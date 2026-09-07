# GreatKart React Frontend (API-Driven)

This is the decoupled, single-page React frontend for the **GreatKart** e-commerce application. It is built to communicate exclusively via JSON REST APIs with the Django backend.

## Tech Stack
- **Framework**: React 19 + Vite
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT interceptor and token auto-refresh on 401

---

## Getting Started

### 1. Start the Django Backend Server
In the root project directory, start your Django REST backend:
```powershell
# Windows
.\env\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```
Backend will run at `http://127.0.0.1:8000`.

### 2. Start the React Frontend Dev Server
In a new terminal, navigate to `frontend`:
```powershell
cd frontend
npm run dev
```
The frontend will launch at: `http://localhost:5173`.

---

## Key Features & Page Routes

- `/`: **Home Page** with hero banner, category showcase, and trending products.
- `/store`: **Store Catalog** with real-time keyword search, category filters, and pagination.
- `/product/:slug`: **Product Details** with image gallery, interactive color & size variant selector, live stock badge, reviews breakdown, and review submission.
- `/cart`: **Shopping Cart** with quantity increment/decrement, line removal, subtotal, tax calculation, and checkout CTA.
- `/wishlist`: **Wishlist** with quick "Move to Cart" and item removal.
- `/checkout`: **Checkout & Shipping** with 10-digit phone validation, address fields, order review, and order placement.
- `/order-complete/:orderNumber`: **Order Confirmation** with server-generated order number and invoice summary.
- `/orders`: **Order History** listing all user orders with status badges and details.
- `/orders/:orderNumber`: **Order Details** showing itemized invoice and destination address.
- `/profile`: **User Profile** with personal details, account stats, and quick links.
- `/login`: **JWT Sign In** with email & password.
- `/register`: **Registration** with input validation and instant feedback.

---

## API Endpoints Consumed

All requests send and receive pure JSON data:
- `POST /api/token/`: Obtain JWT `access` and `refresh` tokens
- `POST /api/token/refresh/`: Refresh expired access tokens
- `POST /accounts/api/register/`: Create new customer account
- `GET /accounts/api/profile/`: Retrieve current user profile
- `GET /category/api/categories/`: Fetch categories
- `GET /store/api/products/`: Paginated products with `category` and `search` filters
- `GET /store/api/products/<slug>/`: Detailed product with color variants & sizes
- `GET /store/api/products/<slug>/reviews/`: Customer reviews
- `POST /store/api/products/<slug>/reviews/`: Submit review (verified buyer only)
- `GET /cart/api/`: Customer shopping cart
- `POST /cart/api/add/<variant_id>/`: Add variant to cart (checks stock)
- `POST /cart/api/remove/<variant_id>/`: Decrement quantity
- `DELETE /cart/api/remove_item/<variant_id>/`: Delete cart line
- `GET /wishlist/api/`: Customer wishlist
- `POST /wishlist/api/add/<variant_id>/`: Add variant to wishlist
- `DELETE /wishlist/api/remove/<variant_id>/`: Remove variant from wishlist
- `POST /orders/api/checkout/`: Atomic order creation and inventory decrement
- `GET /orders/api/orders/`: Customer order history
- `GET /orders/api/orders/<order_number>/`: Single order detail
