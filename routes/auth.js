const express = require('express');
const router = express.Router();
const { requestReset, confirmCode, renvoilien, sendWelcome, sendNewsletterToAll, uploadAvatar, getUserProfile, getUserInfo, updateUserInfo} = require('../controllers/authController');

router.post('/reset-password', requestReset);
router.post('/confirm-code', confirmCode);
router.post('/renvoilien', renvoilien);
router.post('/sendwelcome', sendWelcome);
router.get('/sendNewsletterToAll', sendNewsletterToAll);
router.get('/user/profile', getUserProfile);
router.post("/uploadAvatar", uploadAvatar);
router.get("/getUserInfo", getUserInfo);
router.patch("/updateUserInfo", updateUserInfo);

module.exports = router;
