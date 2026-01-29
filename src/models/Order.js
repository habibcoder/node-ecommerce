const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
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
                min: 1,
            },
            price: {
                type: Number,
                required: true,
            },
            name: String,
        },
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingAddress: {
        line1: { type: String, required: true },
        city: { type: String, required: true },
        postal_code: { type: String, required: true },
        country: { type: String, required: true },
    },
    paymentIntentId: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'shipped', 'cancelled'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for order history and sorting
OrderSchema.index({ user: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
