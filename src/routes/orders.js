const express = require('express');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
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

router.route('/:id')
    .get(validateOrderId, getOrder);

router.route('/:id/status')
    .put(authorize('admin'), validateUpdateOrderStatus, updateOrderStatus);

module.exports = router;
