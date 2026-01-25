const Product = require('../models/Product.js');
const asyncHandler = require('../middleware/async.js');

// @desc      Get all products
// @route     GET /api/products
// @access    Public
exports.getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find();

    res.status(200).json({
        success: true,
        count: products.length,
        data: products,
    });
});

// @desc      Get single product
// @route     GET /api/products/:id
// @access    Public
exports.getProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next({
            statusCode: 404,
            message: `Product not found with id of ${req.params.id}`
        });
    }

    res.status(200).json({
        success: true,
        data: product,
    });
});

// @desc      Create new product
// @route     POST /api/products
// @access    Private (Admin)
exports.createProduct = asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        data: product,
    });
});

// @desc      Update product
// @route     PUT /api/products/:id
// @access    Private (Admin)
exports.updateProduct = asyncHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next({
            statusCode: 404,
            message: `Product not found with id of ${req.params.id}`
        });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: product,
    });
});

// @desc      Delete product
// @route     DELETE /api/products/:id
// @access    Private (Admin)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next({
            statusCode: 404,
            message: `Product not found with id of ${req.params.id}`
        });
    }

    await product.deleteOne();

    res.status(200).json({
        success: true,
        data: {},
    });
});
