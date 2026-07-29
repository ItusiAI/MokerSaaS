import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Star, Cloud, Terminal, UserCheck } from 'lucide-react';

// 装饰性 icon 映射（不需要翻译，是组件内部装饰）
const ICON_BY_TYPE: Record<string, React.ElementType> = {
  star: Star,
  cloud: Cloud,
  terminal: Terminal
};

export const EngineeringValidation: React.FC = () => {
  const t = useTranslations('engineeringValidation');

  const testimonials = t.raw('testimonials') as Array<{
    name: string;
    title: string;
    badge: string;
    quote: string;
    icon?: string;
  }>;

  return (
    <section className="py-20 md:py-28 bg-transparent relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded glass-card border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono-code text-[10px] uppercase tracking-widest mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('sectionBadge')}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
              {t('sectionTitlePrefix')}<span className="text-[var(--color-primary)]">{t('sectionTitleHighlight')}</span>
            </h2>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => {
            const IconComponent = item.icon ? ICON_BY_TYPE[item.icon] : undefined;

            return (
              <div
                key={idx}
                className="glass-card p-6 flex flex-col justify-between relative group hover:border-[var(--color-primary)]/40 transition-all rounded-xl shadow-lg"
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"></span>
                  <span className="font-mono-code text-[10px] text-[var(--color-accent)] uppercase">{item.badge}</span>
                </div>

                {/* Author Row */}
                <div className="flex items-center gap-4 mb-6 pt-2">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden flex items-center justify-center shrink-0">
                    <UserCheck className="w-6 h-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-[var(--color-text-primary)] text-sm">{item.name}</p>
                      {IconComponent && <IconComponent className="w-3.5 h-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]" />}
                    </div>
                    <p className="font-mono-code text-[11px] text-[var(--color-text-secondary)]">{item.title}</p>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed mb-6 flex-grow">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
