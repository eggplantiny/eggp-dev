import fs from 'node:fs';
import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

const melGrammar = JSON.parse(fs.readFileSync(new URL('./src/shiki/mel.tmLanguage.json', import.meta.url), 'utf-8'));
const melLanguage = {
  name: 'mel',
  scopeName: 'source.mel',
  ...melGrammar,
};

export default defineConfig({
  site: 'https://eggp.dev',
  output: 'static',
  adapter: vercel({ entrypointResolution: 'auto' }),
  integrations: [sitemap()],
  image: {
    service: passthroughImageService(),
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      langs: [melLanguage],
      langAlias: {
        manifesto: 'mel',
        MEL: 'mel',
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
