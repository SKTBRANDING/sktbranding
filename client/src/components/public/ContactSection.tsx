'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Mail,
  Phone,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { InstagramIcon, BehanceIcon, LinkedinIcon, TwitterXIcon } from '@/components/ui/SocialIcons';
import { AgencySettings, WebsiteContent, ServiceItem } from '@/types';
import { apiFetch } from '@/lib/apiBase';

interface ContactSectionProps {
  content: WebsiteContent['finalCta'];
  settings: AgencySettings;
  services: ServiceItem[];
  preSelectedService?: string;
}

export default function ContactSection({
  content,
  settings,
  services,
  preSelectedService,
}: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sync pre-selected service when changed from Services section
  useEffect(() => {
    if (preSelectedService) {
      setFormData((prev) => ({ ...prev, service: preSelectedService }));
    } else if (services.length > 0 && !formData.service) {
      setFormData((prev) => ({ ...prev, service: services[0].title }));
    }
  }, [preSelectedService, services]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Valid email address is required';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 6) {
      errors.phone = 'Phone or WhatsApp number is required';
    }
    if (!formData.service) {
      errors.service = 'Please select a required service';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errors.description = 'Please provide brief details (minimum 10 characters)';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        }
        throw new Error(data.error || 'Failed to submit inquiry. Please try again.');
      }

      setSuccessMessage(data.message || 'Thank you! Your project inquiry has been received.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: services[0]?.title || '',
        description: '',
      });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const social = settings?.socialLinks || {};
  const hasSocials = Boolean(
    social.whatsapp || social.email || social.instagram || social.behance || social.linkedin
  );

  return (
    <section id="contact" className="py-32 bg-[#050505] relative overflow-hidden cta-glow-bg">
      {/* Subtle orange curved glow effect inspired by reference */}
      <div 
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-t from-[#FF4D00]/25 to-transparent rounded-[100%] blur-[100px] pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Heading & Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#FF4D00]/30 text-xs font-semibold text-[#FF4D00] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{content?.badge || 'START A CONVERSATION'}</span>
              </div>

              {/* Headline */}
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#F5F5F5] leading-[1.08]">
                Let&apos;s Build Something{' '}
                <span className="font-serif italic font-normal text-white orange-gradient-text block">
                  Remarkable.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#A3A3A3] leading-relaxed">
                {content?.supportingCopy ||
                  'Have an upcoming brand launch, redesign, or creative challenge? Connect with us to explore how SKT Branding can elevate your market presence.'}
              </p>
            </div>

            {/* Direct Contact Channels */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              {settings?.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-3.5 text-sm text-[#A3A3A3] hover:text-[#FF4D00] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-center group-hover:border-[#FF4D00]/40">
                    <Mail className="w-4 h-4 text-[#FF4D00]" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-[#737373]">Email Studio</span>
                    <span className="font-medium text-white">{settings.email}</span>
                  </div>
                </a>
              )}

              {settings?.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="flex items-center gap-3.5 text-sm text-[#A3A3A3] hover:text-[#FF4D00] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-center group-hover:border-[#FF4D00]/40">
                    <Phone className="w-4 h-4 text-[#FF4D00]" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-[#737373]">Direct Line</span>
                    <span className="font-medium text-white">{settings.phone}</span>
                  </div>
                </a>
              )}

              {settings?.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 text-sm text-[#A3A3A3] hover:text-[#FF4D00] transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-center group-hover:border-[#FF4D00]/40">
                    <MessageSquare className="w-4 h-4 text-[#FF4D00]" />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-[#737373]">WhatsApp Direct</span>
                    <span className="font-medium text-white">{settings.whatsapp}</span>
                  </div>
                </a>
              )}
            </div>

            {/* Social channels (Only show if configured) */}
            {hasSocials && (
              <div className="pt-4 border-t border-white/[0.08] space-y-2">
                <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold">
                  Follow Our Craft
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {social.instagram && (
                    <a
                      href={social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-full text-xs bg-[#141414] hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 transition-colors"
                    >
                      <InstagramIcon className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {social.behance && (
                    <a
                      href={social.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-full text-xs bg-[#141414] hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 transition-colors"
                    >
                      <BehanceIcon className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Behance</span>
                    </a>
                  )}
                  {social.linkedin && (
                    <a
                      href={social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-full text-xs bg-[#141414] hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 transition-colors"
                    >
                      <LinkedinIcon className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="luxury-card rounded-3xl p-6 sm:p-10 border border-white/10 relative shadow-2xl">
              {/* Form title */}
              <div className="mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Start Your Project Inquiry
                </h3>
                <p className="text-xs text-[#A3A3A3] mt-1">
                  Tell us about your brand aspirations. We respond within 24 hours.
                </p>
              </div>

              {/* Success Notification */}
              {successMessage ? (
                <div className="p-8 rounded-2xl bg-[#0a0a0a] border border-[#FF4D00]/50 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#FF4D00]/20 text-[#FF4D00] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,77,0,0.4)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Inquiry Received</h4>
                  <p className="text-sm text-[#A3A3A3] max-w-md mx-auto">
                    {successMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#141414] hover:bg-white/10 border border-white/20 text-white transition-colors"
                  >
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* General Error Banner */}
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* 2-Column Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="block text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
                        Your Name <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Arthur Pendelton"
                        className={`w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none transition-colors ${
                          fieldErrors.name
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-white/10 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00]'
                        }`}
                      />
                      {fieldErrors.name && (
                        <p className="text-[11px] text-red-400 mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="email" className="block text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
                        Email Address <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. arthur@brand.com"
                        className={`w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none transition-colors ${
                          fieldErrors.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-white/10 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00]'
                        }`}
                      />
                      {fieldErrors.email && (
                        <p className="text-[11px] text-red-400 mt-1">{fieldErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* 2-Column Phone/WhatsApp & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="block text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
                        Phone / WhatsApp <span className="text-[#FF4D00]">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. +1 555 123 4567"
                        className={`w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none transition-colors ${
                          fieldErrors.phone
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-white/10 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00]'
                        }`}
                      />
                      {fieldErrors.phone && (
                        <p className="text-[11px] text-red-400 mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="company" className="block text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
                        Company Name <span className="text-[#737373] text-[10px] font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="e.g. Atelier Vantage"
                        className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Service Required Dropdown */}
                  <div className="space-y-1.5">
                    <label htmlFor="service" className="block text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
                      Service Required <span className="text-[#FF4D00]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border text-sm text-[#F5F5F5] focus:outline-none transition-colors appearance-none cursor-pointer ${
                          fieldErrors.service
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-white/10 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00]'
                        }`}
                      >
                        <option value="" disabled>Select a capability...</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.title} className="bg-[#141414] text-white">
                            {s.title}
                          </option>
                        ))}
                        <option value="Full Brand Transformation" className="bg-[#141414] text-white">
                          Full Brand Transformation (Comprehensive)
                        </option>
                        <option value="Other Bespoke Engagement" className="bg-[#141414] text-white">
                          Other Bespoke Engagement
                        </option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A3A3A3]">
                        ▼
                      </div>
                    </div>
                    {fieldErrors.service && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.service}</p>
                    )}
                  </div>

                  {/* Project Description */}
                  <div className="space-y-1.5">
                    <label htmlFor="description" className="block text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
                      Project Description <span className="text-[#FF4D00]">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell us about your brand vision, target timeline, and specific goals..."
                      className={`w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none transition-colors resize-y ${
                        fieldErrors.description
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-white/10 focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00]'
                      }`}
                    />
                    {fieldErrors.description && (
                      <p className="text-[11px] text-red-400 mt-1">{fieldErrors.description}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-8 rounded-full text-sm font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all duration-300 shadow-[0_0_25px_rgba(255,77,0,0.45)] hover:shadow-[0_0_35px_rgba(255,122,0,0.6)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4D00]"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Submit Project Brief</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
