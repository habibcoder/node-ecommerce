const stripe = require('../config/stripe.js');
const Order = require('../models/Order.js');
const User = require('../models/User.js');
const asyncHandler = require('../middleware/async.js');

// @desc      Create Payment Intent
// @route     POST /api/payments/create-payment-intent
// @access    Private
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
        return next({
            statusCode: 404,
            message: 'Order not found'
        });
    }

    // CRITICAL: Check if the order belongs to the authenticated user
    if (order.user.toString() !== req.user.id) {
        // Log potential security threat
        console.warn(`SECURITY ALERT: User ${req.user.id} (${req.user.email || 'unknown'}) attempted to create payment for order ${orderId} owned by ${order.user}`);
        return next({
            statusCode: 403,
            message: 'Not authorized to create payment for this order'
        });
    }

    if (order.status === 'paid') {
        return next({
            statusCode: 400,
            message: 'Order already paid'
        });
    }

    // Additional security checks
    if (order.status === 'cancelled') {
        return next({
            statusCode: 400,
            message: 'Cannot create payment for cancelled order'
        });
    }

    if (!order.items || order.items.length === 0) {
        return next({
            statusCode: 400,
            message: 'Cannot create payment for order with no items'
        });
    }

    if (order.totalAmount <= 0) {
        return next({
            statusCode: 400,
            message: 'Cannot create payment for order with invalid amount'
        });
    }

    const user = await User.findById(req.user.id).select('+stripeCustomerId');

    // Create params
    const params = {
        amount: Math.round(order.totalAmount * 100), // Amount in cents
        currency: 'usd',
        customer: user.stripeCustomerId,
        metadata: {
            orderId: order._id.toString(),
            userId: user._id.toString()
        },
        automatic_payment_methods: {
            enabled: true,
        },
    };

    const paymentIntent = await stripe.paymentIntents.create(params);

    // Save payment intent ID to order
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    // Log successful payment intent creation
    console.log(`Payment intent created: ${paymentIntent.id} for order ${orderId} by user ${req.user.id} (amount: $${order.totalAmount})`);

    res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
    });
});

// @desc      Stripe Webhook
// @route     POST /api/payments/webhook
// @access    Public
exports.stripeWebhook = async (req, res) => {
    let event;

    if (process.env.NODE_ENV !== 'production') {
        // Accept curl payload directly in dev
        try {
            event = JSON.parse(req.body.toString());
        } catch (err) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    } else {
        const sig = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }

    // Event handling logic with enhanced security checks
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;
            const userId = paymentIntent.metadata.userId;
            
            if (orderId && userId) {
                // Verify the order exists and belongs to the user in metadata
                const order = await Order.findById(orderId);
                if (order && order.user.toString() === userId) {
                    await Order.findByIdAndUpdate(orderId, { 
                        status: 'paid',
                        paymentIntentId: paymentIntent.id 
                    });
                    console.log(`PaymentIntent succeeded: ${paymentIntent.id} for order: ${orderId}`);
                } else {
                    console.error(`Invalid payment attempt: Order ${orderId} not found or user mismatch`);
                }
            } else {
                console.error(`PaymentIntent ${paymentIntent.id} missing required metadata`);
            }
            break;
            
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log(`Payment failed: ${failedPayment.id}`);
            // Optionally update order status to failed
            if (failedPayment.metadata.orderId) {
                await Order.findByIdAndUpdate(failedPayment.metadata.orderId, { 
                    status: 'pending' // Reset to pending for retry
                });
            }
            break;
            
        case 'payment_intent.canceled':
            const canceledPayment = event.data.object;
            const canceledOrderId = canceledPayment.metadata.orderId;
            const canceledUserId = canceledPayment.metadata.userId;
            
            if (canceledOrderId && canceledUserId) {
                // Verify the order exists and belongs to the user
                const order = await Order.findById(canceledOrderId);
                if (order && order.user.toString() === canceledUserId) {
                    await Order.findByIdAndUpdate(canceledOrderId, { status: 'cancelled' });
                    console.log(`Payment canceled: ${canceledPayment.id} for order: ${canceledOrderId}`);
                } else {
                    console.error(`Invalid cancellation attempt: Order ${canceledOrderId} not found or user mismatch`);
                }
            }
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send({ received: true });
};

// @desc      Create Setup Intent (for saving card)
// @route     POST /api/payments/setup-intent
// @access    Private
exports.createSetupIntent = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('+stripeCustomerId');

    // Create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
        customer: user.stripeCustomerId,
        automatic_payment_methods: {
            enabled: true,
        },
    });

    res.status(200).json({
        success: true,
        clientSecret: setupIntent.client_secret,
        id: setupIntent.id
    });
});