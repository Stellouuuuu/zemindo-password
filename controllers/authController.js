const db = require('../db');
const { sendCode, sendLien, welcome, newcagnotte} = require('../utils/mailer');
const bcrypt = require('bcryptjs');
const axios = require('axios');

let tempCodes = {};

exports.requestReset = (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Champs invalides" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Email non trouvé" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    tempCodes[email] = { code, newPassword };

    try {
      await sendCode(email, code);
      res.json({ message: "Code envoyé à votre adresse email" });
    } catch (e) {
      console.error("Erreur envoi mail:", e.message);
      res.status(500).json({ message: "Erreur d'envoi du mail" });
    }
  });
};

exports.confirmCode = async (req, res) => {
  const { email, code } = req.body;
  const data = tempCodes[email];

  if (!data || data.code !== code) {
    return res.status(401).json({ message: "Code invalide" });
  }

  try {
    // Appel vers l’API externe pour hasher le mot de passe
    const hashResponse = await axios.post('http://zemindo-api.vercel.app/api/hasher_password', {
      mot_de_passe: data.newPassword
    });

    const hashedPassword = hashResponse.data.mot_de_passe_hashé;

    // Mise à jour dans la base de données
    db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email], (err) => {
      if (err) return res.status(500).json({ message: "Erreur serveur" });

      delete tempCodes[email];
      res.json({ message: "Mot de passe modifié avec succès" });
    });

  } catch (error) {
    console.error("Erreur lors du hachage via API :", error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors du hachage du mot de passe" });
  }
};

exports.subscribe = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requis." });

  db.query("SELECT id FROM newsletter WHERE email = ?", [email], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Erreur serveur." });
    }
    if (rows.length > 0) {
      return res.status(200).json({ message: "Déjà inscrit." });
    }

    db.query("INSERT INTO newsletter (email) VALUES (?)", [email], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: "Erreur serveur." });
      }

      // Envoi mail via PHP externe (axios)
      axios.post('https://zemindo-password.vercel.app/send-welcome.php', { email })
        .then(() => {
          res.status(200).json({ message: "Inscription réussie !" });
        })
        .catch(mailErr => {
          console.error(mailErr);
          res.status(500).json({ message: "Erreur lors de l'envoi du mail." });
        });
    });
  });
};

exports.renvoilien = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Champs invalides" });
  }

  const lien = "http://localhost:5173/newpassword";

  try {
    await sendLien(email, lien);
    res.json({ message: "Lien envoyé à votre adresse email" });
  } catch (e) {
    console.error("Erreur envoi mail:", e.message);
    res.status(500).json({ message: "Erreur d'envoi du mail" });
  }
};

exports.sendWelcome = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Champs invalides" });
  }

  try {
    // Vérifie si l’email est déjà enregistré
    const [rows] = await db.query('SELECT * FROM newsletter WHERE email = ?', [email]);

    // S’il n’existe pas, on l’insère
    if (rows.length === 0) {
      await db.query('INSERT INTO newsletter (email) VALUES (?)', [email]);
    }

    // Envoie l’email de bienvenue
    await welcome(email);

    res.json({ message: "Email enregistré et message envoyé." });
  } catch (e) {
    console.error("Erreur:", e.message);
    res.status(500).json({ message: "Erreur lors de l’envoi ou enregistrement" });
  }
};

exports.sendNewsletterToAll = async (req, res) => {
  console.log("🔍 Requête vers la base de données en cours...");
  try {
    const [rows] = await db.query("SELECT email FROM newsletter");

    console.log(rows.length);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Aucun abonné trouvé" });
    }

    for (const row of rows) {
      const email = row.email;
      console.log(email);
      try {
        await newcagnotte(email); 
      } catch (e) {
        console.error(`Erreur d'envoi à ${email}:`, e.message);
      }
    }

    res.json({ message: "Newsletter envoyée à tous les abonnés" });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la newsletter:", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
