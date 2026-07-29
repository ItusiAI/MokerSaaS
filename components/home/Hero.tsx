"use client"

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Bolt, ArrowRight, Lock, Copy, Check, Play, TrendingUp } from 'lucide-react';

interface HeroProps {
  onOpenDeploy?: () => void;
  onOpenDocs?: () => void;
}

const defaultCode = `import { db } from '@/lib/db';
import { referrals, users } from '@/lib/schema';
import { grantReferralReward } from '@/lib/referral';

// Next.js 16 App Router · Referral reward grant
export async function POST(req: Request) {
  // 1. Query Neon Serverless Postgres for referral relation
  const relation = await db.select().from(referrals)
    .where(eq(referrals.code, 'MOKER8X'));

  // 2. Auto-grant credits + extend subscription days
  const reward = await grantReferralReward({
    referralId: relation[0].id,
    refereeId: relation[0].referredId,
    plan: 'pro',
  });

  // 3. Insert into Drizzle ORM history + trigger webhook
  await db.insert(referralHistory).values({
    userId: relation[0].referrerId,
    action: 'subscription_reward',
    pointsAwarded: reward.points,
    subscriptionDaysExtended: reward.days,
  });

  return Response.json({ ok: true, reward });
}`;

// GitHub 仓库地址
const GITHUB_REPO_URL = 'https://github.com/ItusiAI/MokerSaaS';

