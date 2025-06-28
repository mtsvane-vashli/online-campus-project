// server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middlewareの設定
app.use(cors()); // CORSを有効にする
app.use(express.json()); // JSON形式のリクエストボディを解析できるようにする

// AIチャットのエンドポイント（APIの入り口）
app.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    console.log('ユーザーからのメッセージ:', userMessage);

    // ★★★ ここで本来はAI APIを呼び出す ★★★
    // 今回は、AIからの返信をダミーで作成します。
    const aiResponse = {
        reply: `「${userMessage}」についてですね。これはAIからのダミーの返信です。`
    };

    res.json(aiResponse);
});

// サーバーを起動
app.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました。 http://localhost:${PORT}`);
});