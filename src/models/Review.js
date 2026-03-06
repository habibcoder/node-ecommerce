const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please add a rating between 1 and 5'],
    },
    comment: {
        type: String,
        required: [true, 'Please add some text for the review'],
        maxlength: 500,
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true,
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    verifiedPurchase: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent user from submitting more than one review per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to get avg rating and save
ReviewSchema.statics.getAverageRating = async function (productId) {
    const obj = await this.aggregate([
        {
            $match: { product: productId },
        },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 },
            },
        },
    ]);

    try {
        if (obj[0]) {
            await this.model('Product').findByIdAndUpdate(productId, {
                averageRating: obj[0].averageRating,
                numOfReviews: obj[0].numOfReviews,
            });
        } else {
            // No reviews left
            await this.model('Product').findByIdAndUpdate(productId, {
                averageRating: 0,
                numOfReviews: 0,
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// Call getAverageRating after save
ReviewSchema.post('save', async function () {
    await this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after remove
ReviewSchema.post('deleteOne', { document: true, query: false }, async function () {
    await this.constructor.getAverageRating(this.product);
});

module.exports = mongoose.model('Review', ReviewSchema);
