# 樊振东的互联网档案馆

> 🏓 民间互联网记忆工程 | A Community Internet Memory Project

记录樊振东的意志、人品、纯真、良善、机智、幽默，以及他在喧嚣中的清醒与坚守、直面荆棘时的捍卫与孤勇。

🌐 **在线访问**: [fzd-fans.com](https://fzd-fans.com)

---

## 技术栈

| 技术 | 用途 |
|------|------|
| [Astro 5](https://astro.build/) | 静态站点生成框架 |
| TypeScript | 类型安全 |
| Astro Content Collections | 内容管理 |
| Cloudflare Pages | 部署托管 |

## 项目结构

```
fzd-archive/
├── src/
│   ├── components/       # 可复用组件
│   │   ├── Card.astro
│   │   ├── Footer.astro
│   │   ├── LanguagePicker.astro
│   │   ├── Navigation.astro
│   │   └── Timeline.astro
│   ├── content/          # 内容集合 (Markdown)
│   │   ├── arena/        # 职业生涯
│   │   ├── friends/      # 贵人与朋友
│   │   ├── fzd101/       # FZD 101 入门指南
│   │   ├── links/        # 媒体链接
│   │   ├── quotes/       # 语录与梗
│   │   ├── stars/        # 天际樊星
│   │   ├── tributes/     # 评价与祝福
│   │   ├── ugc/          # 用户投稿
│   │   ├── warrior/      # 孤勇者
│   │   └── config.ts     # 内容 Schema 定义
│   ├── i18n/             # 国际化
│   │   ├── ui.ts         # 翻译字符串
│   │   └── utils.ts      # i18n 工具函数
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/            # 页面路由
│   └── config/
│       └── site.ts       # 站点配置
├── public/               # 静态资源
│   ├── audio/
│   ├── img/
│   ├── stars/
│   └── videos/
├── astro.config.mjs      # Astro 配置
├── wrangler.toml         # Cloudflare 配置
└── package.json
```

## 核心特性

### 1. 内容集合 (Content Collections)

使用 Astro 的 Content Collections 管理 Markdown 内容，通过 Zod Schema 进行类型校验：

```typescript
// src/content/config.ts
const archiveSchema = z.object({
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string().optional(),
  date: z.date().optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['stories', 'arena', 'quotes', ...]),
  translated: z.boolean().default(false),
});
```

### 2. 国际化 (i18n)

- 默认语言：中文 (`zh`)
- 支持语言：英文 (`en`)
- 路由策略：中文无前缀，英文使用 `/en/` 前缀
- 自动语言检测与跳转

```typescript
// astro.config.mjs
i18n: {
  defaultLocale: 'zh',
  locales: ['zh', 'en'],
  routing: { prefixDefaultLocale: false }
}
```

内容按语言组织：
```
content/quotes/
├── zh/
│   ├── personal-quotes.md
│   └── memes.md
└── en/
    └── personal-quotes.md
```

### 3. UGC 投稿系统

支持两种投稿类型：
- **东风·论剑** (`tactical`): 技战术分析
- **樊星·寄语** (`letter`): 球迷来信

```typescript
const ugcSchema = z.object({
  ugcType: z.enum(['tactical', 'letter']),
  ugcTag: z.string().optional(),
  author: z.string(),
  featured: z.boolean().default(false),
  // ...
});
```

### 4. SEO 优化

- Canonical URL
- Open Graph 标签
- 多语言 hreflang 标签
- 语义化 HTML

## 环境配置

为了确保后台管理和同步功能的安全性，请务必在 Cloudflare Pages 的设置中（或本地 `.env` 文件中）添加以下环境变量：

- `BASIC_USER`: 管理员用户名
- `BASIC_PASS`: 管理员密码

> **警告**：如果不设置这些环境变量，管理后台和同步 API 将无法使用。

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 本地预览构建结果
npm run preview
```

## 部署

项目部署在 Cloudflare Pages：

```toml
# wrangler.toml
name = "fzd-fans-com"
pages_build_output_dir = "dist"
```

## 添加新内容

1. 在对应的 `src/content/{category}/{lang}/` 目录下创建 `.md` 文件
2. 添加 frontmatter 元数据
3. 编写 Markdown 内容

示例：
```markdown
---
title: "文章标题"
description: "简短描述"
date: 2025-01-01
category: "quotes"
tags: ["语录", "经典"]
translated: false
---

正文内容...
```

## License

内容版权归原作者所有，素材大多来源于网络，如有侵权请联系删除。
