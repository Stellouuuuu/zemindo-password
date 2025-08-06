const express = require('express');
const router = express.Router();
const { requestReset, confirmCode, subscribe} = require('../controllers/authController');

router.post('/reset-password', requestReset);
router.post('/confirm-code', confirmCode);
router.post('/subscribe', subscribe);

module.exports = router;
