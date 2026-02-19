# Node.js Express E-commerce with Stripe

A e-commerce backend API with Stripe payment integration, RBAC authentication, product management, cart feature implemented and order management.

> **API Documentation (Swagger UI)**: [https://www.habib.iam.bd](https://www.habib.iam.bd)

## Features

- **Authentication**: JWT & Cookie based auth with Role-Based Access Control (User/Admin).
- **Email Verification**: Email verification to prevent spam.
- **Password Reset**: Password reset with email verification.
- **Rate Limiting**: Rate limiting to prevent brute-force attacks.
- **Products**: CRUD operations (Admin only for CUD), browsing for users.
- **Cart**: Persistent shopping cart stored in database.
- **Orders**: Order creation, status tracking, and history.
- **Payments**: 
  - Stripe Payment Intents.
  - Webhook handling for asynchronous payment confirmation.
  - Secure customer integration.
- **Email Service**: 
  - Free Brevo email API (Render blocks SMTP).
  - Email verification for new users.
  - Password reset emails.
  - Works perfectly on Render.
- **Security**: Helmet, CORS, Data Sanitization.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Rename `.env.example` to `.env` and fill in your details:

   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority
   # OR for local: mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   JWT_EXPIRE_DAYS=30
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NODE_ENV=development

   BREVO_API_KEY=xkeysib_YOUR_API_KEY_HERE
   FROM_NAME=Your App Name
   FROM_EMAIL=your-verified-email@gmail.com
   ```
   > **Note**: To get the `STRIPE_WEBHOOK_SECRET`, you need to set up a webhook endpoint in Stripe Dashboard pointing to `your-domain/api/payments/webhook` or use the Stripe CLI for local testing.

   **Email Service (Brevo)**:
   > 1. Sign up at [https://www.brevo.com](https://www.brevo.com) (completely free, no credit card needed)
   > 2. Get your API Key v3 from: **Settings → API keys & MCP**
   > 3. Verify your sender email in Brevo: **Senders → Add a Sender**
   > 4. Use that email as `FROM_EMAIL` in `.env`
   > 5. Free plan includes 300 emails/day (perfect for personal projects)

3. **Run Server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```
   
## API Documentation

### Auth
- `POST /api/v2/auth/register` - Register a new user
- `GET /api/v2/auth/verifyemail/:token` - Verify email
- `POST /api/v2/auth/login` - Login
- `GET /api/v2/auth/me` - Get current user profile
- `GET /api/v2/auth/logout` - Logout user (Clear cookie)
- `POST /api/v2/auth/forgotpassword` - Forgot password
- `GET /api/v2/auth/resetpassword/:token` - Reset password
- `PUT /api/v2/auth/resetpassword/:token` - Reset password with new password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update quantity of existing cart items
- `DELETE /api/cart/:itemId` - Remove item from cart

### Orders
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/all` - Get all orders (Admin)
- `GET /api/orders/user/:userId` - Get orders by user (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe Payment Intent for an order
- `POST /api/payments/setup-intent` - Create Stripe Setup Intent

## Testing Webhooks Locally

1. Install Stripe CLI.
2. Login: `stripe login`
3. Listen: `stripe listen --forward-to localhost:5000/api/payments/webhook`
4. Copy the Webhook Signing Secret (`whsec_...`) printed in the terminal to your `.env` file.

## Troubleshooting

### MongoDB Connection Issues
If you see `MongooseError: Operation buffering timed out` or connection failures:
1. **Check IP Whitelist**: If using MongoDB Atlas, ensure your current IP address is whitelisted in the "Network Access" tab.
2. **Check Connection String**: Ensure your `MONGO_URI` is correct and includes the password.
3. **Firewall/Network**: Some corporate networks or ISPs block port 27017. Try using a VPN or mobile hotspot if the connection fails despite whitelisting.
