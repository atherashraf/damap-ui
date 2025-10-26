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
                targets: [{ src: 'src/assets', dest: '.' }], // -> dist/assets
            }),
        ],

        resolve: {
            alias: { '@': resolve(__dirname, './src') },
            // Always dedupe React/Emotion to avoid duplicates when linked
            dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
        },

        server: {
            port: parseInt(env.VITE_DEV_PORT || '5173', 10),
        },

        // Library build only
        build: isBuild
            ? {
                outDir: 'dist',
                emptyOutDir: false, // set true if you don't rely on pre-existing files in dist
                sourcemap: true,
                lib: {
                    entry: resolve(__dirname, 'src/damap.ts'),
                    name: 'damap',
                    fileName: (format) => `damap.${format}.js`,
                    formats: ['es', 'cjs'],
                },
                rollupOptions: {
                    external: peers, // externalize all peer deps
                },
            }
            : undefined,

        // On build: don't prebundle peers; on dev: let Vite prebundle react/react-dom normally
        optimizeDeps: isBuild ? { exclude: peers } : {},

        assetsInclude: ['**/*.geojson'],
    };
});
