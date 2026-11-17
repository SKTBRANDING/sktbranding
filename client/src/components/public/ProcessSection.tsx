'use client';

import React from 'react';
import { WebsiteContent } from '@/types';
import { Check, ArrowRight } from 'lucide-react';

interface ProcessSectionProps {
  content: WebsiteContent['process'];
}

export default function ProcessSection({ content }: ProcessSectionProps) {
  const badge = content?.badge || 'OUR PROCESS';
  const headline = content?.headline || 'A deliberate process for exceptional results.';
  const description =
    content?.description ||
    'Three focused phases designed to eliminate guesswork, inspire creative breakthroughs, and deliver bulletproof design solutions.';
  const steps = content?.steps || [];

  return (
    <section id="process" className="py-28 bg-[#050505] relative border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#FF4D00]/30 text-xs font-semibold text-[#FF4D00] uppercase tracking-wider">
            <span>{badge}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F5F5]">
            How We Bring Brands{' '}
            <span className="font-serif italic font-normal text-white orange-gradient-text">
              To Life.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#A3A3A3] leading-relaxed">
            {description}
          </p>
        </div>

        {/* 3 Spacious Horizontal Rows */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={step.number || index}
              className="luxury-card rounded-3xl p-6 sm:p-10 border border-white/10 hover:border-[#FF4D00]/40 transition-all duration-300 group"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Step Number & Headline */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#FF4D00] font-mono">
                      {step.number}
                    </span>
                    <span className="h-[1px] w-12 bg-white/20" />
                    <span className="text-xs uppercase tracking-widest text-[#737373] font-semibold">
                      Phase {index + 1}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5] group-hover:text-white transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-sm font-medium text-[#FF7A00]">
                    {step.subtitle}
                  </p>
                </div>

                {/* Step Description & Tags */}
                <div className="lg:col-span-5 space-y-5">
                  <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
                    {step.description}
                  </p>

                  {/* Service tags */}
                  {step.tags && step.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-3 py-1 rounded-full text-xs bg-black/60 border border-white/10 text-[#F5F5F5] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Supporting Thumbnail */}
                <div className="lg:col-span-3">
                  {step.thumbnail ? (
                    <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={step.thumbnail}
                        alt={`${step.title} Process Visual`}
                        className="w-full h-full object-cover object-center filter brightness-90 contrast-105 group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] lg:aspect-[4/3] rounded-2xl border border-dashed border-white/10 flex items-center justify-center p-4 bg-black/30">
                      <span className="text-xs text-[#737373]">Phase {step.number} Protocol</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
