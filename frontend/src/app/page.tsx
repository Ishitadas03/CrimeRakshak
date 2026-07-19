import React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { MeshGradientBackground } from '@/components/landing/MeshGradientBackground';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { TrustMarquee } from '@/components/landing/TrustMarquee';
import { StatsTicker } from '@/components/landing/StatsTicker';
import { StoryDiagram } from '@/components/landing/StoryDiagram';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { FeatureSpotlight1 } from '@/components/landing/FeatureSpotlight1';
import { FeatureSpotlight2 } from '@/components/landing/FeatureSpotlight2';
import { InteractiveWorkflow } from '@/components/landing/InteractiveWorkflow';
import { IntegrationsGrid } from '@/components/landing/IntegrationsGrid';
import { SecurityCompliance } from '@/components/landing/SecurityCompliance';
import { Testimonials } from '@/components/landing/Testimonials';
import { DeploymentTiers } from '@/components/landing/DeploymentTiers';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Footer } from '@/components/landing/Footer';

export default async function LandingPage() {
  const { userId } = await auth();
  
  if (userId) {
    redirect('/overview');
  }

  return (
    <main className="min-h-screen bg-bg-base text-text-primary selection:bg-accent/30 selection:text-white overflow-x-hidden">
      <MeshGradientBackground>
        <Navbar />
        <Hero />
      </MeshGradientBackground>
      <TrustMarquee />
      <StatsTicker />
      <StoryDiagram />
      <FeaturesGrid />
      <FeatureSpotlight1 />
      <FeatureSpotlight2 />
      <InteractiveWorkflow />
      <IntegrationsGrid />
      <SecurityCompliance />
      <Testimonials />
      <DeploymentTiers />
      <FinalCTA />
      <Footer />
    </main>
  );
}
