const express = require('express');
const {
    getCart,
    addItemToCart,
    removeItemFromCart,
} = require('../controllers/cartController.js');
const { protect } = require('../middleware/auth.js');
const { validateAddToCart, validateRemoveFromCart } = require('../middleware/validation.js');

const router = express.Router();

router.use(protect); // All headers below are protected

router.route('/')
    .get(getCart)
    .post(validateAddToCart, addItemToCart);

router.route('/:itemId')
    .delete(validateRemoveFromCart, removeItemFromCart);

module.exports = router;
