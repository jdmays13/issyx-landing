import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://issyx.com',
  devToolbar: {
    enabled: false,
  },
});
