<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Chargement automatique via Composer
require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Récupération JSON POST
$data = json_decode(file_get_contents("php://input"), true);

$email = $data["email"] ?? "";
$code = $data["code"] ?? "";

if (!$email || !$code) {
    http_response_code(400);
    echo json_encode(["message" => "Champs manquants"]);
    exit;
}

$mail = new PHPMailer(true);

try {
    // Configuration SMTP Gmail
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;

    // Mets ici ton email et mot de passe application Google
    $mail->Username = 'ademaketingdigital@gmail.com';
    $mail->Password = 'ohky jaga rlqq fgke';

    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    $mail->setFrom('ademaketingdigital@gmail.com', 'Support Reset Password');
    $mail->addAddress($email);

    $mail->isHTML(false);
    $mail->Subject = 'Code de réinitialisation';
    $mail->Body = "Votre code de réinitialisation est : $code";

    $mail->send();
    echo json_encode(["message" => "Email envoyé"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Erreur envoi email: " . $mail->ErrorInfo]);
}
?>
