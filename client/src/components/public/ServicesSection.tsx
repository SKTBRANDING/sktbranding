'use client';

import React from 'react';
import {
  Compass,
  Shapes,
  Share2,
  Package,
  Printer,
  Globe,
  Sparkles,
  Layers,
  Shield,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import { ServiceItem } from '@/types';

interface ServicesSectionProps {
  services: ServiceItem[];
  onSelectService?: (serviceTitle: string) => void;
}

// Icon mapper for dynamic service icons
const getServiceIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case 'compass':
      return <Compass className="w-6 h-6 text-red-500" />;
    case 'shapes':
      return <Shapes className="w-6 h-6 text-red-500" />;
    case 'share2':
    case 'share':
      return <Share2 className="w-6 h-6 text-red-500" />;
    case 'package':
      return <Package className="w-6 h-6 text-red-500" />;
    case 'printer':
      return <Printer className="w-6 h-6 text-red-500" />;
    case 'globe':
      return <Globe className="w-6 h-6 text-red-500" />;
    case 'layers':
      return <Layers className="w-6 h-6 text-red-500" />;
    case 'shield':
      return <Shield className="w-6 h-6 text-red-500" />;
    default:
      return <Sparkles className="w-6 h-6 text-red-500" />;
  }
};

export default function ServicesSection({ services, onSelectService }: ServicesSectionProps) {
  const handleDiscussService = (serviceTitle: string) => {
    if (onSelectService) {
      onSelectService(serviceTitle);
    }
    // Also scroll down to inquiry section
    const contactElem = document.getElementById('contact');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-28 bg-[#050505] relative border-b border-white/[0.06]">
      {/* Background glow behind cards */}
      <div 
        aria-hidden="true"
        className="absolute top-1/2 left-0 w-96 h-96 bg-[#FF4D00]/10 rounded-full blur-[140px] pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#FF4D00]/30 text-xs font-semibold text-[#FF4D00] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Specialized Capabilities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F5F5] leading-tight">
            Crafting Identities That Command{' '}
            <span className="font-serif italic font-normal text-white orange-gradient-text">
              Respect.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#A3A3A3] leading-relaxed">
            We provide cohesive, multi-disciplinary design services built to take emerging and established brands to their highest commercial expression.
          </p>
        </div>

        {/* 6 Services Dark Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <div
              key={service.id || index}
              className="luxury-card rounded-3xl p-8 flex flex-col justify-between group hover:border-[#FF4D00]/50 transition-all duration-300 relative overflow-hidden"
            >
              {/* Subtle orange accent top bar */}
              <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#FF4D00]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="space-y-6">
                {/* Icon & Index Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-black border-2 border-red-600/70 flex items-center justify-center group-hover:border-red-500 group-hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all duration-300">
                    {getServiceIcon(service.icon)}
                  </div>
                  <span className="text-xs font-mono text-[#737373] tracking-widest">
                    0{index + 1}
                  </span>
                </div>

                {/* Service Title */}
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5] group-hover:text-white transition-colors">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#A3A3A3] leading-relaxed">
                  {service.description}
                </p>

                {/* Deliverables / Capabilities List */}
                {service.deliverables && service.deliverables.length > 0 && (
                  <div className="pt-2 space-y-2 border-t border-white/[0.06]">
                    <span className="text-[11px] uppercase tracking-wider text-[#737373] font-semibold">
                      Key Deliverables
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#A3A3A3]">
                      {service.deliverables.map((item, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Discuss Your Project Action */}
              <div className="pt-8 mt-6 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => handleDiscussService(service.title)}
                  className="w-full inline-flex items-center justify-between py-3 px-5 rounded-full bg-black border-2 border-red-600 hover:bg-red-600 hover:border-red-600 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 group/btn shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <span className="text-white font-bold tracking-wider">Discuss Your Project</span>
                  <ArrowUpRight className="w-4 h-4 text-red-500 group-hover/btn:text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
