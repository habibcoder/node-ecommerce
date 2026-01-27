const errorHandler = (err, req, res, next) => {
    let error = { ...err };

    error.message = err.message;

    // Log to console for dev (but not in production for security)
    if (process.env.NODE_ENV === 'development') {
        console.log(err);
        console.log(err.stack); // ADDED
    } else {
        // In production, log only essential error info
        console.error(`Error ${err.statusCode || 500}: ${err.message}`);
        console.error(err.stack); // ADDED ensure logs in prod too for now
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Resource not found`;
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        let message = 'Duplicate field value entered';

        // Extract field name from error for better user experience
        if (err.keyValue) {
            const field = Object.keys(err.keyValue)[0];
            const value = err.keyValue[field];

            if (field === 'email') {
                message = `An account with email '${value}' already exists. Please use a different email or try logging in.`;
            } else {
                message = `The ${field} '${value}' is already taken. Please choose a different ${field}.`;
            }
        }

        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { message, statusCode: 401 };
    }

    // Stripe errors
    if (err.type && err.type.startsWith('Stripe')) {
        const message = 'Payment processing error. Please try again.';
        error = { message, statusCode: 400 };

        // Log Stripe errors for debugging (but don't expose details to user)
        console.error('Stripe Error:', err.message);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
    });
};

module.exports = errorHandler;
