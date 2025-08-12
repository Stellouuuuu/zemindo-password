const db = require('../db');
const { sendCode, sendLien, welcome, newcagnotte} = require('../utils/mailer');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary avec tes infos
cloudinary.config({
  cloud_name: "dvnfoapof",
  api_key: "488262554191638",
  api_secret: "Oa-dJhC-Cz1yFsv3yTEU_87Ul-0",
});

// Configure multer pour utiliser Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'avatars',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      public_id: `${Date.now()}_${file.originalname.split('.')[0]}`
    };
  },
});


const upload = multer({ storage });



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

exports.sendNewsletterToAll = (req, res) => {
  console.log("🔍 Requête vers la base de données en cours...");

  db.query("SELECT email FROM newsletter", async (err, rows) => {
    if (err) {
      console.error("Erreur lors de la requête :", err.message);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Aucun abonné trouvé" });
    }

    // Envoi des mails un par un (avec await dans une fonction async)
    for (const row of rows) {
      const email = row.email;
      console.log(email);
      try {
        await newcagnotte(email);
      } catch (e) {
        console.error(`Erreur d'envoi à ${email}:`, e.message);
      }
    }

    return res.json({ message: "Newsletter envoyée à tous les abonnés" });
  });
};


exports.uploadAvatar = async (req, res) => {
  // Récupérer token dans le header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token manquant" });
  }
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  console.log(token);
  // Appel API externe pour récupérer id et email
  let userData;
  try {
    const response = await axios.get("https://zemindo-api.vercel.app/api/users/2", {
      headers: { Authorization: `Bearer ${token}` }
    });

    userData = response.data.user;
  } catch (error) {
    console.error("Erreur appel API externe :", error.response?.data || error.message);
    return res.status(401).json({ message: " oh Token invalide ou erreur API externe" }); 
  }

  if (!userData.id) {
    return res.status(401).json({ message: "Utilisateur non trouvé via API externe" });
  }

  // Upload fichier via multer
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      console.error("Erreur upload cloudinary:", err);
      return res.status(500).json({ message: "Erreur lors du téléversement" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image manquante." });
    }

    const imageUrl = req.file.path;

    // Mise à jour BDD avec l'id récupéré
    db.query("UPDATE users SET avatar = ? WHERE id = ?", [imageUrl, userData.id], (err, result) => {
      if (err) {
        console.error("Erreur base de données :", err.message);
        return res.status(500).json({ message: "Erreur mise à jour profil" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "oh Utilisateur non trouvé." });
      }

      res.json({ message: "Photo mise à jour avec succès", imageUrl });
    });
  });
};


exports.getUserProfile = async (req, res) => {
  // Récupérer le token dans l'en-tête Authorization
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Token manquant" });
  }
  const token = authHeader.split(" ")[1];

  try {
    // Appel vers l'API externe avec le token pour obtenir id et email
    const response = await axios.get("https://zemindo-api.vercel.app/api/users/2", {
      headers: { Authorization: `Bearer ${token}` }
    });
   const userData = response.data.user; 

    if (!userData.id) {
      return res.status(401).json({ message: "Token invalide ou utilisateur non trouvé" });
    }

    // Interroger ta base locale avec l'id récupéré
    db.query(
      "SELECT CONCAT(first_name, ' ', last_name) AS fullName, email, avatar FROM users WHERE id = ?",
      [userData.id],
      (err, results) => {
        if (err) {
          console.error("Erreur DB :", err);
          return res.status(500).json({ message: "Erreur serveur" });
        }
        if (results.length === 0) {
          return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        res.json(results[0]); // { fullName, email, avatar }
      }
    );

  } catch (error) {
    console.error("Erreur appel API externe :", error.response?.data || error.message);
    return res.status(401).json({ message: "Token invalide ou erreur API externe" });
  }
};

exports.getUserInfo = async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  try {
    // Récupérer userId via API externe
    const response = await axios.get("https://zemindo-api.vercel.app/api/users/2", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userData = response.data.user;
    if (!userData?.id) {
      return res.status(401).json({ message: "Token invalide ou utilisateur non trouvé" });
    }

    // Récupérer infos dans ta BDD locale
    const query = `SELECT first_name, last_name, phone_number, city, country FROM users WHERE id = ?`;
    db.query(query, [userData.id], (err, results) => {
      if (err) {
        console.error("Erreur DB :", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      const user = results[0];
      res.json({
        nom: user.first_name || "",
        prenom: user.last_name || "",
        email: user.email || "",
        telephone: user.phone_number || "",
        ville: user.city || "",
        pays: user.country || ""
      });
    });

  } catch (error) {
    console.error("Erreur appel API externe :", error.response?.data || error.message);
    return res.status(401).json({ message: "Token invalide ou erreur API externe" });
  }
};

// Mettre à jour les infos utilisateur
exports.updateUserInfo = async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  try {
    // Récupérer userId via API externe
    const response = await axios.get("https://zemindo-api.vercel.app/api/users/2", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userData = response.data.user;
    if (!userData?.id) {
      return res.status(401).json({ message: "Token invalide ou utilisateur non trouvé" });
    }

    const allowedFields = {
      nom: "first_name",
      prenom: "last_name",
      email: "email",
      telephone: "phone_number",
      ville: "city",
      pays: "country"
    };

    const fieldsToUpdate = {};
    for (const key in allowedFields) {
      if (req.body[key] !== undefined) {
        fieldsToUpdate[allowedFields[key]] = req.body[key];
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({ message: "Aucun champ valide à mettre à jour" });
    }

    const setClause = Object.keys(fieldsToUpdate)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = Object.values(fieldsToUpdate);
    values.push(userData.id);

    const query = `UPDATE users SET ${setClause} WHERE id = ?`;

    db.query(query, values, (err, result) => {
      if (err) {
        console.error("Erreur DB :", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
      res.json({ message: "Informations mises à jour avec succès" });
    });

  } catch (error) {
    console.error("Erreur appel API externe :", error.response?.data || error.message);
    return res.status(401).json({ message: "Token invalide ou erreur API externe" });
  }
};