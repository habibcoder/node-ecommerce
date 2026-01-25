const express = require('express');
const {
    createPaymentIntent,
    createSetupIntent,
} = require('../controllers/paymentController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/setup-intent', protect, createSetupIntent);

module.exports = router;
