'use client';

import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Tag,
  Edit2,
  Trash2,
  ArrowUpRight,
  Briefcase,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Client } from '@/types';
import { adminFetch } from '@/lib/adminApi';

interface AdminClientsProps {
  clients: Client[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onOpenCreateClient: () => void;
  onEditClient: (client: Client) => void;
  onAssignWorkForClient?: (client: Client) => void;
}

export default function AdminClients({
  clients,
  onRefresh,
  showToast,
  onOpenCreateClient,
  onEditClient,
  onAssignWorkForClient,
}: AdminClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const handleDeleteClient = async (client: Client) => {
    const id = client.id || (client as any)._id;
    if (!confirm(`Are you sure you want to remove client "${client.name}"? This will not delete past invoices.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await adminFetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
      showToast(`Client "${client.name}" removed.`);
      await onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error deleting client', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Client Directory & Service Pricing
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30">
              {clients.length} Clients
            </span>
          </div>
          <p className="text-xs text-[#A3A3A3] mt-1">
            Manage clients, billing contacts, and custom service rates (e.g. Poster ₹300, Video ₹500)
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateClient}
          className="px-5 py-2.5 rounded-full bg-[#FF4D00] hover:bg-[#FF7A00] text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,77,0,0.3)] flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#737373] absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search by client name, company, phone, email, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#0a0a0a] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] transition-colors"
        />
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#0a0a0a] border border-white/10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#737373]">
            <Building className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No clients found</h3>
            <p className="text-xs text-[#737373]">
              {searchQuery ? 'No client profiles matched your search.' : 'Add your first client with custom service rates.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateClient}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF4D00] text-black font-bold text-xs uppercase"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Client Profile</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const rates = client.serviceRates || [];

            return (
              <div
                key={client.id || (client as any)._id}
                className="luxury-card rounded-2xl p-5 border border-white/10 space-y-4 hover:border-white/20 transition-all group bg-[#0d0d0d]"
              >
                {/* Client Top Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/40 flex items-center justify-center text-[#FF4D00] font-black text-sm">
                      {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                        <span>{client.name}</span>
                      </h3>
                      {client.company && (
                        <p className="text-xs text-[#A3A3A3] font-medium">{client.company}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditClient(client)}
                      className="p-2 rounded-xl text-[#A3A3A3] hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit Client & Rates"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClient(client)}
                      disabled={deletingId === (client.id || (client as any)._id)}
                      className="p-2 rounded-xl text-[#737373] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Delete Client"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact Details List */}
                <div className="space-y-1.5 text-xs text-[#A3A3A3] pt-1 border-t border-white/5">
                  {client.phone && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 text-[11px] text-[#737373]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF4D00] flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Configured Service Rates Section */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[#737373]">
                    <span className="flex items-center gap-1 text-[#FF4D00]">
                      <Tag className="w-3 h-3" />
                      <span>Custom Service Rates</span>
                    </span>
                    <span>{rates.length} Services</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {rates.map((sr, idx) => (
                      <span
                        key={sr.serviceName || idx}
                        className="px-2.5 py-1 rounded-lg text-xs bg-black/60 border border-white/10 flex items-center gap-1.5"
                      >
                        <span className="text-[#E5E5E5] font-medium">{sr.serviceName}</span>
                        <span className="text-emerald-400 font-mono font-bold">₹{sr.rate.toLocaleString()}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Action Button: Upload & Assign Work for this client */}
                {onAssignWorkForClient && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onAssignWorkForClient(client)}
                      className="w-full py-2 rounded-xl bg-white/5 hover:bg-[#FF4D00]/15 hover:text-[#FF4D00] hover:border-[#FF4D00]/40 border border-white/5 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 group"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Assign New Work for {client.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
