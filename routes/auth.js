const express = require('express');
const router = express.Router();
const { requestReset, confirmCode, renvoilien, sendWelcome, sendNewsletterToAll, info, uploadAvatar, getUserProfile} = require('../controllers/authController');

router.post('/reset-password', requestReset);
router.post('/confirm-code', confirmCode);
router.post('/renvoilien', renvoilien);
router.post('/sendwelcome', sendWelcome);
router.get('/sendNewsletterToAll', sendNewsletterToAll);
router.get('/info', info);
router.get('/user/profile', getUserProfile);
router.post("/uploadAvatar", uploadAvatar);
module.exports = router;
