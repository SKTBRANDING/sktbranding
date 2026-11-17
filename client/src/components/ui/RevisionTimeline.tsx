'use client';

import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Calendar,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { TaskSubmission } from '@/types';
import { formatDateTime } from '@/lib/dateUtils';
import FileAttachmentCard from './FileAttachmentCard';
import { AudioPlayer } from './AudioVoiceControl';

interface RevisionTimelineProps {
  submissions: TaskSubmission[];
  currentStatus: string;
}

export default function RevisionTimeline({ submissions, currentStatus }: RevisionTimelineProps) {
  // Store expanded versions in state; default all expanded
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});

  const toggleExpand = (subId: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [subId]: prev[subId] === false ? true : false,
    }));
  };

  if (!submissions || submissions.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 text-center space-y-2">
        <History className="w-8 h-8 text-[#737373] mx-auto opacity-60" />
        <p className="text-xs font-semibold text-white">No Submissions Recorded Yet</p>
        <p className="text-[11px] text-[#A3A3A3] max-w-sm mx-auto">
          When work or revisions are submitted, a complete chronological timeline of deliverables, files, and review decisions will appear here.
        </p>
      </div>
    );
  }

  // Sort newest first
  const sortedSubmissions = [...submissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#FF4D00]" />
          <h4 className="text-xs uppercase font-bold tracking-wider text-white">
            Revision & Submission History ({sortedSubmissions.length} Version{sortedSubmissions.length > 1 ? 's' : ''})
          </h4>
        </div>
        <span className="text-[11px] text-[#A3A3A3]">Newest Activity First</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
        {sortedSubmissions.map((sub, idx) => {
          const isLatest = idx === 0;
          const isApproved = sub.reviewStatus === 'approved';
          const isChangesRequested = sub.reviewStatus === 'revision_requested';
          const isPending = sub.reviewStatus === 'pending';

          const isExpanded = expandedVersions[sub.id] !== false;

          const formattedSubmitDate = formatDateTime(sub.submittedAt);
          const formattedReviewDate = sub.reviewedAt ? formatDateTime(sub.reviewedAt) : null;

          return (
            <div key={sub.id} className="relative">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-6 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isApproved
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : isChangesRequested
                    ? 'bg-amber-950 border-[#FF4D00] text-[#FF4D00] shadow-[0_0_12px_rgba(255,77,0,0.4)]'
                    : 'bg-zinc-900 border-white/30 text-white'
                }`}
              >
                {isApproved && <CheckCircle2 className="w-3 h-3" />}
                {isChangesRequested && <AlertTriangle className="w-3 h-3" />}
                {isPending && <Clock className="w-2.5 h-2.5" />}
              </div>

              {/* Version Box */}
              <div
                className={`rounded-2xl border transition-all ${
                  isApproved
                    ? 'bg-emerald-950/15 border-emerald-500/30'
                    : isLatest
                    ? 'bg-[#141414] border-[#FF4D00]/40 shadow-[0_0_20px_rgba(255,77,0,0.1)]'
                    : 'bg-[#101010] border-white/10'
                }`}
              >
                {/* Header (Always Visible, Click to Toggle) */}
                <div
                  onClick={() => toggleExpand(sub.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {sub.versionLabel || `Version ${sub.version}`}
                    </span>

                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4D00] text-black tracking-wider uppercase">
                        Latest
                      </span>
                    )}

                    {isApproved && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved Version
                      </span>
                    )}

                    {isChangesRequested && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Changes Requested
                      </span>
                    )}

                    {isPending && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Awaiting Admin Review
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#A3A3A3]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>{formattedSubmitDate}</span>
                    </div>
                    <button
                      type="button"
                      className="p-1 rounded-lg hover:bg-white/10 text-white"
                      aria-label="Toggle version details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Body */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 space-y-4 border-t border-white/[0.06]">
                    {/* Submitter & Notes */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                        <User className="w-3.5 h-3.5 text-[#FF4D00]" />
                        <span>Submitted by <strong className="text-white">{sub.designerName}</strong></span>
                      </div>

                      {sub.notes ? (
                        <p className="text-xs text-[#E5E5E5] bg-[#0a0a0a] p-3 rounded-xl border border-white/5 leading-relaxed whitespace-pre-line">
                          {sub.notes}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#737373] italic">No submission notes provided.</p>
                      )}

                      {/* Designer Voice Note if provided */}
                      {sub.designerVoiceNote && (
                        <div className="pt-1">
                          <AudioPlayer
                            src={sub.designerVoiceNote.url}
                            title={`${sub.designerName}'s Voice Walkthrough`}
                            duration={sub.designerVoiceNote.duration}
                            compact={true}
                          />
                        </div>
                      )}
                    </div>

                    {/* Files Uploaded with this version */}
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider font-bold text-[#A3A3A3]">
                        Delivered Files ({sub.files?.length || 0})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(sub.files || []).map((file) => (
                          <FileAttachmentCard key={file.id || file.url} file={file} readOnly={true} />
                        ))}
                      </div>
                    </div>

                    {/* Admin Review Feedback & Decision Box */}
                    {(sub.adminFeedback || sub.adminVoiceFeedback || (sub.adminFeedbackAttachments && sub.adminFeedbackAttachments.length > 0)) ? (
                      <div
                        className={`p-4 rounded-xl border space-y-3 ${
                          isApproved
                            ? 'bg-emerald-950/30 border-emerald-500/40'
                            : 'bg-[#FF4D00]/10 border-[#FF4D00]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className={`w-3.5 h-3.5 ${isApproved ? 'text-emerald-400' : 'text-[#FF4D00]'}`} />
                            <span className="text-xs font-bold text-white">
                              Admin Review Feedback
                            </span>
                          </div>
                          {formattedReviewDate && (
                            <span className="text-[10px] text-[#A3A3A3]">{formattedReviewDate}</span>
                          )}
                        </div>

                        {sub.adminFeedback && (
                          <p className="text-xs text-[#F5F5F5] leading-relaxed whitespace-pre-line">
                            {sub.adminFeedback}
                          </p>
                        )}

                        {/* Admin Voice Feedback */}
                        {sub.adminVoiceFeedback && (
                          <div className="pt-1">
                            <AudioPlayer
                              src={sub.adminVoiceFeedback.url}
                              title="Admin Voice Feedback & Instructions"
                              duration={sub.adminVoiceFeedback.duration}
                              compact={true}
                            />
                          </div>
                        )}

                        {/* Admin Feedback Attachments (Models, PDFs, PNGs) */}
                        {sub.adminFeedbackAttachments && sub.adminFeedbackAttachments.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            <p className="text-[11px] uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
                              <span>Revision References ({sub.adminFeedbackAttachments.length})</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sub.adminFeedbackAttachments.map((file) => (
                                <FileAttachmentCard key={file.id || file.url} file={file} readOnly={true} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : isPending ? (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-200">
                        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>This version is currently awaiting review by the administrator.</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
