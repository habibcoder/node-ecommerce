const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db.js');
const errorHandler = require('./middleware/error.js');
const { globalLimiter, authLimiter, webhookLimiter } = require('./middleware/rateLimiter.js');
const { preventNoSQLInjection, preventXSS } = require('./middleware/sanitize.js');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Route files
const authV1 = require('./routes/v1/auth.js');
const authV2 = require('./routes/v2/auth.js');

const products = require('./routes/products.js');
const cart = require('./routes/cart.js');
const orders = require('./routes/orders.js');
const paymentController = require('./controllers/paymentController.js');
const paymentRoutes = require('./routes/payments.js'); // Note: we will use this for non-webhook routes if we split, but currently it has both.

// Middleware

// Helmet for security headers
app.use(helmet());

// Prevent NoSQL injection and XSS
app.use(preventNoSQLInjection);
app.use(preventXSS);

// Rate Limiting
app.use(globalLimiter);

// CORS
app.use(cors());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// STRIPE WEBHOOK - Must be before express.json()
// We use express.raw() to get the buffer for signature verification
app.post(
    '/api/payments/webhook',
    webhookLimiter,
    express.raw({ type: 'application/json' }),
    paymentController.stripeWebhook
);

// Body parser
app.use(express.json());

// Mount routers
app.use('/api/v1/auth', authLimiter, authV1);
app.use('/api/v2/auth', authLimiter, authV2);

app.use('/api/products', products);
app.use('/api/cart', cart);
app.use('/api/orders', orders);

// Mount payment routes
app.use('/api/payments', paymentRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});
