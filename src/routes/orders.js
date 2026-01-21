const express = require('express');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(createOrder)
    .get(getOrders);

router.route('/:id')
    .get(getOrder);

router.route('/:id/status')
    .put(authorize('admin'), updateOrderStatus);

module.exports = router;
