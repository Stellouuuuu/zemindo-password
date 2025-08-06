const axios = require('axios');

async function sendCode(email, code) {
  const phpURL = "http://localhost:8000/send-code.php";
  const response = await axios.post(phpURL, { email, code });
  return response.data;
}

module.exports = { sendCode };