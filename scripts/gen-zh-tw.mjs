import { readFileSync, writeFileSync } from 'node:fs';
import { Converter } from 'opencc-js';

// 简 → 繁转换，用于生成 messages/zh-TW.json
const cn = JSON.parse(readFileSync(new URL('../messages/zh-CN.json', import.meta.url), 'utf8'));
const c = Converter({ from: 'cn', to: 'tw' });

function convertNode(node) {
  if (typeof node === 'string') return c(node);
  if (Array.isArray(node)) return node.map(convertNode);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = convertNode(v);
    return out;
  }
  return node;
}

const tw = convertNode(cn);
writeFileSync(new URL('../messages/zh-TW.json', import.meta.url), JSON.stringify(tw, null, 2) + '\n', 'utf8');
console.log('zh-TW.json generated');
