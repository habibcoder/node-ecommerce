const crypto = require('crypto');
const User = require('../../models/User.js');
const asyncHandler = require('../../middleware/async.js');
const stripe = require('../../config/stripe.js');
const sendEmail = require('../../utils/sendEmail.js');

// @desc      Register user (v2) - emails verification token
// @route     POST /api/v2/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next({
            statusCode: 400,
            message: `An account with email '${email}' already exists. Please use a different email or try logging in.`
        });
    }

    let customer;
    try {
        // Create Stripe Customer
        customer = await stripe.customers.create({
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
        });

        // Create verification token
        const verificationToken = user.getVerificationToken();
        await user.save({ validateBeforeSave: false });

        // Create verification URL
        const verifyUrl = `${req.protocol}://${req.get('host')}/api/v2/auth/verifyemail/${verificationToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the creation of an account.\nPlease click on the below link to verify your email:\n\n${verifyUrl}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Account Verification Token',
                message,
            });

            res.status(200).json({
                success: true,
                data: 'Email sent',
            });
        } catch (emailError) {
            console.log(emailError);
            user.verificationToken = undefined;
            user.verificationTokenExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return next({
                statusCode: 500,
                message: 'Email could not be sent'
            });
        }
    } catch (error) {
        // If user creation fails but Stripe customer was created, clean up
        if (customer && customer.id) {
            try {
                await stripe.customers.del(customer.id);
                console.log(`Cleaned up Stripe customer ${customer.id} after failed user creation`);
            } catch (cleanupError) {
                console.error(`Failed to cleanup Stripe customer ${customer.id}:`, cleanupError.message);
            }
        }
        
        // Re-throw the original error
        throw error;
    }
});

// @desc      Verify email
// @route     GET /api/v2/auth/verifyemail/:token
// @access    Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const verificationToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        verificationToken,
        verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next({
            statusCode: 400,
            message: 'Invalid or expired token'
        });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc      Login user (v2) - checks for verification
// @route     POST /api/v2/auth/login
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

    // Check if verified
    if (!user.isVerified) {
        return next({
            statusCode: 401,
            message: 'Please verify your email first'
        });
    }

    sendTokenResponse(user, 200, res);
});

// @desc      Forgot password
// @route     POST /api/v2/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next({
            statusCode: 404,
            message: 'There is no user with that email'
        });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v2/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to:\n\n${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message,
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next({
            statusCode: 500,
            message: 'Email could not be sent'
        });
    }
});

// @desc      Validate reset token
// @route     GET /api/v2/auth/resetpassword/:token
// @access    Public
exports.validateResetToken = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next({
            statusCode: 400,
            message: 'Invalid or expired token'
        });
    }

    res.status(200).json({
        success: true,
        data: 'Token is valid. Please send a PUT request to this URL with your new password.'
    });
});

// @desc      Reset password
// @route     PUT /api/v2/auth/resetpassword/:token
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next({
            statusCode: 400,
            message: 'Invalid token'
        });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
});


// @desc      Get current logged in user
// @route     GET /api/v2/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-stripeCustomerId -passwordChangedAt');

    res.status(200).json({
        success: true,
        data: user,
    });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v2/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        data: {},
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

    // Remove sensitive data from user object
    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
    };

    res
        .status(statusCode)
        .json({
            success: true,
            token,
            user: userResponse
        });
};
