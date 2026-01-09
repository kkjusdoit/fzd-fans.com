import { defineCollection, z } from 'astro:content';

const archiveSchema = z.object({
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  date: z.date().optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['stories', 'arena', 'quotes', 'friends', 'warrior', 'tributes', 'links']),
  image: z.string().optional(),
  source: z.string().optional(), // 来源链接
  translated: z.boolean().default(false), // 是否已翻译
});

const stories = defineCollection({ type: 'content', schema: archiveSchema });
const arena = defineCollection({ type: 'content', schema: archiveSchema }); // 赛场之上 (合并难忘时刻+荣誉战绩)
const quotes = defineCollection({ type: 'content', schema: archiveSchema });
const friends = defineCollection({ type: 'content', schema: archiveSchema });
const warrior = defineCollection({ type: 'content', schema: archiveSchema }); // 孤勇者
const tributes = defineCollection({ type: 'content', schema: archiveSchema }); // 评价和祝福
const links = defineCollection({ type: 'content', schema: archiveSchema });

export const collections = { stories, arena, quotes, friends, warrior, tributes, links };
