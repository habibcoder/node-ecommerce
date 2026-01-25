const User = require('../../models/User.js');
const asyncHandler = require('../../middleware/async.js');
const stripe = require('../../config/stripe.js');

// @desc      Register user
// @route     POST /api/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Create Stripe Customer
    const customer = await stripe.customers.create({
        email,
        name,
    });

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role,
        stripeCustomerId: customer.id,
        isVerified: true,
    });

    sendTokenResponse(user, 200, res);
});

// @desc      Login user
// @route     POST /api/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
        return next({
            statusCode: 400,
            message: 'Please provide an email and password'
        });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next({
            statusCode: 401,
            message: 'Invalid credentials'
        });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next({
            statusCode: 401,
            message: 'Invalid credentials'
        });
    }

    sendTokenResponse(user, 200, res);
});

// @desc      Get current logged in user
// @route     GET /api/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user,
    });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_EXPIRE_DAYS * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .json({
            success: true,
            token,
            user
        });
};
