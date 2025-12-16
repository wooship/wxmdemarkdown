import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 使用更宽松的兼容性目标，防止旧版 WebView 白屏
    target: 'chrome65',
    minify: false, // 禁用压缩，方便调试
    sourcemap: true // 开启源码映射
  }
})