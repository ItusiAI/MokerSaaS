import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, HelpCircle } from 'lucide-react';

export const TechnicalFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const t = useTranslations('technicalFAQ');

  const faqs = t.raw('faqs') as Array<{ question: string; answer: string }>;

  return (
    <section className="py-20 md:py-28 bg-transparent relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 relative z-10">

        {/* Header */}
        <div className="mb-12 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono-code text-xs mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t('sectionBadge')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            {t('sectionTitlePrefix')}<span className="text-[var(--color-primary)]">{t('sectionTitleHighlight')}</span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-base mt-3 max-w-xl">
            {t('sectionSubtitle')}
          </p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="glass-card border border-[var(--color-accent)]/20 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-6 text-left cursor-pointer hover:bg-[var(--color-primary)]/5 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0"></div>
                    <h4 className="text-base md:text-xl font-semibold text-[var(--color-primary)]">{faq.question}</h4>
                  </div>
                  <Plus className={`w-5 h-5 text-[var(--color-accent)] transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-45' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-1 animate-in fade-in-50 duration-200">
                    <div className="pl-5 sm:pl-6">
                      <p className="text-[var(--color-text-primary)] text-xs sm:text-base leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
