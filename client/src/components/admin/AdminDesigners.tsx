'use client';

import React, { useState, useMemo } from 'react';
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
  Key,
  Lock,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  ChevronRight,
  Phone,
  Camera,
  CreditCard,
  Award,
  BadgeCheck,
  Hash,
  MapPin,
} from 'lucide-react';
import { Designer, Task, TaskSubmission } from '@/types';
import { adminFetch, uploadMediaFile } from '@/lib/adminApi';

const InstagramIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

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
  tasks?: Task[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onViewDesignerTasks?: (designerId: string) => void;
  onAssignWork?: (designerId: string) => void;
}

export default function AdminDesigners({
  designers,
  tasks = [],
  onRefresh,
  showToast,
  onViewDesignerTasks,
  onAssignWork,
}: AdminDesignersProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateSearch, setDateSearch] = useState<string>(''); // YYYY-MM-DD
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
  const [inspectingDesigner, setInspectingDesigner] = useState<Designer | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Quick inline password editor state
  const [inlinePasswordId, setInlinePasswordId] = useState<string | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState<string>('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Form state for create / edit modal
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: 'Brand Identity & Typography',
    avatar: '',
    notes: '',
    token: '',
    instagram: '',
    phone: '',
    accountDetails: '',
    dateOfBirth: '',
    joiningDate: '',
    experienceYears: '',
    companyCode: '',
    address: '',
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadMediaFile(file);
      if (url) {
        setFormData((prev) => ({ ...prev, avatar: url }));
        showToast('Designer photo uploaded successfully!');
      }
    } catch (err: any) {
      showToast(err.message || 'Photo upload failed', 'error');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  // Calculate Productivity & Submissions Analytics for each designer
  const designerAnalytics = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const map = new Map<
      string,
      {
        dailySubmissions: number;
        weeklySubmissions: number;
        monthlySubmissions: number;
        totalSubmissions: number;
        pendingWorksCount: number;
        dailyAssignedCount: number;
        dateFilteredAssignedCount: number;
        dateFilteredSubmissionsCount: number;
        pendingTasks: Task[];
        assignedTasks: Task[];
        submissions: (TaskSubmission & { taskTitle: string; taskId: string })[];
      }
    >();

    designers.forEach((d) => {
      // Find all tasks assigned to this designer
      const designerTasks = tasks.filter(
        (t) => t.assignedDesignerId === d.id || t.assignedDesignerName === d.name
      );

      // Pending tasks requiring designer action
      const pendingTasks = designerTasks.filter(
        (t) =>
          t.status === 'assigned' ||
          t.status === 'in_progress' ||
          t.status === 'revision_requested' ||
          t.status === 'submitted' ||
          t.status === 'resubmitted'
      );

      // Tasks assigned today
      const dailyAssignedTasks = designerTasks.filter((t) => {
        const assignedDate = t.assignedAt ? t.assignedAt.slice(0, 10) : t.createdAt?.slice(0, 10);
        return assignedDate === todayStr;
      });

      // Tasks assigned on searchDate if specified
      const dateFilteredAssigned = dateSearch
        ? designerTasks.filter((t) => {
            const assignedDate = t.assignedAt ? t.assignedAt.slice(0, 10) : t.createdAt?.slice(0, 10);
            const deadlineDate = t.deadline ? t.deadline.slice(0, 10) : '';
            return assignedDate === dateSearch || deadlineDate === dateSearch;
          })
        : dailyAssignedTasks;

      // Extract all submissions made by this designer across all tasks
      const allSubmissions: (TaskSubmission & { taskTitle: string; taskId: string })[] = [];
      tasks.forEach((t) => {
        (t.submissions || []).forEach((sub) => {
          if (sub.designerId === d.id || (t.assignedDesignerId === d.id && !sub.designerId)) {
            allSubmissions.push({ ...sub, taskTitle: t.title, taskId: t.id });
          }
        });
      });

      const dailySubmissions = allSubmissions.filter(
        (s) => s.submittedAt && s.submittedAt.slice(0, 10) === todayStr
      ).length;

      const weeklySubmissions = allSubmissions.filter(
        (s) => s.submittedAt && new Date(s.submittedAt) >= sevenDaysAgo
      ).length;

      const monthlySubmissions = allSubmissions.filter(
        (s) => s.submittedAt && new Date(s.submittedAt) >= startOfMonth
      ).length;

      const dateFilteredSubmissions = dateSearch
        ? allSubmissions.filter((s) => s.submittedAt && s.submittedAt.slice(0, 10) === dateSearch).length
        : dailySubmissions;

      map.set(d.id, {
        dailySubmissions,
        weeklySubmissions,
        monthlySubmissions,
        totalSubmissions: allSubmissions.length,
        pendingWorksCount: pendingTasks.length,
        dailyAssignedCount: dailyAssignedTasks.length,
        dateFilteredAssignedCount: dateFilteredAssigned.length,
        dateFilteredSubmissionsCount: dateFilteredSubmissions,
        pendingTasks,
        assignedTasks: dateSearch ? dateFilteredAssigned : designerTasks,
        submissions: allSubmissions,
      });
    });

    return map;
  }, [designers, tasks, dateSearch]);

  // Overall Agency Aggregates
  const totalSubmissionsToday = useMemo(() => {
    let sum = 0;
    designerAnalytics.forEach((stat) => {
      sum += stat.dailySubmissions;
    });
    return sum;
  }, [designerAnalytics]);

  const totalSubmissionsThisWeek = useMemo(() => {
    let sum = 0;
    designerAnalytics.forEach((stat) => {
      sum += stat.weeklySubmissions;
    });
    return sum;
  }, [designerAnalytics]);

  const totalSubmissionsThisMonth = useMemo(() => {
    let sum = 0;
    designerAnalytics.forEach((stat) => {
      sum += stat.monthlySubmissions;
    });
    return sum;
  }, [designerAnalytics]);

  const totalPendingWorks = useMemo(() => {
    let sum = 0;
    designerAnalytics.forEach((stat) => {
      sum += stat.pendingWorksCount;
    });
    return sum;
  }, [designerAnalytics]);

  // Filtered designers
  const filteredDesigners = (designers || []).filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.token.toLowerCase().includes(search.toLowerCase());

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
      showToast(`Access link & password copied for ${designer.name}!`);
      setTimeout(() => setCopiedTokenId(null), 3000);
    } catch {
      showToast('Could not copy to clipboard. Please copy manually.', 'error');
    }
  };

  const copyPasswordToken = async (designer: Designer) => {
    try {
      await navigator.clipboard.writeText(designer.token);
      setCopiedTokenId(`token-${designer.id}`);
      showToast(`Password / Token "${designer.token}" copied!`);
      setTimeout(() => setCopiedTokenId(null), 3000);
    } catch {
      showToast('Could not copy to clipboard.', 'error');
    }
  };

  // Customize designer password / access token
  const handleSaveCustomPassword = async (designer: Designer, newPassword: string) => {
    if (!newPassword.trim()) {
      showToast('Password / access token cannot be empty.', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await adminFetch(`/api/designers/${designer.id}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customToken: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update designer password');

      showToast(`Password updated to "${data.token}" for ${designer.name}!`);
      setInlinePasswordId(null);
      setCustomPasswordInput('');
      await onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error updating password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleRegenerateToken = async (designer: Designer) => {
    if (
      !confirm(
        `Regenerate random access token for ${designer.name}? The previous password/token will be invalidated.`
      )
    ) {
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

      showToast(`New password token generated: ${data.token}`);
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
    if (
      !confirm(
        `Are you sure you want to delete ${designer.name}? Active tasks will return to available works.`
      )
    ) {
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
      token: '',
      instagram: '',
      phone: '',
      accountDetails: '',
      dateOfBirth: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      experienceYears: '',
      companyCode: `SKT-${Math.floor(100 + Math.random() * 900)}`,
      address: '',
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
      token: designer.token || '',
      instagram: designer.instagram || '',
      phone: designer.phone || '',
      accountDetails: designer.accountDetails || '',
      dateOfBirth: designer.dateOfBirth || '',
      joiningDate: designer.joiningDate || '',
      experienceYears: designer.experienceYears || '',
      companyCode: designer.companyCode || '',
      address: designer.address || '',
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
        showToast(`Designer ${formData.name} added! Access password set.`);
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
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Designer Workspace Management & Productivity</span>
            <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/30 font-bold">
              {designers.length} Active
            </span>
          </h2>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Customize access passwords, track daily/weekly/monthly submissions, and inspect pending & assigned works.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF6A26] text-xs font-bold text-black transition-all shadow-[0_0_20px_rgba(255,77,0,0.35)] active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Designer</span>
        </button>
      </div>

      {/* Agency-Wide Submissions & Works Tracker Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A3A3A3] mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Submissions Today</span>
            <Calendar className="w-4 h-4 text-[#FF4D00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalSubmissionsToday}</span>
            <span className="text-[10px] text-emerald-400 font-medium">Daily</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A3A3A3] mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Submissions This Week</span>
            <TrendingUp className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalSubmissionsThisWeek}</span>
            <span className="text-[10px] text-amber-400 font-medium">Last 7 Days</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A3A3A3] mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Submissions This Month</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalSubmissionsThisMonth}</span>
            <span className="text-[10px] text-cyan-400 font-medium">Monthly</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#A3A3A3] mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Pending Works</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#FF4D00]">{totalPendingWorks}</span>
            <span className="text-[10px] text-[#A3A3A3] font-medium">In Progress</span>
          </div>
        </div>
      </div>

      {/* Search & Date Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#0e0e0e] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Text search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search designer by name, email, specialty, or password token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Date Search filter for daily assigned works */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] border border-white/10 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span className="text-[#A3A3A3] text-[11px] font-medium">Search Date:</span>
            <input
              type="date"
              value={dateSearch}
              onChange={(e) => setDateSearch(e.target.value)}
              className="bg-transparent text-white text-xs focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          {dateSearch && (
            <button
              type="button"
              onClick={() => setDateSearch('')}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] text-[#A3A3A3] hover:text-white"
            >
              Clear Date
            </button>
          )}

          <button
            type="button"
            onClick={() => setDateSearch(new Date().toISOString().slice(0, 10))}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-[#FF4D00]"
          >
            Today
          </button>
        </div>
      </div>

      {dateSearch && (
        <div className="p-3 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF4D00]" />
            <span>
              Showing daily assigned works & submissions for date: <strong>{dateSearch}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDateSearch('')}
            className="text-[11px] text-[#A3A3A3] hover:text-white underline"
          >
            Reset to all
          </button>
        </div>
      )}

      {/* Designers List Grid */}
      <div className="space-y-4">
        {filteredDesigners.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0a0a0a] border border-white/10 space-y-3">
            <Users className="w-10 h-10 text-[#737373] mx-auto" />
            <p className="text-sm font-semibold text-white">No designers match your filter criteria.</p>
            <p className="text-xs text-[#737373]">Try clearing search filters or add a new designer.</p>
          </div>
        ) : (
          filteredDesigners.map((designer) => {
            const stats = designerAnalytics.get(designer.id) || {
              dailySubmissions: 0,
              weeklySubmissions: 0,
              monthlySubmissions: 0,
              totalSubmissions: 0,
              pendingWorksCount: 0,
              dailyAssignedCount: 0,
              dateFilteredAssignedCount: 0,
              dateFilteredSubmissionsCount: 0,
              pendingTasks: [],
              assignedTasks: [],
              submissions: [],
            };

            const isEditingPassword = inlinePasswordId === designer.id;

            return (
              <div
                key={designer.id}
                className="p-5 sm:p-6 rounded-3xl bg-[#0e0e0e] border border-white/[0.08] hover:border-white/20 transition-all space-y-4 shadow-md"
              >
                {/* Header Row: Avatar, Name, Status, Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {designer.avatar ? (
                      <img
                        src={designer.avatar}
                        alt={designer.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#FF4D00]/40 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00] font-black text-lg flex-shrink-0 shadow-[0_0_12px_rgba(255,77,0,0.2)]">
                        {designer.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white tracking-tight">{designer.name}</h3>
                        {designer.companyCode && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30">
                            {designer.companyCode}
                          </span>
                        )}
                        <span
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            designer.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {designer.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A3A3A3] mt-0.5">
                        <span>{designer.specialty}</span>
                        {designer.experienceYears && (
                          <span className="text-[11px] text-[#A3A3A3] flex items-center gap-1">
                            • <Award className="w-3 h-3 text-[#FF4D00]" /> {designer.experienceYears}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#737373] font-mono mt-0.5">
                        <span>{designer.email}</span>
                        {designer.phone && (
                          <span className="flex items-center gap-1 text-[#A3A3A3]">
                            • <Phone className="w-3 h-3 text-emerald-400" /> {designer.phone}
                          </span>
                        )}
                        {designer.instagram && (
                          <span className="flex items-center gap-1 text-[#A3A3A3]">
                            • <InstagramIcon className="w-3 h-3 text-pink-400" /> {designer.instagram}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setInspectingDesigner(designer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors"
                      title="Inspect works, submissions & dates"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Inspect Works ({stats.pendingWorksCount})</span>
                    </button>

                    {onAssignWork && (
                      <button
                        type="button"
                        onClick={() => onAssignWork(designer.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 text-xs font-semibold text-[#FF4D00] border border-[#FF4D00]/30 transition-colors"
                        title="Directly assign new task"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Assign Task</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(designer)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(designer)}
                      className={`p-2 rounded-xl ${
                        designer.status === 'active'
                          ? 'bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                      title={designer.status === 'active' ? 'Deactivate Designer' : 'Activate Designer'}
                    >
                      {designer.status === 'active' ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <ShieldAlert className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDesigner(designer)}
                      className="p-2 rounded-xl bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300"
                      title="Delete Designer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submissions & Productivity Metric Badges (Daily, Weekly, Monthly, Pending) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-[#090909] border border-white/5 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#A3A3A3] tracking-wider">
                      📅 Today
                    </span>
                    <span className="text-lg font-black text-white mt-0.5">
                      {stats.dailySubmissions}{' '}
                      <span className="text-[10px] font-normal text-[#737373]">submitted</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090909] border border-white/5 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#A3A3A3] tracking-wider">
                      📆 This Week
                    </span>
                    <span className="text-lg font-black text-white mt-0.5">
                      {stats.weeklySubmissions}{' '}
                      <span className="text-[10px] font-normal text-[#737373]">submitted</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090909] border border-white/5 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#A3A3A3] tracking-wider">
                      🗓️ This Month
                    </span>
                    <span className="text-lg font-black text-white mt-0.5">
                      {stats.monthlySubmissions}{' '}
                      <span className="text-[10px] font-normal text-[#737373]">submitted</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090909] border border-white/5 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#A3A3A3] tracking-wider">
                      🏆 All-Time Total
                    </span>
                    <span className="text-lg font-black text-white mt-0.5">
                      {stats.totalSubmissions}{' '}
                      <span className="text-[10px] font-normal text-[#737373]">works</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090909] border border-[#FF4D00]/20 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#FF4D00] tracking-wider">
                      ⏳ Pending Works
                    </span>
                    <span className="text-lg font-black text-[#FF4D00] mt-0.5">
                      {stats.pendingWorksCount}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#090909] border border-white/5 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#A3A3A3] tracking-wider">
                      📌 {dateSearch ? `On ${dateSearch}` : "Today's Assigned"}
                    </span>
                    <span className="text-lg font-black text-cyan-400 mt-0.5">
                      {stats.dateFilteredAssignedCount}
                    </span>
                  </div>
                </div>

                {/* Password / Access Token Customization Row */}
                <div className="p-3.5 rounded-2xl bg-[#090909] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Key className="w-4 h-4 text-[#FF4D00] flex-shrink-0" />
                    <span className="text-[#A3A3A3] font-semibold flex-shrink-0">Studio Password / Token:</span>

                    {isEditingPassword ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={customPasswordInput}
                          onChange={(e) => setCustomPasswordInput(e.target.value)}
                          placeholder="e.g. fida123, fidha2026..."
                          className="px-2.5 py-1 rounded-lg bg-[#141414] border border-[#FF4D00] text-white text-xs font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCustomPassword(designer, customPasswordInput)}
                          disabled={updatingPassword}
                          className="px-3 py-1 rounded-lg bg-[#FF4D00] hover:bg-[#FF6A26] text-black text-[11px] font-bold"
                        >
                          {updatingPassword ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInlinePasswordId(null);
                            setCustomPasswordInput('');
                          }}
                          className="px-2 py-1 text-[#A3A3A3] hover:text-white text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <code
                          className="px-2.5 py-1 rounded-lg bg-[#141414] border border-white/10 text-white font-mono text-[11px] truncate cursor-pointer hover:border-[#FF4D00]"
                          onClick={() => copyPasswordToken(designer)}
                          title="Click to copy password token"
                        >
                          {designer.token}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            setInlinePasswordId(designer.id);
                            setCustomPasswordInput(designer.token);
                          }}
                          className="text-[11px] text-[#FF4D00] hover:underline font-semibold"
                        >
                          Change Password
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => copyInviteLink(designer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-semibold border border-white/10 transition-colors"
                      title="Copy full studio invitation link"
                    >
                      {copiedTokenId === designer.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedTokenId === designer.id ? 'Copied Link' : 'Copy Access Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRegenerateToken(designer)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#737373] hover:text-white"
                      title="Regenerate random token"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INSPECTOR MODAL: View Works & Submissions for Selected Designer */}
      {inspectingDesigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0d0d0d] border border-white/10 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#121212]">
              <div className="flex items-center gap-3.5">
                {inspectingDesigner.avatar ? (
                  <img
                    src={inspectingDesigner.avatar}
                    alt={inspectingDesigner.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-[#FF4D00]/50 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#FF4D00]/50 flex items-center justify-center text-[#FF4D00] font-black text-lg flex-shrink-0">
                    {inspectingDesigner.name[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                    <span>{inspectingDesigner.name}</span>
                    {inspectingDesigner.companyCode && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30 font-bold">
                        {inspectingDesigner.companyCode}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {inspectingDesigner.specialty}
                    </span>
                  </h3>
                  <p className="text-xs text-[#737373]">
                    {inspectingDesigner.email} • Password Token: <code className="text-[#FF7A00]">{inspectingDesigner.token}</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingDesigner(null)}
                className="p-2 rounded-xl bg-white/5 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Personnel Dossier & Contact Information */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-white flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-[#FF4D00]" />
                  <span>Personnel Profile & Payroll Details</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#737373] block">Company Code</span>
                    <span className="font-mono text-white font-bold">{inspectingDesigner.companyCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#737373] block">Phone Number</span>
                    <span className="text-white">{inspectingDesigner.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#737373] block">Instagram</span>
                    <span className="text-[#FF7A00]">{inspectingDesigner.instagram || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#737373] block">Experience</span>
                    <span className="text-white">{inspectingDesigner.experienceYears || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#737373] block">Date of Birth</span>
                    <span className="text-[#A3A3A3] font-mono">{inspectingDesigner.dateOfBirth || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#737373] block">Joining Date</span>
                    <span className="text-[#A3A3A3] font-mono">{inspectingDesigner.joiningDate || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] uppercase font-semibold text-[#737373] block">Address</span>
                    <span className="text-white text-[11px] block truncate">{inspectingDesigner.address || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] uppercase font-semibold text-[#737373] block">Account / Payout Details</span>
                    <span className="text-white font-mono text-[11px] block truncate">{inspectingDesigner.accountDetails || 'N/A'}</span>
                  </div>
                </div>
              </div>
              {(() => {
                const stats = designerAnalytics.get(inspectingDesigner.id);
                if (!stats) return null;

                return (
                  <>
                    {/* Submissions Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-[#A3A3A3]">Today's Submissions</span>
                        <p className="text-2xl font-black text-white mt-1">{stats.dailySubmissions}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-[#A3A3A3]">Weekly (7 Days)</span>
                        <p className="text-2xl font-black text-white mt-1">{stats.weeklySubmissions}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-[#A3A3A3]">Monthly (This Month)</span>
                        <p className="text-2xl font-black text-white mt-1">{stats.monthlySubmissions}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/10">
                        <span className="text-[10px] uppercase font-bold text-[#FF4D00]">Pending Works</span>
                        <p className="text-2xl font-black text-[#FF4D00] mt-1">{stats.pendingWorksCount}</p>
                      </div>
                    </div>

                    {/* Pending Works Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs uppercase font-bold tracking-wider text-white flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#FF4D00]" />
                          <span>Active Pending Works ({stats.pendingTasks.length})</span>
                        </h4>
                      </div>

                      {stats.pendingTasks.length === 0 ? (
                        <p className="text-xs text-[#737373] p-4 rounded-xl bg-[#141414] border border-white/5">
                          No pending works. Designer has completed all assigned tasks!
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {stats.pendingTasks.map((t) => (
                            <div
                              key={t.id}
                              className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-white">{t.title}</p>
                                <p className="text-[11px] text-[#A3A3A3]">
                                  Client: {t.client} • Deadline: {t.deadline?.slice(0, 10)}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  t.status === 'in_progress'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                    : t.status === 'revision_requested'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                    : t.status === 'submitted'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {t.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Submissions History */}
                    <div className="space-y-3">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span>Submitted Works History ({stats.submissions.length})</span>
                      </h4>

                      {stats.submissions.length === 0 ? (
                        <p className="text-xs text-[#737373] p-4 rounded-xl bg-[#141414] border border-white/5">
                          No deliverables submitted yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {stats.submissions.map((sub, sIdx) => (
                            <div
                              key={sub.id || sIdx}
                              className="p-3.5 rounded-xl bg-[#141414] border border-white/10 flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-white">{sub.taskTitle}</p>
                                <p className="text-[11px] text-[#737373]">
                                  {sub.versionLabel || 'Submission'} • Submitted on:{' '}
                                  {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Recent'}
                                </p>
                                {sub.files && (
                                  <p className="text-[10px] text-[#A3A3A3] mt-0.5">
                                    Files attached: {sub.files.length} deliverable(s)
                                  </p>
                                )}
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  sub.reviewStatus === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : sub.reviewStatus === 'revision_requested'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                    : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                }`}
                              >
                                {sub.reviewStatus}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DESIGNER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0e0e0e] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#FF4D00]" />
                <span>{editingDesigner ? 'Edit Designer Profile' : 'Add New Designer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Upload Section */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Designer Preview"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF4D00]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#090909] border border-white/20 flex flex-col items-center justify-center text-[#A3A3A3]">
                      <Camera className="w-6 h-6 text-[#FF4D00]" />
                      <span className="text-[9px] uppercase font-bold mt-1">Photo</span>
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/70 rounded-2xl flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-[#FF4D00] animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF6A26] text-black text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{uploadingAvatar ? 'Uploading...' : formData.avatar ? 'Change Photo' : 'Upload Designer Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>

                    {formData.avatar && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: '' })}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-[#A3A3A3] hover:text-red-400 text-xs transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-[#737373]">
                    Upload official designer profile picture. Square (1:1) JPG, PNG, WEBP recommended.
                  </p>
                </div>
              </div>

              {/* 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Company Code Number</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKT-DSG-01"
                    value={formData.companyCode}
                    onChange={(e) => setFormData({ ...formData, companyCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Designer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FATHIMA"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Designer Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sktdesigns50@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {/* Specialty */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Design Specialty / Role
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Brand Identity & Typography"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {/* Work Experience */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Work Experience Year</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Years, 5+ Years"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {/* Instagram URL or ID */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1">
                    <InstagramIcon className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Instagram URL or ID (Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. @skt_designer or instagram.com/..."
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Date of Birth</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00] font-mono"
                  />
                </div>

                {/* Joining Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Company Joining Date</span>
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00] font-mono"
                  />
                </div>

                {/* Designer Full Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Designer Full Address</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Street, City, State, Country"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Account Details for Payouts */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>Account Details (Bank, IBAN / SWIFT, UPI)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bank Name, Account Number / IBAN, SWIFT / IFSC Code for salary payouts"
                  value={formData.accountDetails}
                  onChange={(e) => setFormData({ ...formData, accountDetails: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00] font-mono resize-none"
                />
              </div>

              {/* Custom Access Password / Token Field */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#090909] border border-[#FF4D00]/20">
                <label className="block text-xs uppercase font-bold text-[#FF4D00] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Custom Studio Password / Access Token</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. fida123, fidha2026 (Leave blank for auto-generated token)"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4D00]"
                />
                <p className="text-[10px] text-[#737373]">
                  The designer can type this exact password on the Designer Studio Access screen (<code className="text-[#A3A3A3]">/designer</code>) to sign in.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-[#FF4D00] hover:bg-[#FF6A26] text-xs font-bold text-black disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingDesigner ? 'Save Changes' : 'Create Designer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
