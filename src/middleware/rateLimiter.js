const rateLimit = require('express-rate-limit');

// Global Limiter - 10 requests per 2 minutes
exports.globalLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 2 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth Limiter - 3 requests per 1 minutes (for login/register/verification)
exports.authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        error: 'Too many login/register attempts, please try again after 1 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});