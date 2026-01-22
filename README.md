# 樊振东的互联网档案馆

> 🏓 民间互联网记忆工程 | A Community Internet Memory Project

记录樊振东的意志、人品、纯真、良善、机智、幽默，以及他在喧嚣中的清醒与坚守、直面荆棘时的捍卫与孤勇。

🌐 **在线访问**: [fzd-fans.com](https://fzd-fans.com)

---

## 🏗️ 架构概览 (Architecture)

本项目采用现代化的 **Astro 岛屿架构 (Islands Architecture)**，结合了服务端渲染 (SSR) 的高性能与 React 客户端交互的灵活性，部署于 Cloudflare Edge Network。

### 架构图解

```mermaid
graph TD
    User[用户浏览器]
    Cloudflare[Cloudflare Workers (Edge)]
    KV[Cloudflare KV (数据存储)]
    R2[Cloudflare R2 / 图床 (图片存储)]

    subgraph "Astro Server (SSR)"
        Page[Astro Page (.astro)]
        API[API Routes (.ts)]
        Middleware[Middleware (Auth/Protection)]
    end

    subgraph "Client Side (Hydration)"
        React[React Components]
    end

    User -->|请求页面| Cloudflare
    Cloudflare -->|执行| Page
    Page -->|HTML + JSON| User
    
    User -->|交互 (React)| React
    React -->|Fetch API| API
    
    API -->|读写| KV
    API -->|上传| R2
```

### 1. 渲染层：Astro + React (混合模式)

*   **主体框架 (Astro)**: 负责路由、SEO、静态内容（如文章、Markdown）的生成。采用 SSR 模式，首屏直出 HTML，速度极快。
*   **交互岛屿 (React)**: 负责复杂的客户端交互，通过 `client:load` 指令按需加载。
    *   **ImageUploader**: 图片拖拽上传、进度反馈、文件校验。
    *   **Gallery**: 照片墙瀑布流、分页加载、Lightbox 大图查看、状态缓存 (LocalStorage)。

### 2. 服务端层：Cloudflare Workers

*   **Edge Runtime**: 项目构建为 Cloudflare Workers 脚本 (`output: 'server'`)，运行在全球边缘节点。
*   **API Routes**: 位于 `src/pages/api/`，处理动态请求。
    *   `/api/photos`: 获取照片列表 (分页)。
    *   `/api/upload`: 处理图片上传，中转至图床 API。
    *   `/api/sync-auto`: 自动同步图床元数据。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| [Astro 5](https://astro.build/) | 核心框架 (SSR) |
| [React 19](https://react.dev/) | 客户端交互组件 |
| TypeScript | 类型安全 |
| Cloudflare Pages | 部署托管 & Edge Runtime |
| Cloudflare KV | 轻量级数据存储 |
| CSS Modules | 组件样式隔离 |

## 项目结构

```
fzd-archive/
├── src/
│   ├── components/       
│   │   ├── react/        # React 交互组件 (ImageUploader, Gallery)
│   │   └── ...           # Astro 静态组件 (Footer, Navigation)
│   ├── content/          # 内容集合 (Markdown)
│   │   ├── arena/        # 职业生涯
│   │   ├── quotes/       # 语录与梗
│   │   └── ...
│   ├── i18n/             # 国际化 (ui.ts, utils.ts)
│   ├── pages/            # 路由定义
│   │   ├── api/          # 后端 API (photos.ts, upload.ts)
│   │   └── ...           # 前端页面
│   └── env.d.ts          # 环境变量类型定义
├── public/               # 静态资源
├── astro.config.mjs      # Astro 配置 (Cloudflare + React)
└── wrangler.toml         # Cloudflare 部署配置
```

## 核心特性

### 1. 内容集合 (Content Collections)

使用 Astro 的 Content Collections 管理 Markdown 内容，通过 Zod Schema 进行类型校验。

### 2. 国际化 (i18n)

*   **UI 文本**: 统一字典管理 (`ui.ts`)。
*   **内容**: 物理隔离 (`src/content/quotes/zh/`, `src/content/quotes/en/`)。
*   **路由**: 中文默认无前缀，英文 `/en/`。

### 3. 照片墙 (Gallery System)

*   **高性能**: 列表数据分页加载，图片懒加载。
*   **用户体验**: 自动缓存浏览状态（页码、滚动位置），刷新或返回时无缝衔接。
*   **UGC**: 支持用户直接上传图片，前端进行文件校验和 Base64 转换，后端中转上传。

## 开发指南

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npx astro check
```

## 部署配置

项目依赖以下环境变量 (Cloudflare Dashboard 或 `.env`):

*   `BASIC_USER` / `BASIC_PASS`: 管理后台认证。
*   `KV_BINDING`: Cloudflare KV 绑定名称。
*   图床相关配置 (API Key, Endpoints 等)。

## License

内容版权归原作者所有，素材大多来源于网络，如有侵权请联系删除。
