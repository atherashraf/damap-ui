import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'path';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd());
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': resolve(__dirname, './src'),
            },
        },
        server: {
            port: parseInt(env.VITE_DEV_PORT) || 5173,
        },
        build: {
            outDir: 'dist',
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                name: 'damap',
                fileName: (format) => `damap.${format}.js`,
                formats: ['es', 'cjs'],
            },
            rollupOptions: {
                external: ['react', 'react-dom'],
                output: {
                    globals: {
                        react: 'React',
                        'react-dom': 'ReactDOM',
                    },
                },
            },
        },
        optimizeDeps: {
            include: ["@emotion/react", "@emotion/styled"],
        },
    };
});
