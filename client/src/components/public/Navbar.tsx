'use client';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { AgencySettings } from '@/types';

interface NavbarProps {
  settings?: AgencySettings;
}

export default function Navbar({ settings }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#hero' },
    { name: 'Works', href: '#works' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Process', href: '#process' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#050505]/90 backdrop-blur-md border-b border-white/[0.08] py-3.5 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00] rounded-lg"
          aria-label="SKT Branding Home"
        >
          <div className="w-9 h-9 rounded-lg bg-[#141414] border border-[#FF4D00]/40 flex items-center justify-center transition-all duration-300 group-hover:border-[#FF4D00] group-hover:shadow-[0_0_15px_rgba(255,77,0,0.5)]">
            <span className="text-[#FF4D00] font-black text-lg tracking-tighter">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-wider text-[#F5F5F5] group-hover:text-white transition-colors">
              {settings?.logoText || 'SKT BRANDING'}
            </span>
            <span className="text-[10px] tracking-widest text-[#A3A3A3] uppercase -mt-0.5">
              Design Agency
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[#A3A3A3] hover:text-[#F5F5F5] hover:text-white transition-colors tracking-wide py-1 relative group focus:outline-none focus-visible:text-[#FF4D00]"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#FF4D00] transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="#contact"
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#F5F5F5] bg-[#141414] border border-white/10 rounded-full hover:border-[#FF4D00] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,77,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00]"
          >
            <span>Let&apos;s Talk</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-pulse" />
            <ArrowUpRight className="w-3.5 h-3.5 text-[#FF4D00] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#A3A3A3] hover:text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FF4D00] rounded-lg"
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 transition-all">
          <nav className="flex flex-col gap-4 text-base">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#A3A3A3] hover:text-[#FF4D00] font-medium py-1 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-[#FF4D00] text-black font-semibold rounded-lg shadow-lg hover:bg-[#FF7A00] transition-colors"
              >
                Let&apos;s Talk
              </a>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-center text-[#737373] hover:text-[#A3A3A3] py-1"
              >
                Agency Admin Access →
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
