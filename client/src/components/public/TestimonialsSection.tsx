'use client';

import React from 'react';
import { Testimonial } from '@/types';
import { Star, Quote, Sparkles } from 'lucide-react';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  // Hide this section until genuine testimonials are added (as strictly requested)
  const publishedTestimonials = (testimonials || []).filter((t) => t.published);

  if (publishedTestimonials.length === 0) {
    return null;
  }

  return (
    <section id="testimonials" className="py-28 bg-[#050505] relative border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#FF4D00]/30 text-xs font-semibold text-[#FF4D00] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Client Endorsements</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F5F5]">
            Trusted by Visionary{' '}
            <span className="font-serif italic font-normal text-white orange-gradient-text">
              Leaders.
            </span>
          </h2>

          <p className="text-base text-[#A3A3A3]">
            Read what our partners have to say about collaborating with the SKT Branding studio.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {publishedTestimonials.map((t) => (
            <div
              key={t.id}
              className="luxury-card rounded-3xl p-8 flex flex-col justify-between group hover:border-[#FF4D00]/50 transition-all duration-300 relative"
            >
              <div className="space-y-6">
                {/* Star rating and Quote icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#FF7A00]">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-[#FF4D00]/40 group-hover:text-[#FF4D00] transition-colors" />
                </div>

                {/* Quote Text */}
                <p className="text-sm sm:text-base text-[#F5F5F5] font-normal leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-6 mt-6 border-t border-white/[0.08] flex items-center gap-4">
                {t.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.avatar}
                      alt={t.author}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1c1c1c] border border-white/10 flex items-center justify-center text-[#FF4D00] font-bold text-sm flex-shrink-0">
                    {t.author.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">{t.author}</h4>
                  <p className="text-xs text-[#A3A3A3]">
                    {t.role}
                    {t.company ? ` • ${t.company}` : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
