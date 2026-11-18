'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Quote,
  X,
  Upload,
  Sparkles,
} from 'lucide-react';
import { Testimonial } from '@/types';
import { adminFetch, uploadMediaFile } from '@/lib/adminApi';

interface AdminTestimonialsProps {
  testimonials: Testimonial[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminTestimonials({
  testimonials,
  onRefresh,
  showToast,
}: AdminTestimonialsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState<Partial<Testimonial>>({
    quote: '',
    author: '',
    role: '',
    company: '',
    avatar: '',
    rating: 5,
    published: true,
  });

  const openCreateModal = () => {
    setEditingTestimonial(null);
    setFormData({
      quote: '',
      author: '',
      role: '',
      company: '',
      avatar: '',
      rating: 5,
      published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (t: Testimonial) => {
    setEditingTestimonial(t);
    setFormData({ ...t });
    setModalOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const url = await uploadMediaFile(file);
      if (!url) throw new Error('Failed to upload photo');

      setFormData((prev) => ({ ...prev, avatar: url }));
      showToast('Photo uploaded successfully');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quote || !formData.author) {
      showToast('Quotation and author name are required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingTestimonial) {
        const res = await adminFetch(`/api/testimonials/${editingTestimonial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update testimonial');
        showToast('Testimonial updated successfully');
      } else {
        const res = await adminFetch('/api/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create testimonial');
        showToast('Genuine testimonial created!');
      }

      await onRefresh();
      setModalOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/testimonials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete testimonial');
      showToast('Testimonial deleted successfully');
      setDeleteConfirmId(null);
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  const togglePublish = async (t: Testimonial) => {
    try {
      const res = await adminFetch(`/api/testimonials/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !t.published }),
      });
      if (!res.ok) throw new Error('Failed to toggle testimonial status');
      await onRefresh();
      showToast(t.published ? 'Testimonial hidden' : 'Testimonial published live!');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Client Testimonials & Endorsements
          </h2>
          <p className="text-xs text-[#A3A3A3]">
            Strict Rule: The testimonial section on the public homepage is <strong>hidden</strong> until genuine testimonials are added and published.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Genuine Testimonial</span>
        </button>
      </div>

      {/* Grid of Testimonials */}
      {testimonials.length === 0 ? (
        <div className="luxury-card rounded-3xl p-12 text-center border border-white/10 space-y-3">
          <Quote className="w-10 h-10 text-[#737373] mx-auto" />
          <h3 className="text-base font-bold text-white">No testimonials added yet</h3>
          <p className="text-xs text-[#A3A3A3] max-w-md mx-auto">
            The testimonials section is currently hidden on the client-facing website to avoid presenting invented quotes. Click &ldquo;Add Genuine Testimonial&rdquo; when real feedback is received.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="luxury-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between group hover:border-[#FF4D00]/40 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#FF7A00]">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePublish(t)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      t.published
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {t.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{t.published ? 'Published' : 'Hidden'}</span>
                  </button>
                </div>

                <p className="text-xs text-[#F5F5F5] italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {t.avatar ? (
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.avatar} alt={t.author} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#1c1c1c] text-[#FF4D00] font-bold text-xs flex items-center justify-center">
                      {t.author.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.author}</h4>
                    <span className="text-[10px] text-[#A3A3A3]">
                      {t.role} {t.company ? `• ${t.company}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(t.id)}
                    className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-red-500/30 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete this testimonial?</h3>
            <p className="text-xs text-[#A3A3A3]">
              This will remove the review permanently.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Testimonial Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
            
            <div className="flex items-center justify-between p-6 bg-[#141414] border-b border-white/10">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-[#FF4D00]" />
                <h3 className="text-base font-bold text-white">
                  {editingTestimonial ? 'Edit Testimonial' : 'Add Client Testimonial'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Client Quotation *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  placeholder="&ldquo;SKT Branding redefined how our brand presents itself to the world...&rdquo;"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Rating (Stars)
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value={5}>★★★★★ (5 Stars)</option>
                    <option value={4}>★★★★☆ (4 Stars)</option>
                    <option value={3}>★★★☆☆ (3 Stars)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Head of Marketing"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Aether Dynamics"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Avatar Photo */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[#141414] border border-white/10">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Avatar Photo URL or Upload
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.avatar || ''}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-white"
                  />
                  <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer text-white">
                    <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>{uploadingAvatar ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF4D00]"
                  />
                  <span>Published (Display live on client website)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] shadow-[0_0_20px_rgba(255,77,0,0.4)]"
                >
                  {saving ? 'Saving...' : editingTestimonial ? 'Save Changes' : 'Create Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
