'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Designer, Task, TaskAttachment } from '@/types';
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

export default function DesignerDashboard({
  designer,
  initialTasks,
  onLogout,
  showToast,
  onRefreshTasks,
}: DesignerDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<'available' | 'my_works' | 'submitted' | 'revisions' | 'completed'>('available');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showToast('Design copy & text contents copied to clipboard!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Categorize tasks for tabs
  const availableTasks = tasks.filter((t) => t.status === 'available');
  const myActiveTasks = tasks.filter((t) => (t.status === 'assigned' || t.status === 'in_progress') && t.assignedDesignerId === designer.id);
  const submittedTasks = tasks.filter((t) => (t.status === 'submitted' || t.status === 'resubmitted') && t.assignedDesignerId === designer.id);
  const revisionTasks = tasks.filter((t) => t.status === 'revision_requested' && t.assignedDesignerId === designer.id);
  const completedTasks = tasks.filter((t) => t.status === 'completed' && t.assignedDesignerId === designer.id);

  // Keep tasks synced if initialTasks prop changes
  React.useEffect(() => {
    setTasks(initialTasks);
    if (selectedTask) {
      const updated = initialTasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [initialTasks]);

  const handleTakeWork = async (task: Task) => {
    setClaimingTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}/claim`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim task');
      }

      showToast(`Work claimed! "${task.title}" has been moved to your active tasks.`);
      await onRefreshTasks();
      setActiveTab('my_works');
    } catch (err: any) {
      showToast(err.message, 'error');
      await onRefreshTasks();
    } finally {
      setClaimingTaskId(null);
    }
  };

  const handleStartWork = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/start`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to update status');

      showToast(`Work started on "${task.title}".`);
      await onRefreshTasks();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUploadDeliverables = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    try {
      const newUploads: TaskAttachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = new FormData();
        data.append('file', file);

        const res = await fetch('/api/tasks/upload', {
          method: 'POST',
          body: data,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Failed to upload ${file.name}`);
        newUploads.push(json);
      }

      setUploadedFiles((prev) => [...prev, ...newUploads]);
      showToast(`${newUploads.length} deliverable file(s) uploaded successfully!`);
    } catch (err: any) {
      showToast(err.message, 'error');
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
      const res = await fetch(`/api/tasks/${selectedTask.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: submissionNotes,
          files: uploadedFiles,
          designerVoiceNote: submissionVoiceNote,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit deliverables');

      showToast(json.message || 'Deliverables submitted for review!');
      setSubmitModalOpen(false);
      await onRefreshTasks();
      setActiveTab('submitted');
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
              Designer Studio
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
              <span className="text-xs font-bold text-white block leading-tight">{designer.name}</span>
              <span className="text-[9px] text-[#A3A3A3] block uppercase tracking-wider">{designer.specialty}</span>
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
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-[#FF4D00]">{designer.name}</span>
            </h1>
            <p className="text-xs text-[#A3A3A3] max-w-xl">
              Claim available design briefs, submit work packages, read client feedback, and track all version iterations in real-time.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshTasks}
            className="self-start sm:self-center px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 transition-colors relative z-10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Workspace</span>
          </button>
        </div>

        {/* Tab Navigation Bars */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'available'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <span>Available Works</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'available' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'}`}>
              {availableTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_works')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'my_works'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <span>My Active Works</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'my_works' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'}`}>
              {myActiveTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revisions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'revisions'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <span>Revisions Requested</span>
            {revisionTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-black animate-pulse">
                {revisionTasks.length} Action Needed
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submitted')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'submitted'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <span>Submitted (Awaiting Review)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'submitted' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'}`}>
              {submittedTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'completed'
                ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                : 'bg-[#141414] hover:bg-white/10 text-[#A3A3A3] hover:text-white'
            }`}
          >
            <span>Completed Works</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'completed' ? 'bg-black text-[#FF4D00]' : 'bg-black text-white'}`}>
              {completedTasks.length}
            </span>
          </button>
        </div>

        {/* Tab Content Cards */}
        {(() => {
          let currentList: Task[] = [];
          let emptyMessage = '';

          if (activeTab === 'available') {
            currentList = availableTasks;
            emptyMessage = 'No new briefs available right now. Check back soon for new client assignments!';
          } else if (activeTab === 'my_works') {
            currentList = myActiveTasks;
            emptyMessage = 'You currently have no active assignments. Browse "Available Works" to claim a new design brief.';
          } else if (activeTab === 'revisions') {
            currentList = revisionTasks;
            emptyMessage = 'No revisions requested. Great job on your submissions!';
          } else if (activeTab === 'submitted') {
            currentList = submittedTasks;
            emptyMessage = 'No submissions awaiting review.';
          } else {
            currentList = completedTasks;
            emptyMessage = 'No completed works yet.';
          }

          if (currentList.length === 0) {
            return (
              <div className="p-16 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center space-y-3">
                <Briefcase className="w-10 h-10 text-[#737373] mx-auto opacity-50" />
                <p className="text-sm font-bold text-white">No tasks in this section</p>
                <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">{emptyMessage}</p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {currentList.map((task) => {
                const isClaiming = claimingTaskId === task.id;
                const hasSubmissions = (task.submissions || []).length > 0;
                const latestSub = hasSubmissions
                  ? task.submissions.reduce((prev, curr) => (curr.version > prev.version ? curr : prev))
                  : null;

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
                        <div className="flex items-center gap-2">
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

                          <span className="text-[11px] text-[#A3A3A3] flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#FF4D00]" />
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
                        </p>
                      </div>

                      {/* Brief Excerpt */}
                      <p className="text-xs text-[#B3B3B3] line-clamp-3 leading-relaxed">
                        {task.brief}
                      </p>

                      {/* Deliverables snippet */}
                      <div className="p-2.5 rounded-xl bg-black border border-white/5 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">
                          Deliverables & Formats
                        </span>
                        <p className="text-xs text-white truncate">{task.deliverables}</p>
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

                      {activeTab === 'available' ? (
                        <button
                          type="button"
                          onClick={() => handleTakeWork(task)}
                          disabled={isClaiming}
                          className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF4D00] hover:bg-[#FF7A00] text-black transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{isClaiming ? 'Claiming...' : 'Take Work'}</span>
                        </button>
                      ) : activeTab === 'revisions' ? (
                        <button
                          type="button"
                          onClick={() => openSubmissionModal(task)}
                          className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF4D00] hover:bg-[#FF7A00] text-black transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Revision</span>
                        </button>
                      ) : activeTab === 'my_works' ? (
                        <div className="flex items-center gap-2">
                          {task.status === 'assigned' && (
                            <button
                              type="button"
                              onClick={() => handleStartWork(task)}
                              className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                              Start Working
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openSubmissionModal(task)}
                            className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF4D00] hover:bg-[#FF7A00] text-black transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)] flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Work</span>
                          </button>
                        </div>
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
          );
        })()}
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
                ) : (selectedTask.status === 'in_progress' || selectedTask.status === 'assigned' || selectedTask.status === 'revision_requested') ? (
                  <button
                    type="button"
                    onClick={() => {
                      openSubmissionModal(selectedTask);
                    }}
                    className="px-5 py-2 rounded-full text-xs font-bold uppercase bg-[#FF4D00] text-black hover:bg-[#FF7A00] transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{selectedTask.status === 'revision_requested' ? 'Submit Revision' : 'Submit Deliverables'}</span>
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
                  {selectedTask.submissions?.[0]?.adminFeedbackAttachments && selectedTask.submissions[0].adminFeedbackAttachments.length > 0 && (
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
                    Required Deliverables
                  </span>
                  <p className="text-xs text-white font-medium">{selectedTask.deliverables}</p>
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
                    {selectedTask.status === 'revision_requested' ? 'Submit Revised Deliverables' : 'Submit Work Package'}
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
                <label className="border-2 border-dashed border-white/20 hover:border-[#FF4D00] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#0a0a0a]">
                  <Upload className="w-8 h-8 text-[#FF4D00] mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-white">
                    Click to select files or drag & drop here
                  </p>
                  <p className="text-[11px] text-[#737373] mt-1">
                    Supports PNG, JPG, PDF, PSD, AI, EPS, INDD, ZIP, RAR, MP4, and all project source files.
                  </p>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUploadDeliverables(e.target.files)}
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
