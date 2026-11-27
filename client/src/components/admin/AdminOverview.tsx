'use client';

import React from 'react';
import {
  FolderKanban,
  Wrench,
  Mail,
  Bell,
  ArrowUpRight,
  Plus,
  ExternalLink,
  Database,
  CheckCircle2,
  Clock,
  Sparkles,
  Briefcase,
  Users,
  Upload,
  Receipt,
  Building,
} from 'lucide-react';
import { DatabaseSchema, Inquiry } from '@/types';
import { formatDate } from '@/lib/dateUtils';

interface AdminOverviewProps {
  data: DatabaseSchema;
  onNavigateTab: (tabId: string) => void;
  onOpenProjectModal: () => void;
  onOpenServiceModal: () => void;
  onOpenTestimonialModal: () => void;
  onSelectInquiry: (inquiry: Inquiry) => void;
  onOpenTaskModal?: () => void;
  onOpenClientModal?: () => void;
}

export default function AdminOverview({
  data,
  onNavigateTab,
  onOpenProjectModal,
  onOpenServiceModal,
  onOpenTestimonialModal,
  onSelectInquiry,
  onOpenTaskModal,
  onOpenClientModal,
}: AdminOverviewProps) {
  const projects = Array.isArray(data?.projects) ? data.projects : [];
  const services = Array.isArray(data?.services) ? data.services : [];
  const inquiries = Array.isArray(data?.inquiries) ? data.inquiries : [];
  const testimonials = Array.isArray(data?.testimonials) ? data.testimonials : [];
  const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
  const designers = Array.isArray(data?.designers) ? data.designers : [];
  const invoices = Array.isArray(data?.invoices) ? data.invoices : [];

  const publishedProjectsCount = projects.filter((p) => p && p.published).length;
  const publishedServicesCount = services.filter((s) => s && s.published).length;
  const newInquiries = inquiries.filter((i) => i && i.status === 'New');
  const recentInquiries = [...inquiries].slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div 
          aria-hidden="true"
          className="absolute -right-20 -top-20 w-80 h-80 bg-[#FF4D00]/15 rounded-full blur-[100px] pointer-events-none" 
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D00]/15 border border-[#FF4D00]/30 text-xs font-semibold text-[#FF4D00]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Agency Control Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back to <span className="text-[#FF4D00]">SKT Branding</span> Admin
            </h1>
            <p className="text-sm text-[#A3A3A3] max-w-xl">
              Upload work packages, assign to creative designers, review PDF/PNG deliverables, and manage all public portfolio cases.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenTaskModal && (
              <button
                type="button"
                onClick={onOpenTaskModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF4D00] hover:bg-[#FF7A00] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,77,0,0.3)]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload & Assign Work</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('billing')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1c1c1c] hover:bg-white/10 border border-[#FF4D00]/40 text-xs font-semibold uppercase tracking-wider text-white transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Client Billing</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1c1c1c] hover:bg-white/10 border border-white/10 text-xs font-semibold uppercase tracking-wider text-white transition-colors"
            >
              <span>Live Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#FF4D00]" />
            </a>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Client Billing KPI */}
        <div
          onClick={() => onNavigateTab('billing')}
          className="luxury-card rounded-2xl p-6 border border-white/10 hover:border-[#FF4D00]/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
              Client Billing
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-[#FF4D00] group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white tracking-tight">
              ₹{invoices.reduce((acc, inv) => acc + Number(inv?.total || 0), 0).toLocaleString()}
            </span>
            <span className="text-xs text-amber-400">
              ₹{invoices.reduce((acc, inv) => acc + Number(inv?.balanceDue || 0), 0).toLocaleString()} due
            </span>
          </div>
          <span className="inline-block mt-3 text-xs text-[#FF4D00] group-hover:underline">
            {invoices.length} invoices • Manage billing →
          </span>
        </div>

        {/* Work Tasks KPI */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="luxury-card rounded-2xl p-6 border border-white/10 hover:border-[#FF4D00]/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          {(tasks.filter((t) => t && (t.status === 'submitted' || t.status === 'resubmitted')).length > 0) && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF4D00]/20 rounded-bl-full pointer-events-none" />
          )}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
              Work Management
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-[#FF4D00] group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {tasks.length}
            </span>
            <span className="text-xs text-[#FF4D00]">
              {tasks.filter((t) => t && (t.status === 'submitted' || t.status === 'resubmitted')).length} awaiting review
            </span>
          </div>
          <span className="inline-block mt-3 text-xs text-[#FF4D00] group-hover:underline">
            Manage tasks & submissions →
          </span>
        </div>

        {/* Designers KPI */}
        <div
          onClick={() => onNavigateTab('designers')}
          className="luxury-card rounded-2xl p-6 border border-white/10 hover:border-[#FF4D00]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
              Active Designers
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-[#FF4D00] group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {designers.filter((d) => d && d.status === 'active').length}
            </span>
            <span className="text-xs text-[#737373]">
              of {designers.length} registered
            </span>
          </div>
          <span className="inline-block mt-3 text-xs text-[#FF4D00] group-hover:underline">
            Manage designer access →
          </span>
        </div>

        {/* Projects KPI */}
        <div
          onClick={() => onNavigateTab('projects')}
          className="luxury-card rounded-2xl p-6 border border-white/10 hover:border-[#FF4D00]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
              Published Projects
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-[#FF4D00] group-hover:scale-110 transition-transform">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {publishedProjectsCount}
            </span>
            <span className="text-xs text-[#737373]">
              of {projects.length} total
            </span>
          </div>
          <span className="inline-block mt-3 text-xs text-[#FF4D00] group-hover:underline">
            Manage projects →
          </span>
        </div>

        {/* Services KPI */}
        <div
          onClick={() => onNavigateTab('services')}
          className="luxury-card rounded-2xl p-6 border border-white/10 hover:border-[#FF4D00]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
              Active Services
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-[#FF4D00] group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {publishedServicesCount}
            </span>
            <span className="text-xs text-[#737373]">
              visible on website
            </span>
          </div>
          <span className="inline-block mt-3 text-xs text-[#FF4D00] group-hover:underline">
            Manage services →
          </span>
        </div>

        {/* New Inquiries KPI */}
        <div
          onClick={() => onNavigateTab('inquiries')}
          className="luxury-card rounded-2xl p-6 border border-white/10 hover:border-[#FF4D00]/50 transition-all cursor-pointer group relative overflow-hidden"
        >
          {newInquiries.length > 0 && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF4D00]/20 rounded-bl-full pointer-events-none" />
          )}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
              New Inquiries
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-[#FF4D00]/30 flex items-center justify-center text-[#FF4D00] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,77,0,0.3)]">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#FF4D00] tracking-tight">
              {newInquiries.length}
            </span>
            <span className="text-xs text-[#A3A3A3]">
              awaiting review
            </span>
          </div>
          <span className="inline-block mt-3 text-xs text-[#FF4D00] group-hover:underline">
            Review inquiries →
          </span>
        </div>

        {/* Total Inquiries KPI */}
        <div
          onClick={() => onNavigateTab('inquiries')}
          className="luxury-card rounded-2xl p-6 border border-white/10 hover:border-[#FF4D00]/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold">
              Total Inquiries
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center text-[#FF4D00] group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {inquiries.length}
            </span>
            <span className="text-xs text-[#737373]">
              all time submissions
            </span>
          </div>
          <span className="inline-block mt-3 text-xs text-[#FF4D00] group-hover:underline">
            View full inquiry log →
          </span>
        </div>
      </div>

      {/* Quick Actions & Recent Inquiries Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Quick Actions & System Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="luxury-card rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-white font-bold">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {onOpenTaskModal && (
                <button
                  type="button"
                  onClick={onOpenTaskModal}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 border border-[#FF4D00]/40 text-xs font-bold text-white transition-all group shadow-[0_0_15px_rgba(255,77,0,0.15)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FF4D00] text-black flex items-center justify-center font-bold shadow-md">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-white font-bold">Upload & Assign Work</span>
                      <span className="block text-[10px] text-[#A3A3A3] font-normal">Assign creative brief & specs to designers by client name</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#FF4D00] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigateTab('billing')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 text-xs font-semibold text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-white font-bold">Client Invoicing & Billing</span>
                    <span className="block text-[10px] text-[#A3A3A3] font-normal">Manage client details, services, rates & print invoices</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#737373] group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => (onOpenClientModal ? onOpenClientModal() : onNavigateTab('clients'))}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 text-xs font-semibold text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-white font-bold">Add New Client & Service Rates</span>
                    <span className="block text-[10px] text-[#A3A3A3] font-normal">Configure client info & rates (e.g. Poster ₹300, Video ₹500)</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#737373] group-hover:text-blue-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={onOpenProjectModal}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 text-xs font-semibold text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/15 text-[#FF4D00] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Add New Case Study</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#737373] group-hover:text-[#FF4D00] transition-colors" />
              </button>

              <button
                type="button"
                onClick={onOpenServiceModal}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 text-xs font-semibold text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/15 text-[#FF4D00] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Add New Service Offering</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#737373] group-hover:text-[#FF4D00] transition-colors" />
              </button>

              <button
                type="button"
                onClick={onOpenTestimonialModal}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 text-xs font-semibold text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/15 text-[#FF4D00] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span>Add Client Testimonial</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#737373] group-hover:text-[#FF4D00] transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('content')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/10 text-xs font-semibold text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/15 text-[#FF4D00] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Edit Hero & Page Content</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#737373] group-hover:text-[#FF4D00] transition-colors" />
              </button>
            </div>
          </div>

          {/* Database Persistence Status Box */}
          <div className="luxury-card rounded-3xl p-6 border border-white/10 space-y-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-[#FF4D00]" />
              <h4 className="text-xs uppercase tracking-wider font-bold text-white">
                Persistence Engine Status
              </h4>
            </div>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Running with <strong>Local Atomic Storage</strong> (<code className="text-[#FF7A00]">data/db.json</code>). All admin changes survive server reboots and update the public website instantly.
            </p>
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#737373] border-t border-white/[0.06]">
              <span>Supabase Cloud Integration:</span>
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="text-[#FF4D00] hover:underline"
              >
                View Setup Guide →
              </button>
            </div>
          </div>
        </div>

        {/* Right: Recent Inquiries Feed */}
        <div className="lg:col-span-7">
          <div className="luxury-card rounded-3xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-white font-bold">
                  Recent Project Inquiries
                </h3>
                <p className="text-xs text-[#A3A3A3]">
                  Incoming lead submissions from public client form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('inquiries')}
                className="text-xs text-[#FF4D00] hover:underline"
              >
                View All ({inquiries.length})
              </button>
            </div>

            {recentInquiries.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#737373]">
                No inquiries received yet. Submit a test inquiry on the public website.
              </div>
            ) : (
              <div className="space-y-3">
                {recentInquiries.map((inquiry) => {
                  const statusColors = {
                    New: 'bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/40',
                    Contacted: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
                    Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                  };

                  return (
                    <div
                      key={inquiry.id}
                      onClick={() => onSelectInquiry(inquiry)}
                      className="p-4 rounded-2xl bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/10 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white group-hover:text-[#FF4D00] transition-colors">
                            {inquiry.name}
                          </span>
                          {inquiry.company && (
                            <span className="text-xs text-[#737373]">
                              ({inquiry.company})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#A3A3A3] line-clamp-1">
                          {inquiry.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-[#737373]">
                          <span>{inquiry.service}</span>
                          <span>•</span>
                          <span>{formatDate(inquiry.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            statusColors[inquiry.status] || statusColors.New
                          }`}
                        >
                          {inquiry.status}
                        </span>
                        <span className="text-[11px] text-[#FF4D00] sm:hidden group-hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
