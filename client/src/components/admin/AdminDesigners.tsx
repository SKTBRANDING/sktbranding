'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Edit2,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Search,
  Filter,
  Briefcase,
  Sparkles,
  X,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { Designer } from '@/types';
import { adminFetch, uploadMediaFile } from '@/lib/adminApi';

interface DesignerWithStats extends Designer {
  stats?: {
    total: number;
    inProgress: number;
    submitted: number;
    revisions: number;
    completed: number;
  };
}

interface AdminDesignersProps {
  designers: DesignerWithStats[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onViewDesignerTasks?: (designerId: string) => void;
  onAssignWork?: (designerId: string) => void;
}

export default function AdminDesigners({
  designers,
  onRefresh,
  showToast,
  onViewDesignerTasks,
  onAssignWork,
}: AdminDesignersProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: 'Brand Identity & Typography',
    avatar: '',
    notes: '',
  });

  // Filtered designers
  const filteredDesigners = (designers || []).filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getInviteUrl = (token: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/designer?token=${token}`;
    }
    return `http://localhost:3000/designer?token=${token}`;
  };

  const copyInviteLink = async (designer: Designer) => {
    const url = getInviteUrl(designer.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedTokenId(designer.id);
      showToast(`Private invitation link copied for ${designer.name}!`);
      setTimeout(() => setCopiedTokenId(null), 3000);
    } catch {
      showToast('Could not copy to clipboard. Please copy manually.', 'error');
    }
  };

  const handleRegenerateToken = async (designer: Designer) => {
    if (!confirm(`Are you sure you want to regenerate the invitation link for ${designer.name}? Any existing link will be immediately invalidated.`)) {
      return;
    }

    try {
      const res = await adminFetch(`/api/designers/${designer.id}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate link');

      showToast(`New invitation link generated for ${designer.name}!`);
      await onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleStatus = async (designer: Designer) => {
    const nextStatus = designer.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await adminFetch(`/api/designers/${designer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      showToast(`Designer ${designer.name} marked as ${nextStatus}.`);
      await onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteDesigner = async (designer: Designer) => {
    if (!confirm(`Are you sure you want to delete ${designer.name}? Assigned active tasks will be unassigned and returned to available works.`)) {
      return;
    }

    try {
      const res = await adminFetch(`/api/designers/${designer.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete designer');

      showToast(`Designer ${designer.name} removed.`);
      await onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openCreateModal = () => {
    setEditingDesigner(null);
    setFormData({
      name: '',
      email: '',
      specialty: 'Brand Identity & Typography',
      avatar: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (designer: Designer) => {
    setEditingDesigner(designer);
    setFormData({
      name: designer.name,
      email: designer.email,
      specialty: designer.specialty,
      avatar: designer.avatar || '',
      notes: designer.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and email are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingDesigner) {
        const res = await adminFetch(`/api/designers/${editingDesigner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update designer');
        showToast(`Designer ${formData.name} updated!`);
      } else {
        const res = await adminFetch('/api/designers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add designer');
        showToast(`Designer ${formData.name} added! Invitation link generated.`);
      }

      await onRefresh();
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Designer Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30">
              {designers.length} Registered
            </span>
          </div>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Manage agency designers, generate private invite links, and track ongoing submissions and revisions.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF4D00] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.3)] self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Designer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#737373]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="revoked">Revoked Only</option>
          </select>
        </div>
      </div>

      {/* Designers Grid */}
      {filteredDesigners.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center space-y-3">
          <Users className="w-10 h-10 text-[#737373] mx-auto opacity-50" />
          <p className="text-sm font-bold text-white">No designers found</p>
          <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">
            {search ? 'No designers match your search filter.' : 'Add your first creative designer to invite them to the designer studio.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesigners.map((designer) => {
            const inviteUrl = getInviteUrl(designer.token);
            const isCopied = copiedTokenId === designer.id;
            const stats = designer.stats || { total: 0, inProgress: 0, submitted: 0, revisions: 0, completed: 0 };

            return (
              <div
                key={designer.id}
                className="luxury-card rounded-2xl p-5 flex flex-col justify-between border border-white/10 hover:border-[#FF4D00]/40 transition-all duration-300"
              >
                <div>
                  {/* Top Row: Avatar & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {designer.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={designer.avatar}
                          alt={designer.name}
                          className="w-12 h-12 rounded-full object-cover border border-[#FF4D00]/50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#FF4D00]/50 flex items-center justify-center text-sm font-black text-[#FF4D00]">
                          {designer.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">{designer.name}</h3>
                        <p className="text-[11px] text-[#A3A3A3] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-[#FF4D00]" />
                          <span>{designer.email}</span>
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/10 text-white">
                          {designer.specialty}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        designer.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : designer.status === 'revoked'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                      }`}
                    >
                      {designer.status}
                    </span>
                  </div>

                  {/* Task Stats Counter Pill */}
                  <div className="grid grid-cols-4 gap-1 mt-4 p-2.5 rounded-xl bg-black border border-white/5 text-center">
                    <div>
                      <span className="text-xs font-bold text-white block">{stats.inProgress}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#737373]">Active</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-400 block">{stats.submitted}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#737373]">Review</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#FF4D00] block">{stats.revisions}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#737373]">Revisions</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-400 block">{stats.completed}</span>
                      <span className="text-[9px] uppercase tracking-wider text-[#737373]">Done</span>
                    </div>
                  </div>

                  {/* Private Invitation Link Box */}
                  <div className="mt-4 p-3 rounded-xl bg-[#0a0a0a] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#A3A3A3] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D00]" />
                        <span>Private Access Link</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRegenerateToken(designer)}
                        className="text-[10px] text-[#A3A3A3] hover:text-white flex items-center gap-1 transition-colors"
                        title="Regenerate invitation link"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/10 text-[10px] font-mono text-[#A3A3A3] truncate select-all focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copyInviteLink(designer)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0 ${
                          isCopied
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-white/10 hover:bg-[#FF4D00] border-white/10 hover:border-transparent text-white hover:text-black'
                        }`}
                        title="Copy private invite URL"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Row Actions */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(designer)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white transition-colors"
                      title="Edit designer profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(designer)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white transition-colors"
                      title={designer.status === 'active' ? 'Deactivate designer' : 'Activate designer'}
                    >
                      {designer.status === 'active' ? <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDesigner(designer)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#A3A3A3] hover:text-red-400 transition-colors"
                      title="Delete designer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {onAssignWork && designer.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => onAssignWork(designer.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF4D00]/15 hover:bg-[#FF4D00] text-[#FF4D00] hover:text-black border border-[#FF4D00]/30 hover:border-transparent text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,77,0,0.15)]"
                        title={`Upload work and assign directly to ${designer.name}`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Assign Work</span>
                      </button>
                    )}

                    <a
                      href={inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A3A3A3] hover:text-white transition-colors px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                    >
                      <span>Panel</span>
                      <ExternalLink className="w-3 h-3 text-[#FF4D00]" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Designer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {editingDesigner ? 'Edit Designer Profile' : 'Add New Agency Designer'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Designer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aria Chen"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aria@designers.sktbranding.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Specialty / Creative Discipline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Brand Identity, 3D Packaging, UI/UX, Motion Design"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Internal Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Specialization details, hourly rate, time zone, or portfolio link..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_15px_rgba(255,77,0,0.4)] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingDesigner ? 'Save Changes' : 'Generate Invite & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
