import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';
export default defineConfig({
    resolve: {
        alias: {
            'shared': resolve(__dirname, 'src/shared')
        }
    },
    plugins: [
        react(),
        electron([
            {
                entry: 'src/main/index.ts',
                vite: {
                    build: {
                        outDir: 'dist/main',
                        rollupOptions: {
                            external: ['better-sqlite3', 'keytar', 'ssh2']
                        }
                    }
                }
            },
            {
                entry: 'src/preload/index.ts',
                onstart(options) {
                    options.reload();
                },
                vite: {
                    build: {
                        outDir: 'dist/preload',
                    }
                }
            }
        ]),
        renderer(),
    ],
});
