import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';

interface FooterProps {}

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

export const Footer: React.FC<FooterProps> = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubscribeStatus>('idle');
  const [message, setMessage] = useState('');
  const t = useTranslations('footer.home');
  const locale = useLocale();

  const getLocalizedPath = (path: string) =>
    locale === 'en' ? path : `/${locale}${path}`;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, locale }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || t('newsletter.serverError'));
        return;
      }

      setStatus('success');
      setMessage(data.message || t('newsletter.successMessage'));
      setEmail('');
    } catch {
      setStatus('error');
      setMessage(t('newsletter.networkError'));
    }
  };

  return (
    <footer className="bg-transparent relative z-10 pt-20 pb-12 border-t border-[var(--color-border)]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12">

        {/* Top Grid: Brand, Navigation Links & Email Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-16">

          {/* Brand & Mission (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="MokerSaaS Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-[#F59E0B] tracking-tight">{t('brand.name')}</span>
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
              {t('brand.description')}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card border border-[var(--color-border)] text-xs font-mono-code text-[var(--color-text-primary)]">
              <span className="flex h-2 w-2 rounded-full bg-[#27C93F] animate-pulse"></span>
              <span className="uppercase tracking-wider">{t('brand.statusBadge')}</span>
            </div>
          </div>

          {/* Nav Links Column 1: 产品方案 (2 cols on lg) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-[var(--color-text-primary)] mb-4 font-mono-code uppercase tracking-wider text-xs">
              {t('products.title')}
            </h4>
            <ul className="space-y-2.5 font-sans text-sm text-[var(--color-text-secondary)]">
              <li>
                <Link
                  href={getLocalizedPath('/#orchestration')}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {t('products.items.orchestration')}
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/#mission-control')}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {t('products.items.missionControl')}
                </Link>
              </li>
              <li>
                <Link
                  href={getLocalizedPath('/#pricing')}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {t('products.items.pricing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Nav Links Column 2: 产品矩阵 (2 cols on lg) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-[var(--color-text-primary)] mb-4 font-mono-code uppercase tracking-wider text-xs">
              {t('productsColumn.title')}
            </h4>
            <ul className="space-y-2.5 font-sans text-sm text-[var(--color-text-secondary)]">
              <li>
                <Link
                  href="https://magiviz.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {t('productsColumn.items.magiviz')}
                </Link>
              </li>
              <li>
                <Link
                  href="https://editf.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {t('productsColumn.items.editf')}
                </Link>
              </li>
              <li>
                <Link
                  href="https://voicecanvas.org"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  {t('productsColumn.items.voiceCanvas')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription Area (4 cols on lg) */}
          <div className="lg:col-span-4 glass-card p-6 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-surface)] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[var(--color-primary)] text-xs font-mono-code font-bold mb-2">
                <Mail className="w-4 h-4" />
                <span>{t('newsletter.title')}</span>
              </div>
              <h5 className="text-base font-bold text-[var(--color-text-primary)] mb-2">
                {t('newsletter.heading')}
              </h5>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                {t('newsletter.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={t('newsletter.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full py-2.5 pl-3 pr-24 bg-[var(--color-bg)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-xl text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]/60 outline-none transition-all font-mono-code disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-[var(--color-primary)] text-white dark:text-[#4d2600] font-bold text-xs rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('newsletter.loadingButton')}</span>
                    </>
                  ) : status === 'success' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('newsletter.subscribedBadge')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('newsletter.subscribeButton')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
              {status === 'success' && (
                <p className="text-[11px] text-[var(--color-accent)] font-mono-code animate-in fade-in flex items-start gap-1">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{message || t('newsletter.successMessage')}</span>
                </p>
              )}
              {status === 'error' && (
                <p className="text-[11px] text-red-500 font-mono-code animate-in fade-in flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{message || t('newsletter.errorMessage')}</span>
                </p>
              )}
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Copyright + Legal Links */}
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3 font-mono-code text-xs text-[var(--color-text-secondary)]">
            <span>{t('bottomBar.copyright', { year: new Date().getFullYear() })}</span>
            <span className="hidden md:inline opacity-40">|</span>
            <Link href={getLocalizedPath('/terms')} className="hover:text-[var(--color-primary)] transition-colors">{t('bottomBar.legal.terms')}</Link>
            <span className="opacity-40">·</span>
            <Link href={getLocalizedPath('/privacy')} className="hover:text-[var(--color-primary)] transition-colors">{t('bottomBar.legal.privacy')}</Link>
            <span className="opacity-40">·</span>
            <Link href={getLocalizedPath('/cookies')} className="hover:text-[var(--color-primary)] transition-colors">{t('bottomBar.legal.cookies')}</Link>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-5 text-[var(--color-text-secondary)]">
            <a href="https://github.com/ItusiAI/MokerSaaS" target="_blank" rel="noreferrer" className="hover:text-[var(--color-primary)] transition-colors" title={t('bottomBar.social.github')}>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a href="https://x.com/zyailive" target="_blank" rel="noreferrer" className="hover:text-[var(--color-primary)] transition-colors" title={t('bottomBar.social.twitter')}>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
