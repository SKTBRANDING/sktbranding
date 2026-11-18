'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Share2,
  FileText,
  Upload,
  X,
  ExternalLink,
  Edit2,
  Trash2,
  Eye,
  Check,
  Send,
  Sparkles,
  Copy,
  Box,
  Mic,
  FileAudio,
} from 'lucide-react';
import { Task, Designer, TaskAttachment, TaskPriority, TaskStatus } from '@/types';
import { formatDate } from '@/lib/dateUtils';
import FileAttachmentCard from '@/components/ui/FileAttachmentCard';
import RevisionTimeline from '@/components/ui/RevisionTimeline';
import AudioVoiceControl, { AudioPlayer } from '@/components/ui/AudioVoiceControl';
import { adminFetch } from '@/lib/adminApi';

interface AdminTasksProps {
  tasks: Task[];
  designers: Designer[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onPublishToPortfolio?: (task: Task) => void;
  initialOpenCreateModal?: boolean;
  preselectedDesignerId?: string | null;
  onResetModalTrigger?: () => void;
}

export default function AdminTasks({
  tasks,
  designers,
  onRefresh,
  showToast,
  onPublishToPortfolio,
  initialOpenCreateModal = false,
  preselectedDesignerId = null,
  onResetModalTrigger,
}: AdminTasksProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [designerFilter, setDesignerFilter] = useState<string>('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Review states
  const [reviewMode, setReviewMode] = useState<'idle' | 'request_revision' | 'approve'>('idle');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewVoiceFeedback, setReviewVoiceFeedback] = useState<TaskAttachment | null>(null);
  const [reviewAttachments, setReviewAttachments] = useState<TaskAttachment[]>([]);
  const [uploadingReviewRef, setUploadingReviewRef] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // Task creation/edit form state
  const [formData, setFormData] = useState<{
    title: string;
    client: string;
    brief: string;
    textContent: string;
    voiceBrief: TaskAttachment | null;
    deliverables: string;
    dimensions: string;
    fileFormats: string;
    priority: TaskPriority;
    deadline: string;
    assignedDesignerId: string;
    referenceFiles: TaskAttachment[];
  }>({
    title: '',
    client: '',
    brief: '',
    textContent: '',
    voiceBrief: null,
    deliverables: '',
    dimensions: '',
    fileFormats: 'AI, PSD, PDF, PNG',
    priority: 'medium',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedDesignerId: '',
    referenceFiles: [],
  });

  const [savingTask, setSavingTask] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);

  // Trigger open modal if requested via prop
  useEffect(() => {
    if (initialOpenCreateModal) {
      openCreateModal(preselectedDesignerId);
      if (onResetModalTrigger) onResetModalTrigger();
    }
  }, [initialOpenCreateModal, preselectedDesignerId]);

