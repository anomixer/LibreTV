'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { s2t } from '@/lib/opencc';

/**
 * 全局繁体中文提供者：
 * 当当前语言为 zh-TW 时，自动监听并将整站 DOM 中所有简体文本、
 * placeholder、title、aria-label 转换为台湾正体繁体。
 * 配合 client-api 的数据层转换，实现整站 100% 繁体无死角覆盖。
 */
export function TraditionalChineseProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    if (locale !== 'zh-TW') return;

    const ignoreTags = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'INPUT', 'TEXTAREA']);

    function convertNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentElement;
        if (parent && (parent.closest('[data-no-tw="true"]') || parent.closest('.notranslate'))) return;
        const val = node.nodeValue;
        if (val && /[\u4e00-\u9fa5]/.test(val)) {
          const converted = s2t(val);
          if (converted !== val) {
            node.nodeValue = converted;
          }
        }
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (ignoreTags.has(el.tagName) || el.getAttribute('data-no-tw') === 'true' || el.classList.contains('notranslate')) return;

        // 转换 placeholder
        const ph = el.getAttribute('placeholder');
        if (ph && /[\u4e00-\u9fa5]/.test(ph)) {
          const c = s2t(ph);
          if (c !== ph) el.setAttribute('placeholder', c);
        }

        // 转换 title
        const title = el.getAttribute('title');
        if (title && /[\u4e00-\u9fa5]/.test(title)) {
          const c = s2t(title);
          if (c !== title) el.setAttribute('title', c);
        }

        // 转换 aria-label
        const aria = el.getAttribute('aria-label');
        if (aria && /[\u4e00-\u9fa5]/.test(aria)) {
          const c = s2t(aria);
          if (c !== aria) el.setAttribute('aria-label', c);
        }

        for (let i = 0; i < el.childNodes.length; i++) {
          convertNode(el.childNodes[i]);
        }
      }
    }

    // 初次遍历挂载
    convertNode(document.body);

    let rafId: number | null = null;
    const pendingNodes = new Set<Node>();

    const flush = () => {
      pendingNodes.forEach((n) => {
        if (document.body.contains(n)) {
          convertNode(n);
        }
      });
      pendingNodes.clear();
      rafId = null;
    };

    // 监听后续动态注入节点（弹窗、抽屉、虚拟列表等）
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => pendingNodes.add(n));
        } else if (m.type === 'characterData') {
          const parent = m.target.parentElement;
          if (parent && (parent.closest('[data-no-tw="true"]') || parent.closest('.notranslate'))) continue;
          const val = m.target.nodeValue;
          if (val && /[\u4e00-\u9fa5]/.test(val)) {
            const converted = s2t(val);
            if (converted !== val) {
              m.target.nodeValue = converted;
            }
          }
        }
      }
      if (pendingNodes.size > 0 && rafId === null) {
        rafId = requestAnimationFrame(flush);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [locale]);

  return <>{children}</>;
}
