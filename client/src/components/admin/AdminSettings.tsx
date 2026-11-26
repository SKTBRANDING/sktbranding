'use client';

import React, { useState } from 'react';
import {
  Settings,
  Save,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  Database,
  Code,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AgencySettings } from '@/types';
import { adminFetch } from '@/lib/adminApi';

interface AdminSettingsProps {
  settings: AgencySettings;
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminSettings({ settings, onRefresh, showToast }: AdminSettingsProps) {
  const [formData, setFormData] = useState<AgencySettings>({
    ...settings,
    socialLinks: { ...(settings.socialLinks || {}) },
  });

  const [saving, setSaving] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateAdminPassword = async () => {
    if (!newAdminPassword.trim() || newAdminPassword.trim().length < 4) {
      showToast('Admin password must be at least 4 characters long.', 'error');
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await adminFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newAdminPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update admin password');
      showToast('Admin Studio login password updated successfully! Keep this password safe.');
      setNewAdminPassword('');
      await onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error updating password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await adminFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update agency settings');

      showToast('Settings saved successfully and updated on live website!');
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const copySqlToClipboard = () => {
    const sqlCode = `-- SKT Branding Supabase Setup
create table if not exists public.projects (
  id text primary key default uuid_generate_v4()::text,
  title text not null,
  slug text not null unique,
  client text not null,
  category text not null,
  year text not null,
  cover_image text not null,
  image_alt text default '',
  gallery_images text[] default '{}',
  overview text not null,
  services text[] default '{}',
  approach text not null,
  external_link text,
  is_sample boolean default false,
  is_featured boolean default false,
  published boolean default true,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.inquiries (
  id text primary key default uuid_generate_v4()::text,
  name text not null,
  email text not null,
  phone text not null,
  company text,
  service text not null,
  description text not null,
  status text default 'New' check (status in ('New', 'Contacted', 'Completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);`;

    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    showToast('SQL schema copied to clipboard');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Agency Identity & Global Settings
          </h2>
          <p className="text-xs text-[#A3A3A3]">
            Configure agency name, studio contact information, social profiles, and SEO metadata.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Card 1: Agency Brand & Identity */}
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <h3 className="text-base font-bold text-white">Agency Branding</h3>
            <p className="text-xs text-[#A3A3A3]">
              Displayed in the navigation header, website hero, and footer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Agency Name
              </label>
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Logo Monogram Text
              </label>
              <input
                type="text"
                value={formData.logoText}
                onChange={(e) => setFormData({ ...formData, logoText: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Agency Tagline / Mission
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
            />
          </div>
        </div>

        {/* Card 2: Contact Channels */}
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <h3 className="text-base font-bold text-white">Direct Contact Channels</h3>
            <p className="text-xs text-[#A3A3A3]">
              Shown on the public contact section. Leaving fields blank will automatically hide them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Public Contact Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
              Studio Location / Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
            />
          </div>
        </div>

        {/* Card 3: Social Media Links */}
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <h3 className="text-base font-bold text-white">Social Profiles</h3>
            <p className="text-xs text-[#A3A3A3]">
              Strict Rule: Social links are hidden on the public site until real URLs are entered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Instagram URL
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/sktbranding"
                value={formData.socialLinks.instagram || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Behance Profile URL
              </label>
              <input
                type="url"
                placeholder="https://behance.net/sktbranding"
                value={formData.socialLinks.behance || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, behance: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                LinkedIn Page URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/company/sktbranding"
                value={formData.socialLinks.linkedin || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Twitter / X URL
              </label>
              <input
                type="url"
                placeholder="https://x.com/sktbranding"
                value={formData.socialLinks.twitter || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Search Engine Optimization */}
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="border-b border-white/[0.08] pb-4">
            <h3 className="text-base font-bold text-white">SEO & Meta Tags</h3>
            <p className="text-xs text-[#A3A3A3]">
              Default page title and description for search engines and social share cards.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Page Title Tag
              </label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Meta Description
              </label>
              <textarea
                rows={2}
                value={formData.seoDescription}
                onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
              />
            </div>
          </div>
        </div>

        {/* Card 4.5: Admin Security & Studio Password Customization */}
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Admin Studio Security & Password</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/30 font-bold">
                    Customizable
                  </span>
                </h3>
                <p className="text-xs text-[#A3A3A3]">
                  Customize the password required to log in to the private Admin Studio at <code className="text-[#FF7A00]">/admin</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3.5">
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>Enter New Admin Studio Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Enter new custom admin password (e.g. your secret password)..."
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-white"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdateAdminPassword}
                disabled={updatingPassword || !newAdminPassword.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF6A26] disabled:opacity-40 text-xs font-bold text-black transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] flex-shrink-0"
              >
                <Lock className={`w-3.5 h-3.5 ${updatingPassword ? 'animate-spin' : ''}`} />
                <span>{updatingPassword ? 'Updating...' : 'Update Admin Password'}</span>
              </button>
            </div>

            <p className="text-[11px] text-[#737373]">
              Default fallback password: <code className="text-[#A3A3A3]">admin123</code>. Once updated, your new password will be required immediately upon your next sign-in.
            </p>
          </div>
        </div>
      </form>

      {/* Card 5: Persistence & Supabase Setup Guide */}
      <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-[#FF4D00]" />
            <div>
              <h3 className="text-base font-bold text-white">
                Database Engine & Supabase Cloud Integration
              </h3>
              <p className="text-xs text-[#A3A3A3]">
                Local persistence is active. To connect Supabase Cloud, follow the instructions below.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            Active: Local JSON Engine
          </span>
        </div>

        <div className="space-y-4 text-xs text-[#A3A3A3] leading-relaxed">
          <p>
            Your website is currently operating on <strong>Local Persistent Storage</strong> (<code className="text-[#FF7A00]">data/db.json</code>). All project edits, services, testimonials, and submitted inquiries are saved to disk and instantly update the public site.
          </p>

          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-3">
            <h4 className="text-xs uppercase font-bold text-white tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-[#FF4D00]" />
              <span>Step 1: Configure Environment Variables in .env.local</span>
            </h4>
            <pre className="p-3 rounded-xl bg-black text-[#F5F5F5] font-mono text-[11px] overflow-x-auto border border-white/5">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here`}
            </pre>
          </div>

          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-bold text-white tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-[#FF4D00]" />
                <span>Step 2: Supabase SQL Migration Script</span>
              </h4>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#737373]">
              Run the full schema in your Supabase SQL Editor located at <code className="text-[#FF7A00]">supabase/schema.sql</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
