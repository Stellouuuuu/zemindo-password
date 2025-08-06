const axios = require("axios");
const FormData = require("form-data");

exports.sendCode = async function (email, code) {
  const phpURL = "https://zemindo-ai.vercel.app/mail/envoyer_mail";

  const form = new FormData();
  form.append("destinataire", email);
  form.append("sujet", "Code de confirmation");
  form.append("contenu", `Votre code de vérification est : ${code}`);

  const response = await axios.post(phpURL, form, {
    headers: form.getHeaders()
  });

  return response.data;
};

exports.sendLien = async function (email, lien) {
  const phpURL = "https://zemindo-ai.vercel.app/mail/envoyer_mail";

  const form = new FormData();
  form.append("destinataire", email);
  form.append("sujet", "Réinitialisation de mot de passe");
  form.append("contenu", `Bonjour,\n\nCliquez sur le lien suivant pour réinitialiser votre mot de passe :\n\n${lien}\n\nCe lien expirera dans 10 minutes.`);

  const response = await axios.post(phpURL, form, {
    headers: form.getHeaders()
  });

  return response.data;
};
