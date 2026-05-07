import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@engine': resolve('engine'),
        '@shared': resolve('electron/shared'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve('electron/main/index.ts'),
        },
        external: ['better-sqlite3', 'keytar', 'playwright'],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('electron/shared'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve('electron/preload/index.ts'),
        },
      },
    },
  },
  renderer: {
    root: resolve('src'),
    resolve: {
      alias: {
        '@': resolve('src'),
        '@shared': resolve('electron/shared'),
        '@components': resolve('src/components'),
        '@store': resolve('src/store'),
        '@hooks': resolve('src/hooks'),
        '@utils': resolve('src/utils'),
      },
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/index.html'),
        },
      },
    },
  },
});
