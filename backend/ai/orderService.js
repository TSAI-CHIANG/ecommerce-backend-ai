// backend/ai/orderService.js
import { Order } from '../../models/Order.js';

/**
 * 從使用者訊息文字中抓出看起來像訂單編號的字串。
 * 目前 Order.id 是 UUID，所以這裡先用簡單規則抓「含英數 + dash，長度 >= 10」的片段。
 * 之後如果你有明確的訂單編號格式，可以再調整 regex。
 */
export function extractOrderIdsFromMessage(message) {
  if (!message || typeof message !== 'string') return [];

  const matches = message.match(/[0-9a-fA-F-]{10,}/g);
  return matches || [];
}

/**
 * 依照訂單編號從 DB 查詢（使用現有 Sequelize Order model）
 */
export async function findOrdersByIds(orderIds) {
  if (!orderIds || orderIds.length === 0) return [];

  const orders = await Order.unscoped().findAll({
    where: { id: orderIds },
    order: [['orderTimeMs', 'DESC']],
  });

  // Sequelize instance 轉成純 JSON，避免帶一堆 metadata
  return orders.map((o) => o.toJSON());
}
