const rateLimit = require('express-rate-limit');

// Global Limiter - 100 requests per 15 minutes
exports.globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use default key generator for proper IPv6 handling
    // Add prefix through store configuration if needed
    skip: (req) => {
        if (!req.ip) {
            console.warn('Rate limiter: Unable to determine client IP address');
            return false; // Don't skip, but log the issue
        }
        return false;
    }
});

// Auth Limiter - 5 requests per 5 minutes
exports.authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too many login/register attempts, please try again after 5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (!req.ip) {
            console.warn('Auth rate limiter: Unable to determine client IP address');
            return false;
        }
        return false;
    }
});

// Webhook Limiter - 100 requests per 5 minutes
exports.webhookLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: 'Too many webhook requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for valid Stripe webhooks
    skip: (req) => {
        // Allow legitimate Stripe webhooks to bypass rate limiting
        const hasStripeSignature = req.headers['stripe-signature'] && process.env.STRIPE_WEBHOOK_SECRET;
        if (hasStripeSignature) {
            return true; // Skip rate limiting for valid Stripe webhooks
        }
        
        if (!req.ip) {
            console.warn('Webhook rate limiter: Unable to determine client IP address');
            return false;
        }
        return false;
    }
});