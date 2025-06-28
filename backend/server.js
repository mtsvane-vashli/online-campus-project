// server.js

require('dotenv').config(); // .envファイルから環境変数を読み込む
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Google AIの初期設定 ---
// APIキーを環境変数から取得
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// -------------------------

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// AIチャットのエンドポイント
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        console.log('ユーザーからのメッセージ:', userMessage);

        // --- Gemini APIにリクエストを送信 ---
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();
        // ---------------------------------

        console.log('AIからの返信:', text);
        res.json({ reply: text });

    } catch (error) {
        console.error('AIからの応答エラー:', error);
        res.status(500).json({ error: 'AIからの応答の取得に失敗しました。' });
    }
});

app.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました。 http://localhost:${PORT}`);
});