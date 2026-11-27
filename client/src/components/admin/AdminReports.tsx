import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  Download,
  Maximize2,
  Minimize2,
  Edit3,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  FileText,
  Sparkles,
  Eye,
  Upload,
  Image as ImageIcon,
  Layers,
  Calendar,
  ChevronDown,
  X,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { ClientReport, ReportServiceSection, ReportDeliverableItem, Client } from '../../types';
import { adminFetch } from '../../lib/adminApi';

interface AdminReportsProps {
  reports: ClientReport[];
  clients: Client[];
  onRefresh: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  reports,
  clients,
  onRefresh,
  showToast,
}) => {
  // Current active report
  const [selectedReportId, setSelectedReportId] = useState<string>(
    reports && reports.length > 0 ? reports[0].id : ''
  );

  // Sync selectedReportId if reports change
  React.useEffect(() => {
    if ((!selectedReportId || !reports.some((r) => r.id === selectedReportId)) && reports.length > 0) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  const currentReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || reports[0] || null;
  }, [reports, selectedReportId]);

  // Fullscreen Presentation Mode state
  const [presentationMode, setPresentationMode] = useState<boolean>(false);

  // Edit / Create Report Modal state
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [syncingTasks, setSyncingTasks] = useState<boolean>(false);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    id?: string;
    clientId: string;
    clientName: string;
    clientLogo: string;
    reportMonth: string;
    reportTitle: string;
    executiveSummaryTitle: string;
    executiveSummaryText: string;
    thankYouTitle: string;
    sections: ReportServiceSection[];
  }>({
    clientId: '',
    clientName: '',
    clientLogo: '',
    reportMonth: '',
    reportTitle: '',
    executiveSummaryTitle: '',
    executiveSummaryText: '',
    thankYouTitle: 'THANK YOU',
    sections: [],
  });

  // Modal active tab for editing
  const [editTab, setEditTab] = useState<'cover' | 'narrative' | 'sections' | 'thankyou'>('cover');

  // New section / item temporary inputs
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const deliverableInputRef = useRef<HTMLInputElement>(null);

  // Open modal for editing existing report
  const handleOpenEditModal = (report?: ClientReport) => {
    const r = report || currentReport;
    if (!r) return;
    setIsCreatingNew(false);
    setEditForm({
      id: r.id,
      clientId: r.clientId || '',
      clientName: r.clientName || '',
      clientLogo: r.clientLogo || '',
      reportMonth: r.reportMonth || '',
      reportTitle: r.reportTitle || `${r.clientName} MONTHLY REPORT`,
      executiveSummaryTitle: r.executiveSummaryTitle || `Social Media Report – ${r.reportMonth}`,
      executiveSummaryText: r.executiveSummaryText || '',
      thankYouTitle: r.thankYouTitle || 'THANK YOU',
      sections: JSON.parse(JSON.stringify(r.sections || [])),
    });
    setEditTab('cover');
    setEditModalOpen(true);
  };

  // Open modal for creating new report
  const handleOpenCreateModal = () => {
    setIsCreatingNew(true);
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const defaultClient = clients[0] || null;

    setEditForm({
      clientId: defaultClient?.id || '',
      clientName: defaultClient?.name || 'BAITHULRASA',
      clientLogo: defaultClient?.logo || '/logos/baitul-rasa-emblem.svg',
      reportMonth: month,
      reportTitle: `${(defaultClient?.name || 'BAITHULRASA').toUpperCase()} MONTHLY REPORT`,
      executiveSummaryTitle: `Social Media Report – ${month}`,
      executiveSummaryText: `We take immense pride in presenting the comprehensive visual deliverables and creative campaign progress executed across this billing cycle. Every assignment was strategically developed to elevate brand recall, reinforce market authority, and drive targeted consumer engagement across digital touchpoints.\n\nOur creative trajectory continues to prioritize strategic visual direction, coherent brand aesthetics, and maximum campaign resonance. Consistent aesthetics and high-fidelity typography selections across all creative formats have solidified an unmistakable and polished visual identity. Visual cohesion is paramount in capturing consumer mindshare, and this month's execution guarantees prominent standing against regional competition.\n\nThrough strategic communication architecture, high-impact poster storytelling, and meticulously crafted promotional collateral, we maintained consistent brand visibility and premium market positioning. Every visual asset was engineered to resonate with core demographics, supporting measurable brand growth and sustained customer loyalty.\n\nMoving forward, our studio remains committed to introducing progressive creative assets, refined brand collateral, and forward-looking visual strategies that command lasting attention across every digital and retail medium.`,
      thankYouTitle: 'THANK YOU',
      sections: [],
    });
    setEditTab('cover');
    setEditModalOpen(true);
  };

  // Auto-populate when selecting client in modal
  const handleClientChangeInForm = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      setEditForm((prev) => ({
        ...prev,
        clientId: selected.id,
        clientName: selected.name,
        clientLogo: selected.logo || prev.clientLogo || '/logos/baitul-rasa-emblem.svg',
        reportTitle: `${selected.name.toUpperCase()} MONTHLY REPORT`,
      }));
    }
  };

  // Upload custom logo in modal
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'logos');

      const res = await adminFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload emblem image');
      const data = await res.json();
      setEditForm((prev) => ({ ...prev, clientLogo: data.url }));
      showToast('Client emblem uploaded successfully!');
    } catch (err: any) {
      showToast(err.message || 'Emblem upload failed', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload deliverable image directly to active section
  const handleUploadDeliverable = async (e: React.ChangeEvent<HTMLInputElement>, secId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'tasks');

      const res = await adminFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload deliverable file');
      const data = await res.json();

      setEditForm((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id === secId) {
            return {
              ...s,
              items: [
                ...s.items,
                {
                  id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  title: file.name.replace(/\.[^/.]+$/, ''),
                  imageUrl: data.url,
                  category: s.title,
                },
              ],
            };
          }
          return s;
        }),
      }));
      showToast('Deliverable image uploaded!');
    } catch (err: any) {
      showToast(err.message || 'Deliverable upload failed', 'error');
    }
  };

  // Save report (create or update)
  const handleSaveReport = async () => {
    if (!editForm.clientName.trim()) {
      showToast('Client name is required', 'error');
      return;
    }

    try {
      if (isCreatingNew) {
        const res = await adminFetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
        if (!res.ok) throw new Error('Failed to create report');
        const created = await res.json();
        showToast('Client Work Report created successfully!');
        setEditModalOpen(false);
        await onRefresh();
        setSelectedReportId(created.id);
      } else if (editForm.id) {
        const res = await adminFetch(`/api/reports/${editForm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        });
        if (!res.ok) throw new Error('Failed to update report');
        showToast('Report updated successfully!');
        setEditModalOpen(false);
        await onRefresh();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save report', 'error');
    }
  };

  // Sync approved works from Work Management
  const handleSyncApprovedTasks = async () => {
    if (!currentReport) return;
    try {
      setSyncingTasks(true);
      const res = await adminFetch('/api/reports/sync-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: currentReport.clientName,
          reportMonth: currentReport.reportMonth,
        }),
      });

      if (!res.ok) throw new Error('Failed to synchronize approved deliverables');
      const result = await res.json();
      showToast('Approved designer deliverables synchronized into report!');
      await onRefresh();
      if (result.report?.id) {
        setSelectedReportId(result.report.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setSyncingTasks(false);
    }
  };

  // Delete current report
  const handleDeleteReport = async () => {
    if (!currentReport) return;
    if (!window.confirm(`Are you sure you want to delete the report for "${currentReport.clientName}"?`)) return;

    try {
      const res = await adminFetch(`/api/reports/${currentReport.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete report');
      showToast('Report deleted.');
      await onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Print & PDF Export
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Download PDF helper (triggers browser print-to-pdf dialog with instructions)
  const handleDownloadPdf = () => {
    showToast('Opening PDF Export: Choose "Save as PDF" with Background Graphics enabled.');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Print Stylesheet strictly tailored to reference design */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          body {
            background: #FAF7F2 !important;
            color: #1A1A1A !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .report-no-print {
            display: none !important;
          }
          .report-print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .report-page-card {
            width: 100vw !important;
            min-height: 100vh !important;
            height: 100vh !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .report-cover-page {
            background: #080808 !important;
            background: linear-gradient(180deg, #080808 0%, #150300 50%, #250400 100%) !important;
            color: #ffffff !important;
          }
          .report-content-page {
            background-color: #FAF7F2 !important;
            color: #1A1A1A !important;
          }
        }
      `}</style>

      {/* Top Header & Management Controls */}
      <div className="report-no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/[0.08] p-5 sm:p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#990000] flex items-center justify-center shadow-[0_0_20px_rgba(255,77,0,0.35)]">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white flex items-center gap-2">
                <span>Client Work Reports</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30 font-bold uppercase">
                  Reference Deck
                </span>
              </h1>
              <p className="text-xs text-[#8A8A8A]">
                Monthly presentation showcase reports for clients with automated deliverable ingestion and luxury PDF print styling.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncApprovedTasks}
            disabled={syncingTasks || !currentReport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-all hover:border-[#FF4D00]/40 disabled:opacity-50"
            title="Automatically pull newly approved works from Work Management into this report"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#FF4D00] ${syncingTasks ? 'animate-spin' : ''}`} />
            <span>Sync Approved Works</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenEditModal()}
            disabled={!currentReport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-all hover:border-white/20 disabled:opacity-50"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#A3A3A3]" />
            <span>Edit Report</span>
          </button>

          <button
            type="button"
            onClick={() => setPresentationMode(!presentationMode)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-all hover:border-white/20"
            title="Toggle fullscreen deck presentation"
          >
            {presentationMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Exit Deck</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Full Deck View</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-xs font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            title="Export high-resolution PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF4D00] to-[#E63900] hover:brightness-110 text-xs font-bold text-white shadow-[0_0_20px_rgba(255,77,0,0.35)] transition-all"
            title="Print report on luxury A4 sheets"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Filter / Selector Bar for Reports */}
      {reports && reports.length > 0 && (
        <div className="report-no-print flex flex-wrap items-center justify-between gap-3 bg-[#0f0f0f] border border-white/[0.06] px-4 py-3 rounded-xl">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-[11px] font-mono text-[#737373] uppercase tracking-wider whitespace-nowrap mr-1">
              Active Client Reports:
            </span>
            {reports.map((r) => {
              const active = r.id === selectedReportId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReportId(r.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.4)] font-bold'
                      : 'bg-white/5 text-[#A3A3A3] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {r.clientLogo ? (
                    <img src={r.clientLogo} alt="" className="w-4 h-4 rounded object-contain bg-white/10" />
                  ) : (
                    <Building className="w-3.5 h-3.5" />
                  )}
                  <span>{r.clientName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${active ? 'bg-black/20 text-black' : 'bg-white/10 text-[#888]'}`}>
                    {r.reportMonth}
                  </span>
                </button>
              );
            })}
          </div>

          {currentReport && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#737373] hidden sm:inline">
                {currentReport.sections?.reduce((acc, s) => acc + (s.items?.length || 0), 0) || 0} deliverable visuals compiled
              </span>
              <button
                type="button"
                onClick={handleDeleteReport}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                title="Delete this report"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Reports Fallback */}
      {(!currentReport || reports.length === 0) && (
        <div className="report-no-print p-12 text-center bg-[#0d0d0d] border border-dashed border-white/10 rounded-3xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-[#FF4D00]">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Client Reports Created Yet</h3>
            <p className="text-xs text-[#8A8A8A] max-w-md mx-auto">
              Start a new monthly report for a client. When designer submissions are approved in Work Management, they will automatically appear here!
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D00] text-black font-bold text-xs shadow-[0_0_20px_rgba(255,77,0,0.4)] hover:brightness-110"
          >
            <Plus className="w-4 h-4" />
            <span>Create Client Report</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MULTI-PAGE PRESENTATION CANVAS (FAITHFUL TO REFERENCE IMAGE 2) */}
      {/* ========================================================================= */}
      {currentReport && (
        <div className={`report-print-container flex flex-col items-center gap-12 w-full transition-all ${presentationMode ? 'fixed inset-0 z-50 bg-black/95 overflow-y-auto p-4 sm:p-10' : ''}`}>
          
          {/* Deck Floating Close Button in Fullscreen Presentation Mode */}
          {presentationMode && (
            <div className="report-no-print fixed top-6 right-8 z-50 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xl flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PDF</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-[#FF4D00] text-black font-bold text-xs shadow-xl flex items-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setPresentationMode(false)}
                className="p-2 rounded-xl bg-neutral-800 text-white hover:bg-neutral-700 shadow-xl"
                title="Exit Presentation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* =================================================================== */}
          {/* PAGE 1: LUXURY COVER SCREEN (Dark gradient + Red Glow + Client Emblem) */}
          {/* =================================================================== */}
          <div className="report-page-card report-cover-page relative w-full max-w-[800px] aspect-[1/1.414] rounded-[28px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col justify-between p-10 sm:p-16 select-none bg-gradient-to-b from-[#080808] via-[#150300] to-[#250400]">
            
            {/* Ambient Red Glow at right/bottom corner matching reference */}
            <div
              className="absolute -bottom-24 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255, 51, 0, 0.55) 0%, rgba(255, 30, 0, 0.15) 50%, transparent 75%)',
                filter: 'blur(45px)',
              }}
            />

            {/* Subtle top ambient red gradient accent */}
            <div
              className="absolute -top-32 -left-32 w-80 h-80 rounded-full pointer-events-none opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(200, 20, 0, 0.4) 0%, transparent 70%)',
                filter: 'blur(50px)',
              }}
            />

            {/* Top Empty Spacer for Centering Balance */}
            <div className="h-6" />

            {/* Centered Main Cover Hero */}
            <div className="relative z-10 flex flex-col items-center text-center my-auto space-y-8">
              
              {/* Client Emblem / Logo */}
              <div className="transition-transform duration-500 hover:scale-105">
                {currentReport.clientLogo ? (
                  <img
                    src={currentReport.clientLogo}
                    alt={currentReport.clientName}
                    className="w-56 sm:w-72 max-h-36 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
                  />
                ) : (
                  <div className="w-64 py-5 px-8 rounded-[36px] bg-[#0c3620] border-2 border-[#D4AF37] shadow-[0_12px_30px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-serif tracking-[4px] text-[#F4E0A5] font-bold">
                      RESTAURANT
                    </span>
                    <span className="text-2xl font-serif font-black text-white tracking-wide my-1">
                      {currentReport.clientName}
                    </span>
                    <span className="text-[9px] uppercase font-serif tracking-[2px] text-[#D4AF37]">
                      ESTD 1990
                    </span>
                  </div>
                )}
              </div>

              {/* Title: [CLIENT NAME] MONTHLY REPORT */}
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-4xl font-black tracking-[0.06em] text-white uppercase font-sans drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] leading-tight">
                  {currentReport.reportTitle || `${currentReport.clientName} MONTHLY REPORT`}
                </h2>
              </div>

              {/* Pill Badge: Month & Year */}
              <div>
                <div className="inline-flex items-center justify-center px-8 py-2.5 rounded-full bg-white text-black font-extrabold text-sm sm:text-base tracking-wide shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                  {currentReport.reportMonth}
                </div>
              </div>

            </div>

            {/* Bottom SKT Branding Logo */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-8">
              <div className="inline-flex items-center gap-2 opacity-95">
                {/* Red geometric icon */}
                <svg className="w-5 h-5 text-[#FF3300]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="text-sm font-bold tracking-wider text-white lowercase">
                  sktbranding
                </span>
              </div>
            </div>

          </div>

          {/* =================================================================== */}
          {/* PAGE 2: EXECUTIVE SOCIAL MEDIA REPORT NARRATIVE (Cream Paper Tone) */}
          {/* =================================================================== */}
          <div className="report-page-card report-content-page relative w-full max-w-[800px] aspect-[1/1.414] rounded-[28px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-neutral-200/60 p-10 sm:p-14 flex flex-col justify-between bg-[#FAF7F2] text-[#1A1A1A]">
            
            {/* Header: Social Media Report – [Month Year] */}
            <div className="space-y-6">
              <h2 className="text-xl sm:text-2xl font-black text-[#D60000] tracking-wide font-sans text-center">
                {currentReport.executiveSummaryTitle || `Social Media Report – ${currentReport.reportMonth}`}
              </h2>

              {/* Multi-paragraph narrative text */}
              <div className="text-[13px] sm:text-[14.5px] leading-relaxed text-[#262626] font-normal text-justify space-y-4 font-sans antialiased">
                {(currentReport.executiveSummaryText || '').split('\n\n').map((para, pIdx) => {
                  if (!para.trim()) return null;
                  return (
                    <p key={pIdx} className="tracking-tight text-neutral-800 leading-[1.75]">
                      {para.trim()}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Bottom Right: SKT Branding signature watermark */}
            <div className="flex items-center justify-end pt-6 border-t border-neutral-300/40">
              <div className="inline-flex items-center gap-1.5 opacity-80">
                <svg className="w-3.5 h-3.5 text-[#D60000]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="text-[11px] font-bold tracking-wider text-neutral-700 lowercase">
                  sktbranding
                </span>
              </div>
            </div>

          </div>

          {/* =================================================================== */}
          {/* PAGES 3+: CREATIVE SHOWCASE SECTIONS (DYNAMICALLY EXPANDING BY WORK COUNT) */}
          {/* =================================================================== */}
          {currentReport.sections && currentReport.sections.length > 0 ? (
            currentReport.sections.map((section, sIdx) => {
              const itemCount = section.items ? section.items.length : 0;
              // Determine grid columns based on count:
              // For 1-2 items: 2 cols; 3-4 items: 3-4 cols; 5-8 items: 4 cols
              const gridColsClass =
                itemCount <= 2
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto'
                  : itemCount <= 4
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';

              return (
                <div
                  key={section.id || sIdx}
                  className="report-page-card report-content-page relative w-full max-w-[800px] aspect-[1/1.414] rounded-[28px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-neutral-200/60 p-8 sm:p-12 flex flex-col justify-between bg-[#FAF7F2] text-[#1A1A1A]"
                >
                  {/* Section Title in bold Crimson/Red */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-base sm:text-xl font-black text-[#D60000] tracking-wider uppercase font-sans">
                        {section.title}
                      </h3>
                    </div>

                    {/* Deliverable Visuals Grid */}
                    {itemCount > 0 ? (
                      <div className={`grid ${gridColsClass} gap-3 sm:gap-4 items-center justify-center my-auto`}>
                        {section.items.map((item, iIdx) => (
                          <div
                            key={item.id || iIdx}
                            className="group relative rounded-2xl overflow-hidden bg-white border border-neutral-200/70 shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-all duration-300 flex items-center justify-center"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title || section.title}
                              className="w-full h-auto max-h-[180px] sm:max-h-[220px] object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            {/* Title overlay in web view */}
                            {item.title && (
                              <div className="report-no-print absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity text-center">
                                <span className="text-[10px] font-semibold text-white tracking-wide truncate block">
                                  {item.title}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-neutral-400 text-xs italic">
                        No deliverable visuals in this category yet. When designer submissions are approved, they will appear here automatically!
                      </div>
                    )}
                  </div>

                  {/* Bottom Right: SKT Branding signature watermark */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-300/40">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
                      {currentReport.clientName} • Page {sIdx + 3}
                    </span>
                    <div className="inline-flex items-center gap-1.5 opacity-80">
                      <svg className="w-3.5 h-3.5 text-[#D60000]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                      <span className="text-[11px] font-bold tracking-wider text-neutral-700 lowercase">
                        sktbranding
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="report-page-card report-content-page relative w-full max-w-[800px] aspect-[1/1.414] rounded-[28px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-neutral-200/60 p-10 sm:p-14 flex flex-col justify-between bg-[#FAF7F2] text-[#1A1A1A]">
              <div className="my-auto text-center space-y-4">
                <h3 className="text-xl font-black text-[#D60000] uppercase">
                  SOCIAL MEDIA CREATIVE POSTERS
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Deliverable artworks will compile here automatically upon designer work approval in Admin Studio.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal()}
                  className="report-no-print inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>Add Deliverables Manually</span>
                </button>
              </div>
              <div className="flex items-center justify-end pt-4 border-t border-neutral-300/40">
                <span className="text-[11px] font-bold tracking-wider text-neutral-700 lowercase">
                  sktbranding
                </span>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* LAST PAGE: THANK YOU (Matching Reference: Big Red THANK YOU + Logo) */}
          {/* =================================================================== */}
          <div className="report-page-card report-content-page relative w-full max-w-[800px] aspect-[1/1.414] rounded-[28px] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.4)] border border-neutral-200/60 p-12 sm:p-16 flex flex-col justify-between items-center text-center bg-[#FAF7F2] text-[#1A1A1A]">
            
            {/* Top spacing */}
            <div className="h-4" />

            {/* Centered Big Red THANK YOU + Client Logo */}
            <div className="my-auto space-y-12 flex flex-col items-center">
              
              {/* THANK YOU Title */}
              <h1 className="text-4xl sm:text-6xl font-black text-[#D60000] tracking-wider uppercase font-sans drop-shadow-sm">
                {currentReport.thankYouTitle || 'THANK YOU'}
              </h1>

              {/* Client Logo Emblem */}
              <div className="transition-transform duration-500 hover:scale-105">
                {currentReport.clientLogo ? (
                  <img
                    src={currentReport.clientLogo}
                    alt={currentReport.clientName}
                    className="w-56 sm:w-72 max-h-36 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                  />
                ) : (
                  <div className="w-64 py-5 px-8 rounded-[36px] bg-[#0c3620] border-2 border-[#D4AF37] shadow-[0_12px_30px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase font-serif tracking-[4px] text-[#F4E0A5] font-bold">
                      RESTAURANT
                    </span>
                    <span className="text-2xl font-serif font-black text-white tracking-wide my-1">
                      {currentReport.clientName}
                    </span>
                    <span className="text-[9px] uppercase font-serif tracking-[2px] text-[#D4AF37]">
                      ESTD 1990
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom SKT Branding Logo */}
            <div className="flex flex-col items-center justify-center pt-8 border-t border-neutral-300/40 w-full">
              <div className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 text-[#D60000]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="text-sm font-bold tracking-wider text-neutral-800 lowercase">
                  sktbranding
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT / CREATE REPORT MODAL */}
      {/* ========================================================================= */}
      {editModalOpen && (
        <div className="report-no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#171717]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF4D00]/20 flex items-center justify-center text-[#FF4D00]">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isCreatingNew ? 'Create New Client Work Report' : `Edit Report for ${editForm.clientName}`}
                  </h3>
                  <p className="text-xs text-[#8A8A8A]">
                    Configure cover metadata, narrative texts, and work showcase deliverables.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-2 text-[#737373] hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-white/10 px-5 bg-[#0e0e0e] overflow-x-auto">
              <button
                type="button"
                onClick={() => setEditTab('cover')}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  editTab === 'cover'
                    ? 'border-[#FF4D00] text-white font-bold'
                    : 'border-transparent text-[#737373] hover:text-white'
                }`}
              >
                1. Cover Page & Logo
              </button>
              <button
                type="button"
                onClick={() => setEditTab('narrative')}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  editTab === 'narrative'
                    ? 'border-[#FF4D00] text-white font-bold'
                    : 'border-transparent text-[#737373] hover:text-white'
                }`}
              >
                2. Page 2 Narrative
              </button>
              <button
                type="button"
                onClick={() => setEditTab('sections')}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  editTab === 'sections'
                    ? 'border-[#FF4D00] text-white font-bold'
                    : 'border-transparent text-[#737373] hover:text-white'
                }`}
              >
                3. Creative Deliverables ({editForm.sections.reduce((acc, s) => acc + s.items.length, 0)})
              </button>
              <button
                type="button"
                onClick={() => setEditTab('thankyou')}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  editTab === 'thankyou'
                    ? 'border-[#FF4D00] text-white font-bold'
                    : 'border-transparent text-[#737373] hover:text-white'
                }`}
              >
                4. Thank You Screen
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[68vh] overflow-y-auto">
              
              {/* TAB 1: COVER PAGE & LOGO */}
              {editTab === 'cover' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Select Existing Client */}
                    <div>
                      <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase">
                        Select Client Account
                      </label>
                      <select
                        value={editForm.clientId}
                        onChange={(e) => handleClientChangeInForm(e.target.value)}
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                      >
                        <option value="">Custom / Direct Entry</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.company ? `(${c.company})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Client Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase">
                        Client / Brand Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.clientName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            clientName: e.target.value,
                            reportTitle: `${e.target.value.toUpperCase()} MONTHLY REPORT`,
                          })
                        }
                        placeholder="e.g. BAITHULRASA"
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                      />
                    </div>

                    {/* Report Month */}
                    <div>
                      <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase">
                        Report Month & Year *
                      </label>
                      <input
                        type="text"
                        value={editForm.reportMonth}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            reportMonth: e.target.value,
                            executiveSummaryTitle: `Social Media Report – ${e.target.value}`,
                          })
                        }
                        placeholder="e.g. October 2026"
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                      />
                    </div>

                    {/* Cover Title */}
                    <div>
                      <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase">
                        Cover Title Banner
                      </label>
                      <input
                        type="text"
                        value={editForm.reportTitle}
                        onChange={(e) => setEditForm({ ...editForm, reportTitle: e.target.value })}
                        placeholder="e.g. BAITHULRASA MONTHLY REPORT"
                        className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                      />
                    </div>

                  </div>

                  {/* Client Emblem / Logo Configuration */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                    <label className="block text-xs font-bold text-white uppercase tracking-wider">
                      Client Logo Emblem (Displayed on Cover & Thank You page)
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Logo Preview */}
                      <div className="w-32 h-20 rounded-xl bg-[#082215] border border-[#D4AF37] flex items-center justify-center p-2 overflow-hidden shadow-inner flex-shrink-0">
                        {editForm.clientLogo ? (
                          <img src={editForm.clientLogo} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-white/50 font-serif">No Logo</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <input
                          type="text"
                          value={editForm.clientLogo}
                          onChange={(e) => setEditForm({ ...editForm, clientLogo: e.target.value })}
                          placeholder="Logo URL or relative path (e.g. /logos/baitul-rasa-emblem.svg)"
                          className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*,.svg"
                            onChange={handleUploadLogo}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                          >
                            <Upload className="w-3 h-3 text-[#FF4D00]" />
                            <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo File'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, clientLogo: '/logos/baitul-rasa-emblem.svg' })}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-[#A3A3A3] hover:text-white transition-colors"
                          >
                            Use Baitul Rasa Emblem
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: PAGE 2 NARRATIVE */}
              {editTab === 'narrative' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase">
                      Page 2 Heading Title
                    </label>
                    <input
                      type="text"
                      value={editForm.executiveSummaryTitle}
                      onChange={(e) => setEditForm({ ...editForm, executiveSummaryTitle: e.target.value })}
                      placeholder="e.g. Social Media Report – October 2026"
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase">
                      Executive Monthly Narrative (Separate paragraphs with double enter)
                    </label>
                    <textarea
                      rows={10}
                      value={editForm.executiveSummaryText}
                      onChange={(e) => setEditForm({ ...editForm, executiveSummaryText: e.target.value })}
                      placeholder="Write the monthly narrative review for the client..."
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-[#FF4D00] leading-relaxed font-sans"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SECTIONS & DELIVERABLES */}
              {editTab === 'sections' && (
                <div className="space-y-6">
                  
                  {/* Add New Section Banner */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="New Section Title (e.g. SOCIAL MEDIA CREATIVE POSTERS, RATE STICKER)"
                      className="flex-1 bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSectionTitle.trim()) return;
                        setEditForm((prev) => ({
                          ...prev,
                          sections: [
                            ...prev.sections,
                            {
                              id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                              title: newSectionTitle.toUpperCase().trim(),
                              category: newSectionTitle.trim(),
                              items: [],
                            },
                          ],
                        }));
                        setNewSectionTitle('');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#FF4D00] text-black font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Section</span>
                    </button>
                  </div>

                  {/* Section List */}
                  {editForm.sections.map((section, sIdx) => (
                    <div key={section.id || sIdx} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#FF4D00] uppercase tracking-wider">
                          Section {sIdx + 1}: {section.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm((prev) => ({
                              ...prev,
                              sections: prev.sections.filter((_, idx) => idx !== sIdx),
                            }));
                          }}
                          className="text-neutral-500 hover:text-red-400 p-1"
                          title="Remove this entire section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Items inside section */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {section.items.map((item, iIdx) => (
                          <div key={item.id || iIdx} className="relative rounded-lg overflow-hidden border border-white/10 bg-black group">
                            <img src={item.imageUrl} alt="" className="w-full h-24 object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm((prev) => ({
                                  ...prev,
                                  sections: prev.sections.map((s, idx) => {
                                    if (idx === sIdx) {
                                      return {
                                        ...s,
                                        items: s.items.filter((_, itIdx) => itIdx !== iIdx),
                                      };
                                    }
                                    return s;
                                  }),
                                }));
                              }}
                              className="absolute top-1 right-1 p-1 rounded bg-red-950/80 text-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete item"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Add Item Trigger */}
                        <label className="border border-dashed border-white/20 hover:border-[#FF4D00] rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer transition-colors text-neutral-400 hover:text-white p-2 text-center">
                          <Plus className="w-4 h-4 text-[#FF4D00] mb-1" />
                          <span className="text-[10px] font-semibold">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadDeliverable(e, section.id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}

                </div>
              )}

              {/* TAB 4: THANK YOU SCREEN */}
              {editTab === 'thankyou' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 uppercase">
                      Thank You Page Title
                    </label>
                    <input
                      type="text"
                      value={editForm.thankYouTitle}
                      onChange={(e) => setEditForm({ ...editForm, thankYouTitle: e.target.value })}
                      placeholder="e.g. THANK YOU"
                      className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                  <p className="text-xs text-neutral-400">
                    The Thank You page automatically features the client emblem and SKT Branding signature at the center and bottom.
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/10 flex items-center justify-between bg-[#171717]">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8A8A8A] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReport}
                className="px-5 py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF3300] text-black font-bold text-xs shadow-[0_0_20px_rgba(255,77,0,0.35)] transition-all"
              >
                {isCreatingNew ? 'Create & Publish Report' : 'Save Changes'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
