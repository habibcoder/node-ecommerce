const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
    },
    imageUrl: {
        type: String,
        default: 'no-photo.jpg',
    },
    category: {
        type: String,
        required: [true, 'Please add a category'],
    },
    stock: {
        type: Number,
        required: [true, 'Please add stock quantity'],
        default: 0,
    },
    averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must can not be more than 5'],
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for sorting and filtering
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });

// Cascade delete reviews when a product is deleted
ProductSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    console.log(`Reviews being removed from product ${this._id}`);
    await this.model('Review').deleteMany({ product: this._id });
    next();
});

// Reverse populate with virtuals
ProductSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'product',
    justOne: false
});

module.exports = mongoose.model('Product', ProductSchema);
