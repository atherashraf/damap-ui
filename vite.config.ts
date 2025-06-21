import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());

    return {
        plugins: [
            react(),
            viteStaticCopy({
                targets: [
                    {
                        src: 'src/assets',      // source folder
                        dest: '.'               // copied to: dist/assets
                    }
                ]
            })
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
        server: {
            port: parseInt(env.VITE_DEV_PORT || '5173'),
        },
        build: {
            outDir: 'dist',
            emptyOutDir: false,
            sourcemap: true,
            lib: {
                entry: resolve(__dirname, 'src/damap.ts'),
                name: 'damap',
                fileName: (format) => `damap.${format}.js`,
                formats: ['es', 'cjs'],
            },
            rollupOptions: {
                external: [
                    'react',
                    'react-dom',
                    'react-router-dom',
                    '@mui/material',
                    '@mui/lab',
                    '@mui/icons-material',
                    '@mui/x-date-pickers',
                    '@emotion/react',
                    '@emotion/styled',
                    'ol',
                    'ol-ext',
                    'react-pivottable',
                    'plotly.js',
                    'react-plotly.js',
                ],
                output: {
                    globals: {
                        react: 'React',
                        'react-dom': 'ReactDOM',
                    },
                },
            },
        },
        optimizeDeps: {
            include: ['@emotion/react', '@emotion/styled'],
        },
    };
});
