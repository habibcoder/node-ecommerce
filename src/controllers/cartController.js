const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/async');

// @desc      Get user cart
// @route     GET /api/cart
// @access    Private
exports.getCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user.id,
            items: []
        });
    }

    res.status(200).json({
        success: true,
        data: cart,
    });
});

// @desc      Add item to cart
// @route     POST /api/cart
// @access    Private
exports.addItemToCart = asyncHandler(async (req, res, next) => {
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user.id,
            items: []
        });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next({ statusCode: 404, message: 'Product not found' });
    }

    // Check if product already in cart
    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);

    if (itemIndex > -1) {
        // Product exists in the cart, update the quantity
        let productItem = cart.items[itemIndex];
        productItem.quantity += quantity;
        cart.items[itemIndex] = productItem;
    } else {
        // Product does not exist in cart, add new item
        cart.items.push({
            product: productId,
            quantity,
            price: product.price,
            name: product.name,
            imageUrl: product.imageUrl
        });
    }

    await cart.save();

    res.status(200).json({
        success: true,
        data: cart,
    });
});

// @desc      Remove item from cart
// @route     DELETE /api/cart/:itemId
// @access    Private
exports.removeItemFromCart = asyncHandler(async (req, res, next) => {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        return next({ statusCode: 404, message: 'Cart not found' });
    }

    // Filter out item by ItemId OR ProductId
    cart.items = cart.items.filter(item =>
        item._id.toString() !== req.params.itemId &&
        item.product.toString() !== req.params.itemId
    );

    await cart.save();

    res.status(200).json({
        success: true,
        data: cart,
    });
});
