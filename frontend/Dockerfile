# ステージ1: ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ステージ2: 本番ステージ
FROM node:20-alpine
WORKDIR /app

# viteはdevDependenciesにあるため、本番でもインストール
COPY package*.json ./
RUN npm install --omit=dev # dependenciesのみインストール
RUN npm install vite # viteのみ追加でインストール

# vite.config.jsをビルドステージからコピーする
COPY --from=builder /app/vite.config.js ./

# ビルドステージから生成物のみコピー
COPY --from=builder /app/dist ./dist

# vite previewが使用するポート
EXPOSE 5173

# コンテナ起動時にvite previewサーバーを起動
# --host 0.0.0.0 でコンテナ外部からのアクセスを許可
CMD ["npm", "run", "serve", "--", "--host", "0.0.0.0", "--port", "5173"]