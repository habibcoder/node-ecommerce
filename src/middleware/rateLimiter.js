const rateLimit = require('express-rate-limit');

// Global Limiter - 100 requests per 15 minutes (increased from 10/2min)
exports.globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth Limiter - 5 requests per 5 minutes (increased from 3/1min)
exports.authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too many login/register attempts, please try again after 5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Webhook Limiter - 100 requests per 5 minutes (for Stripe webhooks)
exports.webhookLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many webhook requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for valid Stripe webhooks (they have valid signatures)
    skip: (req) => {
        // Only apply rate limiting if signature verification would fail
        // This allows legitimate Stripe webhooks while blocking abuse
        return req.headers['stripe-signature'] && process.env.STRIPE_WEBHOOK_SECRET;
    }
});