import { ui, defaultLang, languages } from './ui';

export type Lang = keyof typeof ui;

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function getLocalizedPath(path: string, lang: string) {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  // 中文是默认语言，不需要前缀
  if (lang === 'zh') return cleanPath;
  return `/${lang}${cleanPath}`;
}

// 获取当前语言对应的内容前缀
export function getContentLangPrefix(lang: Lang): string {
  return `${lang}/`;
}

// 从 slug 中移除语言前缀
export function removeLanguagePrefix(slug: string): string {
  return slug.replace(/^(zh|en)\//, '');
}

// 获取对应语言的内容 slug
export function getLocalizedSlug(slug: string, lang: Lang): string {
  const cleanSlug = removeLanguagePrefix(slug);
  return `${lang}/${cleanSlug}`;
}
