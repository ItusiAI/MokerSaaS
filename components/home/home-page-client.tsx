"use client";

import React from 'react';
import { Hero } from './Hero';
import { OrchestrationEngine } from './OrchestrationEngine';
import { MissionControl } from './MissionControl';
import { PricingSection } from './PricingSection';
import { EngineeringValidation } from './EngineeringValidation';
import { TechnicalFAQ } from './TechnicalFAQ';

interface HomePageClientProps {
  onOpenDeploy?: () => void;
  onOpenDocs?: () => void;
}

export const HomePageClient: React.FC<HomePageClientProps> = ({
  onOpenDeploy,
  onOpenDocs,
}) => {
  return (
    <>
      <Hero onOpenDeploy={onOpenDeploy} onOpenDocs={onOpenDocs} />
      <OrchestrationEngine />
      <MissionControl />
      <PricingSection onOpenDeploy={onOpenDeploy} />
      <EngineeringValidation />
      <TechnicalFAQ />
    </>
  );
};
