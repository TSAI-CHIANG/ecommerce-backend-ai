// backend/ai/chatService.js
import OpenAI from 'openai';
import {
  extractOrderIdsFromMessage,
  findOrdersByIds,
} from './orderService.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getPersonalityConfig() {
  const personality = process.env.AI_PERSONALITY || 'introvert';

  if (personality === 'extrovert') {
    return {
      personality,
      personalityPrompt:
        '你是一位非常熱情、健談的電商客服，會主動關心、適度加入輕鬆語氣，但不要太囉嗦。',
      temperature: 0.8,
    };
  }

  // 預設內向
  return {
    personality: 'introvert',
    personalityPrompt:
      '你是一位偏內向、說話精簡但有禮貌的電商客服，回答重點清楚，必要時多補一句提醒即可。',
    temperature: 0.4,
  };
}

/**
 * 主要流程：
 * 1. 從 message 抓出可能的訂單 id
 * 2. 用 Order model 查 DB
 * 3. 把訂單 JSON + 問題 + personality prompt 一起丟給 GPT
 */
export async function generateChatReply({ message, history }) {
  const { personalityPrompt, temperature } = getPersonalityConfig();

  // 1. 解析訂單編號
  const orderIds = extractOrderIdsFromMessage(message);

  // 2. 查 DB 拿訂單資料
  const orders =
    orderIds.length > 0 ? await findOrdersByIds(orderIds) : [];

  // 3. system prompt（人格 + 行為規則）
  const systemPrompt = `
你是某電商網站的客服機器人，專門協助處理「訂單相關問題」以及一般購物問題。
你可以使用後端提供的訂單資料回答問題。
${personalityPrompt}

回答原則：
- 優先根據實際訂單資料作答，不要憑空捏造。
- 查無訂單時，要請對方確認訂單編號或提供更多資訊。
- 回覆使用繁體中文。
  `.trim();

  const messages = [{ role: 'system', content: systemPrompt }];

  // 歷史訊息（前端如果有傳就一併加進來）
  if (Array.isArray(history)) {
    history.forEach((msg) => {
      if (!msg.role || !msg.content) return;
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });
  }

  // 把訂單資料塞進去當 context
  messages.push({
    role: 'system',
    content:
      orders.length > 0
        ? `以下是系統查到的訂單資料（JSON 格式，請依照內容回答，不要杜撰）：${JSON.stringify(orders)}`
        : '目前尚未查到任何訂單資料，若使用者提到訂單，請先請他確認訂單編號或提供更多資訊。',
  });

  // 當前這次的 user 問題
  messages.push({ role: 'user', content: message });

  // 4. 呼叫 GPT
  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini', // 你可以換成自己要用的模型
    messages,
    temperature,
    max_tokens: 512,
  });

  const reply =
    completion.choices?.[0]?.message?.content?.trim() ??
    '目前暫時無法回答，請稍後再試。';

  return reply;
}
