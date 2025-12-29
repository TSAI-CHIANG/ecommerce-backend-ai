import express from 'express';
import { sequelize } from '../models/index.js';
import { Product } from '../models/Product.js';
import { DeliveryOption } from '../models/DeliveryOption.js';
import { CartItem } from '../models/CartItem.js';
import { Order } from '../models/Order.js';
import { defaultProducts } from '../defaultData/defaultProducts.js';
import { defaultDeliveryOptions } from '../defaultData/defaultDeliveryOptions.js';
import { defaultCart } from '../defaultData/defaultCart.js';
import { defaultOrders } from '../defaultData/defaultOrders.js';
import { defaultUser } from '../defaultData/defaultUser.js';
import { User } from '../models/User.js';
import { DEFAULT_USER_ID } from '../config/auth.js';

const router = express.Router();

router.post('/', async (req, res) => {
  await sequelize.sync({ force: true });

  const timestamp = Date.now();

  const productsWithTimestamps = defaultProducts.map((product, index) => ({
    ...product,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const deliveryOptionsWithTimestamps = defaultDeliveryOptions.map((option, index) => ({
    ...option,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  // Default cart/orders are created with DEFAULT_USER_ID
  // Reset clears ALL data for ALL users
  const userId = DEFAULT_USER_ID;

  const cartItemsWithTimestamps = defaultCart.map((item, index) => ({
    ...item,
    userId,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  const ordersWithTimestamps = defaultOrders.map((order, index) => ({
    ...order,
    userId,
    createdAt: new Date(timestamp + index),
    updatedAt: new Date(timestamp + index)
  }));

  // Create default user for testing auth
  const passwordHash = await User.hashPassword(defaultUser.password);
  await User.create({
    id: defaultUser.id,
    email: defaultUser.email,
    passwordHash,
    createdAt: new Date(timestamp),
    updatedAt: new Date(timestamp)
  });

  await Product.bulkCreate(productsWithTimestamps);
  await DeliveryOption.bulkCreate(deliveryOptionsWithTimestamps);
  await CartItem.bulkCreate(cartItemsWithTimestamps);
  await Order.bulkCreate(ordersWithTimestamps);

  res.status(204).send();
});

export default router;
