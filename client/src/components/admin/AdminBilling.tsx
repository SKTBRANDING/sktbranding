'use client';

import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ArrowRight,
  Send,
  X,
  BadgeCheck,
  Globe,
} from 'lucide-react';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod, Project } from '@/types';
import { adminFetch } from '@/lib/adminApi';
import { formatDate } from '@/lib/dateUtils';

interface AdminBillingProps {
  invoices: Invoice[];
  projects: Project[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  INR: '₹',
  GBP: '£',
  AED: 'AED ',
};

export default function AdminBilling({
  invoices = [],
  projects = [],
  onRefresh,
  showToast,
}: AdminBillingProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Payment recording state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form state for creating / editing invoice
  const [formData, setFormData] = useState<{
    invoiceNumber: string;
    clientName: string;
    clientEmail: string;
    clientCompany: string;
    clientPhone: string;
    clientAddress: string;
    projectId: string;
    projectName: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    status: InvoiceStatus;
    items: InvoiceItem[];
    taxRate: number;
    discountRate: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    paymentDetails: string;
    notes: string;
  }>({
    invoiceNumber: '',
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    clientPhone: '',
    clientAddress: '',
    projectId: '',
    projectName: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'USD',
    status: 'pending',
    items: [
      {
        id: 'item-1',
        description: 'Brand Identity & Visual Architecture',
        category: 'Branding',
        quantity: 1,
        rate: 2500,
        amount: 2500,
      },
    ],
    taxRate: 0,
    discountRate: 0,
    amountPaid: 0,
    paymentMethod: 'bank_transfer',
    paymentDetails: 'SKT BRANDING AGENCY • Wire / IBAN / Swift Transfer',
    notes: 'Thank you for partnering with SKT Branding. Payment is due within 14 days of invoice date.',
  });

  // Calculate high-level financial metrics
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalBalanceDue = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    invoices.forEach((inv) => {
      const tot = Number(inv.total || 0);
      const paid = Number(inv.amountPaid || 0);
      const bal = Number(inv.balanceDue || Math.max(0, tot - paid));

      totalInvoiced += tot;
      totalPaid += paid;
      totalBalanceDue += bal;

      if ((inv.status === 'overdue' || (inv.dueDate && inv.dueDate < todayStr)) && bal > 0) {
        overdueCount++;
        overdueAmount += bal;
      }
    });

    return {
      totalInvoiced,
      totalPaid,
      totalBalanceDue,
      overdueCount,
      overdueAmount,
    };
  }, [invoices]);

  // Filter invoices based on search and status
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.clientName || '').toLowerCase().includes(q) ||
        (inv.clientCompany || '').toLowerCase().includes(q) ||
        (inv.projectName || '').toLowerCase().includes(q) ||
        (inv.clientEmail || '').toLowerCase().includes(q);

      return matchStatus && matchSearch;
    });
  }, [invoices, statusFilter, search]);

  // Auto-calculated totals in Form Data
  const formCalculations = useMemo(() => {
    const subtotal = (formData.items || []).reduce((acc, item) => acc + (Number(item?.quantity) * Number(item?.rate) || 0), 0);
    const discountAmount = (subtotal * (Number(formData.discountRate) || 0)) / 100;
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxable * (Number(formData.taxRate) || 0)) / 100;
    const total = taxable + taxAmount;
    const balanceDue = Math.max(0, total - (Number(formData.amountPaid) || 0));

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      balanceDue,
    };
  }, [formData.items, formData.taxRate, formData.discountRate, formData.amountPaid]);

  const handleOpenCreateModal = () => {
    setEditingInvoice(null);
    const year = new Date().getFullYear();
    const nextNum = String(invoices.length + 1).padStart(3, '0');

    setFormData({
      invoiceNumber: `SKT-INV-${year}-${nextNum}`,
      clientName: '',
      clientEmail: '',
      clientCompany: '',
      clientPhone: '',
      clientAddress: '',
      projectId: '',
      projectName: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: 'USD',
      status: 'pending',
      items: [
        {
          id: `item-${Date.now()}`,
          description: 'Brand Identity & Visual Architecture',
          category: 'Branding',
          quantity: 1,
          rate: 2500,
          amount: 2500,
        },
      ],
      taxRate: 0,
      discountRate: 0,
      amountPaid: 0,
      paymentMethod: 'bank_transfer',
      paymentDetails: 'SKT BRANDING AGENCY • Wire / IBAN / Swift Transfer Details',
      notes: 'Thank you for partnering with SKT Branding. Payment is due within 14 days of invoice date.',
    });
    setEditModalOpen(true);
  };

  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setFormData({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName || '',
      clientEmail: inv.clientEmail || '',
      clientCompany: inv.clientCompany || '',
      clientPhone: inv.clientPhone || '',
      clientAddress: inv.clientAddress || '',
      projectId: inv.projectId || '',
      projectName: inv.projectName || '',
      issueDate: inv.issueDate || new Date().toISOString().split('T')[0],
      dueDate: inv.dueDate || new Date().toISOString().split('T')[0],
      currency: inv.currency || 'USD',
      status: inv.status || 'pending',
      items: Array.isArray(inv.items) && inv.items.length > 0 ? [...inv.items] : [
        {
          id: `item-${Date.now()}`,
          description: 'Creative Agency Deliverables',
          category: 'Branding',
          quantity: 1,
          rate: inv.total || 0,
          amount: inv.total || 0,
        },
      ],
      taxRate: inv.taxRate || 0,
      discountRate: inv.discountRate || 0,
      amountPaid: inv.amountPaid || 0,
      paymentMethod: inv.paymentMethod || 'bank_transfer',
      paymentDetails: inv.paymentDetails || '',
      notes: inv.notes || '',
    });
    setEditModalOpen(true);
  };

  const handleClientSelect = (clientName: string) => {
    // If client is selected from an existing project, auto-fill project details
    const proj = (projects || []).find((p) => (p?.client || '').toLowerCase() === (clientName || '').toLowerCase());
    if (proj) {
      setFormData((prev) => ({
        ...prev,
        clientName: proj.client,
        clientCompany: prev.clientCompany || proj.client,
        projectId: proj.id,
        projectName: proj.title,
      }));
    } else {
      setFormData((prev) => ({ ...prev, clientName }));
    }
  };

  const handleProjectSelect = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setFormData((prev) => ({
        ...prev,
        projectId: proj.id,
        projectName: proj.title,
        clientName: prev.clientName || proj.client,
        clientCompany: prev.clientCompany || proj.client,
      }));
    }
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          description: 'Deliverables & Creative Direction',
          category: 'Branding',
          quantity: 1,
          rate: 1000,
          amount: 1000,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) {
      showToast('An invoice must have at least one line item.', 'error');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const target = { ...newItems[index], [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? Number(value) : target.quantity;
        const rate = field === 'rate' ? Number(value) : target.rate;
        target.amount = Number((qty * rate).toFixed(2));
      }
      newItems[index] = target;
      return { ...prev, items: newItems };
    });
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      showToast('Client Name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        ...formCalculations,
      };

      if (editingInvoice) {
        const res = await adminFetch(`/api/invoices/${editingInvoice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to update invoice');
        showToast(`Invoice ${payload.invoiceNumber} updated successfully!`);
      } else {
        const res = await adminFetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to generate invoice');
        showToast(`Invoice ${payload.invoiceNumber} created for ${payload.clientName}!`);
      }

      await onRefresh();
      setEditModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber} for ${inv.clientName}?`)) {
      return;
    }

    try {
      const res = await adminFetch(`/api/invoices/${inv.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete invoice');

      showToast(`Invoice ${inv.invoiceNumber} removed.`);
      if (selectedInvoice?.id === inv.id) setPreviewModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenPaymentModal = (inv: Invoice) => {
    setPaymentTargetInvoice(inv);
    setPaymentAmount(inv.balanceDue > 0 ? inv.balanceDue : inv.total);
    setPaymentMethod(inv.paymentMethod || 'bank_transfer');
    setPaymentNotes('');
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetInvoice) return;

    if (paymentAmount <= 0) {
      showToast('Please enter a valid positive payment amount.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await adminFetch(`/api/invoices/${paymentTargetInvoice.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentMethod,
          notes: paymentNotes,
          date: new Date().toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      showToast(`Payment of ${formatCurrency(paymentAmount, paymentTargetInvoice.currency)} recorded for ${paymentTargetInvoice.clientName}!`);
      await onRefresh();
      setPaymentModalOpen(false);
      if (selectedInvoice && selectedInvoice.id === paymentTargetInvoice.id) {
        setSelectedInvoice(data);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyInvoiceText = (inv: Invoice) => {
    const symbol = CURRENCY_SYMBOLS[inv.currency] || '$';
    const text = `SKT BRANDING - CLIENT INVOICE #${inv.invoiceNumber}\nClient: ${inv.clientName} (${inv.clientCompany || ''})\nProject: ${inv.projectName || 'Creative Deliverables'}\nTotal: ${symbol}${inv.total.toFixed(2)}\nBalance Due: ${symbol}${inv.balanceDue.toFixed(2)}\nStatus: ${inv.status.toUpperCase()}\nDue Date: ${inv.dueDate}\n\nPayment Details:\n${inv.paymentDetails || 'SKT BRANDING AGENCY ACCOUNT'}`;

    navigator.clipboard.writeText(text);
    setCopiedId(inv.id);
    showToast(`Invoice details copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPdf = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPreviewModalOpen(true);
    showToast(`Preparing invoice PDF for ${inv.invoiceNumber}...`, 'success');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 350);
  };

  const handleDownloadFromModal = () => {
    showToast('Select "Save as PDF" destination to download invoice to your computer.', 'success');
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.print();
      }
    }, 200);
  };

  const formatCurrency = (amount: number, curr = 'USD') => {
    const symbol = CURRENCY_SYMBOLS[curr] || '$';
    return `${symbol}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Paid</span>
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Partially Paid</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Overdue</span>
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-white/10">
            <span>Draft</span>
          </span>
        );
    }
  };

  // Distinct clients from existing projects to populate autocomplete
  const clientSuggestions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.client && p.client.trim()) set.add(p.client.trim());
    });
    return Array.from(set);
  }, [projects]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Client Billing & Invoicing</span>
              <Receipt className="w-6 h-6 text-[#FF4D00]" />
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-xs text-[#A3A3A3] mt-1 max-w-2xl leading-relaxed">
            Manage agency client billing, generate executive PDF invoices, itemize design deliverables, and track real-time wire and digital payments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF4D00] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.3)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 font-bold" />
          <span>Create Client Invoice</span>
        </button>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="luxury-card rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-[#A3A3A3] uppercase">Total Invoiced</span>
            <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/10 flex items-center justify-center text-[#FF4D00]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(metrics.totalInvoiced)}</p>
          <p className="text-[11px] text-[#737373]">Across {invoices.length} client work invoices</p>
        </div>

        {/* Total Paid / Collected */}
        <div className="luxury-card rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-emerald-400 uppercase">Received / Paid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">{formatCurrency(metrics.totalPaid)}</p>
          <p className="text-[11px] text-[#737373]">
            {metrics.totalInvoiced > 0
              ? `${Math.round((metrics.totalPaid / metrics.totalInvoiced) * 100)}% collection rate`
              : '0% collection rate'}
          </p>
        </div>

        {/* Outstanding Balance */}
        <div className="luxury-card rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-amber-400 uppercase">Outstanding Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400">{formatCurrency(metrics.totalBalanceDue)}</p>
          <p className="text-[11px] text-[#737373]">Pending client transfers</p>
        </div>

        {/* Overdue */}
        <div className="luxury-card rounded-2xl p-5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider text-red-400 uppercase">Overdue Amount</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-400">{formatCurrency(metrics.overdueAmount)}</p>
          <p className="text-[11px] text-red-400/80">{metrics.overdueCount} invoice(s) past due date</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice #, client, company, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00]"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['all', 'pending', 'partially_paid', 'paid', 'overdue', 'draft'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#FF4D00] text-black shadow-[0_0_15px_rgba(255,77,0,0.3)]'
                  : 'bg-[#141414] text-[#A3A3A3] hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {st === 'all'
                ? 'All Invoices'
                : st === 'partially_paid'
                ? 'Partially Paid'
                : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List / Table */}
      {filteredInvoices.length === 0 ? (
        <div className="luxury-card rounded-2xl p-12 text-center border border-white/10 space-y-3">
          <Receipt className="w-10 h-10 text-[#737373] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-white">No client invoices found</h3>
          <p className="text-xs text-[#A3A3A3] max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'Try modifying your search query or status filter.'
              : 'Create your first luxury work billing invoice for a client to get started.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF4D00] text-black text-xs font-bold uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      ) : (
        <div className="luxury-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0a0a] border-b border-white/10 text-[#A3A3A3] uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-5">Invoice #</th>
                  <th className="py-3.5 px-5">Client / Project</th>
                  <th className="py-3.5 px-5">Due Date</th>
                  <th className="py-3.5 px-5">Total</th>
                  <th className="py-3.5 px-5">Balance Due</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Invoice # */}
                    <td className="py-4 px-5">
                      <div className="font-mono font-bold text-white group-hover:text-[#FF4D00] transition-colors">
                        {inv.invoiceNumber}
                      </div>
                      <span className="text-[10px] text-[#737373] block mt-0.5 font-mono">
                        Issued {inv.issueDate}
                      </span>
                    </td>

                    {/* Client & Project */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-white text-sm">{inv.clientName}</div>
                      {inv.clientCompany && (
                        <div className="text-[11px] text-[#A3A3A3] flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-[#737373]" />
                          <span>{inv.clientCompany}</span>
                        </div>
                      )}
                      {inv.projectName && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-[#FF4D00] font-mono">
                          {inv.projectName}
                        </span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-5 font-mono text-[#A3A3A3]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#737373]" />
                        <span>{inv.dueDate}</span>
                      </div>
                      {inv.paidAt && (
                        <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                          Paid {new Date(inv.paidAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-4 px-5 font-bold text-white text-sm">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>

                    {/* Balance Due */}
                    <td className="py-4 px-5">
                      <span
                        className={`font-bold font-mono text-xs ${
                          inv.balanceDue <= 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {formatCurrency(inv.balanceDue, inv.currency)}
                      </span>
                      {inv.amountPaid > 0 && inv.balanceDue > 0 && (
                        <span className="text-[10px] text-[#737373] block">
                          ({formatCurrency(inv.amountPaid, inv.currency)} paid)
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">{getStatusBadge(inv.status)}</td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View / Print Full Invoice */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPreviewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white hover:text-[#FF4D00] transition-colors"
                          title="View / Print Executive Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Download Invoice PDF */}
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inv)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#FF4D00] transition-colors"
                          title="Download Invoice as PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Record Payment */}
                        {inv.balanceDue > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(inv)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            title="Record Client Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {/* Copy Link / Details */}
                        <button
                          type="button"
                          onClick={() => handleCopyInvoiceText(inv)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white transition-colors"
                          title="Copy Invoice Details"
                        >
                          {copiedId === inv.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(inv)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-white transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv)}
                          className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-900/40 text-red-400 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ===================================================== */}
      {/* 1. EXECUTIVE INVOICE PREVIEW & PRINT MODAL */}
      {/* ===================================================== */}
      {previewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          {/* Print Style Overrides to keep Red & Black Gradient theme and eliminate white space */}
          <style>{`
            @media print {
              @page {
                margin: 8mm;
                size: auto;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-hide {
                display: none !important;
              }
              .print-invoice-sheet {
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          <div className="w-full max-w-4xl my-6 relative print:m-0 print:p-0 print:w-full print:max-w-none">
            {/* Top Toolbar (Hidden during print) */}
            <div className="flex items-center justify-between bg-[#120a0a] border border-red-950/60 rounded-2xl px-5 py-3.5 mb-4 shadow-xl print-hide">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#FF4D00] uppercase tracking-wider">
                  SKT Luxury Invoice Studio
                </span>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              <div className="flex items-center gap-2">
                {selectedInvoice.balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewModalOpen(false);
                      handleOpenPaymentModal(selectedInvoice);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold border border-emerald-500/40 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
                  title="Print invoice to paper"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadFromModal}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FF4D00] text-black text-xs font-bold hover:bg-[#FF7A00] transition-all shadow-[0_0_15px_rgba(255,77,0,0.3)]"
                  title="Download invoice as PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 text-[#A3A3A3] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* INVOICE CANVAS (TOP RED/BLACK GRADIENT + CRISP WHITE BODY WITH RED & BLACK TEXT) */}
            <div className="print-invoice-sheet bg-white text-black rounded-[32px] overflow-hidden border border-neutral-200 shadow-[0_20px_60px_rgba(0,0,0,0.35)] relative">
              
              {/* TOP HEADER: CRIMSON RED TO VELVET BLACK GRADIENT BANNER */}
              <div className="relative p-7 sm:p-10 bg-gradient-to-br from-[#150202] via-[#4d0703] to-[#FF2A00] text-white overflow-hidden">
                {/* Ambient dark vignette & glossy red highlight */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/60 pointer-events-none"
                />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
                  {/* Left Column: SKT Branding Reference Logo + INVOICE Title + Number */}
                  <div className="space-y-4 max-w-md">
                    <div className="flex items-center gap-3">
                      <img
                        src="/skt-brand-logo-white.png"
                        alt="SKT BRANDING"
                        className="h-9 sm:h-10 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
                      />
                      <div className="border-l border-white/25 pl-3">
                        <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white font-extrabold block">
                          DESIGN STUDIO
                        </span>
                        <span className="text-[9px] text-white/70 tracking-wider block font-sans">
                          EXECUTIVE ATELIER
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-white uppercase drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)]">
                        INVOICE
                      </h1>
                      <div className="flex items-center gap-2 pt-1 font-mono">
                        <span className="text-base sm:text-lg font-bold text-white/95">
                          # {selectedInvoice.invoiceNumber}
                        </span>
                      </div>
                      <p className="text-xs text-white/75 pt-1">
                        SKT Branding Inc, {formatDate(selectedInvoice.issueDate)}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Date Information, Invoice Number, Invoice To, Total Due */}
                  <div className="space-y-3 md:text-right text-xs text-white/90">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 block font-mono">
                        Date Information
                      </span>
                      <span className="font-mono text-xs font-bold text-white block">
                        {selectedInvoice.issueDate}
                      </span>
                    </div>

                    <div className="space-y-0.5 pt-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 block font-mono">
                        Invoice Number
                      </span>
                      <span className="font-mono text-xs font-bold text-white block">
                        {selectedInvoice.invoiceNumber}
                      </span>
                    </div>

                    <div className="space-y-0.5 pt-1">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-white/70 block font-mono">
                        INVOICE TO:
                      </span>
                      <p className="text-sm font-extrabold text-white">
                        {selectedInvoice.clientName}
                      </p>
                      {selectedInvoice.clientCompany && (
                        <p className="text-xs text-white/85">{selectedInvoice.clientCompany}</p>
                      )}
                      {selectedInvoice.clientAddress && (
                        <p className="text-xs text-white/75 whitespace-pre-line leading-relaxed max-w-xs md:ml-auto">
                          {selectedInvoice.clientAddress}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/20">
                      <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide block">
                        Total Due: {selectedInvoice.currency}: {formatCurrency(selectedInvoice.balanceDue > 0 ? selectedInvoice.balanceDue : selectedInvoice.total, selectedInvoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* BODY: TABLE & DETAILS (CRISP WHITE BACKGROUND WITH RED & BLACK TYPOGRAPHY) */}
              <div className="p-6 sm:p-10 space-y-8 bg-white text-black relative">
                {/* Table Section */}
                <div className="space-y-3">
                  {/* Table Header: Light Pill Container matching Sempurna Reference */}
                  <div className="grid grid-cols-12 items-center px-6 py-3.5 rounded-2xl bg-[#F0F2F5] border border-neutral-200 text-xs font-bold text-neutral-800 uppercase tracking-wider font-mono">
                    <div className="col-span-1 text-center text-[#D60000]">NO.</div>
                    <div className="col-span-6 pl-2 text-black">Item Description</div>
                    <div className="col-span-2 text-right text-black">Price</div>
                    <div className="col-span-1 text-center text-black">Qty.</div>
                    <div className="col-span-2 text-right text-black">Total</div>
                  </div>

                  {/* Table Rows: Rounded Pill Container for each item */}
                  <div className="space-y-2.5">
                    {(selectedInvoice.items || []).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="grid grid-cols-12 items-center px-6 py-4 rounded-2xl bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-neutral-200/90 text-xs transition-colors"
                      >
                        <div className="col-span-1 text-center font-mono font-bold text-[#D60000]">
                          {String(idx + 1).padStart(2, '0')}.
                        </div>
                        <div className="col-span-6 pl-2 space-y-0.5">
                          <p className="font-bold text-black text-sm">{item.description}</p>
                          <p className="text-[11px] text-neutral-500">
                            {item.category ? `${item.category} Deliverables` : 'Executive Brand Architecture Deliverables'}
                          </p>
                        </div>
                        <div className="col-span-2 text-right font-mono text-neutral-800 font-semibold">
                          {formatCurrency(item.rate, selectedInvoice.currency)}
                        </div>
                        <div className="col-span-1 text-center font-mono text-neutral-700 font-medium">
                          {item.quantity}
                        </div>
                        <div className="col-span-2 text-right font-mono font-black text-[#D60000] text-sm">
                          {formatCurrency(item.amount, selectedInvoice.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Section: Left (Thanks, Google Pay QR, Bank Details) & Right (Totals & Signature) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-neutral-200">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Thank You & Contacts */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-black tracking-tight">
                        Thank you for your business
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-700">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Phone className="w-3.5 h-3.5 text-[#D60000]" />
                          <span className="font-mono text-black font-semibold">+91 9544931226</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-[#D60000]" />
                          <span>billing@sktbranding.com</span>
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Globe className="w-3.5 h-3.5 text-[#D60000]" />
                          <span>www.sktbranding.com</span>
                        </span>
                      </div>
                    </div>

                    {/* Google Pay QR Code & UPI Instant Pay Box */}
                    <div className="p-4 rounded-2xl bg-[#FFF5F5] border border-red-200/90 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                      {/* QR Code Container */}
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-white p-1.5 border border-red-200 shadow-sm flex-shrink-0 flex items-center justify-center">
                        <img
                          src="/images/gpay-qr.jpg"
                          alt="Google Pay QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* GPay Details & UPI Number */}
                      <div className="space-y-1.5 text-center sm:text-left flex-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-[#D60000] text-[10px] font-mono font-bold uppercase tracking-wider">
                          Google Pay / UPI Instant Pay
                        </div>
                        <div>
                          <p className="text-[10px] text-neutral-500 font-mono font-bold uppercase tracking-wider">
                            GPAY NUMBER / PHONE
                          </p>
                          <p className="text-base sm:text-lg font-black font-mono text-black tracking-tight">
                            +91 9544931226
                          </p>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-tight">
                          Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong> or any UPI App to pay.
                        </p>
                      </div>
                    </div>

                    {/* Payment Method: Bank Transfer / SWIFT */}
                    <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-neutral-200 space-y-2">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#D60000] block">
                        PAYMENT METHOD (BANK WIRE / SWIFT)
                      </span>
                      <div className="text-xs text-neutral-800 space-y-1 font-mono">
                        <p><strong className="text-black">Bank Account:</strong> SKT BRANDING LTD</p>
                        <p><strong className="text-black">Bank Full Name:</strong> Barclays International / Emirates NBD</p>
                        <p><strong className="text-black">Bank Code / SWIFT:</strong> BARCGB22 / EBILAEAD</p>
                        {selectedInvoice.paymentDetails && (
                          <p className="text-[11px] text-neutral-600 pt-1 whitespace-pre-line border-t border-neutral-200">
                            {selectedInvoice.paymentDetails}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-500 block">
                        TERMS & CONDITIONS
                      </span>
                      <p className="text-[11px] text-neutral-600 leading-relaxed whitespace-pre-line">
                        {selectedInvoice.notes ||
                          'Payment is due upon receipt or within stated terms. All intellectual property, vector files, and master brand assets are formally assigned to client upon full settlement.'}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Financial Totals & Signature */}
                  <div className="space-y-4 md:pl-6 md:border-l md:border-neutral-200 flex flex-col justify-between">
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center text-neutral-600 px-2">
                        <span className="font-medium">Sub total</span>
                        <span>:</span>
                        <span className="text-black font-bold">
                          {formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}
                        </span>
                      </div>

                      {selectedInvoice.taxRate > 0 && (
                        <div className="flex justify-between items-center text-neutral-600 px-2">
                          <span className="font-medium">Tax ({selectedInvoice.taxRate}%)</span>
                          <span>:</span>
                          <span className="text-black font-bold">
                            +{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}
                          </span>
                        </div>
                      )}

                      {selectedInvoice.discountRate > 0 && (
                        <div className="flex justify-between items-center text-neutral-600 px-2">
                          <span className="font-medium">Discount ({selectedInvoice.discountRate}%)</span>
                          <span>:</span>
                          <span className="text-emerald-600 font-bold">
                            -{formatCurrency(selectedInvoice.discountAmount, selectedInvoice.currency)}
                          </span>
                        </div>
                      )}

                      {/* Vibrant Red Gradient Total Pill */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FF2A00] via-[#D60000] to-[#A30000] text-white flex items-center justify-between font-black text-sm sm:text-base shadow-[0_4px_20px_rgba(214,0,0,0.35)] mt-3">
                        <span className="uppercase tracking-wider">TOTAL</span>
                        <span className="text-white/70 font-mono">:</span>
                        <span className="font-mono tracking-tight text-lg sm:text-xl font-black">
                          {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                        </span>
                      </div>

                      {/* Amount Paid & Balance Due if applicable */}
                      {selectedInvoice.amountPaid > 0 && (
                        <div className="flex justify-between items-center text-xs text-emerald-700 px-2 pt-1 font-mono">
                          <span className="font-medium">Amount Paid</span>
                          <span>:</span>
                          <span className="font-bold">
                            {formatCurrency(selectedInvoice.amountPaid, selectedInvoice.currency)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs px-2 pt-1 font-mono">
                        <span className="text-neutral-600 font-medium">Balance Due</span>
                        <span className="text-neutral-500">:</span>
                        <span
                          className={`font-black ${
                            selectedInvoice.balanceDue <= 0 ? 'text-emerald-600' : 'text-[#D60000]'
                          }`}
                        >
                          {formatCurrency(selectedInvoice.balanceDue, selectedInvoice.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Signature Block (Matching reference design!) */}
                    <div className="pt-6 text-center md:text-right space-y-1">
                      <p className="text-sm font-bold text-black tracking-wide">
                        Steven Joe
                      </p>
                      <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
                        Accounting Manager
                      </p>
                      <div className="flex justify-center md:justify-end pt-1">
                        <svg
                          className="w-36 h-12 text-[#D60000]"
                          viewBox="0 0 160 50"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            d="M 12 34 C 22 14, 34 8, 44 22 C 54 38, 34 44, 60 24 C 76 10, 84 38, 100 18 C 110 8, 120 28, 136 14 C 146 4, 154 24, 158 34"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M 40 34 C 58 28, 88 26, 125 30"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* 2. CREATE / EDIT INVOICE MODAL */}
      {/* ===================================================== */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0D0D0D] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-center text-[#FF4D00]">
                  <Receipt className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingInvoice ? `Edit Invoice: ${editingInvoice.invoiceNumber}` : 'Create Client Work Invoice'}
                  </h3>
                  <span className="text-[11px] text-[#A3A3A3]">
                    Itemize creative deliverables and generate an executive billing voucher.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-6">
              {/* Client & Project Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    list="client-suggestions"
                    placeholder="e.g. BAITHULRASA"
                    value={formData.clientName}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                  <datalist id="client-suggestions">
                    {clientSuggestions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Client Company / Brand Entity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Baithulrasa Hospitality & Estate"
                    value={formData.clientCompany}
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Client Email
                  </label>
                  <input
                    type="email"
                    placeholder="billing@client.com"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Client Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+971 4 829 1100"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Project Association & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Associated Project / Work Reference
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => handleProjectSelect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="">-- Custom / Ad-hoc Work --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.client} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Work Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SOCIAL MEDIA POSTERS & EDITORIAL CAMPAIGN"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Client Physical / Billing Address
                  </label>
                  <input
                    type="text"
                    placeholder="Suite / Floor, Street Address, City, Country"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Dates, Invoice #, Currency, Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#A3A3A3] uppercase">
                    Invoice #
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#A3A3A3] uppercase">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="AED">AED (AED)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#A3A3A3] uppercase">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#A3A3A3] uppercase">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Dynamic Line Items Section */}
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Line Items & Creative Deliverables
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[#FF4D00] border border-[#FF4D00]/30 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-3.5 rounded-xl bg-[#080808] border border-white/5 grid grid-cols-12 gap-2.5 items-center"
                    >
                      {/* Description */}
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Deliverable description..."
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                        />
                      </div>

                      {/* Category */}
                      <div className="col-span-6 sm:col-span-2">
                        <select
                          value={item.category || 'Branding'}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                        >
                          <option value="Branding">Branding</option>
                          <option value="Logo Design">Logo Design</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Packaging">Packaging</option>
                          <option value="Web Design">Web Design</option>
                          <option value="Motion">Motion</option>
                          <option value="Consulting">Consulting</option>
                        </select>
                      </div>

                      {/* Qty */}
                      <div className="col-span-3 sm:col-span-1">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full px-2 py-2 rounded-lg bg-[#141414] border border-white/10 text-xs text-white text-center font-mono focus:outline-none focus:border-[#FF4D00]"
                        />
                      </div>

                      {/* Rate */}
                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-[#141414] border border-white/10 text-xs text-white text-right font-mono focus:outline-none focus:border-[#FF4D00]"
                        />
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                        <span className="font-mono font-bold text-xs text-[#FF4D00]">
                          {formatCurrency(item.amount, formData.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 rounded text-red-400 hover:bg-red-950/40"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Computations & Taxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#A3A3A3] uppercase">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.taxRate}
                        onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#A3A3A3] uppercase">
                        Discount Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.discountRate}
                        onChange={(e) => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-[#A3A3A3] uppercase">
                      Initial Amount Paid ({formData.currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({ ...formData, amountPaid: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-[#A3A3A3] uppercase">
                      Payment Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as InvoiceStatus })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white font-mono capitalize"
                    >
                      <option value="pending">Pending</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                {/* Computation Summary Card */}
                <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-white/10 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#A3A3A3]">
                    <span>Items Subtotal:</span>
                    <span>{formatCurrency(formCalculations.subtotal, formData.currency)}</span>
                  </div>
                  {formData.discountRate > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({formData.discountRate}%):</span>
                      <span>-{formatCurrency(formCalculations.discountAmount, formData.currency)}</span>
                    </div>
                  )}
                  {formData.taxRate > 0 && (
                    <div className="flex justify-between text-[#A3A3A3]">
                      <span>Tax ({formData.taxRate}%):</span>
                      <span>+{formatCurrency(formCalculations.taxAmount, formData.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold text-base text-white">
                    <span>Total Amount:</span>
                    <span className="text-[#FF4D00]">
                      {formatCurrency(formCalculations.total, formData.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400 pt-1">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(formData.amountPaid, formData.currency)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#141414] border border-white/10 flex justify-between font-bold text-xs">
                    <span>Balance Due:</span>
                    <span className={formCalculations.balanceDue <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {formatCurrency(formCalculations.balanceDue, formData.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Bank / Payment Instructions
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Wire transfer instructions, IBAN, Swift code, or online payment link..."
                    value={formData.paymentDetails}
                    onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                    Terms & Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Payment terms, late fee policy, and appreciation notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#A3A3A3] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#FF4D00] hover:bg-[#FF7A00] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,77,0,0.3)] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingInvoice ? 'Update Invoice' : 'Generate Client Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* 3. RECORD PAYMENT QUICK MODAL */}
      {/* ===================================================== */}
      {paymentModalOpen && paymentTargetInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0D0D0D] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <CreditCard className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Record Client Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded-full text-[#A3A3A3] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#080808] border border-white/5 space-y-1 text-xs">
              <p className="font-bold text-white">{paymentTargetInvoice.clientName}</p>
              <p className="text-[11px] text-[#A3A3A3] font-mono">Invoice #{paymentTargetInvoice.invoiceNumber}</p>
              <div className="flex justify-between pt-1 font-mono text-xs">
                <span className="text-[#737373]">Outstanding Balance:</span>
                <span className="font-bold text-amber-400">
                  {formatCurrency(paymentTargetInvoice.balanceDue, paymentTargetInvoice.currency)}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                  Payment Amount Received ({paymentTargetInvoice.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 capitalize"
                >
                  <option value="bank_transfer">Bank Wire / Transfer</option>
                  <option value="stripe">Stripe / Credit Card</option>
                  <option value="upi">UPI / Instant Pay</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash</option>
                  <option value="crypto">Cryptocurrency (USDT/BTC)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A3A3A3] uppercase">
                  Payment Reference / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wire Ref #TXN-882910 or Stripe charge ID"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-white/5 text-xs text-[#A3A3A3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
