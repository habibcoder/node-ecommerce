const express = require('express');
const {
    createPaymentIntent,
    createSetupIntent,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();



router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/setup-intent', protect, createSetupIntent);



module.exports = router;
