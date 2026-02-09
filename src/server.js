const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db.js');
const errorHandler = require('./middleware/error.js');
const { globalLimiter, authLimiter, webhookLimiter } = require('./middleware/rateLimiter.js');
const { preventNoSQLInjection, preventXSS } = require('./middleware/sanitize.js');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load Swagger Document
const swaggerDocument = YAML.load(path.join(__dirname, 'config/swagger.yaml'));

// Load env vars
dotenv.config();

const app = express();

// Trust proxy - configured for security
// In production, set this to your specific proxy/load balancer IP ranges
if (process.env.NODE_ENV === 'production') {
    // In production, configure this with your actual proxy IPs
    // Example: app.set('trust proxy', ['127.0.0.1', '::1', '10.0.0.0/8']);
    app.set('trust proxy', 1); // Trust first proxy only
} else {
    // Development: trust localhost IPs only
    app.set('trust proxy', ['127.0.0.1', '::1']);
}

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

// Root route
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        name: 'NodeJS E-Commerce Backend API',
        status: 'ok',
        version: '1.0.0',
        docs: '/api-docs',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Mount routers
app.use('/api/v1/auth', authLimiter, authV1);
app.use('/api/v2/auth', authLimiter, authV2);

app.use('/api/products', products);
app.use('/api/cart', cart);
app.use('/api/orders', orders);

// Mount payment routes
app.use('/api/payments', paymentRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

// Connect to database and start server
connectDB().then(() => {
    server = app.listen(PORT, '0.0.0.0', () => {
        console.log(
            `Server running in ${process.env.NODE_ENV || 'unknown'} mode on port ${PORT}`
        );
    });
}).catch((err) => {
    console.error(`Database connection failed: ${err.message}`);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});
