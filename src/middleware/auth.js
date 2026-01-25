const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const asyncHandler = require('./async.js');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return next({
            statusCode: 401,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return next({
                statusCode: 401,
                message: 'Not authorized to access this route'
            });
        }

        if (!req.user.isVerified) {
            return next({
                statusCode: 401,
                message: 'Please verify your email first'
            });
        }

        // Check if user changed password after the token was issued
        if (req.user.changedPasswordAfter(decoded.iat)) {
            return next({
                statusCode: 401,
                message: 'User recently changed password! Please log in again.'
            });
        }

        next();
    } catch (err) {
        return next({
            statusCode: 401,
            message: 'Not authorized to access this route'
        });
    }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next({
                statusCode: 403,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};