'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Lock } from 'lucide-react';
import { InstagramIcon, LinkedinIcon, BehanceIcon } from '@/components/ui/SocialIcons';
import { AgencySettings } from '@/types';

interface FooterProps {
  settings: AgencySettings;
}

export default function Footer({ settings }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();
  const social = settings?.socialLinks || {};

  return (
    <footer className="bg-[#050505] border-t border-white/[0.08] text-[#A3A3A3] text-xs pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-12">
        {/* Top Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start justify-between">
          {/* Logo & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#FF4D00]/40 flex items-center justify-center">
                <span className="text-[#FF4D00] font-black text-base">S</span>
              </div>
              <span className="text-base font-bold tracking-wider text-white">
                {settings?.logoText || 'SKT BRANDING'}
              </span>
            </Link>

            <p className="text-sm text-[#A3A3A3] max-w-sm leading-relaxed">
              {settings?.tagline ||
                'Premium Graphic Design & Strategic Brand Identity Studio crafted for ambitious global enterprises.'}
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-4 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-white font-semibold">
                Explore
              </span>
              <ul className="space-y-2 text-xs">
                <li><a href="#hero" className="hover:text-[#FF4D00] transition-colors">Home</a></li>
                <li><a href="#works" className="hover:text-[#FF4D00] transition-colors">Selected Works</a></li>
                <li><a href="#services" className="hover:text-[#FF4D00] transition-colors">Services</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-white font-semibold">
                Studio
              </span>
              <ul className="space-y-2 text-xs">
                <li><a href="#about" className="hover:text-[#FF4D00] transition-colors">About Us</a></li>
                <li><a href="#process" className="hover:text-[#FF4D00] transition-colors">Our Workflow</a></li>
                <li><a href="#contact" className="hover:text-[#FF4D00] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Back to Top & Admin */}
          <div className="md:col-span-3 flex flex-col md:items-end justify-between space-y-6">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] border border-white/10 hover:border-[#FF4D00] text-xs text-[#F5F5F5] transition-all hover:text-white"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 text-[#FF4D00]" />
            </button>

            <div className="flex items-center gap-3">
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-lg bg-[#141414] border border-white/10 flex items-center justify-center hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {social.behance && (
                <a
                  href={social.behance}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Behance"
                  className="w-8 h-8 rounded-lg bg-[#141414] border border-white/10 flex items-center justify-center hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors"
                >
                  <BehanceIcon className="w-4 h-4" />
                </a>
              )}
              {social.linkedin && (
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-lg bg-[#141414] border border-white/10 flex items-center justify-center hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors"
                >
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Protected Admin Link */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#737373]">
          <p>
            © {currentYear} {settings?.agencyName || 'SKT Branding'}. All rights reserved. Crafted with precision.
          </p>

          <div className="flex items-center gap-6">
            <span>Built with Next.js, TypeScript & Tailwind CSS</span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-[#737373] hover:text-[#FF4D00] transition-colors"
            >
              <Lock className="w-3 h-3 text-[#FF4D00]" />
              <span>Admin Access</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
