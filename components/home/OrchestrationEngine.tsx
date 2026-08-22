import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Zap, ShieldCheck, Network, Cpu, RefreshCw } from 'lucide-react';

export const OrchestrationEngine: React.FC = () => {
  const t = useTranslations('orchestration');
  const tTerm = useTranslations('orchestration.terminal');
  const locale = useLocale();

  const [selectedNode, setSelectedNode] = useState<string | null>('NODE_01');
  const [trafficGB, setTrafficGB] = useState(124.5);
  const [activeLogs, setActiveLogs] = useState<string[]>([
    tTerm('log1'),
    tTerm('log2'),
    tTerm('log3'),
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Live traffic fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficGB((prev) => +(prev + (Math.random() * 0.8 - 0.38)).toFixed(1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // 语言切换时，重新初始化日志文本（避免初次渲染后切换语言日志保持旧语言）
  useEffect(() => {
    setActiveLogs([tTerm('log1'), tTerm('log2'), tTerm('log3')]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const triggerSurgeSimulation = () => {
    setIsSimulating(true);
    const tag = locale === 'zh-CN' || locale === 'zh-TW' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : locale === 'ko' ? 'ko-KR' : 'en-US';
    const now = new Date().toLocaleTimeString(tag, { hour12: false });
    const newLog = `> [${now}] ${tTerm('simulateLog')}`;
    setActiveLogs((prev) => [newLog, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <section id="orchestration" className="py-20 md:py-28 relative bg-transparent overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.04),transparent_70%)] pointer-events-none"></div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-12 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-mono-code text-[11px] uppercase tracking-[0.2em] mb-4 backdrop-blur-sm shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)] animate-pulse"></span>
            {t('sectionBadge')}
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[var(--color-text-primary)] tracking-tight">
            {t('sectionTitle')} <span className="text-[var(--color-primary)]">{t('sectionHighlight')}</span>
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto opacity-80 leading-relaxed">
            {t('sectionSubtitle')}
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Callouts */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-6">
            <div className="glass-card p-6 rounded-xl border-l-2 border-l-[var(--color-primary)] relative group overflow-hidden transition-all hover:border-[var(--color-primary)]">
              <div className="flex items-start gap-3.5 mb-3">
                <Zap className="w-7 h-7 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[var(--color-text-primary)] text-sm uppercase tracking-wider">{t('left1.title')}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {t('left1.meta')} <span className="text-[var(--color-primary)] font-mono-code font-bold">{t('left1.metaValue')}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed opacity-85 group-hover:opacity-100 transition-opacity">
                {t('left1.desc')}
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl border-l-2 border-l-[var(--color-accent)] relative group overflow-hidden transition-all hover:border-[var(--color-accent)]">
              <div className="flex items-start gap-3.5 mb-3">
                <ShieldCheck className="w-7 h-7 text-[var(--color-accent)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[var(--color-text-primary)] text-sm uppercase tracking-wider">{t('left2.title')}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {t('left2.meta')} <span className="text-[var(--color-accent)] font-mono-code font-bold">{t('left2.metaValue')}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed opacity-85 group-hover:opacity-100 transition-opacity">
                {t('left2.desc')}
              </p>
            </div>
          </div>

          {/* Central Interactive Visual */}
          <div className="lg:col-span-6 glass-card rounded-2xl border border-[var(--color-border)] flex flex-col items-center justify-center relative overflow-hidden p-6 md:p-8 min-h-[460px]">
            {/* Background SVG */}
            <div className="absolute inset-0 opacity-15 pointer-events-none scale-110">
              <svg className="w-full h-full fill-none stroke-[var(--color-text-secondary)] stroke-[0.5]" viewBox="0 0 800 400">
                <path className="map-line" d="M100,100 Q400,50 700,100 T100,300"></path>
                <circle cx="200" cy="150" fill="currentColor" r="3"></circle>
                <circle cx="600" cy="80" fill="currentColor" r="3"></circle>
                <circle cx="400" cy="300" fill="currentColor" r="3"></circle>
                <circle cx="150" cy="350" fill="currentColor" r="3"></circle>
              </svg>
            </div>

            {/* Central Server Rack Visual */}
            <div className="relative z-10 w-full max-w-[340px] my-auto flex flex-col items-center justify-center py-4">
              <div className="absolute inset-0 bg-[var(--color-primary)]/5 blur-[90px] animate-pulse-slow pointer-events-none"></div>

              {/* Server Nodes Stack */}
              <div className="w-full space-y-4">
                {/* Next.js Node */}
                <div
                  onClick={() => setSelectedNode('NODE_01')}
                  className={`h-14 w-full rounded-lg border px-4 flex items-center gap-3 transform sm:-skew-x-6 hover:-translate-y-1 transition-all cursor-pointer ${
                    selectedNode === 'NODE_01'
                      ? 'bg-[var(--color-surface)] border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/10'
                      : 'bg-[var(--color-surface)]/80 border-[var(--color-border)] hover:border-[var(--color-accent)]/60'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"></div>
                  <div className="flex-grow h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-[var(--color-accent)] transition-all duration-500"></div>
                  </div>
                  <span className="font-mono-code text-xs text-[var(--color-accent)] font-bold">{t('node1.label')}</span>
                </div>

                {/* PostgreSQL Node */}
                <div
                  onClick={() => setSelectedNode('DATA_REP')}
                  className={`h-14 w-full rounded-lg border px-4 flex items-center gap-3 transform sm:skew-x-6 hover:-translate-y-1 transition-all cursor-pointer ${
                    selectedNode === 'DATA_REP'
                      ? 'bg-[var(--color-surface)] border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/10'
                      : 'bg-[var(--color-surface)]/80 border-[var(--color-border)] hover:border-[var(--color-primary)]/60'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)]"></div>
                  <div className="flex-grow h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div className="w-[60%] h-full bg-[var(--color-primary)] transition-all duration-500"></div>
                  </div>
                  <span className="font-mono-code text-xs text-[var(--color-primary)] font-bold">{t('node2.label')}</span>
                </div>

                {/* Stripe Node */}
                <div
                  onClick={() => setSelectedNode('NODE_02')}
                  className={`h-14 w-full rounded-lg border px-4 flex items-center gap-3 transform sm:-skew-x-6 hover:-translate-y-1 transition-all cursor-pointer ${
                    selectedNode === 'NODE_02'
                      ? 'bg-[var(--color-surface)] border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/10'
                      : 'bg-[var(--color-surface)]/80 border-[var(--color-border)] hover:border-[var(--color-accent)]/60'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"></div>
                  <div className="flex-grow h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div className="w-[95%] h-full bg-[var(--color-accent)] transition-all duration-500"></div>
                  </div>
                  <span className="font-mono-code text-xs text-[var(--color-accent)] font-bold">{t('node3.label')}</span>
                </div>
              </div>

              {/* Floating Live Badges */}
              <div className="hidden sm:block absolute -top-6 left-0 p-2.5 glass-card border border-[var(--color-border)] rounded-lg font-mono-code text-[10px] shadow-lg">
                <div className="text-[var(--color-text-secondary)] mb-0.5">{t('floatingBadge1.label')}</div>
                <div className="text-[var(--color-primary)] font-bold text-xs">{t('floatingBadge1.value')}</div>
              </div>

              <div className="hidden sm:block absolute -bottom-6 right-0 p-2.5 glass-card border border-[var(--color-border)] rounded-lg font-mono-code text-[10px] shadow-lg">
                <div className="text-[var(--color-text-secondary)] mb-0.5">{t('floatingBadge2.label')}</div>
                <div className="text-[var(--color-accent)] font-bold text-xs">{t('floatingBadge2.value')}</div>
              </div>
            </div>

            {/* Overlay Live Event Terminal */}
            <div className="w-full mt-8 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)] p-3.5 font-mono-code text-[11px] text-[var(--color-text-secondary)]">
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#27C93F] animate-pulse"></span>
                  <span className="uppercase text-[10px] font-bold tracking-wider text-[var(--color-text-primary)]">
                    {tTerm('title')}
                  </span>
                </div>
                <button
                  onClick={triggerSurgeSimulation}
                  disabled={isSimulating}
                  className="text-[10px] text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{tTerm('simulateBtn')}</span>
                </button>
              </div>
              <div className="space-y-1 overflow-hidden max-h-16">
                {activeLogs.map((log, idx) => (
                  <p key={idx} className={idx === 0 ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-text-secondary)]'}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Right Callouts */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-6">
            <div className="glass-card p-6 rounded-xl border-r-2 border-r-[var(--color-primary)] relative group overflow-hidden text-right transition-all hover:border-[var(--color-primary)]">
              <div className="flex flex-row-reverse items-start gap-3.5 mb-3">
                <Network className="w-7 h-7 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[var(--color-text-primary)] text-sm uppercase tracking-wider">{t('right1.title')}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {t('right1.meta')} <span className="text-[var(--color-primary)] font-mono-code font-bold">{t('right1.metaValue')}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed opacity-85 group-hover:opacity-100 transition-opacity">
                {t('right1.desc')}
              </p>
            </div>

            <div className="glass-card p-6 rounded-xl border-r-2 border-r-[var(--color-accent)] relative group overflow-hidden text-right transition-all hover:border-[var(--color-accent)]">
              <div className="flex flex-row-reverse items-start gap-3.5 mb-3">
                <Cpu className="w-7 h-7 text-[var(--color-accent)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[var(--color-text-primary)] text-sm uppercase tracking-wider">{t('right2.title')}</h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {t('right2.meta')} <span className="text-[var(--color-accent)] font-mono-code font-bold">{t('right2.metaValue')}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed opacity-85 group-hover:opacity-100 transition-opacity">
                {t('right2.desc')}
              </p>
            </div>
          </div>
        </div>

        {/* System Metrics Footer Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 border border-[var(--color-border)] rounded-lg glass-card hover:border-[var(--color-accent)]/40 transition-colors">
            <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)] uppercase tracking-widest mb-1">{t('metrics.1.label')}</div>
            <div className="text-xl font-bold text-[var(--color-accent)]">{t('metrics.1.value')}</div>
          </div>
          <div className="p-4 border border-[var(--color-border)] rounded-lg glass-card hover:border-[var(--color-primary)]/40 transition-colors">
            <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)] uppercase tracking-widest mb-1">{t('metrics.2.label')}</div>
            <div className="text-xl font-bold text-[var(--color-text-primary)]">{t('metrics.2.value')}</div>
          </div>
          <div className="p-4 border border-[var(--color-border)] rounded-lg glass-card hover:border-[var(--color-primary)]/40 transition-colors">
            <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)] uppercase tracking-widest mb-1">{t('metrics.3.label')}</div>
            <div className="text-xl font-bold text-[var(--color-primary)]">{t('metrics.3.value')}</div>
          </div>
          <div className="p-4 border border-[var(--color-border)] rounded-lg glass-card hover:border-[var(--color-accent)]/40 transition-colors">
            <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)] uppercase tracking-widest mb-1">{t('metrics.4.label')}</div>
            <div className="text-xl font-bold text-[var(--color-text-primary)]">{t('metrics.4.value')}</div>
          </div>
        </div>
      </div>
    </section>
  );
};