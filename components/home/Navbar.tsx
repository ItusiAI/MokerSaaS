import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, User, LogOut, Settings, Gift, TrendingUp, Globe, ChevronDown } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";
import { SignInDialog } from "@/components/auth/signin-dialog";

interface NavbarProps {
  onOpenDeploy?: () => void;
  onOpenSignIn?: () => void;
  onOpenDocs?: () => void;
  onGoHome?: () => void;
  activeSection?: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDeploy,
  onOpenSignIn,
  onGoHome,
  isDark = true,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const { data: session, status } = useSession();
  const locale = useLocale();
  const t = useTranslations("navbar");
  const router = useRouter();
  const pathname = usePathname();

  const getLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  const switchLocale = (newLocale: string) => {
    if (!pathname) return
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    router.push(newPath + hash)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleOpenSignIn = () => {
    if (onOpenSignIn) {
      onOpenSignIn();
    } else {
      setIsSignInDialogOpen(true);
    }
  }

  const handleOpenDeploy = () => {
    if (onOpenDeploy) {
      onOpenDeploy();
    }
  }

  const handleGoHome = () => {
    setMobileMenuOpen(false);
    if (onGoHome) {
      onGoHome();
      return;
    }
    const isOnHome = pathname === getLocalizedPath('/') || pathname === '/';
    if (isOnHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    router.push(getLocalizedPath('/'));
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const NAVBAR_OFFSET = 80;
    const scrollToEl = () => {
      const element = document.getElementById(id);
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };
    const isOnHome = pathname === getLocalizedPath('/') || pathname === '/';
    if (isOnHome) {
      scrollToEl();
      return;
    }
    router.push(`${getLocalizedPath('/')}#${id}`);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--color-border)]/50 transition-colors duration-200">
      <div className="flex justify-between items-center h-16 px-4 md:px-12 max-w-[1280px] mx-auto">
        {/* Brand Logo */}
        <div 
          onClick={handleGoHome}
          className="cursor-pointer flex items-center gap-2 group"
        >
          <div className="relative w-8 h-8">
            <Image
              src="/logo.png"
              alt="MokerSaaS Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-xl md:text-2xl font-bold text-[#F59E0B] tracking-tighter font-sans">
            MokerSaaS
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-7 font-medium text-sm">
          <button
            onClick={handleGoHome}
            className="text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors py-1 relative group cursor-pointer"
          >
            {t("home")}
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-primary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </button>
          <button
            onClick={() => scrollToSection('orchestration')}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-1 relative group cursor-pointer"
          >
            {t("featuresArchitecture")}
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-primary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </button>
          <button
            onClick={() => scrollToSection('mission-control')}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-1 relative group cursor-pointer"
          >
            {t("demo")}
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-primary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors py-1 relative group cursor-pointer"
          >
            {t("pricing")}
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--color-primary)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </button>
        </div>


        {/* Action Buttons & Theme Toggle */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                title={t("switchLanguage")}
                aria-label={t("switchLanguage")}
              >
                <Globe className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-xs font-medium">{locale === "zh" ? t("currentLocale") : t("currentLocaleEn")}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[110px] p-1 bg-[var(--color-surface)] border-[var(--color-border)]/50">
              <DropdownMenuItem
                onClick={() => switchLocale("zh")}
                className="justify-center cursor-pointer hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] rounded-md py-1.5"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs ${locale === "zh" ? "bg-[var(--color-primary)] text-white" : ""}`}>
                  🇨🇳 {t("chinese")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchLocale("en")}
                className="justify-center cursor-pointer hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] rounded-md py-1.5"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs ${locale === "en" ? "bg-[var(--color-primary)] text-white" : ""}`}>
                  🇺🇸 {t("english")}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-all duration-300 cursor-pointer flex items-center justify-center group shadow-sm"
            title={isDark ? "切换至亮色模式" : "切换至暗色模式"}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 group-hover:scale-110 transition-transform duration-300" />
            )}
          </button>

          {/* Auth Section */}
          {status === "loading" ? (
            <div className="w-8 h-8 animate-pulse bg-secondary rounded-full" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-all cursor-pointer">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem asChild className="hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] cursor-pointer">
                  <Link href={getLocalizedPath("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    {t("profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] cursor-pointer">
                  <Link href={getLocalizedPath("/affiliate")}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {t("affiliate")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] cursor-pointer">
                  <Link href={getLocalizedPath("/referral")}>
                    <Gift className="mr-2 h-4 w-4" />
                    {t("referral")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenSignIn}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] font-mono-code text-xs px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                {t("signIn")}
              </button>
              <Link
                href={getLocalizedPath("/auth/signup")}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold px-5 py-2 rounded-lg text-sm active:scale-95 hover:shadow-lg hover:shadow-[var(--color-primary)]/20 transition-all cursor-pointer flex items-center justify-center"
              >
                {t("signUp")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="md:hidden flex items-center gap-2">
          {/* Language Switcher Mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] active:scale-95 transition-transform flex items-center gap-1"
                aria-label={t("switchLanguage")}
              >
                <Globe className="w-4 h-4 text-[var(--color-primary)]" />
                <span className="text-xs font-medium">{locale === "zh" ? t("currentLocale") : t("currentLocaleEn")}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[100px] p-1 bg-[var(--color-surface)] border-[var(--color-border)]/50">
              <DropdownMenuItem
                onClick={() => switchLocale("zh")}
                className="justify-center cursor-pointer hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] rounded-md py-1.5"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs ${locale === "zh" ? "bg-[var(--color-primary)] text-white" : ""}`}>
                  🇨🇳 {t("chinese")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchLocale("en")}
                className="justify-center cursor-pointer hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] rounded-md py-1.5"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs ${locale === "en" ? "bg-[var(--color-primary)] text-white" : ""}`}>
                  🇺🇸 {t("english")}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] active:scale-95 transition-transform"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] hover:text-[var(--color-primary)] active:scale-95 transition-transform"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-6 space-y-3 font-sans text-sm shadow-2xl animate-in slide-in-from-top-2">
          <button
            onClick={handleGoHome}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-[var(--color-text-primary)] font-semibold hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors"
          >
            {t("home")}
          </button>
          <button
            onClick={() => scrollToSection('orchestration')}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors"
          >
            {t("featuresArchitecture")}
          </button>
          <button
            onClick={() => scrollToSection('mission-control')}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors"
          >
            {t("demo")}
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="block w-full text-left py-2.5 px-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-colors"
          >
            {t("pricing")}
          </button>
          <div className="pt-3 border-t border-[var(--color-border)] flex items-center gap-3">
            {/* Mobile Auth Section */}
            {session ? (
              <>
                <Link
                  href={getLocalizedPath("/profile")}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {t("profile")}
                </Link>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut({ callbackUrl: '/' });
                  }}
                  className="flex-1 py-2.5 text-center text-xs font-medium text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-red-500 hover:text-red-500 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t("signOut")}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenSignIn();
                  }}
                  className="flex-1 py-2.5 text-center font-mono-code text-xs text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)] rounded-xl transition-colors"
                >
                  {t("signIn")}
                </button>
                <Link
                  href={getLocalizedPath("/auth/signup")}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center font-mono-code text-xs font-bold text-white bg-[var(--color-primary)] rounded-xl shadow transition-colors flex items-center justify-center"
                >
                  {t("signUp")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      <SignInDialog open={isSignInDialogOpen} onOpenChange={setIsSignInDialogOpen} />
    </nav>
  );
};