export const Hero: React.FC<HeroProps> = ({ onOpenDeploy, onOpenDocs }) => {
  const t = useTranslations('hero');
  const tCode = useTranslations('hero.code');
  const locale = useLocale();

  const [copied, setCopied] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSimulation = () => {
    setIsDeploying(true);
    setDeployLogs([tCode('simulateLog1'), tCode('simulateLog2')]);
    setTimeout(() => {
      setDeployLogs((prev) => [...prev, tCode('simulateLog3')]);
    }, 600);
    setTimeout(() => {
      setDeployLogs((prev) => [...prev, tCode('simulateSuccess')]);
      setIsDeploying(false);
    }, 1200);
  };

  // 处理"免费获取模板"按钮：优先调用回调，否则新窗口跳转到 GitHub 仓库
  const handlePrimaryCta = () => {
    if (onOpenDeploy) {
      onOpenDeploy();
      return;
    }
    // 携带当前 locale 参数，便于 GitHub 上根据用户语言提供对应 README
    const url = `${GITHUB_REPO_URL}${locale ? `?ref=hero&lang=${locale}` : '?ref=hero'}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="hero" className="relative pt-28 pb-20 md:pt-44 md:pb-36 overflow-hidden bg-transparent scroll-mt-20">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary)]/15 blur-[128px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--color-accent)]/10 blur-[128px] animate-pulse-slow pointer-events-none"></div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-12 relative z-10 w-full min-w-0">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center min-w-0">
          {/* Left Text Content */}
          <div className="z-10 min-w-0 w-full">
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-accent)] font-mono-code text-xs mb-5 sm:mb-6 shadow-sm">
              <Bolt className="w-3.5 h-3.5 fill-[var(--color-accent)] shrink-0" />
              <span>{t('badge')}</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.1] mb-4 sm:mb-5 text-[var(--color-text-primary)]">
              {t('title')}
              <br />
              <span className="text-[var(--color-primary)]">{t('highlight')}</span>
            </h1>

            {/* Subtitle / Description */}
            <p className="text-sm sm:text-lg text-[var(--color-text-secondary)] max-w-lg mb-6 sm:mb-8 leading-relaxed opacity-90">
              {t('description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-10 w-full min-w-0">
              <button
                onClick={handlePrimaryCta}
                className="w-full sm:w-auto bg-[var(--color-primary)] text-white dark:text-[#4d2600] font-bold px-6 sm:px-7 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/15 cursor-pointer text-sm sm:text-base shrink-0"
              >
                <span>{t('primaryCta')}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={() => {
                  if (onOpenDocs) onOpenDocs();
                  else document.getElementById('orchestration')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold px-6 sm:px-7 py-3.5 rounded-xl hover:bg-[var(--color-surface)] transition-all cursor-pointer flex items-center justify-center text-sm sm:text-base shrink-0"
              >
                {t('secondaryCta')}
              </button>
            </div>

            {/* Trust Logos / Core Tech Stack */}
            <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-2 text-[var(--color-text-secondary)] w-full">
              <span className="font-mono-code text-xs uppercase tracking-widest text-[var(--color-text-secondary)] shrink-0 whitespace-nowrap">
                {t('techStackLabel')}
              </span>
              <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 min-w-0">
                {/* Next.js 16 Logo */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs hover:text-[var(--color-text-primary)] transition-colors cursor-pointer shrink-0" title={t('techStack.nextjsTitle')}>
                  <svg className="w-4 h-4 fill-current text-[var(--color-text-primary)] shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.82 17.58l-7.39-9.59H9v8.01H7.5V8H9.3l7.21 9.38c-.8.56-1.72.93-2.69 1.08-.66.12-1.34.14-2 .02zM14.5 8h1.5v5.18l-1.5-1.95V8z" />
                  </svg>
                  <span className="text-[var(--color-text-primary)] font-bold whitespace-nowrap">{t('techStack.nextjs')}</span>
                </div>

                {/* Neon Serverless Postgres Logo */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs hover:text-[var(--color-text-primary)] transition-colors cursor-pointer shrink-0" title={t('techStack.neonTitle')}>
                  <svg className="w-4 h-4 fill-current text-[var(--color-accent)] shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span className="text-[var(--color-text-primary)] font-bold whitespace-nowrap">{t('techStack.neon')}</span>
                </div>

                {/* Stripe Logo */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs hover:text-[var(--color-text-primary)] transition-colors cursor-pointer shrink-0" title={t('techStack.stripeTitle')}>
                  <svg className="w-4 h-4 fill-current text-[var(--color-primary)] shrink-0" viewBox="0 0 24 24">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.875 15.682.25 12.875.25 6.969.25 2.872 3.328 2.872 8.357c0 7.026 9.686 7.377 9.686 11.198 0 .939-.817 1.522-2.158 1.522-2.316 0-5.111-1.137-7.05-2.285l-.946 5.626c1.868 1.077 4.908 1.832 7.822 1.832 6.136 0 10.395-3.033 10.395-8.232 0-7.553-9.695-7.797-9.695-11.868z" />
                  </svg>
                  <span className="text-[var(--color-text-primary)] font-bold whitespace-nowrap">{t('techStack.stripe')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Code Window */}
          <div className="relative group w-full min-w-0">
            {/* Ambient Backlight */}
            <div className="absolute inset-0 bg-[var(--color-accent)]/10 blur-[90px] rounded-full group-hover:bg-[var(--color-accent)]/20 transition-colors pointer-events-none"></div>

            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden terminal-shadow transform md:rotate-1 hover:rotate-0 transition-all duration-500 w-full min-w-0">
              {/* Window Bar */}
              <div className="bg-[var(--color-bg)] px-2.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-1.5 sm:gap-2 border-b border-[var(--color-border)] min-w-0">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F]"></div>
                </div>
                <div className="font-mono-code text-[10px] sm:text-xs text-[var(--color-text-secondary)] flex items-center gap-1 min-w-0 shrink truncate max-w-[120px] xs:max-w-[170px] sm:max-w-none">
                  <Lock className="w-3 h-3 text-[var(--color-accent)] shrink-0" />
                  <span className="truncate">{tCode('tabTitle')}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    onClick={handleRunSimulation}
                    disabled={isDeploying}
                    className="p-1 sm:px-2 sm:py-1 rounded bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] transition-colors cursor-pointer flex items-center gap-1 text-[10px] sm:text-xs"
                    title={tCode('runTitle')}
                  >
                    <Play className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isDeploying ? 'animate-spin' : ''}`} />
                    <span className="hidden xs:inline">{tCode('runLabel')}</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1 sm:p-1.5 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                    title={tCode('copyTitle')}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[var(--color-accent)]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="p-3 sm:p-5 font-mono-code text-[11px] sm:text-sm leading-relaxed h-[270px] sm:h-[360px] overflow-y-auto overflow-x-auto custom-scrollbar bg-[var(--color-surface)] w-full min-w-0">
                <pre className="text-[var(--color-text-primary)] whitespace-pre-wrap break-words overflow-x-auto min-w-0 font-mono text-[11px] sm:text-sm">
                  <code>{defaultCode}</code>
                </pre>

                {/* Live simulation logs box if triggered */}
                {deployLogs.length > 0 && (
                  <div className="mt-4 p-2.5 sm:p-3 rounded bg-[var(--color-bg)] border border-[var(--color-accent)]/30 text-[10px] sm:text-[11px] font-mono-code space-y-1 text-[var(--color-accent)]">
                    {deployLogs.map((log, i) => (
                      <div key={i}>{log}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Overlapping UPTIME Badge */}
            <div className="absolute -bottom-8 -left-6 glass-card p-4 rounded-xl border-[var(--color-accent)]/30 hidden lg:flex items-center gap-4 transform -rotate-2 hover:scale-105 transition-transform z-20 shadow-xl">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono-code text-[var(--color-text-secondary)]">{t('uptimeBadge.label')}</p>
                <p className="text-xl font-bold text-[var(--color-accent)] tracking-tight">{t('uptimeBadge.value')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};