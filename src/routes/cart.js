const express = require('express');
const {
    getCart,
    addItemToCart,
    removeItemFromCart,
} = require('../controllers/cartController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

router.use(protect); // All headers below are protected

router.route('/')
    .get(getCart)
    .post(addItemToCart);

router.route('/:itemId')
    .delete(removeItemFromCart);

module.exports = router;
