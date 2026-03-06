const express = require('express');
const {
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview
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
    .route('/:id')
    .get(validateReviewId, getReview)
    .patch(protect, validateUpdateReview, updateReview)
    .delete(protect, validateReviewId, deleteReview);

module.exports = router;
