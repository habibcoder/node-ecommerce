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

    if (order.status === 'paid') {
        return next({
            statusCode: 400,
            message: 'Order already paid'
        });
    }

    const user = await User.findById(req.user.id);

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

    // Event handling logic stays the same
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;
            if (orderId) await Order.findByIdAndUpdate(orderId, { status: 'paid' });
            console.log('PaymentIntent succeeded:', paymentIntent.id);
            break;
        case 'payment_intent.payment_failed':
            console.log('Payment failed:', event.data.object.id);
            break;
        case 'payment_intent.canceled':
            const canceledOrderId = event.data.object.metadata.orderId;
            if (canceledOrderId) await Order.findByIdAndUpdate(canceledOrderId, { status: 'cancelled' });
            console.log('Payment canceled:', event.data.object.id);
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
    const user = await User.findById(req.user.id);

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