const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
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
                default: 1,
                min: 1,
            },
            price: {
                type: Number,
                required: true
            },
            name: String,
            imageUrl: String
        }
    ],
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Cart', CartSchema);
