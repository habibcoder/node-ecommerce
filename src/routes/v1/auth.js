const express = require('express');
const { register, login, getMe } = require('../../controllers/v1/authController.js');
const { protect } = require('../../middleware/auth.js');
const { validateRegister, validateLogin } = require('../../middleware/validation.js');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);

module.exports = router;
