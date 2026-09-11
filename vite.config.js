import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (!env.VITE_LEGAL_NAME && (env.VITE_LEGAL_ADDRESS || env.VITE_LEGAL_EMAIL)) {
    console.warn(
      '\n[33mVITE_LEGAL_NAME is not set, so no legal notice will be shown even though ' +
        'VITE_LEGAL_ADDRESS/EMAIL are. Set it and rebuild.[0m\n'
    );
  }

  return {
    plugins: [
      svelte(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        devOptions: {
          enabled: true,
          type: 'module',
          suppressWarnings: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true
        },
        manifest: {
          name: 'Vector Oso',
          short_name: 'Vector Oso',
          description:
            'Turn a photo or scan of a drawing into clean SVG, PDF, EPS, DXF or PNG paths. Runs entirely in your browser.',
          lang: 'en',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          theme_color: '#0b0c11',
          background_color: '#0b0c11',
          categories: ['graphics', 'productivity', 'utilities'],
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    server: {
      port: 5173,
      host: true,
      allowedHosts: true
    },
    build: {
      target: 'esnext'
    }
  };
});
