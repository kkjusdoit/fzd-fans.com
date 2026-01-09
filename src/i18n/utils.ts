import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  // 只有 en 需要前缀，其他情况默认中文
  if (lang === 'en') return 'en' as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function getLocalizedPath(path: string, lang: string) {
  // 中文是默认语言，不需要前缀
  if (lang === 'zh') {
    return path.startsWith('/') ? path : '/' + path;
  }
  return `/${lang}${path.startsWith('/') ? path : '/' + path}`;
}
