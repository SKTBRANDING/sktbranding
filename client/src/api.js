import { API_BASE } from '@/lib/apiBase';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If body is FormData, delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  verifyAuth: () => apiRequest('/auth/verify'),

  // Tasks (Work Management)
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/tasks${query ? `?${query}` : ''}`);
  },
  getTaskById: (id) => apiRequest(`/tasks/${id}`),
  createTask: (taskData) => apiRequest('/tasks', { method: 'POST', body: JSON.stringify(taskData) }),
  updateTask: (id, taskData) => apiRequest(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(taskData) }),
  deleteTask: (id) => apiRequest(`/tasks/${id}`, { method: 'DELETE' }),
  claimTask: (id, token) => apiRequest(`/tasks/${id}/claim`, { method: 'POST', headers: { 'x-designer-token': token } }),
  startTask: (id, token) => apiRequest(`/tasks/${id}/start`, { method: 'POST', headers: { 'x-designer-token': token } }),
  submitTask: (id, submissionData, token) => apiRequest(`/tasks/${id}/submit`, { method: 'POST', headers: { 'x-designer-token': token }, body: JSON.stringify(submissionData) }),
  reviewTask: (id, reviewData) => apiRequest(`/tasks/${id}/review`, { method: 'POST', body: JSON.stringify(reviewData) }),
  uploadTaskFile: (file, token = null) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = token ? { 'x-designer-token': token } : {};
    return apiRequest('/tasks/upload', { method: 'POST', headers, body: formData });
  },

  // Designers
  getDesigners: () => apiRequest('/designers'),
  createDesigner: (data) => apiRequest('/designers', { method: 'POST', body: JSON.stringify(data) }),
  updateDesigner: (id, data) => apiRequest(`/designers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  regenerateDesignerToken: (id) => apiRequest(`/designers/${id}/regenerate-token`, { method: 'POST' }),
  deleteDesigner: (id) => apiRequest(`/designers/${id}`, { method: 'DELETE' }),
  verifyDesignerToken: (token) => apiRequest(`/designers/verify?token=${encodeURIComponent(token)}`),

  // Projects
  getProjects: (all = false) => apiRequest(`/projects${all ? '?all=true' : ''}`),
  createProject: (data) => apiRequest('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => apiRequest(`/projects/${id}`, { method: 'DELETE' }),

  // Services, Testimonials, Content, Settings, Inquiries
  getServices: (all = false) => apiRequest(`/services${all ? '?all=true' : ''}`),
  getTestimonials: (all = false) => apiRequest(`/testimonials${all ? '?all=true' : ''}`),
  getContent: () => apiRequest('/content'),
  updateContent: (data) => apiRequest('/content', { method: 'PUT', body: JSON.stringify(data) }),
  getSettings: () => apiRequest('/settings'),
  updateSettings: (data) => apiRequest('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getInquiries: () => apiRequest('/inquiries'),
  submitInquiry: (data) => apiRequest('/inquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateInquiry: (id, data) => apiRequest(`/inquiries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInquiry: (id) => apiRequest(`/inquiries/${id}`, { method: 'DELETE' }),
};
