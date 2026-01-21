const express = require('express');
const {
    getCart,
    addItemToCart,
    removeItemFromCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All headers below are protected

router.route('/')
    .get(getCart)
    .post(addItemToCart);

router.route('/:itemId')
    .delete(removeItemFromCart);

module.exports = router;
