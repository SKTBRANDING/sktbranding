'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  Sparkles,
  Quote,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Bell,
  Briefcase,
  Users,
  Receipt,
  Sliders,
} from 'lucide-react';
import { DatabaseSchema, Inquiry } from '@/types';
import { clearAdminToken, adminFetch } from '@/lib/adminApi';
import AdminOverview from './AdminOverview';
import AdminProjects from './AdminProjects';
import AdminServices from './AdminServices';
import AdminContent from './AdminContent';
import AdminTestimonials from './AdminTestimonials';
import AdminInquiries from './AdminInquiries';
import AdminSettings from './AdminSettings';
import AdminTasks from './AdminTasks';
import AdminDesigners from './AdminDesigners';
import AdminBilling from './AdminBilling';
import AdminLogos from './AdminLogos';

interface AdminDashboardProps {
  initialData: DatabaseSchema;
  onLogout: () => void;
}

export default function AdminDashboard({ initialData, onLogout }: AdminDashboardProps) {
  const [data, setData] = useState<DatabaseSchema>(() => ({
    ...initialData,
    projects: Array.isArray(initialData?.projects) ? initialData.projects : [],
    services: Array.isArray(initialData?.services) ? initialData.services : [],
    content: initialData?.content || {},
    settings: initialData?.settings || {},
    testimonials: Array.isArray(initialData?.testimonials) ? initialData.testimonials : [],
    inquiries: Array.isArray(initialData?.inquiries) ? initialData.inquiries : [],
    tasks: Array.isArray(initialData?.tasks) ? initialData.tasks : [],
    designers: Array.isArray(initialData?.designers) ? initialData.designers : [],
    invoices: Array.isArray(initialData?.invoices) ? initialData.invoices : [],
  }));

  React.useEffect(() => {
    if (initialData) {
      setData((prev) => ({
        ...prev,
        ...initialData,
        projects: Array.isArray(initialData.projects) ? initialData.projects : prev.projects,
        services: Array.isArray(initialData.services) ? initialData.services : prev.services,
        content: initialData.content || prev.content,
        settings: initialData.settings || prev.settings,
        testimonials: Array.isArray(initialData.testimonials) ? initialData.testimonials : prev.testimonials,
        inquiries: Array.isArray(initialData.inquiries) ? initialData.inquiries : prev.inquiries,
        tasks: Array.isArray(initialData.tasks) ? initialData.tasks : prev.tasks,
        designers: Array.isArray(initialData.designers) ? initialData.designers : prev.designers,
        invoices: Array.isArray(initialData.invoices) ? initialData.invoices : prev.invoices,
      }));
    }
  }, [initialData]);

  // Refresh data on mount to ensure fresh authenticated state
  React.useEffect(() => {
    refreshData();
  }, []);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [forceOpenTaskModal, setForceOpenTaskModal] = useState(false);
  const [taskModalPreselectedDesignerId, setTaskModalPreselectedDesignerId] = useState<string | null>(null);

  const handleOpenUploadAndAssignTask = (designerId?: string) => {
    setTaskModalPreselectedDesignerId(designerId || null);
    setForceOpenTaskModal(true);
    setActiveTab('tasks');
  };

  // Toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Refresh entire database from server
  const refreshData = async () => {
    try {
      const [projRes, servRes, contRes, testRes, inqRes, settRes, taskRes, desRes, invRes] = await Promise.all([
        adminFetch('/api/projects?all=true'),
        adminFetch('/api/services?all=true'),
        adminFetch('/api/content'),
        adminFetch('/api/testimonials?all=true'),
        adminFetch('/api/inquiries'),
        adminFetch('/api/settings'),
        adminFetch('/api/tasks'),
        adminFetch('/api/designers'),
        adminFetch('/api/invoices'),
      ]);

      const safeJson = async (res: Response) => {
        try {
          return await res.json();
        } catch {
          return null;
        }
      };

      const [projects, services, content, testimonials, inquiries, settings, tasks, designers, invoices] = await Promise.all([
        safeJson(projRes),
        safeJson(servRes),
        safeJson(contRes),
        safeJson(testRes),
        safeJson(inqRes),
        safeJson(settRes),
        safeJson(taskRes),
        safeJson(desRes),
        safeJson(invRes),
      ]);

      setData((prev) => ({
        projects: Array.isArray(projects) ? projects : prev.projects,
        services: Array.isArray(services) ? services : prev.services,
        content: content && !content.error && content.hero ? content : prev.content,
        testimonials: Array.isArray(testimonials) ? testimonials : prev.testimonials,
        inquiries: Array.isArray(inquiries) ? inquiries : prev.inquiries,
        settings: settings && !settings.error && settings.agencyName ? settings : prev.settings,
        tasks: Array.isArray(tasks) ? tasks : prev.tasks || [],
        designers: Array.isArray(designers) ? designers : prev.designers || [],
        invoices: Array.isArray(invoices) ? invoices : prev.invoices || [],
      }));
    } catch (err) {
      console.error('Error refreshing admin data:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAdminToken();
      onLogout();
    }
  };

  const newInquiriesCount = (data.inquiries || []).filter((i) => i.status === 'New').length;
  const awaitingReviewTasksCount = (data.tasks || []).filter((t) => t.status === 'submitted' || t.status === 'resubmitted').length;
  const pendingInvoicesCount = (data.invoices || []).filter((inv) => inv.status === 'pending' || inv.status === 'overdue').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'billing',
      label: 'Client Billing',
      icon: Receipt,
      count: (data.invoices || []).length,
      badge: pendingInvoicesCount > 0 ? `${pendingInvoicesCount} Due` : undefined,
    },
    {
      id: 'tasks',
      label: 'Work Management',
      icon: Briefcase,
      count: (data.tasks || []).length,
      badge: awaitingReviewTasksCount > 0 ? `${awaitingReviewTasksCount} Review` : undefined,
    },
    {
      id: 'designers',
      label: 'Designers',
      icon: Users,
      count: (data.designers || []).length,
    },
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: (data?.projects || []).length },
    {
      id: 'logos',
      label: 'Client Logos Slide',
      icon: Sliders,
      count: (data?.content?.partnerLogos || []).length || 10,
    },
    { id: 'services', label: 'Services', icon: Wrench, count: (data?.services || []).length },
    { id: 'content', label: 'Website Content', icon: Sparkles },
    { id: 'testimonials', label: 'Testimonials', icon: Quote, count: (data?.testimonials || []).length },
    {
      id: 'inquiries',
      label: 'Inquiries',
      icon: Mail,
      count: (data?.inquiries || []).length,
      badge: newInquiriesCount > 0 ? `${newInquiriesCount} New` : undefined,
    },
    { id: 'settings', label: 'Settings & Supabase', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col selection:bg-[#FF4D00] selection:text-black">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : 'bg-[#141414]/95 border-[#FF4D00]/60 text-white shadow-[0_0_25px_rgba(255,77,0,0.3)]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#FF4D00] flex-shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-[#737373] hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/[0.08] px-5 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-[#A3A3A3] hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#FF4D00]/50 flex items-center justify-center shadow-[0_0_12px_rgba(255,77,0,0.3)]">
              <span className="text-[#FF4D00] font-black text-sm">S</span>
            </div>
            <div>
              <span className="text-sm font-bold tracking-wider text-white">SKT BRANDING</span>
              <span className="text-[10px] text-[#FF4D00] block tracking-widest uppercase -mt-0.5">Admin Studio</span>
            </div>
          </Link>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#FF4D00]" />
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-xs font-semibold text-red-300 transition-colors"
            title="Sign out of admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 bg-[#080808] border-r border-white/[0.08] flex-col justify-between p-4 flex-shrink-0">
          <nav className="space-y-1.5" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedInquiry(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#FF4D00] text-black shadow-[0_0_20px_rgba(255,77,0,0.35)]'
                      : 'text-[#A3A3A3] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[#A3A3A3]'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-black shadow-sm animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && !item.badge && (
                      <span className={`text-[10px] font-mono ${isActive ? 'text-black/70' : 'text-[#737373]'}`}>
                        {item.count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Info */}
          <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
              <Database className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Storage Status</span>
            </div>
            <p className="text-[10px] text-[#A3A3A3] leading-relaxed">
              Local persistent storage active. Changes save directly to disk.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 lg:hidden bg-black/80 backdrop-blur-md pt-16 p-6">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setSelectedInquiry(null);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-sm font-semibold ${
                      isActive
                        ? 'bg-[#FF4D00] text-black'
                        : 'text-[#A3A3A3] hover:text-white bg-[#141414]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-black">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <div className="pt-4 border-t border-white/10">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-3 rounded-xl bg-white/10 text-white text-xs font-bold uppercase tracking-wider"
                >
                  View Public Website →
                </a>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <AdminOverview
              data={data}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                setSelectedInquiry(null);
              }}
              onOpenProjectModal={() => setActiveTab('projects')}
              onOpenServiceModal={() => setActiveTab('services')}
              onOpenTestimonialModal={() => setActiveTab('testimonials')}
              onOpenTaskModal={() => handleOpenUploadAndAssignTask()}
              onSelectInquiry={(inq) => {
                setSelectedInquiry(inq);
                setActiveTab('inquiries');
              }}
            />
          )}

          {activeTab === 'tasks' && (
            <AdminTasks
              tasks={data.tasks || []}
              designers={data.designers || []}
              onRefresh={refreshData}
              showToast={showToast}
              onPublishToPortfolio={(task) => {
                setActiveTab('projects');
                showToast(`Ready to create portfolio project for "${task.title}". Click Add Project.`);
              }}
              initialOpenCreateModal={forceOpenTaskModal}
              preselectedDesignerId={taskModalPreselectedDesignerId}
              onResetModalTrigger={() => {
                setForceOpenTaskModal(false);
                setTaskModalPreselectedDesignerId(null);
              }}
            />
          )}

          {activeTab === 'designers' && (
            <AdminDesigners
              designers={data.designers || []}
              tasks={data.tasks || []}
              onRefresh={refreshData}
              showToast={showToast}
              onAssignWork={(id) => handleOpenUploadAndAssignTask(id)}
              onViewDesignerTasks={(designerId) => {
                setActiveTab('tasks');
              }}
            />
          )}

          {activeTab === 'billing' && (
            <AdminBilling
              invoices={data.invoices || []}
              projects={data.projects || []}
              onRefresh={refreshData}
              showToast={showToast}
            />
          )}

          {activeTab === 'projects' && (
            <AdminProjects
              projects={data.projects}
              onRefresh={refreshData}
              showToast={showToast}
            />
          )}

          {activeTab === 'logos' && (
            <AdminLogos
              content={data.content}
              onRefresh={refreshData}
              showToast={showToast}
            />
          )}

          {activeTab === 'services' && (
            <AdminServices
              services={data.services}
              onRefresh={refreshData}
              showToast={showToast}
            />
          )}

          {activeTab === 'content' && (
            <AdminContent
              content={data.content}
              onRefresh={refreshData}
              showToast={showToast}
            />
          )}

          {activeTab === 'testimonials' && (
            <AdminTestimonials
              testimonials={data.testimonials}
              onRefresh={refreshData}
              showToast={showToast}
            />
          )}

          {activeTab === 'inquiries' && (
            <AdminInquiries
              inquiries={data.inquiries}
              onRefresh={refreshData}
              showToast={showToast}
              selectedInquiry={selectedInquiry}
              onClearSelectedInquiry={() => setSelectedInquiry(null)}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings
              settings={data.settings}
              onRefresh={refreshData}
              showToast={showToast}
            />
          )}
        </main>

      </div>
    </div>
  );
}
