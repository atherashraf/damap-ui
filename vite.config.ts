import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const peers = [
    'react',
    'react-dom',
    'react-router-dom',
    'react-redux',
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
];

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd());
    const isBuild = command === 'build';

    return {
        plugins: [
            react(),
            viteStaticCopy({
                targets: [
                    { src: 'src/libs/damap/assets/**/*', dest: 'assets' },
                ],
            }),
        ],

        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
                '@damap': resolve(__dirname, './src/libs/damap'),
                '@demo': resolve(__dirname, './src/demo'),
            },
            dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
        },

        server: {
            port: parseInt(env.VITE_DEV_PORT || '5173', 10),
        },

        build: isBuild
            ? {
                outDir: 'dist',
                emptyOutDir: false,
                sourcemap: true,
                lib: {
                    entry: resolve(__dirname, 'src/libs/damap/damap.ts'),
                    name: 'damap',
                    fileName: (format) => `damap.${format}.js`,
                    formats: ['es', 'cjs'],
                },
                rollupOptions: {
                    external: peers,
                },
            }
            : undefined,

        optimizeDeps: isBuild ? { exclude: peers } : {},

        assetsInclude: ['**/*.geojson'],
    };
});