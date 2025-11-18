// routes/chatAi.js
import express from 'express';
import { generateChatReply } from '../backend/ai/chatService.js';

const router = express.Router();

/**
 * POST /api/chat
 * body:
 * {
 *   "message": "使用者輸入",
 *   "history": [
 *      { "role": "user" | "assistant", "content": "..." },
 *      ...
 *   ]
 * }
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res
        .status(400)
        .json({ error: 'message 欄位是必填的字串。' });
    }

    const reply = await generateChatReply({
      message,
      history: Array.isArray(history) ? history : [],
    });

    res.json({ reply });
  } catch (err) {
    console.error(err);
    next(err); // 丟給 server.js 的 error middleware 處理
  }
});

export default router;
