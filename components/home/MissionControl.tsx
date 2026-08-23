import React, { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Users,
  LayoutDashboard,
  CreditCard,
  Gift,
  BarChart3,
  Coins,
  Share2,
  ArrowUpRight,
  Key,
  Clock,
  Sparkles,
  TrendingUp,
  DollarSign,
  ImageIcon
} from 'lucide-react';

const TAB_IDS = ['admin', 'dashboard', 'subscriptions', 'affiliate'] as const;
type TabId = (typeof TAB_IDS)[number];

// 每个 tab 对应的演示截图（项目 public/images 真实存在）
const PREVIEW_IMAGES: Record<TabId, string> = {
  admin: '/images/admin-demo.png',
  dashboard: '/images/profile-demo.png',
  subscriptions: '/images/subscription-demo.png',
  affiliate: '/images/affiliate-demo.png'
};

// 每个 tab 的头部图标
const PREVIEW_HEADER_ICONS: Record<TabId, React.ElementType> = {
  admin: BarChart3,
  dashboard: LayoutDashboard,
  subscriptions: CreditCard,
  affiliate: Gift
};

export const MissionControl: React.FC = () => {
  const t = useTranslations('missionControl');
  const tTab = useTranslations('missionControl.tabs');
  const tPrev = useTranslations('missionControl.previews');

  const [activeSlide, setActiveSlide] = useState(0);
  const activeTab: TabId = TAB_IDS[activeSlide];

  // 取当前 tab 的标题/描述/亮点/特性列表
  const tabItems = tTab.raw(activeTab) as {
    tabTitle: string;
    title: string;
    highlight: string;
    description: string;
    items: string[];
  };

  // Tab 详情左侧的图标列表（与每个 tab 的特性条目一一对应）
  const tabIconMap: Record<TabId, React.ElementType[]> = {
    admin: [Users, BarChart3, Coins],
    dashboard: [LayoutDashboard, Key, Share2],
    subscriptions: [CreditCard, Clock, ArrowUpRight],
    affiliate: [Gift, DollarSign, TrendingUp]
  };

  const HeaderIcon = PREVIEW_HEADER_ICONS[activeTab];

  return (
    <section id="mission-control" className="py-24 md:py-32 relative overflow-hidden bg-transparent scroll-mt-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono-code text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('sectionBadge')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-4">
            {t('sectionTitlePrefix')}{' '}
            <span className="text-[var(--color-primary)]">{t('sectionTitleHighlight')}</span>
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto opacity-80">
            {t('sectionSubtitle')}
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">

          {/* Left Sidebar: Interactive Feature Detail & Tabs Switcher */}
          <div className="order-2 lg:order-1 lg:col-span-4 flex flex-col justify-between gap-4 sm:gap-6 w-full min-w-0">
            <div className="glass-card p-4 sm:p-6 md:p-8 rounded-2xl border border-[var(--color-primary)]/20 relative overflow-hidden flex-grow flex flex-col justify-between w-full min-w-0">
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)]"></div>

              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] font-mono-code text-[11px] mb-3 sm:mb-4">
                  <span>{t('moduleCounter', { current: activeSlide + 1, total: TAB_IDS.length })}</span>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 sm:mb-3 leading-tight text-[var(--color-text-primary)]">
                  {tabItems.title} <br />
                  <span className="text-[var(--color-primary)]">{tabItems.highlight}</span>
                </h3>

                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4 sm:mb-6 leading-relaxed opacity-90">
                  {tabItems.description}
                </p>

                <ul className="space-y-2.5 sm:space-y-3.5 mb-4 sm:mb-6">
                  {tabItems.items.map((text, idx) => {
                    const IconComponent = tabIconMap[activeTab][idx] ?? ArrowUpRight;
                    return (
                      <li key={idx} className="flex items-start gap-2.5 sm:gap-3 text-xs md:text-sm font-sans text-[var(--color-text-primary)]">
                        <IconComponent className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                        <span className="leading-normal">{text}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setActiveSlide((prev) => (prev + 1) % TAB_IDS.length)}
                  className="w-full py-2.5 sm:py-3 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] rounded-lg font-bold hover:bg-[var(--color-primary)]/20 active:scale-98 transition-all text-xs font-mono-code flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('nextButton')}</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>

            {/* Micro Metrics Banner */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full min-w-0">
              <div className="glass-card p-3 sm:p-4 rounded-xl border border-[var(--color-border)] min-w-0">
                <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)] uppercase mb-1 truncate">
                  {t('metrics.savedTime.label')}
                </div>
                <div className="text-lg sm:text-xl font-bold text-[var(--color-accent)] truncate">
                  {t('metrics.savedTime.value')}
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary)]/70 font-mono-code mt-0.5 truncate">
                  {t('metrics.savedTime.caption')}
                </div>
              </div>
              <div className="glass-card p-3 sm:p-4 rounded-xl border border-[var(--color-border)] min-w-0">
                <div className="text-[10px] font-mono-code text-[var(--color-text-secondary)] uppercase mb-1 truncate">
                  {t('metrics.commission.label')}
                </div>
                <div className="text-lg sm:text-xl font-bold text-[var(--color-primary)] truncate">
                  {t('metrics.commission.value')}
                </div>
                <div className="text-[10px] text-[var(--color-text-secondary)]/70 font-mono-code mt-0.5 truncate">
                  {t('metrics.commission.caption')}
                </div>
              </div>
            </div>
          </div>

          {/* Right Main: Feature Preview Display Dashboard */}
          <div className="order-1 lg:order-2 lg:col-span-8 w-full min-w-0">
            <div className="bg-[var(--color-surface)] text-[var(--color-text-primary)] rounded-2xl border border-[var(--color-border)] overflow-hidden terminal-shadow h-full flex flex-col relative group">

              {/* Dashboard Top Header Tabs */}
              <div className="bg-[var(--color-bg)] px-2 sm:px-6 py-0 flex items-center justify-between border-b border-[var(--color-border)] min-w-0">
                <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto custom-scrollbar w-full min-w-0 py-2 sm:py-0">
                  <div className="hidden xs:flex gap-1.5 py-2 sm:py-3 shrink-0">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className="flex h-10 sm:h-14 w-full min-w-0 overflow-x-auto custom-scrollbar gap-1 sm:gap-2">
                    {TAB_IDS.map((id, idx) => (
                      <button
                        key={id}
                        onClick={() => setActiveSlide(idx)}
                        className={`px-2.5 sm:px-4 py-2 flex items-center gap-1.5 sm:gap-2 border-b-2 font-sans text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          activeSlide === idx
                            ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-bold'
                            : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                        <span>{tTab(`${id}.tabTitle`)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 font-mono-code text-[11px] text-[var(--color-accent)] py-2 shrink-0 ml-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
                  <span>{t('readyBadge')}</span>
                </div>
              </div>

              {/* Viewport Content: Header + Image Preview */}
              <div className="p-3.5 sm:p-6 flex-grow flex flex-col justify-between min-h-[420px] sm:min-h-[500px] bg-[var(--color-surface)] w-full min-w-0 overflow-hidden">
                <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300 w-full min-w-0">

                  {/* Header: 图标 + 标题 + 副标题 + 右侧徽章 */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[var(--color-border)]">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <HeaderIcon className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                        <span>{tPrev(`${activeTab}.title`)}</span>
                      </h4>
                      <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {tPrev(`${activeTab}.subtitle`)}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30 text-[10px] sm:text-xs font-mono-code font-bold shrink-0">
                      {tPrev(`${activeTab}.badge`)}
                    </span>
                  </div>

                  {/* Image Preview: 统一图片展示区 */}
                  <div className="relative w-full min-w-0 rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)] group/image">
                    <Image
                      src={PREVIEW_IMAGES[activeTab]}
                      alt={tPrev(`${activeTab}.imageAlt`)}
                      width={1200}
                      height={675}
                      loading="lazy"
                      decoding="async"
                      sizes="(min-width: 1024px) 640px, 100vw"
                      className="w-full h-auto object-cover block"
                    />
                    {/* Image Caption Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-t from-black/70 via-black/40 to-transparent backdrop-blur-[2px]">
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono-code text-white/90">
                        <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 opacity-80" />
                        <span className="truncate">{tPrev(`${activeTab}.imageCaption`)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Bullet Selector */}
              <div className="py-3 bg-[var(--color-bg)] flex justify-center items-center gap-2 border-t border-[var(--color-border)]">
                {TAB_IDS.map((id, idx) => (
                  <button
                    key={id}
                    onClick={() => setActiveSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activeSlide === idx ? 'w-6 bg-[var(--color-primary)]' : 'w-2 bg-[var(--color-border)] hover:bg-[var(--color-text-secondary)]'
                    }`}
                  ></button>
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};