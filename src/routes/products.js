const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/productController.js');
const { protect, authorize } = require('../middleware/auth.js');
const { 
    validateCreateProduct, 
    validateUpdateProduct, 
    validateProductId 
} = require('../middleware/validation.js');

const router = express.Router();

router
    .route('/')
    .get(getProducts)
    .post(protect, authorize('admin'), validateCreateProduct, createProduct);

router
    .route('/:id')
    .get(validateProductId, getProduct)
    .patch(protect, authorize('admin'), validateUpdateProduct, updateProduct)
    .delete(protect, authorize('admin'), validateProductId, deleteProduct);

module.exports = router;
