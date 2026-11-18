'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { Inquiry, InquiryStatus } from '@/types';
import { formatDate, formatDateTime } from '@/lib/dateUtils';
import { adminFetch } from '@/lib/adminApi';

interface AdminInquiriesProps {
  inquiries: Inquiry[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  selectedInquiry?: Inquiry | null;
  onClearSelectedInquiry?: () => void;
}

export default function AdminInquiries({
  inquiries,
  onRefresh,
  showToast,
  selectedInquiry: initialSelected,
  onClearSelectedInquiry,
}: AdminInquiriesProps) {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [activeModalInquiry, setActiveModalInquiry] = useState<Inquiry | null>(initialSelected || null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notesState, setNotesState] = useState<Record<string, string>>({});

  // Sync external selected inquiry if changed
  React.useEffect(() => {
    if (initialSelected) {
      setActiveModalInquiry(initialSelected);
    }
  }, [initialSelected]);

  const handleSaveNotes = async (inquiryId: string, notes: string) => {
    try {
      const res = await adminFetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) throw new Error('Failed to save notes');

      showToast('Internal notes saved');
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  const handleStatusChange = async (inquiryId: string, newStatus: InquiryStatus) => {
    try {
      const res = await adminFetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      showToast(`Inquiry marked as ${newStatus}`);
      await onRefresh();

      if (activeModalInquiry && activeModalInquiry.id === inquiryId) {
        setActiveModalInquiry({ ...activeModalInquiry, status: newStatus });
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (inquiryId: string) => {
    try {
      const res = await adminFetch(`/api/inquiries/${inquiryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete inquiry');

      showToast('Inquiry deleted successfully');
      setDeleteConfirmId(null);
      if (activeModalInquiry?.id === inquiryId) {
        setActiveModalInquiry(null);
      }
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      inq.name.toLowerCase().includes(search.toLowerCase()) ||
      inq.email.toLowerCase().includes(search.toLowerCase()) ||
      (inq.company && inq.company.toLowerCase().includes(search.toLowerCase())) ||
      inq.service.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'All' || inq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<InquiryStatus, string> = {
    New: 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/40',
    Contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Client Inquiries & Briefs
          </h2>
          <p className="text-xs text-[#A3A3A3]">
            Incoming leads submitted through the public &ldquo;Let&apos;s Build Something Remarkable&rdquo; form.
          </p>
        </div>

        <div className="text-xs text-[#737373]">
          Total Leads: <strong className="text-white">{inquiries.length}</strong> (
          <span className="text-[#FF4D00]">
            {inquiries.filter((i) => i.status === 'New').length} New
          </span>
          )
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#141414] border border-white/10">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inquiries by client name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['All', 'New', 'Contacted', 'Completed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === st
                  ? 'bg-[#FF4D00] text-black font-semibold'
                  : 'bg-[#0a0a0a] text-[#A3A3A3] hover:text-white border border-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries Table */}
      {filteredInquiries.length === 0 ? (
        <div className="luxury-card rounded-3xl p-12 text-center border border-white/10 space-y-3">
          <Mail className="w-10 h-10 text-[#737373] mx-auto" />
          <h3 className="text-base font-bold text-white">No inquiries found</h3>
          <p className="text-xs text-[#A3A3A3]">
            {search ? 'Try clearing your search query.' : 'Inquiries submitted on the website will be logged here.'}
          </p>
        </div>
      ) : (
        <div className="luxury-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A3A3A3]">
              <thead className="bg-[#0d0d0d] text-[11px] uppercase tracking-wider text-white border-b border-white/10">
                <tr>
                  <th className="py-4 px-5">Client Name</th>
                  <th className="py-4 px-4">Service Required</th>
                  <th className="py-4 px-4">Contact</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    onClick={() => setActiveModalInquiry(inq)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="font-bold text-white text-sm">
                        {inq.name}
                      </div>
                      {inq.company && (
                        <div className="text-[11px] text-[#737373]">
                          {inq.company}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1a1a1a] text-white border border-white/10">
                        {inq.service}
                      </span>
                    </td>

                    <td className="py-4 px-4 space-y-0.5">
                      <div className="text-white">{inq.email}</div>
                      <div className="text-[#737373] text-[11px]">{inq.phone}</div>
                    </td>

                    <td className="py-4 px-4 text-[#737373]">
                      {formatDate(inq.createdAt)}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          statusColors[inq.status] || statusColors.New
                        }`}
                      >
                        {inq.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={inq.status}
                          onChange={(e) => handleStatusChange(inq.id, e.target.value as InquiryStatus)}
                          className="px-2 py-1 rounded bg-[#0a0a0a] border border-white/10 text-[11px] text-white focus:outline-none"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Completed">Completed</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(inq.id)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400"
                          title="Delete inquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {activeModalInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-[#141414] border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#FF4D00]" />
                <h3 className="text-base font-bold text-white">
                  Client Brief: {activeModalInquiry.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveModalInquiry(null);
                  if (onClearSelectedInquiry) onClearSelectedInquiry();
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Status and Timestamp Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141414] border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase text-[#737373] font-semibold">Status:</span>
                  <select
                    value={activeModalInquiry.status}
                    onChange={(e) => handleStatusChange(activeModalInquiry.id, e.target.value as InquiryStatus)}
                    className="px-2.5 py-1 rounded bg-[#0a0a0a] border border-white/10 text-xs text-white"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <span className="text-xs text-[#737373]">
                  Received: {formatDateTime(activeModalInquiry.createdAt)}
                </span>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">
                    Full Name
                  </span>
                  <p className="text-sm font-bold text-white">{activeModalInquiry.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">
                    Company
                  </span>
                  <p className="text-sm font-bold text-white">
                    {activeModalInquiry.company || 'Not specified'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${activeModalInquiry.email}`}
                    className="text-xs text-[#FF4D00] hover:underline block truncate"
                  >
                    {activeModalInquiry.email}
                  </a>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">
                    Phone / WhatsApp
                  </span>
                  <a
                    href={`https://wa.me/${activeModalInquiry.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#FF4D00] hover:underline block"
                  >
                    {activeModalInquiry.phone}
                  </a>
                </div>
              </div>

              {/* Service Required */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">
                  Required Service
                </span>
                <p className="text-sm font-semibold text-white bg-[#141414] p-3 rounded-xl border border-white/5">
                  {activeModalInquiry.service}
                </p>
              </div>

              {/* Project Description */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#737373] font-semibold">
                  Project Description / Message
                </span>
                <div className="p-4 rounded-xl bg-[#141414] border border-white/10 text-xs text-[#F5F5F5] leading-relaxed whitespace-pre-wrap">
                  {activeModalInquiry.description}
                </div>
              </div>

              {/* Internal Studio Notes */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-[#141414] border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[#FF4D00] font-semibold">
                    Internal Studio Notes (Private)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveNotes(
                        activeModalInquiry.id,
                        notesState[activeModalInquiry.id] ?? activeModalInquiry.notes ?? ''
                      )
                    }
                    className="px-2.5 py-0.5 rounded bg-[#FF4D00]/20 hover:bg-[#FF4D00] text-black hover:text-black font-semibold text-[10px] text-[#FF4D00] transition-colors"
                  >
                    Save Notes
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={notesState[activeModalInquiry.id] ?? activeModalInquiry.notes ?? ''}
                  onChange={(e) =>
                    setNotesState({
                      ...notesState,
                      [activeModalInquiry.id]: e.target.value,
                    })
                  }
                  placeholder="Record call notes, estimated scope, or follow-up milestones..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00]"
                />
              </div>

              {/* Direct Actions */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${activeModalInquiry.email}?subject=Regarding Your Inquiry with SKT Branding`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Send Email</span>
                  </a>

                  <a
                    href={`https://wa.me/${activeModalInquiry.phone.replace(/[^0-9]/g, '')}?text=Hello ${encodeURIComponent(activeModalInquiry.name)}, this is SKT Branding regarding your project inquiry.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(activeModalInquiry.id)}
                  className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs transition-colors"
                >
                  Delete Lead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-red-500/30 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete this inquiry?</h3>
            <p className="text-xs text-[#A3A3A3]">
              This inquiry record will be permanently deleted.
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
    </div>
  );
}
