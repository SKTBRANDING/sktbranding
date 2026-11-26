'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Client, ClientServiceRate } from '@/types';
import { adminFetch } from '@/lib/adminApi';

interface AdminClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  editingClient?: Client | null;
  onClientSaved?: (savedClient: Client) => void;
}

const PRESET_SERVICES: { name: string; defaultRate: number; category: string }[] = [
  { name: 'Poster Design', defaultRate: 300, category: 'Poster Design' },
  { name: 'Video / Motion Graphics', defaultRate: 500, category: 'Video' },
  { name: 'Instagram Reel / Story Design', defaultRate: 500, category: 'Video' },
  { name: 'Social Media Post & Creatives', defaultRate: 300, category: 'Social Media' },
  { name: 'Logo Design & Monogram', defaultRate: 1500, category: 'Logo Design' },
  { name: 'Brand Identity & Guidelines', defaultRate: 3500, category: 'Branding' },
  { name: 'Packaging & Label Design', defaultRate: 2000, category: 'Packaging' },
  { name: 'Brochure & Editorial Lookbook', defaultRate: 1200, category: 'Print' },
  { name: 'Website & UI Design', defaultRate: 4000, category: 'Web Design' },
];

export default function AdminClientModal({
  isOpen,
  onClose,
  onRefresh,
  showToast,
  editingClient,
  onClientSaved,
}: AdminClientModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [serviceRates, setServiceRates] = useState<ClientServiceRate[]>([
    { serviceName: 'Poster Design', rate: 300, category: 'Poster Design' },
    { serviceName: 'Video / Motion Graphics', rate: 500, category: 'Video' },
    { serviceName: 'Social Media Post & Creatives', rate: 300, category: 'Social Media' },
  ]);

  // Form for adding a new service
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceRate, setNewServiceRate] = useState<number>(300);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name || '');
      setCompany(editingClient.company || '');
      setPhone(editingClient.phone || '');
      setEmail(editingClient.email || '');
      setAddress(editingClient.address || '');
      setNotes(editingClient.notes || '');
      setServiceRates(
        editingClient.serviceRates && editingClient.serviceRates.length > 0
          ? editingClient.serviceRates
          : [
              { serviceName: 'Poster Design', rate: 300, category: 'Poster Design' },
              { serviceName: 'Video / Motion Graphics', rate: 500, category: 'Video' },
            ]
      );
    } else {
      setName('');
      setCompany('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setServiceRates([
        { serviceName: 'Poster Design', rate: 300, category: 'Poster Design' },
        { serviceName: 'Video / Motion Graphics', rate: 500, category: 'Video' },
        { serviceName: 'Social Media Post & Creatives', rate: 300, category: 'Social Media' },
      ]);
    }
  }, [editingClient, isOpen]);

  if (!isOpen) return null;

  const handleAddPreset = (preset: { name: string; defaultRate: number; category: string }) => {
    if (serviceRates.some((s) => s.serviceName.toLowerCase() === preset.name.toLowerCase())) {
      showToast(`"${preset.name}" is already in this client's rate list.`, 'error');
      return;
    }
    setServiceRates((prev) => [
      ...prev,
      { serviceName: preset.name, rate: preset.defaultRate, category: preset.category },
    ]);
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showToast('Please enter a service name (e.g. Poster, Video).', 'error');
      return;
    }
    if (serviceRates.some((s) => s.serviceName.toLowerCase() === newServiceName.trim().toLowerCase())) {
      showToast(`"${newServiceName}" already exists in the rate list.`, 'error');
      return;
    }

    setServiceRates((prev) => [
      ...prev,
      {
        serviceName: newServiceName.trim(),
        rate: Math.max(0, Number(newServiceRate) || 0),
        category: 'Custom',
      },
    ]);
    setNewServiceName('');
    setNewServiceRate(300);
  };

  const handleRemoveService = (serviceName: string) => {
    setServiceRates((prev) => prev.filter((s) => s.serviceName !== serviceName));
  };

  const handleUpdateServiceRate = (serviceName: string, newRate: number) => {
    setServiceRates((prev) =>
      prev.map((s) => (s.serviceName === serviceName ? { ...s, rate: Math.max(0, newRate) } : s))
    );
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Client / Brand name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        notes: notes.trim(),
        serviceRates,
      };

      const url = editingClient ? `/api/clients/${editingClient.id || (editingClient as any)._id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save client details');
      }

      showToast(
        editingClient
          ? `Client "${payload.name}" updated successfully with ${serviceRates.length} service rates!`
          : `Client "${payload.name}" added successfully with custom rates!`
      );

      await onRefresh();
      if (onClientSaved) {
        onClientSaved(json);
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF4D00]/15 border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00] shadow-[0_0_15px_rgba(255,77,0,0.2)]">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {editingClient ? 'Edit Client & Service Rates' : 'Add New Client & Service Rates'}
              </h2>
              <p className="text-xs text-[#A3A3A3]">
                Configure brand details and custom pricing (e.g. Poster ₹300, Video ₹500)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#737373] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSaveClient} className="p-5 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Section 1: Client Contact & Business Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#FF4D00]">
              <Building className="w-4 h-4" />
              <span>Client & Business Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase font-semibold text-[#A3A3A3]">
                  Client / Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BAITHULRASA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase font-semibold text-[#A3A3A3]">
                  Company / Entity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Baithulrasa Hospitality & Estate"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase font-semibold text-[#A3A3A3]">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-[#737373] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. +91 9544931226"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase font-semibold text-[#A3A3A3]">
                  Billing Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#737373] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="e.g. accounts@baithulrasa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] transition-colors"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] uppercase font-semibold text-[#A3A3A3]">
                  Billing Physical Address
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#737373] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Level 42, Al Saada Tower, Downtown Dubai, UAE"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Custom Service Pricing & Rates */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#FF4D00]">
                <Tag className="w-4 h-4" />
                <span>Client Service Rates (INR ₹)</span>
              </div>
              <span className="text-[10px] text-[#A3A3A3]">
                {serviceRates.length} configured service(s)
              </span>
            </div>

            {/* Quick Presets Bar */}
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#737373] block">
                Quick Add Popular Services:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SERVICES.map((preset) => {
                  const alreadyAdded = serviceRates.some(
                    (s) => s.serviceName.toLowerCase() === preset.name.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      disabled={alreadyAdded}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 ${
                        alreadyAdded
                          ? 'bg-white/5 text-[#525252] cursor-not-allowed border border-white/5'
                          : 'bg-[#FF4D00]/10 hover:bg-[#FF4D00]/25 text-[#FF4D00] border border-[#FF4D00]/30 hover:border-[#FF4D00]'
                      }`}
                    >
                      {alreadyAdded ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
                      <span>{preset.name}</span>
                      <span className="font-mono font-bold text-white">₹{preset.defaultRate}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configured Service Rates Table / List */}
            <div className="space-y-2">
              {serviceRates.length === 0 ? (
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center text-xs text-[#737373]">
                  No services added yet. Add a preset or custom service below.
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceRates.map((s, idx) => (
                    <div
                      key={s.serviceName || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#FF4D00]/10 flex items-center justify-center text-[#FF4D00] font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block">{s.serviceName}</span>
                          <span className="text-[10px] text-[#737373] uppercase tracking-wider">
                            {s.category || 'Service'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#FF4D00]">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={s.rate}
                            onChange={(e) =>
                              handleUpdateServiceRate(s.serviceName, Number(e.target.value) || 0)
                            }
                            className="w-24 px-2.5 py-1 rounded-lg bg-black/80 border border-white/10 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-[#FF4D00] text-right"
                          />
                          <span className="text-[10px] text-[#737373] font-mono">INR</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveService(s.serviceName)}
                          className="p-1.5 rounded-lg text-[#737373] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Remove service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Service Adder Row */}
            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A3A3A3] block">
                + Add Custom Service & Rate:
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Service Name (e.g. Video, 3D Render, Banner)"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="flex-1 w-full px-3.5 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00]"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-28">
                    <span className="absolute left-3 top-2 text-xs font-bold text-[#FF4D00]">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      placeholder="Rate"
                      value={newServiceRate}
                      onChange={(e) => setNewServiceRate(Number(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomService}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notes (Optional) */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-[11px] uppercase font-semibold text-[#A3A3A3]">
              Client Notes & Contract Specifications (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Special billing instructions, preferred deliverables format, revision policy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-6 py-2.5 rounded-full text-xs font-extrabold bg-[#FF4D00] text-black hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.3)] disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving Client Profile...' : editingClient ? 'Update Client Profile' : 'Save Client & Rates'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
