import { defineRouting } from 'next-intl/routing';

/**
 * 国际化路由配置：简中（默认）/ 繁中。
 * localePrefix: 'never' —— URL 不带语言前缀（/、/watch、/live 保持原样），
 * 语言通过 NEXT_LOCALE cookie 记忆，切换只改 cookie + 刷新，不破坏现有路由/分享链接。
 */
export const routing = defineRouting({
  locales: ['zh-CN', 'zh-TW'],
  defaultLocale: 'zh-CN',
  localePrefix: 'never',
});
