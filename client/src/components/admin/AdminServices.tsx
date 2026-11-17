'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Compass,
  Shapes,
  Share2,
  Package,
  Printer,
  Globe,
  Sparkles,
  Layers,
  Shield,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ServiceItem } from '@/types';

interface AdminServicesProps {
  services: ServiceItem[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const AVAILABLE_ICONS = [
  'Compass',
  'Shapes',
  'Share2',
  'Package',
  'Printer',
  'Globe',
  'Sparkles',
  'Layers',
  'Shield',
];

export default function AdminServices({ services, onRefresh, showToast }: AdminServicesProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<ServiceItem>>({
    title: '',
    description: '',
    icon: 'Sparkles',
    deliverables: [],
    order: 1,
    published: true,
  });

  const [deliverablesInput, setDeliverablesInput] = useState('');

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      title: '',
      description: '',
      icon: 'Sparkles',
      deliverables: [],
      order: services.length + 1,
      published: true,
    });
    setDeliverablesInput('');
    setModalOpen(true);
  };

  const openEditModal = (s: ServiceItem) => {
    setEditingService(s);
    setFormData({ ...s });
    setDeliverablesInput((s.deliverables || []).join('\n'));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      showToast('Title and description are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const parsedDeliverables = deliverablesInput
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        deliverables: parsedDeliverables,
      };

      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update service');
        showToast('Service updated successfully');
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create service');
        showToast('New service created successfully');
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
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service');
      showToast('Service deleted successfully');
      setDeleteConfirmId(null);
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  const togglePublish = async (service: ServiceItem) => {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !service.published }),
      });
      if (!res.ok) throw new Error('Failed to toggle visibility');
      await onRefresh();
      showToast(service.published ? 'Service hidden from website' : 'Service published!');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Agency Capabilities & Services
          </h2>
          <p className="text-xs text-[#A3A3A3]">
            Manage the specialized offerings, deliverables, and display order shown to clients.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div
            key={service.id}
            className="luxury-card rounded-3xl p-6 border border-white/10 flex flex-col justify-between group hover:border-[#FF4D00]/40 transition-all"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#FF4D00] font-bold">
                  0{index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => togglePublish(service)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      service.published
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {service.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{service.published ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#FF4D00] transition-colors">
                  {service.title}
                </h3>
                <span className="text-[10px] font-mono text-[#737373]">
                  Icon: {service.icon} • Order: #{service.order}
                </span>
              </div>

              <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-3">
                {service.description}
              </p>

              {service.deliverables && service.deliverables.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">
                    Deliverables ({service.deliverables.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {service.deliverables.map((d, dIdx) => (
                      <span
                        key={dIdx}
                        className="px-2 py-0.5 rounded text-[10px] bg-black border border-white/5 text-[#A3A3A3]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 mt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-[#737373]">
                Order: #{service.order}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(service)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(service.id)}
                  className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-red-500/30 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete this service?</h3>
            <p className="text-xs text-[#A3A3A3]">
              Clients will no longer be able to explore or select this service in the inquiry form.
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

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
            
            <div className="flex items-center justify-between p-6 bg-[#141414] border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#FF4D00]" />
                <h3 className="text-base font-bold text-white">
                  {editingService ? `Edit Service: ${editingService.title}` : 'Add New Service Capability'}
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

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Brand Strategy & Identity"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Icon Symbol
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Short Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Concise, impactful explanation of what this service delivers..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Key Deliverables (one per line)
                </label>
                <textarea
                  rows={4}
                  value={deliverablesInput}
                  onChange={(e) => setDeliverablesInput(e.target.value)}
                  placeholder="Brand Architecture&#10;Logo Monogram & Guidelines&#10;Packaging Specifications"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#141414] border border-white/10">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF4D00] focus:ring-0"
                  />
                  <span>Published (Visible to visitors on homepage)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)]"
                >
                  {saving ? 'Saving...' : editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
