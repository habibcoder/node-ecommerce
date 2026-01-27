// Custom MongoDB injection prevention (Express 5.x compatible)
const preventNoSQLInjection = (req, res, next) => {
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            // Remove MongoDB operators
            return value.replace(/^\$/, '_dollar_');
        }
        return value;
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // Sanitize key names (remove $ prefixes)
                const sanitizedKey = key.replace(/^\$/, '_dollar_');
                
                if (sanitizedKey !== key) {
                    console.warn(`Potential NoSQL injection attempt detected: ${key} in ${req.method} ${req.path}`);
                }
                
                const value = obj[key];
                
                if (Array.isArray(value)) {
                    sanitized[sanitizedKey] = value.map(item => 
                        typeof item === 'object' && item !== null ? sanitizeObject(item) : sanitizeValue(item)
                    );
                } else if (typeof value === 'object' && value !== null && value.constructor === Object) {
                    sanitized[sanitizedKey] = sanitizeObject(value);
                } else {
                    sanitized[sanitizedKey] = sanitizeValue(value);
                }
            }
        }
        
        return sanitized;
    };

    try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
    } catch (error) {
        console.error('Error in NoSQL injection prevention:', error.message);
        // Continue processing even if sanitization fails
    }

    next();
};

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
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                
                if (Array.isArray(value)) {
                    sanitized[key] = value.map(item => 
                        typeof item === 'object' && item !== null ? sanitizeObject(item) : sanitizeValue(item)
                    );
                } else if (typeof value === 'object' && value !== null && value.constructor === Object) {
                    sanitized[key] = sanitizeObject(value);
                } else {
                    sanitized[key] = sanitizeValue(value);
                }
            }
        }
        
        return sanitized;
    };

    try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
    } catch (error) {
        console.error('Error in XSS sanitization:', error.message);
        // Continue processing even if sanitization fails
    }

    next();
};

module.exports = {
    preventNoSQLInjection,
    preventXSS
};