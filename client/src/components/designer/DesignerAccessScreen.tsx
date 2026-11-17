'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Key,
} from 'lucide-react';

interface DesignerAccessScreenProps {
  onVerifyToken: (token: string) => Promise<boolean>;
  errorMessage?: string | null;
}

export default function DesignerAccessScreen({
  onVerifyToken,
  errorMessage,
}: DesignerAccessScreenProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(errorMessage || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) return;

    // If user pasted a full URL, extract token query param
    let extractedToken = cleaned;
    if (cleaned.includes('token=')) {
      try {
        const url = new URL(cleaned);
        extractedToken = url.searchParams.get('token') || cleaned;
      } catch {
        const match = cleaned.match(/token=([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) extractedToken = match[1];
      }
    }

    setLoading(true);
    setLocalError(null);
    try {
      const success = await onVerifyToken(extractedToken);
      if (!success) {
        setLocalError('Invalid, expired, or revoked invitation link. Please request a new link from your agency administrator.');
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify your invitation link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col justify-between selection:bg-[#FF4D00] selection:text-black">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF4D00]/10 rounded-full blur-[140px] pointer-events-none"
      />

      {/* Header */}
      <header className="px-6 sm:px-12 py-6 flex items-center justify-between border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#141414] border border-[#FF4D00]/50 flex items-center justify-center shadow-[0_0_12px_rgba(255,77,0,0.3)]">
            <span className="text-[#FF4D00] font-black text-sm">S</span>
          </div>
          <div>
            <span className="text-sm font-bold tracking-wider text-white">SKT BRANDING</span>
            <span className="text-[10px] text-[#FF4D00] block tracking-widest uppercase -mt-0.5 font-mono">
              Creative Studio Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#737373]">
          <Lock className="w-3.5 h-3.5 text-[#FF4D00]" />
          <span>Restricted Designer Access</span>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md luxury-card rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-black border border-[#FF4D00]/40 flex items-center justify-center mx-auto text-[#FF4D00] shadow-[0_0_25px_rgba(255,77,0,0.25)]">
              <Key className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight pt-2">
              Designer Studio Access
            </h1>
            <p className="text-xs text-[#A3A3A3] leading-relaxed max-w-xs mx-auto">
              Welcome to the private SKT Branding designer studio. Please access using your personal invitation link or enter your access token below.
            </p>
          </div>

          {(localError || errorMessage) && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{localError || errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                Invitation Link or Access Token
              </label>
              <input
                type="text"
                required
                placeholder="Paste your invitation link or token..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white placeholder-[#737373] focus:outline-none focus:border-[#FF4D00] font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="w-full py-3.5 rounded-full bg-[#FF4D00] hover:bg-[#FF7A00] text-black text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,77,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Access Designer Workspace'}</span>
              <ArrowRight className="w-4 h-4 font-bold" />
            </button>
          </form>

          <div className="p-3.5 rounded-xl bg-black border border-white/5 text-center text-[11px] text-[#737373] space-y-1">
            <p className="flex items-center justify-center gap-1.5 text-[#A3A3A3]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Strict End-to-End Privacy</span>
            </p>
            <p>
              Don&apos;t have an invitation link? Please contact your SKT Branding administrator to be added to the agency team.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/[0.06] text-center text-[11px] text-[#525252] relative z-10">
        SKT Branding Agency Studio • Private Designer Workspace
      </footer>
    </div>
  );
}
