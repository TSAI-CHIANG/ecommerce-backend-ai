## E-Commerce Backend Documentation
Here's a list of all the URL Paths you can use with this backend and what each URL Path does.

**Products, Delivery Options**
- [GET /api/products](#get-apiproducts)
- [GET /api/delivery-options](#get-apidelivery-options)

**Cart**
- [GET /api/cart-items](#get-apicart-items)
- [POST /api/cart-items](#post-apicart-items)
- [PUT /api/cart-items/:productId](#put-apicart-itemsproductid)
- [DELETE /api/cart-items/:productId](#delete-apicart-itemsproductid)

**Orders**
- [GET /api/orders](#get-apiorders)
- [POST /api/orders](#post-apiorders)
- [GET /api/orders/:orderId](#get-apiordersorderid)

**Payment Summary, Reset**
- [GET /api/payment-summary](#get-apipayment-summary)
- [POST /api/reset](#post-apireset)

**Authentication** (optional)
- [GET /api/auth/profile](#get-apiauthprofile)
- [POST /api/auth/register](#post-apiauthregister)
- [POST /api/auth/login](#post-apiauthlogin)
- [POST /api/auth/logout](#post-apiauthlogout)

---

## GET /api/products
Returns a list of products.

**Query Parameters:**
- `search=...` (optional): Search term to find products by name or keywords

**Response:**
```js
[
  {
    "id": "uuid",
    "image": "string",
    "name": "string",
    "rating": {
      "stars": "number",
      "count": "number"
    },
    "priceCents": "number",
    "keywords": ["string"]
  }
]
```

## GET /api/delivery-options
Returns a list of all delivery options.

**Query Parameters:**
- `expand=estimatedDeliveryTime` (optional): includes estimated delivery times

**Response:**
```js
[
  {
    "id": "string",
    "deliveryDays": "number",
    "priceCents": "number",
    // Only included when expand=estimatedDeliveryTime
    "estimatedDeliveryTimeMs": "number"
  }
]
```

## GET /api/cart-items
Returns all items in the cart.

**Authentication:** Required when `AUTH_ENABLED=true`

**Query Parameters:**
- `expand=product` (optional): include full product details

**Response:**
```js
[
  {
    "productId": "uuid",
    "quantity": "number",
    "deliveryOptionId": "string",
      // product object, only when expand=product
    "product": "object"
  }
]
```

## POST /api/cart-items
Adds a product to the cart.

**Authentication:** Required when `AUTH_ENABLED=true`

**Request:**
```js
{
  "productId": "uuid",
  // Must be between 1 and 10
  "quantity": "number"
}
```

**Response:**
```js
{
  "productId": "uuid",
  "quantity": "number",
  "deliveryOptionId": "string",
}
```

## PUT /api/cart-items/:productId
Updates a cart item.

**Authentication:** Required when `AUTH_ENABLED=true`

**URL Parameters:**
- `productId`: ID of the product to update

**Request:**
```js
{
   // Optional, must be ≥ 1
  "quantity": "number",

   // Optional
  "deliveryOptionId": "string"
}
```

**Response:**
```js
{
  "productId": "uuid",
  "quantity": "number",
  "deliveryOptionId": "string",
}
```

## DELETE /api/cart-items/:productId
Removes an item from the cart.

**Authentication:** Required when `AUTH_ENABLED=true`

**URL Parameters:**
- `productId`: ID of the product to remove

**Response:**
- Status: 204 (No response)

## GET /api/orders
Returns all orders, sorted by most recent first.

**Authentication:** Required when `AUTH_ENABLED=true`

**Query Parameters:**
- `expand=products` (optional): include full product details

**Response:**
```js
[
  {
    "id": "uuid",
    "orderTimeMs": "number",
    "totalCostCents": "number",
    "products": [
      {
        "productId": "uuid",
        "quantity": "number",
        "estimatedDeliveryTimeMs": "number",
         // product object, only when expand=products
        "product": "object"
      }
    ]
  }
]
```

## POST /api/orders
Creates a new order from the current cart items.

**Authentication:** Required when `AUTH_ENABLED=true`

**Response:**
```js
{
  "id": "uuid",
  "orderTimeMs": "number",
  "totalCostCents": "number",
  "products": [
    {
      "productId": "uuid",
      "quantity": "number",
      "estimatedDeliveryTimeMs": "number",
    }
  ]
}
```
- Side effect: Cart is emptied

## GET /api/orders/:orderId
Returns a specific order.

**Authentication:** Required when `AUTH_ENABLED=true`

**URL Parameters:**
- `orderId`: ID of the order

**Query Parameters:**
- `expand=products` (optional): include full product details

**Response:**
```js
{
  "id": "uuid",
  "orderTimeMs": "number",
  "totalCostCents": "number",
  "products": [
    {
      "productId": "uuid",
      "quantity": "number",
      "estimatedDeliveryTimeMs": "number",
        // product object, only when expand=products
      "product": "object"
    }
  ]
}
```

## GET /api/payment-summary
Calculates and returns the payment summary for the current cart.

**Authentication:** Required when `AUTH_ENABLED=true`

**Response:**
```js
{
  "totalItems": "number",
  "productCostCents": "number",
  "shippingCostCents": "number",
  "totalCostBeforeTaxCents": "number",
  "taxCents": "number",
  "totalCostCents": "number"
}
```

## POST /api/reset
Resets the database to its default state.

**Response:**
- Status: 204 No Response

---

## Authentication

Authentication is **optional** and can be toggled on/off using an environment variable.

### Enabling/Disabling Authentication

Set the `AUTH_ENABLED` environment variable:

```bash
# Auth disabled by default
npm start

# Auth enabled - cart/orders belong to a user.
AUTH_ENABLED=true npm start
```

### Default User

A default user is created with the default data:

| Field | Value |
|-------|-------|
| Email | `default@example.com` |
| Password | `password123` |

This user owns the default cart items and orders.

### Example:
```js
// Login - cookie is set automatically
await axios.post('/api/auth/login', { email, password });

// Authenticated requests - cookie sent automatically
await axios.get('/api/cart-items');

// Logout - cookie is cleared
await axios.post('/api/auth/logout');
```

---

## GET /api/auth/profile
Returns the current user's information.

**Authentication:** Required when `AUTH_ENABLED=true`

**Response:**
```js
{
  "id": "uuid",
  "email": "string"
}
```

**Errors:**
- `401`: Not logged in
- `400`: Auth disabled

## POST /api/auth/register
Creates a new user and logs them in.

**Request:**
```js
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```js
{
  "id": "uuid",
  "email": "string"
}
```
- Sets `token` cookie (HttpOnly, Secure, SameSite=Strict)

**Errors:**
- `400`: Email already registered, invalid email, password too short, or auth disabled

## POST /api/auth/login
Logs in an existing user.

**Request:**
```js
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```js
{
  "id": "uuid",
  "email": "string"
}
```
- Sets `token` cookie (HttpOnly, Secure, SameSite=Strict)

**Errors:**
- `401`: Invalid email or password
- `400`: Auth disabled or already logged in

## POST /api/auth/logout
Logs out the current user.

**Response:**
```js
{
  "message": "Logged out successfully"
}
```
