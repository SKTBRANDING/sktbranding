import React, { useState, useEffect } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import PublicWebsite from './components/public/PublicWebsite';
import AdminRoot from './components/admin/AdminRoot';
import DesignerRoot from './components/designer/DesignerRoot';
import { initialData as fallbackData } from './lib/initialData';
import { api } from './api';

// ==========================================
// 1. Public Website Page Component
// ==========================================
function PublicWebsitePage() {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [projects, services, content, settings, testimonials] = await Promise.all([
          api.getProjects(false).catch(() => null),
          api.getServices(false).catch(() => null),
          api.getContent().catch(() => null),
          api.getSettings().catch(() => null),
          api.getTestimonials(false).catch(() => null),
        ]);

        if (isMounted) {
          setData((prev) => ({
            projects: projects && projects.length ? projects : prev.projects,
            services: services && services.length ? services : prev.services,
            content: content || prev.content,
            settings: settings || prev.settings,
            testimonials: testimonials && testimonials.length ? testimonials : prev.testimonials,
            inquiries: prev.inquiries || [],
            tasks: prev.tasks || [],
            designers: prev.designers || [],
          }));
        }
      } catch (err) {
        console.warn('Using offline cached dataset:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return <PublicWebsite initialData={data} />;
}

// ==========================================
// 2. Admin Studio Portal Route
// ==========================================
function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState(fallbackData);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkAdmin() {
      try {
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('skt_admin_token') : null;
        const authHeaders = savedToken ? { Authorization: `Bearer ${savedToken}` } : {};
        const authRes = await fetch('/api/auth/me', { credentials: 'include', headers: authHeaders });
        const authJson = await authRes.json().catch(() => ({}));
        if (isMounted && authJson.authenticated) {
          setIsAuthenticated(true);
        }

        // Fetch current studio dataset
        const [projects, services, content, settings, testimonials, inquiries, tasks, designers, invoices] =
          await Promise.all([
            fetch('/api/projects?all=true', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
            fetch('/api/services?all=true', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
            fetch('/api/content', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
            fetch('/api/settings', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
            fetch('/api/testimonials?all=true', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
            fetch('/api/inquiries', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
            fetch('/api/tasks', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
            fetch('/api/designers', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
            fetch('/api/invoices', { credentials: 'include', headers: authHeaders }).then((r) => r.json()).catch(() => null),
          ]);

        if (isMounted) {
          setData((prev) => ({
            projects: Array.isArray(projects) ? projects : prev.projects,
            services: Array.isArray(services) ? services : prev.services,
            content: content || prev.content,
            settings: settings || prev.settings,
            testimonials: Array.isArray(testimonials) ? testimonials : prev.testimonials,
            inquiries: Array.isArray(inquiries) ? inquiries : prev.inquiries || [],
            tasks: Array.isArray(tasks) ? tasks : prev.tasks || [],
            designers: Array.isArray(designers) ? designers : prev.designers || [],
            invoices: Array.isArray(invoices) ? invoices : prev.invoices || [],
          }));
        }
      } catch (err) {
        console.error('Admin bootstrap error:', err);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <div className="w-10 h-10 border-2 border-[#FF4D00] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#A3A3A3] font-mono tracking-wider uppercase">
            Loading SKT Admin Studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminRoot
      initialAuthenticated={isAuthenticated}
      initialData={data}
    />
  );
}

// ==========================================
// 3. Designer Studio Route
// ==========================================
function DesignerPage() {
  let token = null;
  if (typeof window !== 'undefined' && window.location?.search) {
    try {
      token = new URLSearchParams(window.location.search).get('token');
    } catch {
      token = null;
    }
  }

  return (
    <DesignerRoot
      initialDesigner={null}
      initialTasks={[]}
      initialToken={token}
    />
  );
}

// ==========================================
// 4. Error Boundary & Main App Routing
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App crashed with uncaught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center text-white">
          <div className="space-y-4 max-w-md">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30 inline-block">
              SKT BRANDING RECOVERY
            </span>
            <h1 className="text-2xl font-black">Something went wrong</h1>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              We encountered a temporary rendering issue. Please click below to reload the page.
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
              className="inline-block px-5 py-2.5 rounded-full bg-[#FF4D00] text-black font-extrabold text-xs tracking-wider uppercase hover:bg-[#FF7A00] transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<PublicWebsitePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/designer" element={<DesignerPage />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
              <div className="space-y-4 max-w-md">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30 inline-block">
                  404 Not Found
                </span>
                <h1 className="text-3xl font-black text-white">Route Not Discovered</h1>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  The requested URL does not exist or has been migrated.
                </p>
                <a
                  href="/"
                  className="inline-block px-5 py-2.5 rounded-full bg-[#FF4D00] text-black font-extrabold text-xs tracking-wider uppercase hover:bg-[#FF7A00] transition-all"
                >
                  Return to SKT Branding
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
