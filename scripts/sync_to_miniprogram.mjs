import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ASTRO_CONTENT_DIR = path.join(process.cwd(), 'src/content');
const MINI_APP_DATA_DIR = '/Users/linkunkun/WeChatProjects/miniapp-1/miniprogram/data';
const OUTPUT_FILE = path.join(MINI_APP_DATA_DIR, 'content.js');

// Custom marked renderer to adjust URLs if needed, but default is fine
marked.setOptions({
  gfm: true,
  breaks: true
});

async function getMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getMarkdownFiles(res)));
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'placeholder.md') {
      files.push(res);
    }
  }
  return files;
}

async function sync() {
  try {
    console.log('Scanning Astro content directory...');
    const files = await getMarkdownFiles(ASTRO_CONTENT_DIR);
    console.log(`Found ${files.length} markdown files.`);

    const contentArray = [];

    for (const filePath of files) {
      const relative = path.relative(ASTRO_CONTENT_DIR, filePath);
      const parts = relative.split(path.sep); // e.g. ["friends", "zh", "wang-liqin.md"] or ["quotes", "en", "some.md"]
      
      if (parts.length < 2) {
        continue;
      }
      
      const category = parts[0];
      // Language folder is usually parts[1], if not zh/en, default to zh
      let lang = 'zh';
      let filename = parts[parts.length - 1];
      
      if (parts[1] === 'zh' || parts[1] === 'en') {
        lang = parts[1];
      }
      
      const fileId = `${category}-${lang}-${path.basename(filename, '.md')}`;

      const rawContent = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter, content: markdownBody } = matter(rawContent);

      // Convert Markdown to HTML
      const htmlBody = await marked.parse(markdownBody);

      contentArray.push({
        id: fileId,
        category: category,
        lang: lang,
        filename: filename,
        title: frontmatter.title || '',
        titleEn: frontmatter.titleEn || '',
        description: frontmatter.description || frontmatter.descriptionEn || '',
        tags: frontmatter.tags || [],
        translated: frontmatter.translated || false,
        body: htmlBody
      });
    }

    console.log(`Processed ${contentArray.length} items. Writing to ${OUTPUT_FILE}...`);
    
    // Ensure output directory exists
    await fs.mkdir(MINI_APP_DATA_DIR, { recursive: true });

    // Write content.js
    const contentString = `module.exports = {\n  content: ${JSON.stringify(contentArray, null, 2)}\n};\n`;
    await fs.writeFile(OUTPUT_FILE, contentString, 'utf-8');
    
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Error during sync:', error);
  }
}

sync();
