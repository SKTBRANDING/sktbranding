'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Designer, Task } from '@/types';
import DesignerAccessScreen from './DesignerAccessScreen';
import DesignerDashboard from './DesignerDashboard';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface DesignerRootProps {
  initialDesigner: Designer | null;
  initialTasks: Task[];
  initialToken?: string | null;
}

export default function DesignerRoot({
  initialDesigner,
  initialTasks,
  initialToken,
}: DesignerRootProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [designer, setDesigner] = useState<Designer | null>(initialDesigner);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // If token is present in searchParams, initialToken, or localStorage, verify token
  useEffect(() => {
    let tokenFromUrl: string | null = null;
    try {
      if (typeof window !== 'undefined' && window.location?.search) {
        tokenFromUrl = new URLSearchParams(window.location.search).get('token');
      } else if (searchParams && typeof (searchParams as any).get === 'function') {
        tokenFromUrl = (searchParams as any).get('token');
      }
    } catch {
      tokenFromUrl = null;
    }

    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('skt_designer_token') : null;
    const activeToken = tokenFromUrl || initialToken || savedToken;
    if (activeToken && !designer) {
      handleVerifyToken(activeToken);
    }
  }, [searchParams, initialToken]);

  const handleVerifyToken = async (token: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch('/api/designer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return false;
      }

      const activeToken = data.token || data.designer?.token || token;
      if (typeof window !== 'undefined' && activeToken) {
        try {
          localStorage.setItem('skt_designer_token', activeToken);
        } catch {}
      }

      setDesigner(data.designer);
      await refreshTasks(activeToken);
      showToast(`Welcome back, ${data.designer.name}!`);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = async (overrideToken?: string) => {
    try {
      const savedToken = overrideToken || (typeof window !== 'undefined' ? localStorage.getItem('skt_designer_token') : null);
      const headers: Record<string, string> = {};
      if (savedToken) {
        headers['x-designer-token'] = savedToken;
      }
      const res = await fetch('/api/tasks', { headers });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (Array.isArray(data)) {
          setTasks(data);
        }
      }
    } catch (err) {
      console.error('Error refreshing tasks:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/designer/auth', { method: 'DELETE' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('skt_designer_token');
        } catch {}
      }
      setDesigner(null);
      setTasks([]);
      navigate('/designer');
      showToast('Signed out of designer studio.');
    }
  };

  return (
    <>
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

      {designer ? (
        <DesignerDashboard
          designer={designer}
          initialTasks={tasks}
          onLogout={handleLogout}
          showToast={showToast}
          onRefreshTasks={refreshTasks}
        />
      ) : (
        <DesignerAccessScreen onVerifyToken={handleVerifyToken} />
      )}
    </>
  );
}
