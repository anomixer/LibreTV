import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { routing } from './routing';

/**
 * next-intl 请求级配置：根据 Cookie 中的 NEXT_LOCALE 加载对应 messages。
 * 由 next-intl/plugin 接入（next.config.ts），无需 middleware 内部重写路径。
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const val = cookieStore.get('NEXT_LOCALE')?.value;
  const locale =
    val && (routing.locales as readonly string[]).includes(val)
      ? val
      : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
