const axios = require('axios');
const FormData = require('form-data');

async function sendCode(email, code) {
  const phpURL = "https://zemindo-ai.vercel.app/mail/envoyer_mail";

  const form = new FormData();
  form.append("destinataire", email);
  form.append("sujet", "Code de confirmation");
  form.append("contenu", `Votre code de vérification est : ${code}`);

  const response = await axios.post(phpURL, form, {
    headers: form.getHeaders()
  });

  return response.data;
}

module.exports = { sendCode };
