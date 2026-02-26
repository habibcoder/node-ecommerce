const express = require('express');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    getAllOrders,
    getUserOrdersAdmin,
} = require('../controllers/orderController.js');
const { protect, authorize } = require('../middleware/auth.js');
const {
    validateCreateOrder,
    validateOrderId,
    validateUpdateOrderStatus
} = require('../middleware/validation.js');

const router = express.Router();

router.use(protect);

router.route('/')
    .post(validateCreateOrder, createOrder)
    .get(getOrders);

router.route('/all')
    .get(authorize('admin'), getAllOrders);

router.route('/user/:userId')
    .get(authorize('admin'), getUserOrdersAdmin);

router.route('/:id')
    .get(validateOrderId, getOrder);

router.route('/:id/status')
    .patch(authorize('admin'), validateUpdateOrderStatus, updateOrderStatus);

module.exports = router;
