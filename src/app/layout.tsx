import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import './globals.css';
import { Providers } from '@/components/providers';
import { routing } from '@/i18n/routing';
import zhCN from '../../messages/zh-CN.json';
import zhTW from '../../messages/zh-TW.json';

/** locale -> messages 的静态映射，避免根 layout 动态 import 的类型负担 */
const messagesMap = { 'zh-CN': zhCN, 'zh-TW': zhTW } as const;
type Locale = keyof typeof messagesMap;

/** 读取 NEXT_LOCALE cookie（middleware 回写），无则回退默认简中 */
async function resolveLocale(): Promise<Locale> {
  const c = await cookies();
  const val = c.get('NEXT_LOCALE')?.value;
  return val && (routing.locales as readonly string[]).includes(val) ? (val as Locale) : routing.defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const m = messagesMap[locale];
  const app = (m as { app?: { title?: string; description?: string } }).app ?? {};
  return {
    title: {
      default: app.title ?? 'LibreTV',
      template: '%s - LibreTV',
    },
    description: app.description,
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0b101a',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* 首屏前同步主题，避免亮暗闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('libretv-theme')||'dark';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})()",
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messagesMap[locale]} timeZone="Asia/Taipei">
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
