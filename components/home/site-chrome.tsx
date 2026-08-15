"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const SiteChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydration 安全：SSR 与客户端首次渲染都走同一分支（isDark=true），
  // 水合完成后再根据真实主题切换图标/title，避免任何 hydration mismatch。
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

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
