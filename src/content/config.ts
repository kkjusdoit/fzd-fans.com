import { defineCollection, z } from 'astro:content';

const archiveSchema = z.object({
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  date: z.date().optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['stories', 'arena', 'quotes', 'friends', 'warrior', 'tributes', 'links', 'stars', 'fzd101', 'ugc']),
  image: z.string().optional(),
  source: z.string().optional(), // 来源链接
  translated: z.boolean().default(false), // 是否已翻译
});

// UGC 投稿专用 schema
const ugcSchema = z.object({
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  date: z.date(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['ugc']).default('ugc'),
  // UGC 特有字段
  ugcType: z.enum(['tactical', 'letter']), // tactical=东风·论剑, letter=樊星·寄语
  ugcTag: z.string().optional(), // 细分标签：见招拆招/进化之路/高光复盘 或 赛后感言/时光胶囊/文字创作
  author: z.string(), // 投稿人昵称
  authorNote: z.string().optional(), // 作者简介
  editorNote: z.string().optional(), // 站长按语
  featured: z.boolean().default(false), // 是否精选
  image: z.string().optional(),
  source: z.string().optional(),
  translated: z.boolean().default(false),
});

const stories = defineCollection({ type: 'content', schema: archiveSchema });
const arena = defineCollection({ type: 'content', schema: archiveSchema }); // 重要时刻 (合并难忘时刻+荣誉战绩)
const quotes = defineCollection({ type: 'content', schema: archiveSchema });
const friends = defineCollection({ type: 'content', schema: archiveSchema });
const warrior = defineCollection({ type: 'content', schema: archiveSchema }); // 孤勇者
const tributes = defineCollection({ type: 'content', schema: archiveSchema }); // 评价与祝福
const links = defineCollection({ type: 'content', schema: archiveSchema });
const stars = defineCollection({ type: 'content', schema: archiveSchema }); // 天际樊星 (樊星口号)
const fzd101 = defineCollection({ type: 'content', schema: archiveSchema }); // FZD 101 - 英文入门指南
const ugc = defineCollection({ type: 'content', schema: ugcSchema }); // 投稿

export const collections = { stories, arena, quotes, friends, warrior, tributes, links, stars, fzd101, ugc };
