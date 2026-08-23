"use client";

import React, { useCallback, useEffect } from 'react';
import { Hero } from './Hero';
import { OrchestrationEngine } from './OrchestrationEngine';
import { MissionControl } from './MissionControl';
import { PricingSection } from './PricingSection';
import { EngineeringValidation } from './EngineeringValidation';
import { TechnicalFAQ } from './TechnicalFAQ';

const NAVBAR_OFFSET = 80;

const scrollToHash = (hash: string) => {
  if (typeof window === 'undefined') return;
  const element = document.getElementById(hash);
  if (element) {
    const y = element.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

export const HomePageClient: React.FC = () => {
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => scrollToHash(hash), 100);
    }
  }, []);

  const handleOpenDeploy = useCallback(() => scrollToHash('pricing'), []);
  const handleOpenDocs = useCallback(() => scrollToHash('orchestration'), []);

  return (
    <>
      <Hero onOpenDeploy={handleOpenDeploy} onOpenDocs={handleOpenDocs} />
      <OrchestrationEngine />
      <MissionControl />
      <PricingSection onOpenDeploy={handleOpenDeploy} />
      <EngineeringValidation />
      <TechnicalFAQ />
    </>
  );
};