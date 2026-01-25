const express = require('express');
const {
    register,
    login,
    getMe,
    verifyEmail,
    forgotPassword,
    resetPassword,
    validateResetToken,
    logout
} = require('../../controllers/v2/authController.js');
const { protect } = require('../../middleware/auth.js');
const { authLimiter } = require('../../middleware/rateLimiter.js');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.get('/verifyemail/:token', verifyEmail);
router.post('/forgotpassword', forgotPassword);
router.get('/resetpassword/:token', validateResetToken);
router.put('/resetpassword/:token', resetPassword);

module.exports = router;
