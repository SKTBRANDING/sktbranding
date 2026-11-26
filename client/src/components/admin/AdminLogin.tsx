'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Database } from 'lucide-react';
import { setAdminToken } from '@/lib/adminApi';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      let data: any = null;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = {};
      }

      if (!res.ok) {
        throw new Error(
          (data && data.error) ||
          `Authentication failed (${res.status}). Please check credentials or ensure backend server is running.`
        );
      }

      if (data && data.token) {
        setAdminToken(data.token);
      }

      onLoginSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center px-4 relative hero-glow-bg">
      {/* Background ambient glow */}
      <div 
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF4D00]/15 rounded-full blur-[130px] pointer-events-none" 
      />

      <div className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-8 space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#141414] border border-[#FF4D00]/40 flex items-center justify-center group-hover:border-[#FF4D00] transition-colors shadow-[0_0_20px_rgba(255,77,0,0.3)]">
              <span className="text-[#FF4D00] font-black text-xl">S</span>
            </div>
            <div className="text-left">
              <span className="block text-lg font-bold tracking-wider text-white">
                SKT BRANDING
              </span>
              <span className="block text-[10px] tracking-widest text-[#FF4D00] uppercase font-semibold">
                Studio Management Portal
              </span>
            </div>
          </Link>
          <p className="text-xs text-[#A3A3A3]">
            Access restricted to authorized agency team members.
          </p>
        </div>

        {/* Login Card */}
        <div className="luxury-card rounded-3xl p-8 border border-white/10 shadow-2xl relative">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lock className="w-4 h-4 text-[#FF4D00]" />
              <span>Admin Authentication</span>
            </div>
            <span className="text-[10px] font-mono text-[#737373] uppercase tracking-wider">
              Protected Area
            </span>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
                Access Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 pr-12 rounded-xl bg-[#0a0a0a] border border-white/10 text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#A3A3A3] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all duration-300 shadow-[0_0_20px_rgba(255,77,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-[#737373]">
              <span>Default Master Password:</span>
              <code className="text-[#FF7A00] font-mono bg-black/50 px-2 py-0.5 rounded border border-white/5">
                admin123
              </code>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-xs text-[#A3A3A3] hover:text-[#FF4D00] transition-colors text-center py-1 underline underline-offset-4"
            >
              Fill default password automatically
            </button>
          </div>
        </div>

        {/* System Persistence Indicator */}
        <div className="mt-6 p-4 rounded-2xl bg-[#141414]/70 border border-white/5 flex items-center gap-3 text-xs text-[#A3A3A3]">
          <Database className="w-4 h-4 text-[#FF4D00] flex-shrink-0" />
          <p>
            Connected to <strong>Local Persistent Storage</strong> with instant live synchronization to the public website.
          </p>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-[#737373] hover:text-[#A3A3A3] transition-colors"
          >
            ← Return to Public Agency Website
          </Link>
        </div>
      </div>
    </div>
  );
}
