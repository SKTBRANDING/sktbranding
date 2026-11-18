'use client';

import React, { useState } from 'react';

export interface BrandLogo {
  id: string;
  name: string;
  tagline: string;
  image: string;
}

const defaultLogos: BrandLogo[] = [
  { id: 'logo-1', name: 'Aethelgard', tagline: 'Distillers Co.', image: '/logos/logo-1.svg' },
  { id: 'logo-2', name: 'Kromos', tagline: 'Soundworks Berlin', image: '/logos/logo-2.svg' },
  { id: 'logo-3', name: 'Vanguard', tagline: 'Atelier Zurich', image: '/logos/logo-3.svg' },
  { id: 'logo-4', name: 'Baithulrasa', tagline: 'Hospitality & Estate', image: '/logos/logo-4.svg' },
  { id: 'logo-5', name: 'Solstice', tagline: 'Labs California', image: '/logos/logo-5.svg' },
  { id: 'logo-6', name: 'Orbit', tagline: 'Technologies Singapore', image: '/logos/logo-6.svg' },
  { id: 'logo-7', name: 'Lumen', tagline: 'Milano Architecture', image: '/logos/logo-7.svg' },
  { id: 'logo-8', name: 'Aura', tagline: 'Paris Heritage', image: '/logos/logo-8.svg' },
  { id: 'logo-9', name: 'Nexus', tagline: 'Venture Capital', image: '/logos/logo-9.svg' },
  { id: 'logo-10', name: 'Veloce', tagline: 'Corse Modena', image: '/logos/logo-10.svg' },
];

interface LogoMarqueeProps {
  logos?: BrandLogo[];
  title?: string;
}

export default function LogoMarquee({
  logos = defaultLogos,
  title = 'TRUSTED BY VISIONARY BRANDS & GLOBAL ENTERPRISES',
}: LogoMarqueeProps) {
  // Safe 10 logos array
  const activeLogos = logos && logos.length >= 10 ? logos.slice(0, 10) : defaultLogos;
  // Quadruple 10 logos so continuous rightward sliding is completely seamless on any screen width
  const duplicatedLogos = [...activeLogos, ...activeLogos, ...activeLogos, ...activeLogos];

  return (
    <section
      aria-label="Partner and Client Brand Logos"
      className="relative w-full bg-[#050505] border-y border-white/[0.07] py-8 sm:py-10 overflow-hidden select-none"
    >
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-20 bg-[#FF4D00]/5 blur-3xl pointer-events-none"
      />

      {/* Header Label */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-6 text-center">
        <div className="inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-pulse" />
          <p className="text-[11px] font-mono tracking-[0.25em] text-[#A3A3A3] uppercase font-semibold">
            {title}
          </p>
        </div>
      </div>

      {/* Infinite Rightward Sliding Carousel Track */}
      <div className="relative w-full overflow-hidden">
        {/* Left gradient fade mask */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-r from-[#050505] to-transparent z-10"
        />

        {/* Right gradient fade mask */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-l from-[#050505] to-transparent z-10"
        />

        {/* Marquee Wrapper: moves smoothly to the right */}
        <div className="flex w-max animate-marquee-right">
          {duplicatedLogos.map((item, index) => (
            <LogoCard key={`${item.id}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoCard({ item }: { item: BrandLogo }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex-shrink-0 mx-4 sm:mx-6 px-6 sm:px-8 py-3.5 rounded-2xl bg-[#0D0D0D]/60 border border-white/[0.05] hover:border-[#FF4D00]/40 hover:bg-[#141414] transition-all duration-300 flex items-center justify-center min-w-[180px] sm:min-w-[210px] h-16 group shadow-sm hover:shadow-[0_0_20px_rgba(255,77,0,0.18)]">
      {!imageError ? (
        <img
          src={item.image}
          alt={`${item.name} Logo`}
          loading="lazy"
          onError={() => setImageError(true)}
          className="h-7 sm:h-8 w-auto max-w-[150px] object-contain opacity-55 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 filter grayscale group-hover:grayscale-0"
        />
      ) : (
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#181818] border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00] text-xs font-black">
            {item.name.charAt(0)}
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold tracking-wider text-[#F5F5F5] group-hover:text-white">
              {item.name}
            </span>
            <span className="block text-[9px] tracking-widest text-[#A3A3A3] uppercase -mt-0.5">
              {item.tagline}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
