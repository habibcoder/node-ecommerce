const Cart = require('../models/Cart.js');
const Product = require('../models/Product.js');
const asyncHandler = require('../middleware/async.js');

// @desc      Get user cart
// @route     GET /api/cart
// @access    Private
exports.getCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
        path: 'items.product',
        select: 'name price stock imageUrl category'
    });

    if (!cart) {
        cart = await Cart.create({
            user: req.user.id,
            items: []
        });
    }

    // Validate cart items against current product data
    const validatedItems = [];
    let hasChanges = false;

    for (const item of cart.items) {
        if (item.product) {
            // Check if product still exists and has stock
            if (item.product.stock === 0) {
                console.log(`Removing out-of-stock item: ${item.product.name}`);
                hasChanges = true;
                continue; // Skip out-of-stock items
            }

            // Check if quantity exceeds available stock
            if (item.quantity > item.product.stock) {
                console.log(`Adjusting quantity for ${item.product.name}: ${item.quantity} -> ${item.product.stock}`);
                item.quantity = item.product.stock;
                hasChanges = true;
            }

            // Check for price changes
            if (item.price !== item.product.price) {
                console.log(`Price updated for ${item.product.name}: ${item.price} -> ${item.product.price}`);
                item.price = item.product.price;
                hasChanges = true;
            }

            validatedItems.push(item);
        } else {
            // Product no longer exists
            console.log(`Removing deleted product from cart`);
            hasChanges = true;
        }
    }

    // Update cart if there were changes
    if (hasChanges) {
        cart.items = validatedItems;
        await cart.save();
    }

    // Calculate cart totals
    const cartTotal = cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((total, item) => {
        return total + item.quantity;
    }, 0);

    res.status(200).json({
        success: true,
        data: {
            cart,
            summary: {
                totalItems,
                cartTotal: parseFloat(cartTotal.toFixed(2)),
                itemsCount: cart.items.length,
                hasChanges: hasChanges ? 'Cart was updated due to product changes' : null
            }
        }
    });
});

// @desc      Add item to cart
// @route     POST /api/cart
// @access    Private
exports.addItemToCart = asyncHandler(async (req, res, next) => {
    const { productId, quantity } = req.body;

    // Validate quantity is positive
    if (quantity <= 0) {
        const error = new Error('Quantity must be a positive number');
        error.statusCode = 400;
        return next(error);
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user.id,
            items: []
        });
    }

    const product = await Product.findById(productId);
    if (!product) {
        const error = new Error('Product not found');
        error.statusCode = 404;
        return next(error);
    }

    // Check if product has any stock available
    if (product.stock === 0) {
        const error = new Error(`${product.name} is currently out of stock`);
        error.statusCode = 400;
        return next(error);
    }

    // Check if product already exists in cart
    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);
    let currentCartQuantity = 0;
    let finalQuantity = quantity;
    let isExistingItem = false;

    if (itemIndex > -1) {
        // Product already exists in cart - handle adding same item multiple times
        isExistingItem = true;
        currentCartQuantity = cart.items[itemIndex].quantity;
        finalQuantity = currentCartQuantity + quantity;
        
        console.log(`Adding ${quantity} more ${product.name}(s) to existing cart quantity of ${currentCartQuantity}`);
        
        // Check for price changes when adding same item again
        if (cart.items[itemIndex].price !== product.price) {
            console.log(`Price change detected for ${product.name}: ${cart.items[itemIndex].price} -> ${product.price}`);
        }
    } else {
        console.log(`Adding new product ${product.name} with quantity ${quantity} to cart`);
    }

    // CRITICAL: Ensure total cart quantity doesn't exceed product's available stock
    if (finalQuantity > product.stock) {
        const availableToAdd = product.stock - currentCartQuantity;
        
        if (availableToAdd <= 0) {
            const error = new Error(`Cannot add more ${product.name}. You already have the maximum available quantity (${currentCartQuantity}) in your cart. Total stock: ${product.stock}`);
            error.statusCode = 400;
            return next(error);
        }
        
        const error = new Error(`Cannot add ${quantity} ${product.name}(s). Only ${availableToAdd} more can be added to cart (Current in cart: ${currentCartQuantity}, Total stock: ${product.stock})`);
        error.statusCode = 400;
        return next(error);
    }

    // Maximum quantity limit per product (configurable)
    const MAX_QUANTITY_PER_PRODUCT = 50;
    if (finalQuantity > MAX_QUANTITY_PER_PRODUCT) {
        const error = new Error(`Maximum ${MAX_QUANTITY_PER_PRODUCT} items allowed per product. Current request would result in ${finalQuantity} items (Current in cart: ${currentCartQuantity}, Adding: ${quantity})`);
        error.statusCode = 400;
        return next(error);
    }

    // Update or add the item to cart
    if (isExistingItem) {
        // Update existing item - same product added multiple times
        cart.items[itemIndex].quantity = finalQuantity;
        cart.items[itemIndex].price = product.price; // Ensure current price
        cart.items[itemIndex].name = product.name; // Update name in case it changed
        cart.items[itemIndex].imageUrl = product.imageUrl; // Update image in case it changed
        
        console.log(`Updated ${product.name} quantity from ${currentCartQuantity} to ${finalQuantity}`);
    } else {
        // Add new item to cart
        cart.items.push({
            product: productId,
            quantity: finalQuantity,
            price: product.price,
            name: product.name,
            imageUrl: product.imageUrl
        });
        
        console.log(`Added new item ${product.name} with quantity ${finalQuantity} to cart`);
    }

    // Calculate cart totals
    const cartTotal = cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((total, item) => {
        return total + item.quantity;
    }, 0);

    await cart.save();

    // Prepare response message based on action taken
    let responseMessage;
    if (isExistingItem) {
        responseMessage = `Added ${quantity} more ${product.name}(s) to cart. Total quantity: ${finalQuantity}`;
    } else {
        responseMessage = `Added ${quantity} ${product.name}(s) to cart`;
    }

    res.status(200).json({
        success: true,
        message: responseMessage,
        data: {
            cart,
            summary: {
                totalItems,
                cartTotal: parseFloat(cartTotal.toFixed(2)),
                itemsCount: cart.items.length
            },
            productInfo: {
                productName: product.name,
                addedQuantity: quantity,
                totalInCart: finalQuantity,
                availableStock: product.stock,
                remainingStock: product.stock - finalQuantity
            }
        }
    });
});

