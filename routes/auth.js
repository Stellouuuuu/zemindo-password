const express = require('express');
const router = express.Router();
const { requestReset, confirmCode, subscribe, renvoilien, sendwelcome} = require('../controllers/authController');

router.post('/reset-password', requestReset);
router.post('/confirm-code', confirmCode);
router.post('/subscribe', subscribe);
router.post('/renvoilien', renvoilien);
router.post('/sendwelcome', sendwelcome);

module.exports = router;
