'use client';

import React from 'react';
import { ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react';
import { WebsiteContent } from '@/types';

interface HeroProps {
  content: WebsiteContent['hero'];
}

export default function Hero({ content }: HeroProps) {
  const headline = content?.headline || 'Design That Makes\nYour Brand Stand Out.';
  const supportingCopy =
    content?.supportingCopy ||
    'We create thoughtful brand identities, striking visuals, and digital experiences that help businesses connect with their audience.';
  const primaryButtonText = content?.primaryButtonText || 'Explore Our Work';
  const primaryButtonLink = content?.primaryButtonLink || '#works';
  const secondaryButtonText = content?.secondaryButtonText || 'Start a Project';
  const secondaryButtonLink = content?.secondaryButtonLink || '#contact';
  const badgeText = content?.badge || 'CREATIVE BRANDING & DESIGN STUDIO';
  const heroImage = content?.heroImage;

  // Filter stats to show ONLY when real non-empty values have been entered
  const validStats = (content?.stats || []).filter(
    (s) => s.value && s.value.trim().length > 0 && s.label && s.label.trim().length > 0
  );

  // Split headline lines for typography styling with italic emphasis
  const headlineLines = headline.split('\n');

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] pt-32 pb-20 flex items-center overflow-hidden hero-glow-bg border-b border-white/[0.06]"
    >
      {/* Background ambient glow shapes */}
      <div 
        aria-hidden="true"
        className="absolute top-1/4 right-0 w-[550px] h-[550px] bg-[#FF4D00]/15 rounded-full blur-[140px] pointer-events-none -mr-48" 
      />
      <div 
        aria-hidden="true"
        className="absolute bottom-10 right-1/3 w-[350px] h-[350px] bg-[#FF7A00]/10 rounded-full blur-[120px] pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-8">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#FF4D00]/30 shadow-[0_0_15px_rgba(255,77,0,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
              <span className="text-xs font-semibold tracking-wider text-[#A3A3A3] uppercase">
                {badgeText}
              </span>
            </div>

            {/* Oversized Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight text-[#F5F5F5] leading-[1.08]">
              {headlineLines.map((line, idx) => {
                // If it contains "Your Brand", let's apply italic emphasis as requested
                if (line.toLowerCase().includes('your brand')) {
                  const parts = line.split(/(your brand)/i);
                  return (
                    <span key={idx} className="block">
                      {parts.map((p, pIdx) => 
                        p.toLowerCase() === 'your brand' ? (
                          <span key={pIdx} className="font-serif italic font-normal text-white orange-gradient-text px-1">
                            {p}
                          </span>
                        ) : (
                          p
                        )
                      )}
                    </span>
                  );
                }
                return (
                  <span key={idx} className="block">
                    {line}
                  </span>
                );
              })}
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg md:text-xl text-[#A3A3A3] max-w-xl font-normal leading-relaxed">
              {supportingCopy}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
              {/* Primary Button */}
              <a
                href={secondaryButtonLink}
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-bold uppercase tracking-wider text-black bg-[#FF4D00] rounded-full hover:bg-[#FF7A00] transition-all duration-300 shadow-[0_0_25px_rgba(255,77,0,0.45)] hover:shadow-[0_0_35px_rgba(255,122,0,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF4D00]"
              >
                <span>{secondaryButtonText}</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              {/* Secondary Button */}
              <a
                href={primaryButtonLink}
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold uppercase tracking-wider text-[#F5F5F5] bg-[#141414] border border-white/10 rounded-full hover:border-[#FF4D00]/50 hover:bg-[#1a1a1a] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <span>{primaryButtonText}</span>
                <ArrowDown className="w-4 h-4 text-[#A3A3A3] group-hover:text-[#FF4D00] transition-colors" />
              </a>
            </div>

            {/* Agency Statistics (Displayed ONLY when real values have been entered) */}
            {validStats.length > 0 && (
              <div className="pt-8 w-full border-t border-white/[0.08] mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {validStats.map((stat) => (
                    <div key={stat.id} className="flex flex-col">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
                        {stat.value}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-[#A3A3A3] mt-1 font-medium">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Orange-lit Creative Visual */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            <div className="relative w-full max-w-[460px] aspect-[4/5] rounded-3xl overflow-hidden bg-[#141414] border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] group">
              {/* Backlight glow */}
              <div 
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-tr from-[#FF4D00]/25 via-transparent to-[#FF7A00]/20 mix-blend-screen pointer-events-none" 
              />
              
              {/* Visual artwork: Image or 3D composition */}
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt="SKT Branding Creative Direction Visual"
                  className="w-full h-full object-cover object-center filter contrast-110 brightness-95 transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-8 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#050505]">
                  <div className="flex justify-between items-start">
                    <div className="px-3 py-1 rounded bg-black/60 border border-white/10 text-[10px] tracking-widest text-[#FF4D00] uppercase font-bold">
                      Identity / 01
                    </div>
                    <Sparkles className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  
                  <div className="relative my-auto flex items-center justify-center py-10">
                    {/* Glowing ring/torus visual */}
                    <div className="w-44 h-44 rounded-full border-2 border-[#FF4D00]/40 shadow-[0_0_60px_rgba(255,77,0,0.5)] flex items-center justify-center animate-pulse">
                      <div className="w-28 h-28 rounded-full border border-[#FF7A00]/50 shadow-[0_0_30px_rgba(255,122,0,0.4)] flex items-center justify-center">
                        <span className="font-serif italic text-3xl font-bold text-white">SKT</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-[#A3A3A3]">Visual Precision</p>
                    <p className="text-sm font-semibold text-white">Aesthetic Intelligence & Enduring Impact</p>
                  </div>
                </div>
              )}

              {/* Overlay gradient badge */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#A3A3A3]">Aesthetic Philosophy</p>
                  <p className="text-xs font-semibold text-[#F5F5F5]">Form Follows Distinction</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF4D00]/20 border border-[#FF4D00]/40 text-[10px] font-bold text-[#FF4D00]">
                  <span>2025</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
