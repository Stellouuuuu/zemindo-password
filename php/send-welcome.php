<?php
require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Pour afficher les erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

// Lire le JSON brut envoyé par Axios
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? null;

if (!$email) {
    http_response_code(400);
    echo json_encode(['message' => 'Email manquant']);
    exit;
}

$mail = new PHPMailer(true);

try {
    // Configuration SMTP
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'ademaketingdigital@gmail.com';
    $mail->Password = 'ohky jaga rlqq fgke';  // mot de passe d'application Gmail
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    // Email
    $mail->setFrom('ademaketingdigital@gmail.com', 'Bessan Arch');
    $mail->addAddress($email);
    $mail->Subject = "Bienvenue dans notre Newsletter 🎉";
    $mail->Body = "Bienvenue $email,\n\nMerci de vous être inscrit !\nVous recevrez désormais les dernières nouvelles concernant les cagnottes.\n\n— L'équipe Bessan Arch";

    $mail->send();

    echo json_encode(['message' => 'Email envoyé avec succès']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => "Erreur lors de l'envoi : {$mail->ErrorInfo}"]);
}
