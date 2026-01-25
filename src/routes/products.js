const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController.js');
const { protect, authorize } = require('../middleware/auth.js');

const router = express.Router();

router
    .route('/')
    .get(getProducts)
    .post(protect, authorize('admin'), createProduct);

router
    .route('/:id')
    .get(getProduct)
    .put(protect, authorize('admin'), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
