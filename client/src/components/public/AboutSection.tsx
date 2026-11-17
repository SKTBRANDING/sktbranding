'use client';

import React from 'react';
import { WebsiteContent } from '@/types';
import { Sparkles, CheckCircle, Award, Target, Zap } from 'lucide-react';

interface AboutSectionProps {
  content: WebsiteContent['about'];
}

export default function AboutSection({ content }: AboutSectionProps) {
  const badge = content?.badge || 'ABOUT SKT BRANDING';
  const headline = content?.headline || 'Creative Thinking.\nMeaningful Design.';
  const intro =
    content?.intro ||
    'Founded with an uncompromising passion for craft, SKT Branding is an independent design agency that transforms ambitious concepts into iconic brands.';
  const approach =
    content?.approach ||
    'We reject generic templates and sterile trends. Our work is grounded in deep strategic insight, meticulous typography, and bold creative courage.';
  const values = content?.values || [];
  const founder = content?.founder;
  const image = content?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80';

  const headlineLines = headline.split('\n');

  return (
    <section id="about" className="py-28 bg-[#050505] relative border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Editorial Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Image & Founder highlight */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-[#141414] aspect-[4/5] shadow-2xl group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="SKT Branding Studio & Creative Work"
                className="w-full h-full object-cover object-center filter grayscale group-hover:grayscale-0 contrast-110 transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Bottom Quote inside Image */}
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10">
                <p className="text-xs italic text-[#F5F5F5] font-serif leading-relaxed">
                  &ldquo;A great brand doesn&apos;t just ask for attention; it commands enduring memory.&rdquo;
                </p>
                <span className="block mt-2 text-[10px] uppercase tracking-wider text-[#FF4D00] font-bold">
                  SKT Creative Manifesto
                </span>
              </div>
            </div>

            {/* Optional Founder/Team Section */}
            {founder && founder.enabled && (
              <div className="luxury-card rounded-2xl p-5 border border-white/10 flex items-center gap-4">
                {founder.photo && (
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-[#FF4D00]/40 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={founder.photo}
                      alt={founder.name}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-[#F5F5F5]">{founder.name}</h4>
                  <p className="text-xs text-[#FF4D00]">{founder.role}</p>
                  <p className="text-xs text-[#A3A3A3] mt-1 line-clamp-2">{founder.bio}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Editorial Narrative & Values */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#FF4D00]/30 text-xs font-semibold text-[#FF4D00] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{badge}</span>
              </div>

              {/* Large Headline */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold tracking-tight text-[#F5F5F5] leading-[1.12]">
                {headlineLines.map((line, idx) => (
                  <span key={idx} className="block">
                    {idx === 1 ? (
                      <span className="font-serif italic font-normal text-white orange-gradient-text">
                        {line}
                      </span>
                    ) : (
                      line
                    )}
                  </span>
                ))}
              </h2>
            </div>

            {/* Introduction Copy */}
            <p className="text-lg text-[#F5F5F5] font-medium leading-relaxed">
              {intro}
            </p>

            {/* Approach Copy */}
            <p className="text-base text-[#A3A3A3] leading-relaxed">
              {approach}
            </p>

            {/* Core Values / Pillars */}
            {values.length > 0 && (
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-5 border-t border-white/[0.08]">
                {values.map((v, i) => (
                  <div key={i} className="space-y-2">
                    <span className="text-xs font-mono text-[#FF4D00] font-bold">
                      0{i + 1} //
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {v.title}
                    </h3>
                    <p className="text-xs text-[#A3A3A3] leading-relaxed">
                      {v.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Action Button */}
            <div className="pt-2">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FF4D00] hover:text-[#FF7A00] transition-colors"
              >
                <span>Read our full studio capabilities</span>
                <span>→</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
