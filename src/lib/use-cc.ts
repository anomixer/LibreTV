'use client';

import { useLocale } from 'next-intl';
import { s2t } from './opencc';

/**
 * 繁简转换 Hook：当当前语言为 zh-TW 时，自动将传入的简体字符串转为台湾繁体。
 * 为 zh-CN 时原样返回，零性能损耗。
 */
export function useCC() {
  const locale = useLocale();
  const isTW = locale === 'zh-TW';

  return function cc(text: string | undefined | null): string {
    if (!text) return '';
    return isTW ? s2t(text) : text;
  };
}