// @desc      Update item quantity in cart
// @route     PATCH /api/cart/:itemId
// @access    Private
exports.updateCartItem = asyncHandler(async (req, res, next) => {
    const { quantity } = req.body;
    const { itemId } = req.params;

    // Validate quantity
    if (quantity <= 0) {
        const error = new Error('Quantity must be a positive number');
        error.statusCode = 400;
        return next(error);
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        const error = new Error('Cart not found');
        error.statusCode = 404;
        return next(error);
    }

    // Find the item in cart
    const itemIndex = cart.items.findIndex(item => 
        item._id.toString() === itemId || item.product.toString() === itemId
    );

    if (itemIndex === -1) {
        const error = new Error('Item not found in cart');
        error.statusCode = 404;
        return next(error);
    }

    const cartItem = cart.items[itemIndex];
    
    // Get current product info to validate stock and price
    const product = await Product.findById(cartItem.product);
    if (!product) {
        const error = new Error('Product no longer exists');
        error.statusCode = 404;
        return next(error);
    }

    // Stock availability validation
    if (product.stock < quantity) {
        const error = new Error(`Insufficient stock. Only ${product.stock} items available`);
        error.statusCode = 400;
        return next(error);
    }

    // Maximum quantity limit per product
    const MAX_QUANTITY_PER_PRODUCT = 50;
    if (quantity > MAX_QUANTITY_PER_PRODUCT) {
        const error = new Error(`Maximum quantity per product is ${MAX_QUANTITY_PER_PRODUCT}`);
        error.statusCode = 400;
        return next(error);
    }

    // Update item with current product info and new quantity
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price; // Ensure current price
    cart.items[itemIndex].name = product.name; // Update name in case it changed
    cart.items[itemIndex].imageUrl = product.imageUrl; // Update image in case it changed

    // Calculate cart totals
    const cartTotal = cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((total, item) => {
        return total + item.quantity;
    }, 0);

    await cart.save();

    res.status(200).json({
        success: true,
        message: `Updated ${product.name} quantity to ${quantity}`,
        data: {
            cart,
            summary: {
                totalItems,
                cartTotal: parseFloat(cartTotal.toFixed(2)),
                itemsCount: cart.items.length
            }
        }
    });
});

// @desc      Remove item from cart
// @route     DELETE /api/cart/:itemId
// @access    Private
exports.removeItemFromCart = asyncHandler(async (req, res, next) => {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        const error = new Error('Cart not found');
        error.statusCode = 404;
        return next(error);
    }

    // Find the item to get its name before removing
    const itemToRemove = cart.items.find(item =>
        item._id.toString() === req.params.itemId ||
        item.product.toString() === req.params.itemId
    );

    if (!itemToRemove) {
        const error = new Error('Item not found in cart');
        error.statusCode = 404;
        return next(error);
    }

    // Filter out item by ItemId OR ProductId
    const originalLength = cart.items.length;
    cart.items = cart.items.filter(item =>
        item._id.toString() !== req.params.itemId &&
        item.product.toString() !== req.params.itemId
    );

    if (cart.items.length === originalLength) {
        const error = new Error('Item not found in cart');
        error.statusCode = 404;
        return next(error);
    }

    await cart.save();

    // Calculate updated cart totals
    const cartTotal = cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);

    const totalItems = cart.items.reduce((total, item) => {
        return total + item.quantity;
    }, 0);

    res.status(200).json({
        success: true,
        message: `Removed ${itemToRemove.name} from cart`,
        data: {
            cart,
            summary: {
                totalItems,
                cartTotal: parseFloat(cartTotal.toFixed(2)),
                itemsCount: cart.items.length
            }
        }
    });
});
