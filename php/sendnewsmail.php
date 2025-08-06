<?php
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Connexion DB
$host = getenv('DB_HOST');
$dbname = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur : " . $e->getMessage());
}

// Récupération des données
$titre = htmlspecialchars($_POST['titre'] ?? 'Nouvelle cagnotte');
$montant = $_POST['montant'] ?? 0;
$description = htmlspecialchars($_POST['description'] ?? '');

// Insertion
$stmt = $pdo->prepare("INSERT INTO cagnotte (titre, montant, description) VALUES (?, ?, ?)");
$stmt->execute([$titre, $montant, $description]);

// Emails
$emails = $pdo->query("SELECT email FROM newsletter")->fetchAll(PDO::FETCH_COLUMN);

// Envoi
foreach ($emails as $email) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'ademaketingdigital@gmail.com';
        $mail->Password = 'ohky jaga rlqq fgke';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('ademaketingdigital@gmail.com', 'Zemindo');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = "Nouvelle cagnotte : $titre";
        $mail->Body = "<h2>$titre</h2><p>Montant : $montant FCFA</p><p>Description : $description</p><p>Merci !</p>";

        $mail->send();
    } catch (Exception $e) {
        error_log("Erreur avec $email : " . $mail->ErrorInfo);
    }
}

echo "✅ Cagnotte créée et emails envoyés.";
