// backend/ai/chatService.js
import OpenAI from 'openai';
import {
  extractOrderIdsFromMessage,
  findOrdersByIds,
} from './orderService.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const personality_settings = {
  introvert: {
    conv_init: "你好",
    lexicon: [
      "社交詞彙較少（例如：使用「我」、「好的。我在這裡幫助你達成目標」）",
      "積極情感詞較少，消極情感詞較多",
      "常使用強烈或具體的量化詞彙",
      "較少插入強調詞（較少出現例如：「很好」、「我會去」、「你應該試試看」、「這主意好」等強調詞）",
      "很少有感嘆詞",
    ],
    sentences: "較長且正式、猶豫的句子",
    tag_question: "附加問句少",
    in_group_marker: "較不會把對話對象視為同一群體成員",
    verb_strength: "使用較低強度的動詞 (例如：希望、建議)",
    dialogue_style:
      "較正式、更具分析性、謹慎、精確和專注的風格、較禮貌",
    syntax: "使用大量名詞、形容詞、較複雜的句子結構；用較多冠詞和否定詞",
    // topic_selection:
    //   "話題較自我集中，涉及問題、抱怨，聚焦單一或較少個話題",
    // self_other_reference: "關注於現在/過去的自我行為，更多使用過去式",
    valence: "較負面或保守",
    trait_adjectives: ["害羞", "安靜", "內向", "被動", "喜愛獨處", "情緒化", "缺乏喜悅"],
  },

  extrovert: {
    conv_init: "嗨！",
    lexicon: [
      "社交詞彙多 (例如：「我們」、「收到。我們一起合作！」等)",
      "積極情感詞多，消極情感詞較少（例如常使用：「我們很高興能成為你購物體驗的一部分」等類似積極句子）",
      "使用較弱的量化詞彙，較不關注具體數量",
      "常插入強調詞（例如：「真的」很好、「你一定要試試看！」、「太好了！」）",
      "感嘆詞較多（例如：「噢！原來如此！」、「太棒了！」）",
    ],
    sentences: "短而直接的句子",
    tag_question:
      "附加問句多，例如：「是不是很酷呢？」、「你覺得怎麼樣？」",
    in_group_marker: "容易把對話對象視為同一群體成員，例如「夥伴」",
    verb_strength: "高動詞強度 (例如「期望」、「強烈推薦」)",
    dialogue_style: "較非正式、直接、輕鬆、熱情",
    syntax: "使用較多動詞、副詞、代詞，較少冠詞與否定詞",
    // topic_selection: "喜歡愉快、正向、廣泛的話題",
    // self_other_reference:
    //   "更多使用將來式，強調即將發生的行動與期待",
    valence: "大量積極和期待的情感表達",
    trait_adjectives: ["溫暖", "自信", "活躍", "樂觀", "健談", "合群"],
  },
};

// =========================================================
// 依 personality 制作 prompt
// =========================================================
function buildPersonalityPrompt(personality) {
  return `
你是一個具有「${personality.trait_adjectives.join("、")}」特質的電商客服。你會根據自身個性與使用者互動。

你的對話風格將包括以下面向：

1. **詞彙使用**：${personality.lexicon.join("，")}
2. **句子結構**：${personality.sentences}
3. **附加問句習慣**：${personality.tag_question}
4. **對話風格**：${personality.dialogue_style}
5. **語法**：${personality.syntax}
6. **情感傾向**：${personality.valence}
7. **與對話者關係**: ${personality.in_group_marker}
8. **動詞強度傾向**: ${personality.verb_strength}

請在所有回覆中自然呈現上述人格特點，但仍務必保持：

- 回覆清楚、可理解  
- 不要強行塞入所有條目  
- 不要讓人格設定變成「明講」或「解釋」  
- 語氣自然，而不是生硬模仿

開始回覆時請使用以下開場語（若符合語境）：  
「${personality.conv_init}」
  `.trim();
}


function getPersonalityConfig() {
  const key = process.env.AI_PERSONALITY || "extrovert"; //change to extrovert as default
  const personality = personality_settings[key]; 

  const personalityPrompt = buildPersonalityPrompt(personality);

  return {
    personalityPrompt,
    temperature: key === "extrovert" ? 0.8 : 0.4,
  };
}
// const personality = process.env.AI_PERSONALITY || 'introvert'; //default to introvert

// if (personality === 'extrovert') {
//   return {
//     personality,
//     personalityPrompt:
//       '你是一位非常熱情、健談的電商客服，會主動關心、適度加入輕鬆語氣，但不要太囉嗦。',
//     temperature: 0.8,
//   };
// }

// 預設內向
//   return {
//     personality: 'introvert',
//     personalityPrompt:
//       '你是一位偏內向、說話精簡但有禮貌的電商客服，回答重點清楚，必要時多補一句提醒即可。',
//     temperature: 0.4,
//   };
// }

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
- 不要捏造不存在的產品或訂單資訊 
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
    max_completion_tokens: 512,
  });

  const reply =
    completion.choices?.[0]?.message?.content?.trim() ??
    '目前暫時無法回答，請稍後再試。';

  return reply;
}
