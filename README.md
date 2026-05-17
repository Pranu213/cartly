# Cartly - E-Commerce Platform

A production-ready MERN stack e-commerce platform built with modern, professional code practices.

## Tech Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT authentication with role-based access control
- bcryptjs for password hashing

**Database:**
- MongoDB

## Project Structure

```
cartly/
├── cartly-backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── package.json
│   └── .env.example
│
└── cartly-frontend/
    ├── src/
    │   ├── components/      # Reusable React components
    │   ├── pages/          # Page components
    │   ├── services/       # API service layer
    │   ├── context/        # React context for state management
    │   ├── hooks/          # Custom React hooks
    │   ├── utils/          # Utility functions
    │   ├── App.jsx         # Main App component
    │   ├── main.jsx        # React entry point
    │   └── index.css       # Global styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── .env.example
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd cartly-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your MongoDB connection string and JWT secret

5. Start the server:
```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd cartly-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update user profile (protected)

### Products
- `GET /api/products` - Get all products (with pagination, search, filter)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)
- `GET /api/products/categories` - Get all categories

### Cart
- `GET /api/cart` - Get user's cart (protected)
- `POST /api/cart/add` - Add item to cart (protected)
- `PUT /api/cart/update` - Update cart item quantity (protected)
- `DELETE /api/cart/:productId` - Remove item from cart (protected)
- `DELETE /api/cart` - Clear cart (protected)

### Orders
- `GET /api/orders` - Get user's orders (protected)
- `GET /api/orders/:id` - Get order by ID (protected)
- `POST /api/orders` - Create order (protected)
- `PATCH /api/orders/:id/cancel` - Cancel order (protected)
- `PATCH /api/orders/:id/status` - Update order status (admin only)

## Features

- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Product Management**: Browse, search, filter products by category
- **Shopping Cart**: Add/remove items, update quantities, clear cart
- **Checkout**: Place orders with shipping address
- **Order Tracking**: View order history and status
- **Admin Panel**: Manage products (create, update, delete) and order statuses
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Error Handling**: Comprehensive error messages and validation
- **Security**: Password hashing, JWT tokens, protected routes

## Best Practices Implemented

### Backend
- **MVC Architecture**: Clear separation of concerns
- **Environment Variables**: Secure configuration management
- **Error Handling**: Global error handler middleware
- **Validation**: Input validation for all routes
- **Security**: Password hashing with bcryptjs, JWT authentication
- **Async/Await**: Modern async patterns with error handling
- **Code Organization**: Modular folder structure

### Frontend
- **Component Architecture**: Reusable, composable React components
- **State Management**: Context API for global state (Auth, Cart)
- **Custom Hooks**: useAuth, useCart for cleaner component logic
- **Service Layer**: Centralized API calls
- **Protected Routes**: Authentication-based routing
- **Error Handling**: User-friendly error messages
- **Performance**: Lazy loading, proper re-render optimization

## Styling

Uses Tailwind CSS for utility-first styling with custom components:
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.card` - Card component
- `.input-field` - Form input
- `.error-message` - Error text
- `.success-message` - Success text

## Database Schemas

### User
- name, email, password (hashed)
- phone, role (admin/user)
- address (street, city, state, zipCode, country)
- isActive, timestamps

### Product
- name, description, price, category
- stock, image URL
- rating, reviews count
- createdBy (user reference)
- isActive, timestamps

### Cart
- userId (reference)
- items array (productId, quantity, price)
- totalPrice
- timestamps

### Order
- userId (reference)
- items array (productId, quantity, price)
- totalAmount, status
- shippingAddress
- paymentStatus
- timestamps

## Development Workflow

1. **Backend Development**:
   - Create/update models in `src/models/`
   - Implement controllers in `src/controllers/`
   - Define routes in `src/routes/`
   - Add validation in controllers
   - Use `npm run dev` for auto-reload

2. **Frontend Development**:
   - Create components in `src/components/`
   - Create pages in `src/pages/`
   - Use services in `src/services/` for API calls
   - Leverage context and hooks for state
   - Use `npm run dev` for hot reload

## Testing the Application

1. **Register a new user**
2. **Browse products** (products will be empty initially)
3. **Add products as admin** (use admin account)
4. **Add items to cart**
5. **Checkout and create order**
6. **View order history**

## Deployment

### Backend
- Deploy to Heroku, Railway, or similar
- Set environment variables on platform
- Ensure MongoDB URI is accessible

### Frontend
- Build: `npm run build`
- Deploy dist folder to Vercel, Netlify, or similar
- Update API URL in `.env` for production

## Security Considerations

- JWT tokens expire after configured time
- Passwords are hashed with bcryptjs (10 salt rounds)
- Protected routes require valid authentication
- Role-based access control for admin features
- Input validation on all endpoints
- CORS configured for frontend origin
- Sensitive data not exposed in responses

## Future Enhancements

- Payment gateway integration (Stripe/PayPal)
- Product reviews and ratings
- Wishlist functionality
- Admin dashboard with analytics
- Email notifications
- Two-factor authentication
- File upload for product images
- Advanced product filtering
- Recommendation engine

## Contributing

Follow these code standards:
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Follow the established folder structure
- Test features before pushing

## License

MIT License - feel free to use this project as a base for your e-commerce platform.

---

Built with professional practices for production-ready applications.
