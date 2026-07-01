import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const teamsWebhookUrl = env.VITE_TEAMS_WEBHOOK_URL;

  const teamsProxy = teamsWebhookUrl
    ? {
        target: new URL(teamsWebhookUrl).origin,
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/api\/teams-notify/, new URL(teamsWebhookUrl).pathname),
      }
    : undefined;

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api/teams-notify': teamsProxy,
      },
    },
    preview: {
      proxy: {
        '/api/teams-notify': teamsProxy,
      },
    },
  };
});
