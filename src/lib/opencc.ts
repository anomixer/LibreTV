import { Converter } from 'opencc-js';

// 初始化简转繁（台湾标准）与繁转简
let converter: ((text: string) => string) | null = null;
let t2sConverter: ((text: string) => string) | null = null;

export function getConverter(): (text: string) => string {
  if (!converter) {
    converter = Converter({ from: 'cn', to: 'tw' });
  }
  return converter;
}

export function s2t(text: string): string {
  if (!text) return text;
  return getConverter()(text);
}

export function getT2SConverter(): (text: string) => string {
  if (!t2sConverter) {
    t2sConverter = Converter({ from: 't', to: 'cn' });
  }
  return t2sConverter;
}

/**
 * 繁转简：将繁体中文转为简体中文，确保搜索采集站片源时能准确匹配
 */
export function t2s(text: string): string {
  if (!text) return text;
  return getT2SConverter()(text);
}

export function isZhTW(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('NEXT_LOCALE=zh-TW');
}

/**
 * 递归将动态数据中的文本转为繁体（跳过 URL、图片、ID、时间戳等非展示字段）
 */
export function convertDataToTW<T>(data: T): T {
  if (!data) return data;
  if (typeof data === 'string') {
    return s2t(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => convertDataToTW(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const res: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // 保留原始链接、ID、密钥等不能被简繁转换修改的字段
      if (
        key === 'url' ||
        key === 'api' ||
        key === 'detail' ||
        key === 'cover' ||
        key === 'pic' ||
        key === 'id' ||
        key === 'vodId' ||
        key === 'key' ||
        key === 'sourceKey' ||
        key === 'sourceUrl' ||
        key === 'epg' ||
        key === 'tvgId' ||
        key === 'logo' ||
        key === 'timestamp' ||
        key === 'ms' ||
        key === 'status' ||
        key === 'code'
      ) {
        res[key] = value;
      } else {
        res[key] = convertDataToTW(value);
      }
    }
    return res as T;
  }
  return data;
}
