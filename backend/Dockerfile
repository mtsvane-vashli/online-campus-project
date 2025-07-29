FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# 本番で不要なパッケージは除外してインストール
RUN npm install --omit=dev
COPY . .

# Expressサーバーがリッスンするポート
EXPOSE 3000

# サーバーを起動
CMD ["node", "server.js"]