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
const { 
    validateRegister, 
    validateLogin, 
    validateForgotPassword, 
    validateResetPassword,
    validateVerifyEmailToken 
} = require('../../middleware/validation.js');

const router = express.Router();

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.get('/verifyemail/:token', validateVerifyEmailToken, verifyEmail);
router.post('/forgotpassword', validateForgotPassword, forgotPassword);
router.get('/resetpassword/:token', validateResetPassword, validateResetToken);
router.put('/resetpassword/:token', validateResetPassword, resetPassword);

module.exports = router;
