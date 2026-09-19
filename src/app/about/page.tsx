'use client';

import { Header } from '@/components/header';
import { useAuth } from '@/components/auth';
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const { version } = useAuth();
  const t = useTranslations('about');
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-10 space-y-8">
        <section>
          <h1 className="text-xl font-bold text-content mb-3">{t('title')}</h1>
          <p className="text-sm text-muted leading-relaxed">{t('intro')}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-content mb-2.5">{t('shortcutsTitle')}</h2>
          <ul className="text-sm text-muted space-y-1.5 list-disc list-inside">
            <li><code className="text-accent">空格</code> {t('shortcutPlay')}</li>
            <li><code className="text-accent">←</code> / <code className="text-accent">→</code> {t('shortcutSeek')}</li>
            <li><code className="text-accent">↑</code> / <code className="text-accent">↓</code> {t('shortcutVolume')}</li>
            <li><code className="text-accent">F</code> {t('shortcutFullscreen')}</li>
            <li><code className="text-accent">Alt + ←/→</code> {t('shortcutEpisode')}</li>
            <li>{t('shortcutLongPress')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-content mb-2.5">{t('privacyTitle')}</h2>
          <p className="text-sm text-muted leading-relaxed">{t('privacyDesc')}</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-content mb-2.5">{t('disclaimerTitle')}</h2>
          <p className="text-sm text-faint leading-relaxed">{t('disclaimerDesc')}</p>
        </section>
      </main>
      <footer className="border-t border-line py-4">
        <p className="text-center text-xs text-faint">
          <a
            href="https://github.com/LibreSpark/LibreTV"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent"
          >
            LibreTV
          </a>
          {version ? ` v${version} · ` : ' '}
          AGPL-3.0 License
        </p>
      </footer>
    </div>
  );
}
