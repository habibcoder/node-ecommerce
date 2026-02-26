const express = require('express');
const {
    getCart,
    addItemToCart,
    updateCartItem,
    removeItemFromCart,
} = require('../controllers/cartController.js');
const { protect } = require('../middleware/auth.js');
const { validateAddToCart, validateUpdateCartItem, validateRemoveFromCart } = require('../middleware/validation.js');

const router = express.Router();

router.use(protect); // All headers below are protected

router.route('/')
    .get(getCart)
    .post(validateAddToCart, addItemToCart);

router.route('/:itemId')
    .patch(validateUpdateCartItem, updateCartItem)
    .delete(validateRemoveFromCart, removeItemFromCart);

module.exports = router;
