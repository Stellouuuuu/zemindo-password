// const express = require('express');
// const router = express.Router();
// const db = require('../db');

// router.post('/subscribe', async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ message: "Email requis." });

//   try {
//     const [rows] = await db.query("SELECT id FROM newsletter WHERE email = ?", [email]);
//     if (rows.length > 0) {
//       return res.status(200).json({ message: "Déjà inscrit." });
//     }

//     await db.query("INSERT INTO newsletter (email) VALUES (?)", [email]);
//     await axios.post('http://localhost:8000/send-welcome.php', { email });
//     res.status(200).json({ message: "Inscription réussie !" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Erreur serveur." });
//   }
// });

// module.exports = router;
