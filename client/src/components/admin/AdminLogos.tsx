'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { WebsiteContent, BrandLogo } from '@/types';
import { adminFetch, uploadMediaFile } from '@/lib/adminApi';
import { defaultBrandLogos } from '@/components/public/LogoMarquee';

interface AdminLogosProps {
  content: WebsiteContent;
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminLogos({ content, onRefresh, showToast }: AdminLogosProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const initialLogos: BrandLogo[] =
    Array.isArray(content?.partnerLogos) && content.partnerLogos.length > 0
      ? content.partnerLogos
      : defaultBrandLogos;

  const initialTitle: string =
    content?.marqueeTitle || 'TRUSTED BY VISIONARY BRANDS & GLOBAL ENTERPRISES';

  const [marqueeTitle, setMarqueeTitle] = useState<string>(initialTitle);
  const [logos, setLogos] = useState<BrandLogo[]>(initialLogos);

  // Re-sync with incoming content changes
  React.useEffect(() => {
    if (content?.partnerLogos && content.partnerLogos.length > 0) {
      setLogos(content.partnerLogos);
    }
    if (content?.marqueeTitle) {
      setMarqueeTitle(content.marqueeTitle);
    }
  }, [content]);

  // Handle single logo image upload
  const handleLogoUpload = async (file: File, index: number) => {
    try {
      setUploadingIndex(index);
      const url = await uploadMediaFile(file);
      if (!url) throw new Error('Failed to upload logo image');

      setLogos((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], image: url };
        }
        return next;
      });
      showToast(`Logo image uploaded for "${logos[index]?.name || 'brand'}"!`);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Logo upload failed', 'error');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Add new logo slot
  const handleAddLogo = () => {
    const newId = `logo-${Date.now()}`;
    const newLogo: BrandLogo = {
      id: newId,
      name: `New Brand ${logos.length + 1}`,
      tagline: 'Brand Subtitle',
      image: '/logos/logo-1.svg',
    };
    setLogos((prev) => [...prev, newLogo]);
    showToast('New logo slot added. Upload image and enter brand details below.');
  };

  // Remove a logo
  const handleRemoveLogo = (index: number) => {
    if (logos.length <= 1) {
      showToast('You must keep at least 1 brand logo in the slide carousel.', 'error');
      return;
    }
    const removedName = logos[index]?.name || 'Logo';
    setLogos((prev) => prev.filter((_, i) => i !== index));
    showToast(`Removed "${removedName}" from the slide.`);
  };

  // Move logo position up or down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= logos.length) return;

