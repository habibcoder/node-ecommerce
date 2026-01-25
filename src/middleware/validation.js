const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.path,
            message: error.msg,
            value: error.value
        }));
        
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errorMessages
        });
    }
    next();
};

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};

// Auth Validation Rules
const validateRegister = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('Email must not exceed 100 characters'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either user or admin'),
    
    handleValidationErrors
];

const validateLogin = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    handleValidationErrors
];

const validateResetPassword = [
    param('token')
        .notEmpty()
        .withMessage('Reset token is required')
        .isLength({ min: 40, max: 40 })
        .withMessage('Invalid reset token format'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    handleValidationErrors
];

// Product Validation Rules
const validateCreateProduct = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Product name must be between 2 and 100 characters'),
    
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Product description is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Product description must be between 10 and 1000 characters'),
    
    body('price')
        .notEmpty()
        .withMessage('Price is required')
        .isFloat({ min: 0.01, max: 999999.99 })
        .withMessage('Price must be a positive number between 0.01 and 999999.99'),
    
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s-]+$/)
        .withMessage('Category can only contain letters, spaces, and hyphens'),
    
    body('stock')
        .notEmpty()
        .withMessage('Stock quantity is required')
        .isInt({ min: 0, max: 999999 })
        .withMessage('Stock must be a non-negative integer up to 999999'),
    
    body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    
    handleValidationErrors
];

const validateUpdateProduct = [
    param('id')
        .notEmpty()
        .withMessage('Product ID is required')
        .custom(isValidObjectId)
        .withMessage('Invalid product ID format'),
    
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Product name must be between 2 and 100 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Product description must be between 10 and 1000 characters'),
    
    body('price')
        .optional()
        .isFloat({ min: 0.01, max: 999999.99 })
        .withMessage('Price must be a positive number between 0.01 and 999999.99'),
    
    body('category')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Category must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s-]+$/)
        .withMessage('Category can only contain letters, spaces, and hyphens'),
    
    body('stock')
        .optional()
        .isInt({ min: 0, max: 999999 })
        .withMessage('Stock must be a non-negative integer up to 999999'),
    
    body('imageUrl')
        .optional()
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    
    handleValidationErrors
];

const validateProductId = [
    param('id')
        .notEmpty()
        .withMessage('Product ID is required')
        .custom(isValidObjectId)
        .withMessage('Invalid product ID format'),
    
    handleValidationErrors
];

// Cart Validation Rules
const validateAddToCart = [
    body('productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .custom(isValidObjectId)
        .withMessage('Invalid product ID format'),
    
    body('quantity')
        .notEmpty()
        .withMessage('Quantity is required')
        .isInt({ min: 1, max: 100 })
        .withMessage('Quantity must be a positive integer between 1 and 100'),
    
    handleValidationErrors
];

const validateRemoveFromCart = [
    param('itemId')
        .notEmpty()
        .withMessage('Item ID is required')
        .custom(isValidObjectId)
        .withMessage('Invalid item ID format'),
    
    handleValidationErrors
];

// Order Validation Rules
const validateCreateOrder = [
    body('shippingAddress')
        .notEmpty()
        .withMessage('Shipping address is required')
        .isObject()
        .withMessage('Shipping address must be an object'),
    
    body('shippingAddress.line1')
        .trim()
        .notEmpty()
        .withMessage('Address line 1 is required')
        .isLength({ min: 5, max: 100 })
        .withMessage('Address line 1 must be between 5 and 100 characters'),
    
    body('shippingAddress.city')
        .trim()
        .notEmpty()
        .withMessage('City is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s-]+$/)
        .withMessage('City can only contain letters, spaces, and hyphens'),
    
    body('shippingAddress.postal_code')
        .trim()
        .notEmpty()
        .withMessage('Postal code is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Postal code must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9\s-]+$/)
        .withMessage('Postal code can only contain letters, numbers, spaces, and hyphens'),
    
    body('shippingAddress.country')
        .trim()
        .notEmpty()
        .withMessage('Country is required')
        .isLength({ min: 2, max: 2 })
        .withMessage('Country must be a 2-letter country code')
        .matches(/^[A-Z]{2}$/)
        .withMessage('Country must be a valid 2-letter uppercase country code'),
    
    body('shippingAddress.line2')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Address line 2 must not exceed 100 characters'),
    
    body('shippingAddress.state')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('State must not exceed 50 characters')
        .matches(/^[a-zA-Z\s-]*$/)
        .withMessage('State can only contain letters, spaces, and hyphens'),
    
    handleValidationErrors
];

const validateOrderId = [
    param('id')
        .notEmpty()
        .withMessage('Order ID is required')
        .custom(isValidObjectId)
        .withMessage('Invalid order ID format'),
    
    handleValidationErrors
];

const validateUpdateOrderStatus = [
    param('id')
        .notEmpty()
        .withMessage('Order ID is required')
        .custom(isValidObjectId)
        .withMessage('Invalid order ID format'),
    
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['pending', 'paid', 'shipped', 'cancelled'])
        .withMessage('Status must be one of: pending, paid, shipped, cancelled'),
    
    handleValidationErrors
];

// Payment Validation Rules
const validateCreatePaymentIntent = [
    body('orderId')
        .notEmpty()
        .withMessage('Order ID is required')
        .custom(isValidObjectId)
        .withMessage('Invalid order ID format'),
    
    handleValidationErrors
];

const validateVerifyEmailToken = [
    param('token')
        .notEmpty()
        .withMessage('Verification token is required')
        .isLength({ min: 40, max: 40 })
        .withMessage('Invalid verification token format'),
    
    handleValidationErrors
];

module.exports = {
    // Auth validations
    validateRegister,
    validateLogin,
    validateForgotPassword,
    validateResetPassword,
    validateVerifyEmailToken,
    
    // Product validations
    validateCreateProduct,
    validateUpdateProduct,
    validateProductId,
    
    // Cart validations
    validateAddToCart,
    validateRemoveFromCart,
    
    // Order validations
    validateCreateOrder,
    validateOrderId,
    validateUpdateOrderStatus,
    
    // Payment validations
    validateCreatePaymentIntent,
    
    // Utility
    handleValidationErrors
};