"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const SiteChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <div className="font-sans text-[var(--color-text-primary)] bg-[var(--color-bg)] min-h-screen relative transition-colors duration-200">
      <Navbar isDark={isDark} onToggleTheme={toggleTheme} />

      <main className="relative bg-transparent">{children}</main>

      <Footer />
    </div>
  );
};
