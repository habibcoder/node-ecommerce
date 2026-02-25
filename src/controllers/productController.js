const Product = require('../models/Product.js');
const asyncHandler = require('../middleware/async.js');

// @desc      Get all products
// @route     GET /api/products
// @access    Public
exports.getProducts = asyncHandler(async (req, res) => {
    const { category, page = 1, limit = 0 } = req.query;

    const filter = {};
    if (category) {
        // case-insensitive partial match on category
        filter.category = { $regex: category, $options: 'i' };
    }

    const perPage = parseInt(limit, 10) || 0;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    let query = Product.find(filter);

    if (perPage > 0) {
        query = query.skip((pageNum - 1) * perPage).limit(perPage);
    }

    const products = await query;
    const total = await Product.countDocuments(filter);

    res.status(200).json({
        success: true,
        count: products.length,
        total,
        page: perPage > 0 ? pageNum : undefined,
        perPage: perPage > 0 ? perPage : undefined,
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
exports.createProduct = asyncHandler(async (req, res, next) => {
    // Check if product with name already exists
    const productExists = await Product.findOne({ name: req.body.name });

    if (productExists) {
        return next({
            statusCode: 400,
            message: 'Product with this name already exists'
        });
    }

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

    // If client is updating the product name, ensure it's not taken by another product
    if (req.body && req.body.name) {
        const existing = await Product.findOne({ name: req.body.name.trim() });
        if (existing && existing._id.toString() !== req.params.id) {
            return next({
                statusCode: 400,
                message: `The name '${req.body.name}' is already taken. Please choose a different name.`
            });
        }
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
