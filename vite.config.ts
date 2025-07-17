import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // <--- AJOUTEZ CETTE IMPORTATION

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // <--- AJOUTEZ CE BLOC DE CONFIGURATION
    },
  },
});
