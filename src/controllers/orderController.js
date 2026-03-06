const Order = require('../models/Order.js');
const Cart = require('../models/Cart.js');
const Product = require('../models/Product.js');
const asyncHandler = require('../middleware/async.js');

// @desc      Create new order
// @route     POST /api/orders
// @access    Private
exports.createOrder = asyncHandler(async (req, res, next) => {
    const { shippingAddress } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart || cart.items.length === 0) {
        return next({
            statusCode: 400,
            message: 'Cart is empty'
        });
    }

    // Calculate total
    const totalAmount = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Decrement stock atomically
    const decrementedItems = [];
    for (const item of cart.items) {
        const result = await Product.updateOne(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } }
        );

        if (result.modifiedCount === 0) {
            // Rollback previously decremented items
            if (decrementedItems.length > 0) {
                const rollbackOps = decrementedItems.map(rolledBackItem => ({
                    updateOne: {
                        filter: { _id: rolledBackItem.product },
                        update: { $inc: { stock: rolledBackItem.quantity } }
                    }
                }));
                await Product.bulkWrite(rollbackOps);
            }
            return next({
                statusCode: 400,
                message: `Insufficient stock for product: ${item.name}`
            });
        }
        decrementedItems.push(item);
    }

    const order = await Order.create({
        user: req.user.id,
        items: cart.items,
        totalAmount,
        shippingAddress
    });

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
        success: true,
        data: order,
    });
});

// @desc      Get my orders
// @route     GET /api/orders
// @access    Private
exports.getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
    });
});

// @desc      Get single order
// @route     GET /api/orders/:id
// @access    Private
exports.getOrder = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
        return next({
            statusCode: 404,
            message: 'Order not found'
        });
    }

    // Make sure user is order owner or admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return next({
            statusCode: 401,
            message: 'Not authorized to view this order'
        });
    }

    res.status(200).json({
        success: true,
        data: order,
    });
});

// @desc      Update order status
// @route     PATCH /api/orders/:id/status
// @access    Private (Admin)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next({
            statusCode: 404,
            message: 'Order not found'
        });
    }

    // Strict Option A: Hard-block uncanceling
    if (order.status === 'cancelled' && status !== 'cancelled') {
        return next({
            statusCode: 400,
            message: 'Cannot uncancel a cancelled order. Status remains cancelled.'
        });
    }

    const isNewlyCancelled = (status === 'cancelled' && order.status !== 'cancelled');

    order.status = status;
    await order.save({ runValidators: true });

    if (isNewlyCancelled && order.items && order.items.length > 0) {
        const bulkOps = order.items.map(item => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { stock: item.quantity } }
            }
        }));
        await Product.bulkWrite(bulkOps);
    }

    res.status(200).json({
        success: true,
        data: order
    });
});

// @desc      Get all orders (Admin)
// @route     GET /api/orders/all
// @access    Private (Admin)
exports.getAllOrders = asyncHandler(async (req, res, next) => {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
    });
});

// @desc      Get all orders of a user (Admin)
// @route     GET /api/orders/user/:userId
// @access    Private (Admin)
exports.getUserOrdersAdmin = asyncHandler(async (req, res, next) => {
    const orders = await Order.find({ user: req.params.userId }).populate('user', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
    });
});
