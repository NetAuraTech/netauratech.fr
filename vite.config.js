import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import preact from "@preact/preset-vite";
import fs from 'fs';

const viteInputsPath = 'bootstrap/cache/vite_inputs.json';
let allInputAssets = [];

if (fs.existsSync(viteInputsPath)) {
    try {
        allInputAssets = JSON.parse(fs.readFileSync(viteInputsPath, 'utf8'));
    } catch (e) {
        console.error('Failed to parse discovered Vite inputs:', e);
        // Fallback en cas d'erreur de parsing
        allInputAssets = [
            'resources/ts/app.ts',
            'resources/ts/admin.ts',
            'resources/css/app.css',
            'resources/css/admin.css',
        ];
    }
} else {
    console.warn('vite_inputs.json not found. Run `php artisan assets:discover` first.');
    allInputAssets = [
    ];
}

export default defineConfig({
    optimizeDeps: {
        include: [
            'htm/mini',
            'preact',
            'preact/hooks',
            'preact/compat',
            'preact/compat/client',
            'preact/jsx-runtime',
        ],
    },
    resolve: {
        alias: {
            '@core-cms-shared': '/vendor/netauratech/core-cms/src/resources/ts/shared',
            'react': 'preact/compat',
            'react-dom': 'preact/compat',
            'react-dom/client': 'preact/compat/client',
            'react/jsx-runtime': 'preact/jsx-runtime',
        },
    },
    plugins: [
        laravel({
            input: allInputAssets,
            refresh: true,
        }),
        preact(),
    ],
});
