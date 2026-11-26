'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  Upload,
  Layers,
  Info,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { WebsiteContent, AgencyStat, CoreValue, ProcessStep } from '@/types';
import { adminFetch, uploadMediaFile } from '@/lib/adminApi';
import AdminLogos from './AdminLogos';

interface AdminContentProps {
  content: WebsiteContent;
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminContent({ content, onRefresh, showToast }: AdminContentProps) {
  const [activeTab, setActiveTab] = useState<'hero' | 'logos' | 'about' | 'process' | 'cta'>('hero');
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  // Deep clone initial content state with safe null guards
  const [formData, setFormData] = useState<WebsiteContent>(() => ({
    hero: {
      ...(content?.hero || {}),
      stats: [...(content?.hero?.stats || [])],
    },
    about: {
      ...(content?.about || {}),
      values: [...(content?.about?.values || [])],
      founder: { ...(content?.about?.founder || {}) },
    },
    process: {
      ...(content?.process || {}),
      steps: [...(content?.process?.steps || [])],
    },
    finalCta: {
      ...(content?.finalCta || {}),
    },
  } as WebsiteContent));

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await adminFetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save website content');
      }

      showToast('Website content updated and published live!');
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, target: string, extraIndex?: number) => {
    try {
      setUploadingTarget(target);
      const url = await uploadMediaFile(file);
      if (!url) throw new Error('Failed to upload image');

      if (target === 'hero') {
        setFormData((prev) => ({
          ...prev,
          hero: { ...prev.hero, heroImage: url },
        }));
      } else if (target === 'about') {
        setFormData((prev) => ({
          ...prev,
          about: { ...prev.about, image: url },
        }));
      } else if (target === 'founder') {
        setFormData((prev) => ({
          ...prev,
          about: {
            ...prev.about,
            founder: { ...prev.about.founder, photo: url },
          },
        }));
      } else if (target === 'process' && typeof extraIndex === 'number') {
        setFormData((prev) => {
          const nextSteps = [...prev.process.steps];
          if (nextSteps[extraIndex]) {
            nextSteps[extraIndex].thumbnail = url;
          }
          return {
            ...prev,
            process: { ...prev.process, steps: nextSteps },
          };
        });
      }
      showToast('Image uploaded and preview updated');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setUploadingTarget(null);
    }
  };

  // Stat Helpers
  const addStat = () => {
    setFormData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: [
          ...prev.hero.stats,
          { id: `stat-${Date.now()}`, value: '99%', label: 'Metric Label' },
        ],
      },
    }));
  };

  const removeStat = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: prev.hero.stats.filter((s) => s.id !== id),
      },
    }));
  };

  const updateStat = (id: string, field: 'value' | 'label', val: string) => {
    setFormData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: prev.hero.stats.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
      },
    }));
  };

  // Value Helpers
  const addValue = () => {
    setFormData((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        values: [
          ...prev.about.values,
          { title: 'New Core Pillar', description: 'Description of agency principle or philosophy...' },
        ],
      },
    }));
  };

  const removeValue = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        values: prev.about.values.filter((_, i) => i !== index),
      },
    }));
  };

  const updateValue = (index: number, field: 'title' | 'description', val: string) => {
    setFormData((prev) => {
      const nextValues = [...prev.about.values];
      if (nextValues[index]) {
        nextValues[index][field] = val;
      }
      return {
        ...prev,
        about: { ...prev.about, values: nextValues },
      };
    });
  };

  // Process Step Helpers
  const addProcessStep = () => {
    setFormData((prev) => {
      const nextNum = (prev.process.steps.length + 1).toString().padStart(2, '0');
      return {
        ...prev,
        process: {
          ...prev.process,
          steps: [
            ...prev.process.steps,
            {
              number: nextNum,
              title: 'Phase Title',
              subtitle: 'Phase subtitle or objective...',
              description: 'Detailed explanation of methodology...',
              tags: ['Deliverable 1', 'Deliverable 2'],
              thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
            },
          ],
        },
      };
    });
  };

  const removeProcessStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      process: {
        ...prev.process,
        steps: prev.process.steps.filter((_, i) => i !== index),
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Website Content & Copy Editor
          </h2>
          <p className="text-xs text-[#A3A3A3]">
            Edit all texts, headlines, statistics, images, and brand narratives across the entire public homepage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing...' : 'Save & Publish Live'}</span>
        </button>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#141414] border border-white/10 w-full sm:w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'hero', label: '1. Hero & Genuine Stats' },
          { id: 'logos', label: '2. Client Logos Slide' },
          { id: 'about', label: '3. About, Values & Founder' },
          { id: 'process', label: '4. 3-Step Process' },
          { id: 'cta', label: '5. Final Call to Action' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#FF4D00] text-black font-bold shadow-md'
                : 'text-[#A3A3A3] hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 2: CLIENT LOGOS SLIDE */}
      {activeTab === 'logos' && (
        <AdminLogos
          content={content}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {/* TAB 1: HERO */}
      {activeTab === 'hero' && (
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-8">
          <div className="border-b border-white/[0.08] pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Hero Section Configuration</h3>
              <p className="text-xs text-[#A3A3A3]">
                First impression presented to public visitors at the top of the homepage.
              </p>
            </div>
            <span className="text-[10px] text-[#FF4D00] font-mono uppercase bg-[#FF4D00]/10 px-2.5 py-1 rounded-full border border-[#FF4D00]/20">
              Live Editable
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Top Badge Subtitle
              </label>
              <input
                type="text"
                value={formData.hero.badge}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, badge: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Main Headline (Newlines split into separate lines)
              </label>
              <textarea
                rows={2}
                value={formData.hero.headline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, headline: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
              <span className="text-[10px] text-[#737373]">
                Tip: The words &ldquo;Your Brand&rdquo; will automatically receive luxury serif italic styling.
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Supporting Copy
            </label>
            <textarea
              rows={3}
              value={formData.hero.supportingCopy}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hero: { ...formData.hero, supportingCopy: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          {/* Button Text & Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#0a0a0a] border border-white/5">
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-[#FF4D00] font-bold">
                Primary Button
              </h4>
              <input
                type="text"
                placeholder="Label"
                value={formData.hero.secondaryButtonText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, secondaryButtonText: e.target.value },
                  })
                }
                className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
              <input
                type="text"
                placeholder="Anchor link (e.g. #contact)"
                value={formData.hero.secondaryButtonLink}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, secondaryButtonLink: e.target.value },
                  })
                }
                className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-[#A3A3A3] font-bold">
                Secondary Button
              </h4>
              <input
                type="text"
                placeholder="Label"
                value={formData.hero.primaryButtonText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, primaryButtonText: e.target.value },
                  })
                }
                className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
              <input
                type="text"
                placeholder="Anchor link (e.g. #works)"
                value={formData.hero.primaryButtonLink}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, primaryButtonLink: e.target.value },
                  })
                }
                className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>
          </div>

          {/* Hero Creative Visual */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#0a0a0a] border border-white/5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Hero Right-Side Creative Image URL & Preview
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-36 aspect-[4/5] rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0">
                {formData.hero.heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.hero.heroImage} alt="Hero" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-[#737373] p-2 text-center">
                    Default 3D Graphic
                  </div>
                )}
              </div>
              <div className="space-y-3 flex-1 w-full">
                <input
                  type="text"
                  value={formData.hero.heroImage || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, heroImage: e.target.value },
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer text-white transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>{uploadingTarget === 'hero' ? 'Uploading...' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, 'hero');
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Genuine Agency Statistics Manager */}
          <div className="space-y-4 p-5 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-white font-bold">
                  Genuine Agency Statistics
                </h4>
                <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                  Requirement: Statistics are displayed <strong>only when real values have been entered</strong>. Deleting all stats will cleanly omit this counter on the hero.
                </p>
              </div>
              <button
                type="button"
                onClick={addStat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Add Metric</span>
              </button>
            </div>

            {formData.hero.stats.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#737373] border border-dashed border-white/10 rounded-xl">
                No statistics entered. The stats row is currently hidden on the public hero.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {formData.hero.stats.map((stat) => (
                  <div
                    key={stat.id}
                    className="flex items-center gap-2 p-3 rounded-xl bg-[#141414] border border-white/10"
                  >
                    <input
                      type="text"
                      placeholder="Value (e.g. 140+)"
                      value={stat.value}
                      onChange={(e) => updateStat(stat.id, 'value', e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g. Brands Crafted)"
                      value={stat.label}
                      onChange={(e) => updateStat(stat.id, 'label', e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-[#A3A3A3]"
                    />
                    <button
                      type="button"
                      onClick={() => removeStat(stat.id)}
                      className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ABOUT */}
      {activeTab === 'about' && (
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-8">
          <div className="border-b border-white/[0.08] pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">About Section, Core Pillars & Founder</h3>
              <p className="text-xs text-[#A3A3A3]">
                Editorial split layout communicating your design philosophy, values, and leadership credentials.
              </p>
            </div>
            <span className="text-[10px] text-[#FF4D00] font-mono uppercase bg-[#FF4D00]/10 px-2.5 py-1 rounded-full border border-[#FF4D00]/20">
              Live Editable
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Section Badge
              </label>
              <input
                type="text"
                value={formData.about.badge}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    about: { ...formData.about, badge: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Headline (e.g. Creative Thinking.\nMeaningful Design.)
              </label>
              <textarea
                rows={2}
                value={formData.about.headline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    about: { ...formData.about, headline: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Agency Introduction
            </label>
            <textarea
              rows={3}
              value={formData.about.intro}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  about: { ...formData.about, intro: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Strategic Approach
            </label>
            <textarea
              rows={3}
              value={formData.about.approach}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  about: { ...formData.about, approach: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          {/* About Image */}
          <div className="space-y-3 p-4 rounded-2xl bg-[#0a0a0a] border border-white/5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Studio Image & Preview
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-32 aspect-[4/5] rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0">
                {formData.about.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.about.image} alt="About" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="space-y-3 flex-1 w-full">
                <input
                  type="text"
                  value={formData.about.image || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: { ...formData.about, image: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer text-white">
                  <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>{uploadingTarget === 'about' ? 'Uploading...' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(f, 'about');
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Core Values Editor */}
          <div className="space-y-4 p-5 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-white font-bold">
                  Studio Pillars & Values ({formData.about.values?.length || 0})
                </h4>
                <p className="text-[11px] text-[#A3A3A3]">
                  These 3 pillars are rendered with numbered labels (01, 02, 03) in the About section.
                </p>
              </div>
              <button
                type="button"
                onClick={addValue}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Add Pillar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              {formData.about.values?.map((val, vIdx) => (
                <div
                  key={vIdx}
                  className="p-4 rounded-xl bg-[#141414] border border-white/10 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#FF4D00]">
                      Pillar 0{vIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeValue(vIdx)}
                      className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Pillar Title (e.g. Strategic Rigor)"
                    value={val.title}
                    onChange={(e) => updateValue(vIdx, 'title', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-white font-bold"
                  />
                  <textarea
                    rows={2}
                    placeholder="Pillar Description..."
                    value={val.description}
                    onChange={(e) => updateValue(vIdx, 'description', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-[#A3A3A3]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Optional Founder/Team Section */}
          <div className="space-y-4 p-5 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-white font-bold">
                  Founder & Principal Director Profile
                </h4>
                <p className="text-[11px] text-[#A3A3A3]">
                  Optionally show the founder or team profile below the about image.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                <input
                  type="checkbox"
                  checked={formData.about.founder?.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: {
                        ...formData.about,
                        founder: { ...formData.about.founder, enabled: e.target.checked },
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-[#FF4D00]"
                />
                <span>Enabled</span>
              </label>
            </div>

            {formData.about.founder?.enabled && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Founder Name"
                    value={formData.about.founder.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        about: {
                          ...formData.about,
                          founder: { ...formData.about.founder, name: e.target.value },
                        },
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Creative Director)"
                    value={formData.about.founder.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        about: {
                          ...formData.about,
                          founder: { ...formData.about.founder, role: e.target.value },
                        },
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center p-3 rounded-xl bg-[#141414] border border-white/5">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black border border-white/10 flex-shrink-0">
                    {formData.about.founder.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.about.founder.photo} alt="Founder" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[#737373]">Photo</div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Photo URL"
                    value={formData.about.founder.photo || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        about: {
                          ...formData.about,
                          founder: { ...formData.about.founder, photo: e.target.value },
                        },
                      })
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-white"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer text-white">
                    <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>{uploadingTarget === 'founder' ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, 'founder');
                      }}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Founder Bio..."
                  value={formData.about.founder.bio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      about: {
                        ...formData.about,
                        founder: { ...formData.about.founder, bio: e.target.value },
                      },
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PROCESS */}
      {activeTab === 'process' && (
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-8">
          <div className="border-b border-white/[0.08] pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Three-Step Process Workflow</h3>
              <p className="text-xs text-[#A3A3A3]">
                1. Discover, 2. Design, 3. Deliver — horizontal rows with thumbnails and tags.
              </p>
            </div>
            <button
              type="button"
              onClick={addProcessStep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Add Phase</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Badge Subtitle
              </label>
              <input
                type="text"
                value={formData.process.badge}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    process: { ...formData.process, badge: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Headline
              </label>
              <input
                type="text"
                value={formData.process.headline}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    process: { ...formData.process, headline: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-6">
            {formData.process.steps.map((step, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={step.number}
                      onChange={(e) => {
                        const newSteps = [...formData.process.steps];
                        newSteps[idx].number = e.target.value;
                        setFormData({
                          ...formData,
                          process: { ...formData.process, steps: newSteps },
                        });
                      }}
                      className="w-14 px-2 py-1 rounded bg-[#141414] border border-white/10 text-xs font-mono font-bold text-[#FF4D00] text-center"
                    />
                    <span className="text-xs text-white font-bold">
                      {step.title || `Phase ${step.number}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProcessStep(idx)}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                    title="Delete phase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Step Title (e.g. Discover)"
                    value={step.title}
                    onChange={(e) => {
                      const newSteps = [...formData.process.steps];
                      newSteps[idx].title = e.target.value;
                      setFormData({
                        ...formData,
                        process: { ...formData.process, steps: newSteps },
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle (e.g. Understand the business...)"
                    value={step.subtitle}
                    onChange={(e) => {
                      const newSteps = [...formData.process.steps];
                      newSteps[idx].subtitle = e.target.value;
                      setFormData({
                        ...formData,
                        process: { ...formData.process, steps: newSteps },
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Phase description..."
                  value={step.description}
                  onChange={(e) => {
                    const newSteps = [...formData.process.steps];
                    newSteps[idx].description = e.target.value;
                    setFormData({
                      ...formData,
                      process: { ...formData.process, steps: newSteps },
                    });
                  }}
                  className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white"
                />

                <input
                  type="text"
                  placeholder="Tags (comma-separated, e.g. Market Audit, Brand Architecture, Strategic Brief)"
                  value={(step.tags || []).join(', ')}
                  onChange={(e) => {
                    const newSteps = [...formData.process.steps];
                    newSteps[idx].tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    setFormData({
                      ...formData,
                      process: { ...formData.process, steps: newSteps },
                    });
                  }}
                  className="w-full px-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white"
                />

                {/* Thumbnail image and upload */}
                <div className="flex flex-col sm:flex-row gap-3 items-center p-3 rounded-xl bg-[#141414] border border-white/5">
                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-black border border-white/10 flex-shrink-0">
                    {step.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={step.thumbnail} alt={step.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-[#737373]">Thumb</div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Thumbnail URL"
                    value={step.thumbnail || ''}
                    onChange={(e) => {
                      const newSteps = [...formData.process.steps];
                      newSteps[idx].thumbnail = e.target.value;
                      setFormData({
                        ...formData,
                        process: { ...formData.process, steps: newSteps },
                      });
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-white"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer text-white">
                    <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, 'process', idx);
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FINAL CTA */}
      {activeTab === 'cta' && (
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="border-b border-white/[0.08] pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Final Call to Action Section</h3>
              <p className="text-xs text-[#A3A3A3]">
                Headline and supportive text positioned directly beside the client inquiry form.
              </p>
            </div>
            <span className="text-[10px] text-[#FF4D00] font-mono uppercase bg-[#FF4D00]/10 px-2.5 py-1 rounded-full border border-[#FF4D00]/20">
              Live Editable
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Subtitle Badge
            </label>
            <input
              type="text"
              value={formData.finalCta.badge}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  finalCta: { ...formData.finalCta, badge: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Headline
            </label>
            <input
              type="text"
              value={formData.finalCta.headline}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  finalCta: { ...formData.finalCta, headline: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Supporting Copy
            </label>
            <textarea
              rows={3}
              value={formData.finalCta.supportingCopy}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  finalCta: { ...formData.finalCta, supportingCopy: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
