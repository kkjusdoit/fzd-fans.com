import { defineCollection, z } from 'astro:content';

const archiveSchema = z.object({
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  date: z.date().optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['stories', 'moments', 'quotes', 'friends', 'honors', 'links']),
  image: z.string().optional(),
  source: z.string().optional(), // 来源链接
  translated: z.boolean().default(false), // 是否已翻译
});

const stories = defineCollection({ type: 'content', schema: archiveSchema });
const moments = defineCollection({ type: 'content', schema: archiveSchema });
const quotes = defineCollection({ type: 'content', schema: archiveSchema });
const friends = defineCollection({ type: 'content', schema: archiveSchema });
const honors = defineCollection({ type: 'content', schema: archiveSchema });
const links = defineCollection({ type: 'content', schema: archiveSchema });

export const collections = { stories, moments, quotes, friends, honors, links };
