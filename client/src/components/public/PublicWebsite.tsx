'use client';

import React, { useState } from 'react';
import { DatabaseSchema } from '@/types';
import Navbar from './Navbar';
import Hero from './Hero';
import LogoMarquee from './LogoMarquee';
import Portfolio from './Portfolio';
import ServicesSection from './ServicesSection';
import AboutSection from './AboutSection';
import ProcessSection from './ProcessSection';
import TestimonialsSection from './TestimonialsSection';
import ContactSection from './ContactSection';
import Footer from './Footer';

interface PublicWebsiteProps {
  initialData: DatabaseSchema;
}

export default function PublicWebsite({ initialData }: PublicWebsiteProps) {
  const [selectedServiceForInquiry, setSelectedServiceForInquiry] = useState<string>('');

  const publishedProjects = (initialData.projects || []).filter((p) => p.published);
  const publishedServices = (initialData.services || []).filter((s) => s.published);
  const publishedTestimonials = (initialData.testimonials || []).filter((t) => t.published);

  return (
    <main className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col selection:bg-[#FF4D00] selection:text-black">
      {/* 1. Slim Sticky Navigation */}
      <Navbar settings={initialData.settings} />

      {/* 2. Dramatic Hero Section with Orange Creative Visual */}
      <Hero content={initialData.content.hero} />

      {/* 2.5 Infinite Auto-Sliding Brand Logos (Swiping Right) */}
      <LogoMarquee />

      {/* 3. Selected Works Portfolio with Filters & Case Study Modal */}
      <Portfolio projects={publishedProjects} />

      {/* 4. Polished Services Section */}
      <ServicesSection
        services={publishedServices}
        onSelectService={(serviceTitle) => setSelectedServiceForInquiry(serviceTitle)}
      />

      {/* 5. Editorial Split About Section */}
      <AboutSection content={initialData.content.about} />

      {/* 6. Three Spacious Process Rows */}
      <ProcessSection content={initialData.content.process} />

      {/* 7. Testimonials (Cleanly hidden until genuine testimonials exist) */}
      <TestimonialsSection testimonials={publishedTestimonials} />

      {/* 8. Contact & Final Call to Action with Curved Orange Glow */}
      <ContactSection
        content={initialData.content.finalCta}
        settings={initialData.settings}
        services={publishedServices}
        preSelectedService={selectedServiceForInquiry}
      />

      {/* 9. Clean Footer */}
      <Footer settings={initialData.settings} />
    </main>
  );
}
