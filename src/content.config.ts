import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const essays = defineCollection({
  loader: glob({ base: './src/content/essays', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
    ogImage: z.string().optional(),
  }),
});

export const collections = { essays };