    setLogos((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Reset to original 10 default logos
  const handleResetToDefaults = () => {
    if (window.confirm('Reset all brand logos to the original 10 default SKT branding marks?')) {
      setLogos(defaultBrandLogos);
      setMarqueeTitle('TRUSTED BY VISIONARY BRANDS & GLOBAL ENTERPRISES');
      showToast('Reset to original 10 brand logos. Click "Save All Changes" to publish.');
    }
  };

  // Save changes to backend
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload: WebsiteContent = {
        ...content,
        marqueeTitle,
        partnerLogos: logos,
      };

      const res = await adminFetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save logo slide changes');
      }

      showToast('Client Logos Slide updated and published live!');
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message || 'Failed to save logos', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-[#0e0e0e] border border-white/[0.08] shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00] shadow-[0_0_16px_rgba(255,77,0,0.2)]">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Client Logos Slide Manager</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/30 font-bold">
                {logos.length} Logos Live
              </span>
            </h2>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              Upload custom logo images, edit brand names, reorder, and configure the homepage continuous rightward marquee.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#A3A3A3] hover:text-white transition-colors"
            title="Restore original 10 logos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF6A26] disabled:opacity-50 text-xs font-bold text-black transition-all shadow-[0_0_20px_rgba(255,77,0,0.35)] active:scale-95"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Publishing...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Live Interactive Marquee Preview */}
      <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs uppercase font-bold tracking-wider text-white">
              Live Homepage Slide Preview
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#737373]">
            Continuous Rightward Swipe Animation
          </span>
        </div>

        {/* Mini Preview Box */}
        <div className="relative w-full rounded-2xl bg-[#050505] border border-white/10 py-6 overflow-hidden select-none">
          {/* Ambient center lighting */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-16 bg-[#FF4D00]/5 blur-2xl pointer-events-none" />

          {/* Title in preview */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-pulse" />
              <p className="text-[10px] font-mono tracking-[0.2em] text-[#A3A3A3] uppercase font-semibold">
                {marqueeTitle}
              </p>
            </div>
          </div>

          {/* Marquee Track */}
          <div className="relative w-full overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#050505] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#050505] to-transparent z-10" />

            <div className="flex w-max animate-marquee-right">
              {[...logos, ...logos, ...logos].map((item, idx) => (
                <div
                  key={`${item.id}-prev-${idx}`}
                  className="flex-shrink-0 mx-3 px-5 py-2.5 rounded-xl bg-[#0D0D0D]/80 border border-white/[0.07] flex items-center justify-center min-w-[170px] h-14"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-6 w-auto max-w-[130px] object-contain opacity-75 filter grayscale hover:grayscale-0 transition-all"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marquee Header / Title Configuration */}
      <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/[0.08] space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FF4D00]" />
          <span>Slide Header & Subtitle</span>
        </h3>
        <div>
          <label className="block text-xs font-semibold uppercase text-[#A3A3A3] mb-1.5">
            Section Header Title (Displayed above the sliding logos)
          </label>
          <input
            type="text"
            value={marqueeTitle}
            onChange={(e) => setMarqueeTitle(e.target.value)}
            placeholder="TRUSTED BY VISIONARY BRANDS & GLOBAL ENTERPRISES"
            className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-sm font-medium focus:border-[#FF4D00] focus:outline-none transition-colors"
          />
          <p className="text-[11px] text-[#737373] mt-1.5">
            Default: <code className="text-[#FF4D00]/80">TRUSTED BY VISIONARY BRANDS & GLOBAL ENTERPRISES</code>
          </p>
        </div>
      </div>

      {/* Brand Logos Management Grid */}
      <div className="p-6 rounded-3xl bg-[#0e0e0e] border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Configured Brand Logos</span>
              <span className="text-xs font-normal text-[#A3A3A3]">
                ({logos.length} items on sliding track)
              </span>
            </h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Upload SVG, PNG, WebP, or JPG logo files. Transparent PNG or SVG logos work best against the dark theme.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddLogo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            <Plus className="w-4 h-4 text-[#FF4D00]" />
            <span>Add Another Brand Logo</span>
          </button>
        </div>

        {/* Logos Cards List */}
        <div className="space-y-3.5">
          {logos.map((logo, index) => (
            <div
              key={logo.id || index}
              className={`p-4 sm:p-5 rounded-2xl bg-[#141414] border transition-all ${
                dragOverIndex === index
                  ? 'border-[#FF4D00] bg-[#FF4D00]/5 scale-[1.01]'
                  : 'border-white/[0.07] hover:border-white/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                {/* Logo Preview & Upload Box */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-[#737373] w-6 text-center">
                    #{index + 1}
                  </span>

                  {/* Logo Image Preview Area with Click / Drag-and-Drop to replace */}
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(index);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragOverIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverIndex(null);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleLogoUpload(e.dataTransfer.files[0], index);
                      }
                    }}
                    className="relative w-28 h-16 rounded-xl bg-[#090909] border border-white/10 hover:border-[#FF4D00] flex items-center justify-center cursor-pointer overflow-hidden p-2 group transition-all"
                    title="Click or drop file to upload a new logo image"
                  >
                    {logo.image ? (
                      <img
                        src={logo.image}
                        alt={logo.name}
                        className="w-full h-full object-contain filter group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#737373]" />
                    )}

                    {/* Hover Upload Overlay */}
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-center p-1">
                      <Upload className="w-4 h-4 text-[#FF4D00] mb-0.5" />
                      <span className="text-[9px] font-bold text-white uppercase tracking-wider">
                        Change Logo
                      </span>
                    </div>

                    <input
                      type="file"
                      accept="image/svg+xml,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLogoUpload(e.target.files[0], index);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>

                  {uploadingIndex === index && (
                    <span className="text-xs text-[#FF4D00] animate-pulse font-medium">
                      Uploading...
                    </span>
                  )}
                </div>

                {/* Brand Name & Tagline Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-w-0">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#A3A3A3] mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={logo.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLogos((prev) => {
                          const copy = [...prev];
                          copy[index] = { ...copy[index], name: val };
                          return copy;
                        });
                      }}
                      placeholder="e.g. Orbit"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-xs font-semibold focus:border-[#FF4D00] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-[#A3A3A3] mb-1">
                      Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={logo.tagline}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLogos((prev) => {
                          const copy = [...prev];
                          copy[index] = { ...copy[index], tagline: val };
                          return copy;
                        });
                      }}
                      placeholder="e.g. Technologies Singapore"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-xs font-medium focus:border-[#FF4D00] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-[10px] uppercase font-semibold text-[#A3A3A3] mb-1">
                      Logo Image URL
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={logo.image}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLogos((prev) => {
                            const copy = [...prev];
                            copy[index] = { ...copy[index], image: val };
                            return copy;
                          });
                        }}
                        placeholder="/logos/logo-1.svg or URL"
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-white text-xs font-mono focus:border-[#FF4D00] focus:outline-none truncate"
                      />
                    </div>
                  </div>
                </div>

                {/* Move & Delete Actions */}
                <div className="flex items-center gap-1.5 justify-end flex-shrink-0 pt-2 lg:pt-0 border-t border-white/5 lg:border-t-0">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[#A3A3A3] hover:text-white transition-colors"
                    title="Move earlier in slide"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === logos.length - 1}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[#A3A3A3] hover:text-white transition-colors"
                    title="Move later in slide"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveLogo(index)}
                    className="p-2 rounded-lg bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-colors ml-1"
                    title="Remove this brand logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Add & Save Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={handleAddLogo}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors justify-center"
          >
            <Plus className="w-4 h-4 text-[#FF4D00]" />
            <span>Add Brand Logo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF6A26] disabled:opacity-50 text-xs font-bold text-black transition-all shadow-[0_0_20px_rgba(255,77,0,0.35)] justify-center"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Publishing...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
