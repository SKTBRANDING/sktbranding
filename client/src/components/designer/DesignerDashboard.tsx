'use client';

import React, { useState, useMemo } from 'react';
import { apiFetch } from '@/lib/apiBase';
import {
  Briefcase,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  LogOut,
  Send,
  Upload,
  X,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
  Download,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Mic,
  Search,
  Filter,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import { Designer, Task, TaskAttachment, TaskSubmission } from '@/types';
import { formatDate } from '@/lib/dateUtils';
import FileAttachmentCard from '@/components/ui/FileAttachmentCard';
import RevisionTimeline from '@/components/ui/RevisionTimeline';
import AudioVoiceControl, { AudioPlayer } from '@/components/ui/AudioVoiceControl';

interface DesignerDashboardProps {
  designer: Designer;
  initialTasks: Task[];
  onLogout: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onRefreshTasks: () => Promise<void>;
}

type TabType =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'revisions'
  | 'completed'
  | 'available'
  | 'daily';

export default function DesignerDashboard({
  designer,
  initialTasks,
  onLogout,
  showToast,
  onRefreshTasks,
}: DesignerDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<TabType>('assigned');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Search & Date filter state
  const [dateSearch, setDateSearch] = useState<string>('');
  const [textSearch, setTextSearch] = useState<string>('');

  // Claiming loading state
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);

  // Submit Work / Revision Modal state
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<TaskAttachment[]>([]);
  const [submissionVoiceNote, setSubmissionVoiceNote] = useState<TaskAttachment | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Sync initialTasks
  React.useEffect(() => {
    setTasks(initialTasks);
    if (selectedTask) {
      const updated = initialTasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [initialTasks]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showToast('Design copy & text contents copied to clipboard!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Date constants
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // All tasks assigned to this designer
  const myAssignedTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.assignedDesignerId === designer.id || t.assignedDesignerName === designer.name
    );
  }, [tasks, designer]);

  // Designer personal productivity metrics (Submissions total by daily, weekly, monthly)
  const submissionMetrics = useMemo(() => {
    let today = 0;
    let thisWeek = 0;
    let thisMonth = 0;
    let total = 0;

    myAssignedTasks.forEach((t) => {
      (t.submissions || []).forEach((sub) => {
        if (!sub.submittedAt) return;
        const subDate = new Date(sub.submittedAt);
        const subDayStr = sub.submittedAt.slice(0, 10);
        total++;
        if (subDayStr === todayStr) today++;
        if (subDate >= sevenDaysAgo) thisWeek++;
        if (subDate >= startOfMonth) thisMonth++;
      });
    });

    return { today, thisWeek, thisMonth, total };
  }, [myAssignedTasks, todayStr, sevenDaysAgo, startOfMonth]);

  // Tasks categorized strictly by workflow lifecycle
  const availableTasks = useMemo(() => tasks.filter((t) => t.status === 'available'), [tasks]);

  // 0. Pending Action Works (Assigned + Starting + Revision Requests)
  const pendingTasks = useMemo(
    () => myAssignedTasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress' || t.status === 'revision_requested'),
    [myAssignedTasks]
  );

  // 1. Assigned Works (Ready to start)
  const assignedTasks = useMemo(
    () => myAssignedTasks.filter((t) => t.status === 'assigned'),
    [myAssignedTasks]
  );

  // 2. Starting / In-Progress Works (Actively designing)
  const startingTasks = useMemo(
    () => myAssignedTasks.filter((t) => t.status === 'in_progress'),
    [myAssignedTasks]
  );

  // 3. Submitted Works (Delivered for review)
  const submittedTasks = useMemo(
    () => myAssignedTasks.filter((t) => t.status === 'submitted' || t.status === 'resubmitted'),
    [myAssignedTasks]
  );

  // 4. Revision Requests (Action needed)
  const revisionTasks = useMemo(
    () => myAssignedTasks.filter((t) => t.status === 'revision_requested'),
    [myAssignedTasks]
  );

  // 5. Completed Works (Approved)
  const completedTasks = useMemo(
    () => myAssignedTasks.filter((t) => t.status === 'completed'),
    [myAssignedTasks]
  );

  // Daily assigned for reference
  const dailyAssignedTasks = useMemo(() => {
    const targetDate = dateSearch || todayStr;
    return myAssignedTasks.filter((t) => {
      const assignedDate = t.assignedAt ? t.assignedAt.slice(0, 10) : t.createdAt?.slice(0, 10);
      return assignedDate === targetDate;
    });
  }, [myAssignedTasks, dateSearch, todayStr]);

  // Filter tasks based on activeTab, dateSearch, and textSearch
  const displayedTasks = useMemo(() => {
    let list: Task[] = [];
    if (activeTab === 'assigned') {
      list = assignedTasks;
    } else if (activeTab === 'in_progress') {
      list = startingTasks;
    } else if (activeTab === 'submitted') {
      list = submittedTasks;
    } else if (activeTab === 'revisions') {
      list = revisionTasks;
    } else if (activeTab === 'daily') {
      list = dailyAssignedTasks;
    } else if (activeTab === 'available') {
      list = availableTasks;
    } else {
      list = completedTasks;
    }

    // Apply dateSearch only when user explicitly selected a date
    if (dateSearch && activeTab === 'daily') {
      list = list.filter((t) => {
        const assignedDate = t.assignedAt ? t.assignedAt.slice(0, 10) : t.createdAt?.slice(0, 10);
        const deadlineDate = t.deadline ? t.deadline.slice(0, 10) : '';
        const submissionOnDate = (t.submissions || []).some(
          (s) => s.submittedAt && s.submittedAt.slice(0, 10) === dateSearch
        );
        return assignedDate === dateSearch || deadlineDate === dateSearch || submissionOnDate;
      });
    }

    // Apply textSearch
    if (textSearch.trim()) {
      const q = textSearch.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.client || '').toLowerCase().includes(q) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.deliverables && t.deliverables.toLowerCase().includes(q)) ||
          (t.brief && t.brief.toLowerCase().includes(q))
      );
    }

    return list;
  }, [
    activeTab,
    assignedTasks,
    startingTasks,
    submittedTasks,
    revisionTasks,
    dailyAssignedTasks,
    availableTasks,
    completedTasks,
    dateSearch,
    textSearch,
  ]);

  const handleTakeWork = async (task: Task) => {
    setClaimingTaskId(task.id);
    try {
      const token =
        designer.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('skt_designer_token') : '') ||
        '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-designer-token'] = token;

      const res = await apiFetch(`/api/tasks/${task.id}/claim`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim task');
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: 'assigned',
                assignedDesignerId: designer.id,
                assignedDesignerName: designer.name,
                assignedAt: new Date().toISOString(),
              }
            : t
        )
      );
      showToast(`Work claimed! "${task.title}" has been moved to Assigned Works.`);
      setActiveTab('assigned');
      await onRefreshTasks();
    } catch (err: any) {
      showToast(err.message, 'error');
      await onRefreshTasks();
    } finally {
      setClaimingTaskId(null);
    }
  };

  const handleStartWork = async (task: Task) => {
    try {
      // 1. Immediate optimistic UI update: move task to Starting / In-Progress works
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'in_progress' } : t))
      );
      if (selectedTask?.id === task.id) {
        setSelectedTask((prev) => (prev ? { ...prev, status: 'in_progress' } : null));
      }
      // 2. Automatically navigate to the Starting Works panel
      setActiveTab('in_progress');
      showToast(`Work started on "${task.title}". Moved to Starting Works!`);

      const token =
        designer.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('skt_designer_token') : '') ||
        '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-designer-token'] = token;

      const res = await apiFetch(`/api/tasks/${task.id}/start`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update status');

      await onRefreshTasks();
    } catch (err: any) {
      showToast(err.message, 'error');
      await onRefreshTasks();
    }
  };

  const handleUploadDeliverables = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    const token =
      designer.token ||
      (typeof window !== 'undefined' ? localStorage.getItem('skt_designer_token') : '') ||
      '';
    const newUploads: TaskAttachment[] = [];
    let lastError = '';

    const getCategory = (filename = '', mimetype = ''): TaskAttachment['category'] => {
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      if (['obj', 'fbx', 'glb', 'gltf', 'blend', 'c4d', '3ds', 'stl', 'dae', 'step', 'stp'].includes(ext))
        return 'model';
      if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'webm'].includes(ext) || mimetype.includes('audio'))
        return 'audio';
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || mimetype.includes('image'))
        return 'image';
      if (ext === 'pdf' || mimetype.includes('pdf')) return 'pdf';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
      return 'document';
    };

    try {
      const fileList = Array.from(files);
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', getCategory(file.name, file.type));

        const res = await apiFetch('/api/upload', {
          method: 'POST',
          headers: token ? { 'x-designer-token': token } : {},
          credentials: 'include',
          body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) {
          newUploads.push({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            url: data.url,
            size: file.size,
            type: file.type || 'application/octet-stream',
            mimeType: file.type || 'application/octet-stream',
            category: getCategory(file.name, file.type),
            uploadedAt: new Date().toISOString(),
          });
        } else {
          lastError = data.error || 'Upload error';
        }
      }

      if (newUploads.length > 0) {
        setUploadedFiles((prev) => [...prev, ...newUploads]);
        showToast(`Attached ${newUploads.length} deliverable file(s).`);
      } else if (lastError) {
        showToast(`Failed to upload: ${lastError}`, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'File upload failed', 'error');
    } finally {
      setUploadingFiles(false);
    }
  };

  const openSubmissionModal = (task: Task) => {
    setSelectedTask(task);
    setSubmissionNotes('');
    setUploadedFiles([]);
    setSubmissionVoiceNote(null);
    setSubmitModalOpen(true);
  };

  const handleSubmitDeliverables = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (uploadedFiles.length === 0) {
      showToast('Please upload at least one deliverable file before submitting.', 'error');
      return;
    }

    setSubmittingWork(true);
    try {
      const token =
        designer.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('skt_designer_token') : '') ||
        '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-designer-token'] = token;

      const res = await apiFetch(`/api/tasks/${selectedTask.id}/submit`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          notes: submissionNotes,
          files: uploadedFiles,
          designerVoiceNote: submissionVoiceNote,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Failed to submit deliverables');

      // 1. Optimistic update: move work from Starting Works to Submitted review panel
      const nextStatus = (selectedTask.submissions?.length || 0) > 0 ? 'resubmitted' : 'submitted';
      const newSub: TaskSubmission = json.submission || {
        id: `sub-${Date.now()}`,
        version: (selectedTask.submissions?.length || 0) + 1,
        versionLabel: 'Deliverables Submission',
        submittedAt: new Date().toISOString(),
        designerId: designer.id,
        designerName: designer.name,
        notes: submissionNotes,
        files: uploadedFiles,
        designerVoiceNote: submissionVoiceNote,
        reviewStatus: 'pending',
      };

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                status: nextStatus,
                submissions: [newSub, ...(t.submissions || [])],
              }
            : t
        )
      );

      // 2. Clear date/search filters so the submitted work is immediately visible
      setDateSearch('');
      setTextSearch('');

      // 3. Automatically switch to Submitted review panel
      setActiveTab('submitted');
      setSubmitModalOpen(false);
      setSelectedTask(null);
      setSubmissionNotes('');
      setUploadedFiles([]);
      setSubmissionVoiceNote(null);

      showToast(json.message || 'Deliverables submitted! Moved to Submitted review panel.');
      await onRefreshTasks();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingWork(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col selection:bg-[#FF4D00] selection:text-black">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/[0.08] px-5 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#FF4D00]/50 flex items-center justify-center shadow-[0_0_12px_rgba(255,77,0,0.3)]">
            <span className="text-[#FF4D00] font-black text-sm">S</span>
          </div>
          <div>
            <span className="text-sm font-bold tracking-wider text-white">SKT BRANDING</span>
            <span className="text-[10px] text-[#FF4D00] block tracking-widest uppercase -mt-0.5 font-mono">
              Designer Studio Workspace
            </span>
          </div>
        </div>

        {/* Designer Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-[#141414] border border-white/10 px-3 py-1.5 rounded-full">
            {designer.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={designer.avatar}
                alt={designer.name}
                className="w-6 h-6 rounded-full object-cover border border-[#FF4D00]/50"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-black text-[10px] font-black text-[#FF4D00] flex items-center justify-center">
                {designer.name[0]}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white block leading-tight">{designer.name}</span>
                {designer.companyCode && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30 rounded">
                    {designer.companyCode}
                  </span>
                )}
              </div>
              <span className="text-[9px] text-[#A3A3A3] block uppercase tracking-wider">
                {designer.specialty}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white transition-colors"
            title="Sign out of designer workspace"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="luxury-card rounded-3xl p-6 border border-white/10 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 w-80 h-80 bg-[#FF4D00]/10 rounded-full blur-[100px] pointer-events-none"
          />
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                Designer Portal Online
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-[#FF4D00]">{designer.name}</span>
            </h1>
            <p className="text-xs text-[#A3A3A3] max-w-xl">
              Track your pending works, review daily assigned briefs, submit high-resolution deliverables, and filter by any assignment date.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshTasks}
            className="self-start sm:self-center px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 transition-colors relative z-10 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Workspace</span>
          </button>
        </div>

        {/* Designer Productivity & Submissions Analytics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Pending Works */}
          <div
            onClick={() => setActiveTab('assigned')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'assigned'
                ? 'bg-[#FF4D00]/15 border-[#FF4D00] shadow-[0_0_20px_rgba(255,77,0,0.25)]'
                : 'bg-[#0a0a0a] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#A3A3A3] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Pending Works</span>
              <Clock className="w-3.5 h-3.5 text-[#FF4D00]" />
            </div>
            <div className="text-2xl font-black text-white">{pendingTasks.length}</div>
            <div className="text-[10px] text-[#FF4D00] mt-0.5">Action required</div>
          </div>

          {/* Daily Assigned (Today) */}
          <div
            onClick={() => {
              setDateSearch(todayStr);
              setActiveTab('daily');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-[#FF4D00]/15 border-[#FF4D00] shadow-[0_0_20px_rgba(255,77,0,0.25)]'
                : 'bg-[#0a0a0a] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#A3A3A3] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Today Assigned</span>
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{dailyAssignedTasks.length}</div>
            <div className="text-[10px] text-[#A3A3A3] mt-0.5">Assigned {todayStr}</div>
          </div>

          {/* Submitted Today */}
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between text-xs text-[#A3A3A3] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Submitted Today</span>
              <Send className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{submissionMetrics.today}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Daily submissions</div>
          </div>

          {/* Submitted This Week */}
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between text-xs text-[#A3A3A3] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Weekly Submitted</span>
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{submissionMetrics.thisWeek}</div>
            <div className="text-[10px] text-[#A3A3A3] mt-0.5">Last 7 days</div>
          </div>

          {/* Submitted This Month */}
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between text-xs text-[#A3A3A3] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Monthly Submitted</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">{submissionMetrics.thisMonth}</div>
            <div className="text-[10px] text-[#A3A3A3] mt-0.5">Current month</div>
          </div>

          {/* Total Submissions All Time */}
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10">
            <div className="flex items-center justify-between text-xs text-[#A3A3A3] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">All-Time Works</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4D00]" />
            </div>
            <div className="text-2xl font-black text-white">{submissionMetrics.total}</div>
            <div className="text-[10px] text-[#A3A3A3] mt-0.5">Total packages delivered</div>
          </div>
        </div>

        {/* Date Search & Work Filtering Toolbar */}
        <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Date Search controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-bold text-[#A3A3A3] flex items-center gap-1.5 mr-1">
                <CalendarDays className="w-4 h-4 text-[#FF4D00]" />
                <span>Search Date:</span>
              </span>

              {/* Native Date Picker */}
              <input
                type="date"
                value={dateSearch}
                onChange={(e) => setDateSearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00] font-mono"
              />

              {/* Quick Date Pills */}
              <button
                type="button"
                onClick={() => setDateSearch('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  !dateSearch ? 'bg-white/15 text-white border border-white/20' : 'bg-[#141414] text-[#A3A3A3] hover:text-white'
                }`}
              >
                All Dates
              </button>
              <button
                type="button"
                onClick={() => setDateSearch(todayStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  dateSearch === todayStr ? 'bg-[#FF4D00] text-black font-bold' : 'bg-[#141414] text-[#A3A3A3] hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateSearch(yesterdayStr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  dateSearch === yesterdayStr ? 'bg-[#FF4D00] text-black font-bold' : 'bg-[#141414] text-[#A3A3A3] hover:text-white'
                }`}
              >
                Yesterday
              </button>
            </div>

            {/* Keyword search input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={textSearch}
                onChange={(e) => setTextSearch(e.target.value)}
                placeholder="Search by brief, client, title..."
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
              />
              {textSearch && (
                <button
                  type="button"
                  onClick={() => setTextSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#737373] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Notice */}
          {(dateSearch || textSearch) && (
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-[#A3A3A3] flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>
                  Filtering {dateSearch ? `for date ` : ''}
                  {dateSearch && <strong className="text-[#FF4D00] font-mono">{dateSearch}</strong>}
                  {textSearch && ` matching "${textSearch}"`} • Showing {displayedTasks.length} work(s)
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setDateSearch('');
                  setTextSearch('');
                }}
                className="text-[11px] text-[#FF4D00] hover:underline font-bold"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation Bars */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          {/* 1. Assigned Works Tab (To Start) */}
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'assigned'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Assigned Works</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'assigned' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'
              }`}
            >
              {assignedTasks.length}
            </span>
          </button>

          {/* 2. Starting Works Tab (In Progress) */}
          <button
            type="button"
            onClick={() => setActiveTab('in_progress')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'in_progress'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Starting Works</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'in_progress' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'
              }`}
            >
              {startingTasks.length}
            </span>
          </button>

          {/* 3. Submitted (Awaiting Review) */}
          <button
            type="button"
            onClick={() => setActiveTab('submitted')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'submitted'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submitted (Review)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'submitted' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'
              }`}
            >
              {submittedTasks.length}
            </span>
          </button>

          {/* 4. Revisions Requested */}
          <button
            type="button"
            onClick={() => setActiveTab('revisions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'revisions'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Revisions Requested</span>
            {revisionTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-black animate-pulse">
                {revisionTasks.length} Action Needed
              </span>
            )}
          </button>

          {/* 5. Daily Assigned Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Assigned</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'daily' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'
              }`}
            >
              {dailyAssignedTasks.length}
            </span>
          </button>

          {/* 6. Available Works */}
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'available'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Available Briefs</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'available' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'
              }`}
            >
              {availableTasks.length}
            </span>
          </button>

          {/* 7. Completed Works */}
          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'completed' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'
              }`}
            >
              {completedTasks.length}
            </span>
          </button>
        </div>

        {/* Tab Content Cards */}
        {displayedTasks.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-[#737373] mx-auto opacity-50" />
            <p className="text-sm font-bold text-white">No tasks found in this view</p>
            <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">
              {activeTab === 'assigned'
                ? 'No new assigned tasks waiting to start. Check "Available Briefs" or wait for new assignments.'
                : activeTab === 'in_progress'
                ? 'No works currently in starting works panel. Click "Start Working" on an assigned task to begin.'
                : activeTab === 'submitted'
                ? 'No deliverables currently under review. Submit your work package from Starting Works to see it here.'
                : activeTab === 'revisions'
                ? 'No revision requests pending. All submitted works are in order!'
                : activeTab === 'daily'
                ? 'No tasks assigned for this date.'
                : activeTab === 'available'
                ? 'No unassigned briefs in the studio pool right now.'
                : 'No tasks currently in this section.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {displayedTasks.map((task) => {
              const isClaiming = claimingTaskId === task.id;
              const hasSubmissions = (task.submissions || []).length > 0;
              const latestSub = hasSubmissions
                ? task.submissions.reduce((prev, curr) => (curr.version > prev.version ? curr : prev))
                : null;

              const assignedDateStr = task.assignedAt
                ? task.assignedAt.slice(0, 10)
                : task.createdAt?.slice(0, 10);

              return (
                <div
                  key={task.id}
                  className={`luxury-card rounded-2xl p-6 border flex flex-col justify-between transition-all duration-300 ${
                    task.status === 'revision_requested'
                      ? 'border-[#FF4D00]/60 bg-[#160d07] shadow-[0_0_25px_rgba(255,77,0,0.15)]'
                      : task.status === 'completed'
                      ? 'border-emerald-500/30 bg-[#07130a]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : task.priority === 'high'
                              ? 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {task.priority} Priority
                        </span>

                        {assignedDateStr && (
                          <span className="text-[10px] text-[#A3A3A3] flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-white/50" />
                            <span>Assigned: {assignedDateStr}</span>
                          </span>
                        )}

                        <span className="text-[10px] text-[#A3A3A3] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#FF4D00]" />
                          <span>Due: {formatDate(task.deadline)}</span>
                        </span>
                      </div>

                      {task.status === 'revision_requested' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#FF4D00] text-black animate-pulse flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Revision Requested
                        </span>
                      )}

                      {task.status === 'completed' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      )}

                      {(task.status === 'submitted' || task.status === 'resubmitted') && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          Under Review (v{latestSub?.version || 1})
                        </span>
                      )}

                      {task.status === 'in_progress' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          In Progress
                        </span>
                      )}

                      {task.status === 'assigned' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Assigned
                        </span>
                      )}
                    </div>

                    {/* Title & Client */}
                    <div>
                      <h3
                        onClick={() => setSelectedTask(task)}
                        className="text-lg font-bold text-white hover:text-[#FF4D00] transition-colors cursor-pointer"
                      >
                        {task.title}
                      </h3>
                      <p className="text-xs text-[#A3A3A3] mt-0.5">
                        Client: <strong className="text-white">{task.client}</strong>
                        {(task.serviceCategory || task.category) && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-white/5 text-[10px] text-[#FF4D00] border border-[#FF4D00]/30 font-medium">
                            {task.serviceCategory || task.category}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Brief Excerpt */}
                    <p className="text-xs text-[#B3B3B3] line-clamp-3 leading-relaxed">
                      {task.brief}
                    </p>

                    {/* Work Specifications */}
                    <div className="p-2.5 rounded-xl bg-black border border-white/5 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">
                        Work Specifications
                      </span>
                      <p className="text-xs text-white truncate">
                        {task.dimensions ? `${task.dimensions} • ` : ''}
                        {task.fileFormats || 'Standard deliverables'}
                      </p>
                    </div>

                    {/* Prominent Revision Banner inside card if revision requested */}
                    {task.status === 'revision_requested' && latestSub?.adminFeedback && (
                      <div className="p-3 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/40 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-[#FF4D00] block flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Admin Requested Changes:
                        </span>
                        <p className="text-xs text-[#F5F5F5] line-clamp-2 italic">
                          &quot;{latestSub.adminFeedback}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(task)}
                      className="text-xs font-semibold text-[#A3A3A3] hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Brief & Files</span>
                    </button>

                    {task.status === 'available' ? (
                      <button
                        type="button"
                        onClick={() => handleTakeWork(task)}
                        disabled={isClaiming}
                        className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF4D00] hover:bg-[#FF7A00] text-black transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{isClaiming ? 'Claiming...' : 'Take Work'}</span>
                      </button>
                    ) : task.status === 'revision_requested' ? (
                      <button
                        type="button"
                        onClick={() => openSubmissionModal(task)}
                        className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF4D00] hover:bg-[#FF7A00] text-black transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Revision</span>
                      </button>
                    ) : task.status === 'assigned' ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartWork(task)}
                          className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF4D00] hover:bg-[#FF7A00] text-black transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] flex items-center gap-1.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Start Working</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openSubmissionModal(task)}
                          className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Work</span>
                        </button>
                      </div>
                    ) : task.status === 'in_progress' ? (
                      <button
                        type="button"
                        onClick={() => openSubmissionModal(task)}
                        className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF4D00] hover:bg-[#FF7A00] text-black transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Work</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#737373]">
                        {hasSubmissions ? `${task.submissions.length} Version(s)` : 'No files'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Task Details & Revision History Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0c0c] border border-white/20 rounded-3xl overflow-hidden flex flex-col my-auto shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-[#141414]">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30">
                    {selectedTask.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-white">
                    {selectedTask.priority} PRIORITY
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {selectedTask.title}
                </h3>
                <p className="text-xs text-[#A3A3A3]">
                  Client: <strong className="text-white">{selectedTask.client}</strong> • Due: {formatDate(selectedTask.deadline)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedTask.status === 'available' ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleTakeWork(selectedTask);
                      setSelectedTask(null);
                    }}
                    className="px-5 py-2 rounded-full text-xs font-bold uppercase bg-[#FF4D00] text-black hover:bg-[#FF7A00] transition-colors"
                  >
                    Take Work
                  </button>
                ) : selectedTask.status === 'assigned' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleStartWork(selectedTask);
                        setSelectedTask(null);
                      }}
                      className="px-5 py-2 rounded-full text-xs font-bold uppercase bg-[#FF4D00] text-black hover:bg-[#FF7A00] transition-colors flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Start Working</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openSubmissionModal(selectedTask)}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Work</span>
                    </button>
                  </div>
                ) : selectedTask.status === 'in_progress' ||
                  selectedTask.status === 'revision_requested' ? (
                  <button
                    type="button"
                    onClick={() => {
                      openSubmissionModal(selectedTask);
                    }}
                    className="px-5 py-2 rounded-full text-xs font-bold uppercase bg-[#FF4D00] text-black hover:bg-[#FF7A00] transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {selectedTask.status === 'revision_requested'
                        ? 'Submit Revision'
                        : 'Submit Deliverables'}
                    </span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-2 rounded-full bg-white/10 text-[#A3A3A3] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
              {/* Prominent Revision Banner */}
              {selectedTask.status === 'revision_requested' && (
                <div className="p-5 rounded-2xl bg-[#FF4D00]/15 border border-[#FF4D00]/50 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-[#FF4D00] flex-shrink-0" />
                    <span>Administrator Requested Revisions</span>
                  </div>

                  {selectedTask.submissions?.[0]?.adminFeedback && (
                    <p className="text-xs text-[#F5F5F5] leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-xl border border-white/5">
                      {selectedTask.submissions[0].adminFeedback}
                    </p>
                  )}

                  {/* Admin Voice Message if attached */}
                  {selectedTask.submissions?.[0]?.adminVoiceFeedback && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] uppercase font-bold text-[#FF4D00] block flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5" />
                        <span>Verbal Revision Directions & Voice Memo</span>
                      </span>
                      <AudioPlayer
                        src={selectedTask.submissions[0].adminVoiceFeedback.url}
                        title="Admin Revision Voice Note"
                        duration={selectedTask.submissions[0].adminVoiceFeedback.duration}
                      />
                    </div>
                  )}

                  {/* Admin Revision Reference Models & Files */}
                  {selectedTask.submissions?.[0]?.adminFeedbackAttachments &&
                    selectedTask.submissions[0].adminFeedbackAttachments.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-[10px] uppercase font-bold text-white block">
                          Revision References & Models ({selectedTask.submissions[0].adminFeedbackAttachments.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedTask.submissions[0].adminFeedbackAttachments.map((file) => (
                            <FileAttachmentCard key={file.id || file.url} file={file} readOnly={true} />
                          ))}
                        </div>
                      </div>
                    )}

                  <button
                    type="button"
                    onClick={() => openSubmissionModal(selectedTask)}
                    className="px-5 py-2.5 rounded-full text-xs font-bold uppercase bg-[#FF4D00] text-black hover:bg-[#FF7A00] transition-colors"
                  >
                    Upload Revised Files Now →
                  </button>
                </div>
              )}

              {/* Voice Brief Audio Player if attached */}
              {selectedTask.voiceBrief && (
                <div className="p-4 rounded-2xl bg-[#141414] border border-[#FF4D00]/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-[#FF4D00]" />
                    <span className="text-xs uppercase font-bold text-white tracking-wider">
                      Creative Voice Brief & Verbal Directions
                    </span>
                  </div>
                  <AudioPlayer
                    src={selectedTask.voiceBrief.url}
                    title="Creative Voice Brief"
                    duration={selectedTask.voiceBrief.duration}
                  />
                </div>
              )}

              {/* Design Copy & Text Contents */}
              {selectedTask.textContent && (
                <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#FF4D00]" />
                      <span className="text-xs uppercase font-bold text-white tracking-wider">
                        Design Copy & Text Contents
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedTask.textContent || '')}
                      className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Text</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-[#E5E5E5] whitespace-pre-wrap leading-relaxed select-all">
                    {selectedTask.textContent}
                  </div>
                </div>
              )}

              {/* Creative Brief */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-[#FF4D00]">
                  Project Brief & Creative Direction
                </h4>
                <p className="text-xs sm:text-sm text-[#E5E5E5] leading-relaxed whitespace-pre-line bg-[#141414] p-5 rounded-2xl border border-white/5">
                  {selectedTask.brief}
                </p>
              </div>

              {/* Deliverables Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#141414] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">
                    Work Assign Date
                  </span>
                  <p className="text-xs text-white font-medium">
                    {selectedTask.assignedAt ? `Assigned: ${selectedTask.assignedAt.slice(0, 10)}` : 'Active'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141414] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">
                    File Formats & Dimensions
                  </span>
                  <p className="text-xs text-white font-medium">
                    {selectedTask.dimensions ? `${selectedTask.dimensions} • ` : ''}
                    {selectedTask.fileFormats || 'Standard deliverables'}
                  </p>
                </div>
              </div>

              {/* Reference Attachments */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-[#A3A3A3]">
                  Brief Reference Files ({selectedTask.referenceFiles?.length || 0})
                </h4>
                {selectedTask.referenceFiles?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTask.referenceFiles.map((file) => (
                      <FileAttachmentCard key={file.id || file.url} file={file} readOnly={true} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#737373] italic">No reference files attached for this brief.</p>
                )}
              </div>

              {/* Complete Revision History Timeline */}
              <div className="pt-6 border-t border-white/10">
                <RevisionTimeline
                  submissions={selectedTask.submissions || []}
                  currentStatus={selectedTask.status}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Work / Revision Deliverables Modal */}
      {submitModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 my-auto shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedTask.status === 'revision_requested'
                      ? 'Submit Revised Deliverables'
                      : 'Submit Work Package'}
                  </h3>
                  <p className="text-[11px] text-[#A3A3A3]">{selectedTask.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverables} className="space-y-4">
              {/* Deliverable File Upload Box */}
              <div className="space-y-2 p-5 rounded-2xl bg-[#141414] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs uppercase font-bold text-[#FF4D00]">
                    Upload Deliverable Files *
                  </label>
                  <span className="text-[10px] text-[#A3A3A3]">Max 100MB per file</span>
                </div>

                {/* Drag and Drop Zone */}
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDragging) setIsDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleUploadDeliverables(e.dataTransfer.files);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 select-none ${
                    isDragging
                      ? 'border-[#FF4D00] bg-[#FF4D00]/10 scale-[1.01] shadow-[0_0_20px_rgba(255,77,0,0.25)]'
                      : 'border-white/20 hover:border-[#FF4D00] bg-[#0a0a0a]'
                  }`}
                >
                  <Upload
                    className={`w-8 h-8 text-[#FF4D00] mb-2 ${
                      uploadingFiles ? 'animate-bounce' : isDragging ? 'scale-125 transition-transform' : ''
                    }`}
                  />
                  <p className="text-xs font-bold text-white">
                    {isDragging ? 'Release to drop & attach files' : 'Click to select files or drag & drop here'}
                  </p>
                  <p className="text-[11px] text-[#737373] mt-1">
                    Supports PNG, JPG, PDF, PSD, AI, EPS, INDD, ZIP, RAR, MP4, and all project source files.
                  </p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleUploadDeliverables(e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>

                {uploadingFiles && (
                  <p className="text-xs text-[#FF4D00] animate-pulse text-center pt-2 font-medium">
                    Uploading deliverable files at original quality...
                  </p>
                )}

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 pt-3">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-white">
                      Attached Deliverables ({uploadedFiles.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uploadedFiles.map((file, idx) => (
                        <FileAttachmentCard
                          key={file.id || idx}
                          file={file}
                          onRemove={() =>
                            setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submission Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Submission Notes & Deliverable Overview
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain your design execution, revisions made, specific color codes, typography choices, or details for the review team..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              {/* Voice Walkthrough & Audio Explanation */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                <AudioVoiceControl
                  currentAudio={submissionVoiceNote}
                  onAudioChange={setSubmissionVoiceNote}
                  label="Voice Walkthrough / Audio Explanation (Optional)"
                  description="Record a voice note or upload an audio walkthrough explaining your design decisions and revisions"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWork || uploadingFiles || uploadedFiles.length === 0}
                  className="px-7 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)] disabled:opacity-50"
                >
                  {submittingWork ? 'Submitting...' : 'Submit Deliverables for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
