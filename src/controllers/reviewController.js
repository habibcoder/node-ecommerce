const Review = require('../models/Review.js');
const Product = require('../models/Product.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/async.js');

// @desc      Get reviews
// @route     GET /api/products/:productId/reviews
// @access    Public
exports.getReviews = asyncHandler(async (req, res, next) => {
    let query;

    if (req.params.productId) {
        query = Review.find({ product: req.params.productId });
    } else {
        query = Review.find().populate({
            path: 'product',
            select: 'name description'
        });
    }

    const reviews = await query;

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });
});

// @desc      Get logged in user's reviews
// @route     GET /api/reviews/my
// @access    Private
exports.getMyReviews = asyncHandler(async (req, res, next) => {
    const reviews = await Review.find({ user: req.user.id }).populate({
        path: 'product',
        select: 'name description'
    });

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });
});

// @desc      Get specific user's reviews
// @route     GET /api/reviews/user/:userId
// @access    Private/Admin
exports.getUserReviews = asyncHandler(async (req, res, next) => {
    const reviews = await Review.find({ user: req.params.userId }).populate({
        path: 'product',
        select: 'name description'
    });

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
    });
});

// @desc      Get single review
// @route     GET /api/reviews/:id
// @access    Public
exports.getReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
        path: 'product',
        select: 'name description'
    });

    if (!review) {
        return next({
            statusCode: 404,
            message: `No review found with the id of ${req.params.id}`
        });
    }

    res.status(200).json({
        success: true,
        data: review
    });
});

// @desc      Add review
// @route     POST /api/products/:productId/reviews
// @access    Private
exports.addReview = asyncHandler(async (req, res, next) => {
    req.body.product = req.params.productId;
    req.body.user = req.user.id;

    const product = await Product.findById(req.params.productId);

    if (!product) {
        return next({
            statusCode: 404,
            message: `No product with the id of ${req.params.productId}`
        });
    }

    // Check if user has purchased the item
    const orders = await Order.find({
        user: req.user.id,
        'items.product': req.params.productId,
        status: { $in: ['paid', 'shipped'] }
    });

    if (orders && orders.length > 0) {
        req.body.verifiedPurchase = true;
    } else {
        req.body.verifiedPurchase = false;
    }

    try {
        const review = await Review.create(req.body);

        res.status(201).json({
            success: true,
            data: review
        });
    } catch (error) {
        // Handle duplicate key error for multiple reviews
        if (error.code === 11000) {
            return next({
                statusCode: 400,
                message: 'You have already submitted a review for this product'
            });
        }
        return next(error);
    }
});

// @desc      Update review
// @route     PATCH /api/reviews/:id
// @access    Private
exports.updateReview = asyncHandler(async (req, res, next) => {
    let review = await Review.findById(req.params.id);

    if (!review) {
        return next({
            statusCode: 404,
            message: `No review with the id of ${req.params.id}`
        });
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next({
            statusCode: 401,
            message: 'Not authorized to update review'
        });
    }

    // Extract only changeable fields
    const { rating, comment } = req.body;
    let fieldsToUpdate = {};
    if (rating) fieldsToUpdate.rating = rating;
    if (comment) fieldsToUpdate.comment = comment;

    review = await Review.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    // Trigger post save to recalculate averageRating
    review.save();

    res.status(200).json({
        success: true,
        data: review
    });
});

// @desc      Delete review
// @route     DELETE /api/reviews/:id
// @access    Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        return next({
            statusCode: 404,
            message: `No review with the id of ${req.params.id}`
        });
    }

    // Make sure review belongs to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next({
            statusCode: 401,
            message: 'Not authorized to delete review'
        });
    }

    await review.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});