  // Filter tasks
  const filteredTasks = (tasks || []).filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.client.toLowerCase().includes(search.toLowerCase()) ||
      (task.assignedDesignerName && task.assignedDesignerName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'in_progress'
        ? task.status === 'in_progress' || task.status === 'assigned'
        : statusFilter === 'awaiting_review'
        ? task.status === 'submitted' || task.status === 'resubmitted'
        : task.status === statusFilter;

    const matchesPriority = priorityFilter === 'all' ? true : task.priority === priorityFilter;

    const matchesDesigner =
      designerFilter === 'all'
        ? true
        : designerFilter === 'unassigned'
        ? !task.assignedDesignerId
        : task.assignedDesignerId === designerFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesDesigner;
  });

  // KPI Metrics
  const totalCount = tasks.length;
  const availableCount = tasks.filter((t) => t.status === 'available').length;
  const activeCount = tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length;
  const awaitingReviewCount = tasks.filter((t) => t.status === 'submitted' || t.status === 'resubmitted').length;
  const revisionsCount = tasks.filter((t) => t.status === 'revision_requested').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingRef(true);
    try {
      const uploaded: TaskAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append('file', file);

        const res = await adminFetch('/api/tasks/upload', {
          method: 'POST',
          body: data,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Failed to upload ${file.name}`);
        uploaded.push(json);
      }

      setFormData((prev) => ({
        ...prev,
        referenceFiles: [...prev.referenceFiles, ...uploaded],
      }));
      showToast(`${uploaded.length} reference file(s) attached successfully!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingRef(false);
    }
  };

  const handleUploadReviewAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingReviewRef(true);
    try {
      const newUploads: TaskAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append('file', file);
        const res = await adminFetch('/api/tasks/upload', {
          method: 'POST',
          body: data,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Failed to upload ${file.name}`);
        newUploads.push(json);
      }
      setReviewAttachments((prev) => [...prev, ...newUploads]);
      showToast(`${newUploads.length} reference file(s) attached to revision request.`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingReviewRef(false);
    }
  };

  const openCreateModal = (preselectId?: string | null) => {
    setEditingTask(null);
    setFormData({
      title: '',
      client: '',
      brief: '',
      textContent: '',
      voiceBrief: null,
      deliverables: '',
      dimensions: '',
      fileFormats: 'AI, PSD, PDF, High-Res PNG',
      priority: 'medium',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedDesignerId: preselectId || '',
      referenceFiles: [],
    });
    setCreateModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      client: task.client,
      brief: task.brief,
      textContent: task.textContent || '',
      voiceBrief: task.voiceBrief || null,
      deliverables: task.deliverables,
      dimensions: task.dimensions || '',
      fileFormats: task.fileFormats || 'AI, PSD, PDF, High-Res PNG',
      priority: task.priority,
      deadline: task.deadline ? task.deadline.split('T')[0] : '',
      assignedDesignerId: task.assignedDesignerId || '',
      referenceFiles: task.referenceFiles || [],
    });
    setCreateModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.client.trim() || !formData.brief.trim()) {
      showToast('Title, Client, and Creative Brief are required.', 'error');
      return;
    }

    setSavingTask(true);
    try {
      if (editingTask) {
        const res = await adminFetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to update task');
        showToast('Task updated successfully!');
      } else {
        const res = await adminFetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create task');
        showToast(
          formData.assignedDesignerId
            ? 'Task created and assigned to designer!'
            : 'Task created and published to Available Works!'
        );
      }

      await onRefresh();
      setCreateModalOpen(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}"? This will delete all attached submissions and revision histories.`)) {
      return;
    }

    try {
      const res = await adminFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');

      showToast(`Task "${title}" deleted.`);
      if (selectedTask?.id === taskId) setSelectedTask(null);
      await onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReviewDecision = async (action: 'request_revision' | 'approve') => {
    if (!selectedTask) return;
    if (action === 'request_revision' && !reviewFeedback.trim() && !reviewVoiceFeedback) {
      showToast('Please provide feedback explaining requested changes or record/attach a voice note.', 'error');
      return;
    }

    setReviewing(true);
    try {
      const res = await adminFetch(`/api/tasks/${selectedTask.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          feedback: reviewFeedback,
          voiceFeedback: reviewVoiceFeedback,
          attachments: reviewAttachments,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to record review');

      showToast(
        action === 'approve'
          ? 'Work approved! Task marked as Completed.'
          : 'Revisions requested with voice note & attachments! Designer notified.'
      );

      setReviewMode('idle');
      setReviewFeedback('');
      setReviewVoiceFeedback(null);
      setReviewAttachments([]);
      setSelectedTask(json.task);
      await onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setReviewing(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showToast('Design copy & text contents copied to clipboard!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Work Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30">
              {totalCount} Total Tasks
            </span>
          </div>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Create internal design tasks, upload briefs with text copy, voice directions & attachments, review submissions, and manage revision history.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,77,0,0.3)] self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upload & Assign Work</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs tracking-wider transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Brief</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'all'
              ? 'bg-[#141414] border-[#FF4D00] shadow-[0_0_15px_rgba(255,77,0,0.2)]'
              : 'bg-[#0d0d0d] border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-xl font-extrabold text-white block">{totalCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold">All Tasks</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('available')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'available'
              ? 'bg-[#141414] border-[#FF4D00] shadow-[0_0_15px_rgba(255,77,0,0.2)]'
              : 'bg-[#0d0d0d] border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-xl font-extrabold text-blue-400 block">{availableCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold">Available</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('in_progress')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'in_progress'
              ? 'bg-[#141414] border-[#FF4D00] shadow-[0_0_15px_rgba(255,77,0,0.2)]'
              : 'bg-[#0d0d0d] border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-xl font-extrabold text-indigo-400 block">{activeCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold">In Progress</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('awaiting_review')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
            statusFilter === 'awaiting_review'
              ? 'bg-[#141414] border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'bg-[#0d0d0d] border-white/10 hover:border-white/20'
          }`}
        >
          {awaitingReviewCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
          <span className="text-xl font-extrabold text-amber-400 block">{awaitingReviewCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold">Review Needed</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('revision_requested')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'revision_requested'
              ? 'bg-[#141414] border-[#FF4D00] shadow-[0_0_15px_rgba(255,77,0,0.2)]'
              : 'bg-[#0d0d0d] border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-xl font-extrabold text-[#FF4D00] block">{revisionsCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold">Revisions</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            statusFilter === 'completed'
              ? 'bg-[#141414] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-[#0d0d0d] border-white/10 hover:border-white/20'
          }`}
        >
          <span className="text-xl font-extrabold text-emerald-400 block">{completedCount}</span>
          <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold">Completed</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0d0d0d] border border-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, client, or designer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-[#A3A3A3] focus:outline-none focus:border-[#FF4D00]"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available (Unclaimed)</option>
            <option value="in_progress">Active / Assigned</option>
            <option value="awaiting_review">Awaiting Review</option>
            <option value="revision_requested">Revision Requested</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-[#A3A3A3] focus:outline-none focus:border-[#FF4D00]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Designer Filter */}
          <select
            value={designerFilter}
            onChange={(e) => setDesignerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-white/10 text-xs text-[#A3A3A3] focus:outline-none focus:border-[#FF4D00]"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Open for Claim</option>
            {designers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {(search || statusFilter !== 'all' || priorityFilter !== 'all' || designerFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setDesignerFilter('all');
              }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#A3A3A3] hover:text-white"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-[#737373] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-white">No Tasks Matching Filters</h3>
          <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">
            {tasks.length === 0
              ? 'No work assignments created yet. Click "Upload & Assign Work" to get started.'
              : 'Try clearing your search query or status filters.'}
          </p>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="px-5 py-2 rounded-full bg-[#FF4D00] text-black font-bold text-xs uppercase"
          >
            Create Task Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isAwaitingReview = task.status === 'submitted' || task.status === 'resubmitted';
            const latestSub = task.submissions?.[0];

            return (
              <div
                key={task.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isAwaitingReview
                    ? 'bg-[#16130d] border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : task.status === 'completed'
                    ? 'bg-[#0a0f0d] border-emerald-500/20'
                    : 'bg-[#101010] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Info */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        task.status === 'available'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : task.status === 'assigned'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : task.status === 'in_progress'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          : task.status === 'submitted' || task.status === 'resubmitted'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : task.status === 'revision_requested'
                          ? 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'urgent'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : task.priority === 'high'
                          ? 'bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30'
                          : task.priority === 'medium'
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {task.priority} Priority
                    </span>

                    {/* Voice Brief indicator */}
                    {task.voiceBrief && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Mic className="w-3 h-3" />
                        <span>Voice Brief</span>
                      </span>
                    )}

                    {/* Version Badge if submissions exist */}
                    {latestSub && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-[#A3A3A3] border border-white/10">
                        {latestSub.versionLabel} ({latestSub.files?.length || 0} Files)
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight hover:text-[#FF4D00] transition-colors cursor-pointer" onClick={() => setSelectedTask(task)}>
                      {task.title}
                    </h3>
                    <p className="text-xs text-[#A3A3A3] mt-0.5">
                      Client: <strong className="text-white">{task.client}</strong> • Deliverables: {task.deliverables}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#737373]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>
                        Assignee:{' '}
                        {task.assignedDesignerName ? (
                          <strong className="text-white">{task.assignedDesignerName}</strong>
                        ) : (
                          <span className="text-blue-400 font-semibold">Open for Claim</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Due: {formatDate(task.deadline)}</span>
                    </div>

                    {task.referenceFiles?.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-[#A3A3A3]">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{task.referenceFiles.length} Reference(s)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isAwaitingReview
                        ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isAwaitingReview ? 'Review Work' : 'Open Details'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(task)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white transition-colors"
                    title="Edit task settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id, task.title)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-[#A3A3A3] hover:text-red-400 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Details & Review Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0c0c0c] border border-white/20 rounded-3xl overflow-hidden flex flex-col my-auto shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
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
                {selectedTask.status === 'completed' && onPublishToPortfolio && (
                  <button
                    type="button"
                    onClick={() => onPublishToPortfolio(selectedTask)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase bg-gradient-to-r from-[#FF4D00] to-[#FF7A00] text-black hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    title="Publish this completed work to the public portfolio"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Publish to Portfolio</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(null);
                    setReviewMode('idle');
                    setReviewFeedback('');
                    setReviewVoiceFeedback(null);
                    setReviewAttachments([]);
                  }}
                  className="p-2 rounded-full bg-white/10 text-[#A3A3A3] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
              {/* Review Action Banner if Awaiting Review */}
              {(selectedTask.status === 'submitted' || selectedTask.status === 'resubmitted') && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Deliverables Awaiting Review</h4>
                        <p className="text-xs text-[#A3A3A3]">
                          {selectedTask.assignedDesignerName} has submitted{' '}
                          {selectedTask.submissions?.[0]?.versionLabel || 'deliverables'}.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewMode(reviewMode === 'request_revision' ? 'idle' : 'request_revision')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          reviewMode === 'request_revision'
                            ? 'bg-[#FF4D00] text-black'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewDecision('approve')}
                        disabled={reviewing}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Deliverables</span>
                      </button>
                    </div>
                  </div>

                  {/* Request Revision Form Drawer (Directly from User Screenshot) */}
                  {reviewMode === 'request_revision' && (
                    <div className="p-5 rounded-2xl bg-black/80 border border-[#FF4D00]/40 space-y-4 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs uppercase font-bold text-[#FF4D00]">
                          Revision Feedback & Requested Changes *
                        </label>
                        <p className="text-[11px] text-[#A3A3A3] mt-0.5">
                          Provide written notes, or record/upload an audio message, and attach reference files below.
                        </p>
                      </div>

                      <textarea
                        rows={4}
                        placeholder="Detail specific feedback, typography adjustments, spacing changes, or file exports needed from the designer..."
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
                      />

                      {/* Audio Uploading & Voice Messaging Option */}
                      <div className="p-4 rounded-xl bg-[#101010] border border-white/10 space-y-2">
                        <AudioVoiceControl
                          currentAudio={reviewVoiceFeedback}
                          onAudioChange={setReviewVoiceFeedback}
                          label="Voice Message / Audio Revision Directions"
                          description="Record verbal revision feedback directly using your microphone or upload an audio note"
                        />
                      </div>

                      {/* Attaching Reference Models, PDF & PNG Documents */}
                      <div className="p-4 rounded-xl bg-[#101010] border border-white/10 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <label className="block text-xs uppercase font-bold text-white flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                              <span>Attach Reference Models, PDF & PNG Documents</span>
                            </label>
                            <p className="text-[10px] text-[#737373]">
                              Attach 3D reference models (OBJ, FBX, GLB), PDF briefs/markups, or PNG/image screenshots
                            </p>
                          </div>

                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF4D00] text-xs font-semibold cursor-pointer text-white hover:text-black transition-colors self-start sm:self-auto">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingReviewRef ? 'Uploading...' : 'Upload References'}</span>
                            <input
                              type="file"
                              multiple
                              accept=".obj,.fbx,.glb,.gltf,.blend,.c4d,.3ds,.stl,.pdf,.png,.jpg,.jpeg,.webp,.svg,.psd,.ai,.zip,.rar"
                              className="hidden"
                              onChange={(e) => handleUploadReviewAttachments(e.target.files)}
                            />
                          </label>
                        </div>

                        {/* Format badges */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#A3A3A3]">
                          <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                            🧊 3D Models (.obj, .fbx, .glb)
                          </span>
                          <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-500/30">
                            📄 PDF Documents (.pdf)
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                            🖼️ PNG & Images (.png, .webp)
                          </span>
                        </div>

                        {reviewAttachments.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {reviewAttachments.map((file, idx) => (
                                <FileAttachmentCard
                                  key={file.id || idx}
                                  file={file}
                                  onRemove={() =>
                                    setReviewAttachments((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewMode('idle');
                            setReviewFeedback('');
                            setReviewVoiceFeedback(null);
                            setReviewAttachments([]);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewDecision('request_revision')}
                          disabled={reviewing || uploadingReviewRef || (!reviewFeedback.trim() && !reviewVoiceFeedback)}
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF4D00] text-black hover:bg-[#FF7A00] disabled:opacity-50 flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,77,0,0.3)] transition-all"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{reviewing ? 'Submitting...' : 'Send Revision Request'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Creative Brief & Deliverables Specs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
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

                  {/* Text Contents & Design Copy */}
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

                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-[#FF4D00]">
                      Creative Brief & Instructions
                    </h4>
                    <p className="text-xs sm:text-sm text-[#E5E5E5] leading-relaxed whitespace-pre-line bg-[#141414] p-4 rounded-2xl border border-white/5">
                      {selectedTask.brief}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-[#141414] border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-bold block">
                        Deliverables Required
                      </span>
                      <p className="text-xs text-white mt-1 font-medium">{selectedTask.deliverables}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#141414] border border-white/5">
                      <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-bold block">
                        Formats & Dimensions
                      </span>
                      <p className="text-xs text-white mt-1 font-medium">
                        {selectedTask.dimensions ? `${selectedTask.dimensions} • ` : ''}
                        {selectedTask.fileFormats || 'Standard'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Designer Info & Reference Attachments */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#141414] border border-white/5 space-y-2.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-bold block">
                      Assigned Designer
                    </span>
                    {selectedTask.assignedDesignerName ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#FF4D00]/10 border border-[#FF4D00]/50 flex items-center justify-center text-xs font-bold text-[#FF4D00]">
                          {selectedTask.assignedDesignerName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{selectedTask.assignedDesignerName}</p>
                          <p className="text-[10px] text-[#A3A3A3]">
                            Assigned on {formatDate(selectedTask.assignedAt || selectedTask.createdAt)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-blue-400 font-medium">
                        Open on Available Works list for eligible designers.
                      </p>
                    )}
                  </div>

                  {/* Reference Files */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-bold block">
                      Reference Attachments ({selectedTask.referenceFiles?.length || 0})
                    </span>
                    {selectedTask.referenceFiles?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTask.referenceFiles.map((file) => (
                          <FileAttachmentCard key={file.id || file.url} file={file} readOnly={true} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#737373] italic">No reference files attached.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Revision History Section */}
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

      {/* Create / Edit Task Modal ("Upload & Assign Work") */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 my-auto shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00]">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingTask ? 'Edit Work Assignment' : 'Upload & Assign Work to Designers'}
                  </h3>
                  <p className="text-[11px] text-[#A3A3A3]">
                    Configure brief instructions, text copy, voice guidance, reference models, and file attachments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Work Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nocturne Gin Minimalist Label System"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Client / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nocturne Distillers Co."
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Creative Brief */}
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Detailed Creative Brief & Instructions *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain goals, visual direction, mood, color palette, reference links, and must-haves..."
                  value={formData.brief}
                  onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              {/* Text Contents & Design Copy Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Text Contents & Design Copy (Headlines, Body Text, Taglines, Specs)</span>
                  </label>
                  <span className="text-[10px] text-[#737373]">Optional Copy for Artwork</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Paste exact headlines, body text, ingredients, taglines, legal text, or bullet points the designer must place on the design..."
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              {/* Voice Brief / Audio Instructions */}
              <div className="p-4 rounded-2xl bg-[#141414] border border-white/10 space-y-2">
                <AudioVoiceControl
                  currentAudio={formData.voiceBrief}
                  onAudioChange={(audio) => setFormData({ ...formData, voiceBrief: audio })}
                  label="Voice Brief / Audio Instructions (Optional)"
                  description="Record a voice note directly using your microphone or upload an audio file (MP3, WAV, WebM) with verbal direction"
                />
              </div>

              {/* Deliverables Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Deliverables
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Label concepts + 3D Mockups"
                    value={formData.deliverables}
                    onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1920x1080 (16:9), 90x140mm"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    File Formats
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI, PSD, PDF, PNG"
                    value={formData.fileFormats}
                    onChange={(e) => setFormData({ ...formData, fileFormats: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Priority, Deadline, Assign Designer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Assign Designer
                  </label>
                  <select
                    value={formData.assignedDesignerId}
                    onChange={(e) => setFormData({ ...formData, assignedDesignerId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="">Available for any designer to claim</option>
                    {designers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference Files Section (Models, PDFs, PNGs, etc.) */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#141414] border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs uppercase font-semibold text-white flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Reference Files & Attachments ({formData.referenceFiles.length})</span>
                    </label>
                    <p className="text-[11px] text-[#737373] mt-0.5">
                      Attach 3D reference models (OBJ, FBX, GLB), PDF documents, PNG graphics, or source files
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#FF4D00] text-xs font-semibold cursor-pointer text-white hover:text-black transition-colors self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingRef ? 'Uploading...' : 'Attach Reference Files'}</span>
                    <input
                      type="file"
                      multiple
                      accept=".obj,.fbx,.glb,.gltf,.blend,.c4d,.3ds,.stl,.pdf,.png,.jpg,.jpeg,.webp,.svg,.psd,.ai,.zip,.rar"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#A3A3A3]">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                    🧊 3D Models (OBJ, FBX, GLB)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-500/30">
                    📄 PDF Documents
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                    🖼️ PNG & Images
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30">
                    📦 PSD, AI & Source Files
                  </span>
                </div>

                {formData.referenceFiles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {formData.referenceFiles.map((file, idx) => (
                      <FileAttachmentCard
                        key={file.id || idx}
                        file={file}
                        onRemove={() =>
                          setFormData((prev) => ({
                            ...prev,
                            referenceFiles: prev.referenceFiles.filter((_, i) => i !== idx),
                          }))
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#737373]">
                    No reference files attached yet. (Max 100MB per file).
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask || uploadingRef}
                  className="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_15px_rgba(255,77,0,0.4)] disabled:opacity-50"
                >
                  {savingTask ? 'Saving Task...' : editingTask ? 'Save Changes' : 'Create & Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
