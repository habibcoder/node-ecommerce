const express = require('express');
const {
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview,
    getMyReviews,
    getUserReviews
} = require('../controllers/reviewController.js');

const {
    validateCreateReview,
    validateUpdateReview,
    validateReviewId
} = require('../middleware/validation.js');

const { protect, authorize } = require('../middleware/auth.js');

const router = express.Router({ mergeParams: true });

router
    .route('/')
    .get(getReviews)
    .post(protect, validateCreateReview, addReview);

router
    .route('/my')
    .get(protect, getMyReviews);

router
    .route('/user/:userId')
    .get(protect, authorize('admin'), getUserReviews);

router
    .route('/:id')
    .get(validateReviewId, getReview)
    .patch(protect, validateUpdateReview, updateReview)
    .delete(protect, validateReviewId, deleteReview);

module.exports = router;
