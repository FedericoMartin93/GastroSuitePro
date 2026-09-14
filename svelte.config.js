import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://svelte.dev/docs/kit/integrations
    preprocess: vitePreprocess(),

    kit: {
        // adapter-static compiles the app as a 100% static SPA without Node.js server
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: 'index.html', // SPA fallback for GitHub Pages
            precompress: false,
            strict: true
        }),
        paths: {
            base: process.env.NODE_ENV === 'production' ? '/GastroSuitePro' : ''
        },
        alias: {
            $lib: 'src/lib',
            $components: 'src/components'
        }
    }
};

export default config;
