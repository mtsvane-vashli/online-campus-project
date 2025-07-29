import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  // もしReactやVueなどをお使いの場合は、ここにプラグインの設定を追加する必要があります
  // 例: plugins: [react()],

  preview: {
    port: 5173,
    host: true, // コンテナ外からのアクセスを許可するために推奨
    // この設定で「Host not allowed」エラーを解決します
    allowedHosts: ["campus.monetam.xyz"]
  }
});