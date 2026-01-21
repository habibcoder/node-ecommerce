const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Product', ProductSchema);
