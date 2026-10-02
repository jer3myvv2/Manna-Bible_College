import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Lets you set VITE_API_URL=/api in development too; requests are forwarded to Flask.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
