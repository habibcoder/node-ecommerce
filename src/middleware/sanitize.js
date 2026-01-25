const mongoSanitize = require('express-mongo-sanitize');

// MongoDB injection prevention
const preventNoSQLInjection = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Potential NoSQL injection attempt detected: ${key} in ${req.method} ${req.path}`);
    }
});

// XSS prevention - basic HTML entity encoding
const preventXSS = (req, res, next) => {
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            return value
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
        }
        return value;
    };

    const sanitizeObject = (obj) => {
        if (obj && typeof obj === 'object') {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        sanitizeObject(obj[key]);
                    } else {
                        obj[key] = sanitizeValue(obj[key]);
                    }
                }
            }
        }
    };

    // Sanitize request body
    if (req.body) {
        sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
        sanitizeObject(req.params);
    }

    next();
};

module.exports = {
    preventNoSQLInjection,
    preventXSS
};