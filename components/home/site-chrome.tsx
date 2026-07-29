"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const SiteChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    }
    return true;
  });

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const getLocalizedPath = (path: string) => `/${locale}${path}`;

  const navigateToSection = useCallback((id: string) => {
    const NAVBAR_OFFSET = 80;
    const isOnHome = pathname === getLocalizedPath('/') || pathname === '/';
    const scrollToEl = () => {
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };
    if (isOnHome) {
      scrollToEl();
      return;
    }
    router.push(`${getLocalizedPath('/')}#${id}`);
  }, [pathname, locale, router]);

  const handleGoHome = () => {
    const isOnHome = pathname === getLocalizedPath('/') || pathname === '/';
    if (isOnHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    router.push(getLocalizedPath('/'));
  };
  const handleOpenDocs = () => navigateToSection('orchestration');
  const handleOpenDeploy = () => navigateToSection('pricing');

  return (
    <div className="font-sans text-[var(--color-text-primary)] bg-[var(--color-bg)] min-h-screen relative transition-colors duration-200">
      <Navbar
        onOpenDeploy={handleOpenDeploy}
        onOpenDocs={handleOpenDocs}
        onGoHome={handleGoHome}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <main className="relative bg-transparent">{children}</main>

      <Footer onOpenDocs={handleOpenDocs} onOpenDeploy={handleOpenDeploy} />
    </div>
  );
};
