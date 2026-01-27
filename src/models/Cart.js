const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One cart per user
    },
    items: [
        {
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
                min: [1, 'Quantity must be at least 1'],
                max: [50, 'Maximum quantity per product is 50'],
            },
            price: {
                type: Number,
                required: true,
                min: [0, 'Price cannot be negative']
            },
            name: {
                type: String,
                required: true
            },
            imageUrl: String,
            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for cart total
CartSchema.virtual('cartTotal').get(function () {
    return this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
});

// Virtual for total items count
CartSchema.virtual('totalItems').get(function () {
    return this.items.reduce((total, item) => {
        return total + item.quantity;
    }, 0);
});

// Virtual for items count
CartSchema.virtual('itemsCount').get(function () {
    return this.items.length;
});

// Update the updatedAt field before saving
CartSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

// Index for better performance
CartSchema.index({ 'items.product': 1 });

module.exports = mongoose.model('Cart', CartSchema);
