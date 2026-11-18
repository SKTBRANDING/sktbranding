'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  Video,
  Film,
  Play,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { Project, ProjectCategory } from '@/types';
import { adminFetch, uploadMediaFile, uploadMultipleMediaFiles } from '@/lib/adminApi';

interface AdminProjectsProps {
  projects: Project[];
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function AdminProjects({ projects, onRefresh, showToast }: AdminProjectsProps) {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const getEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return null;
  };

  const isDirectVideo = (url?: string): boolean => {
    if (!url) return false;
    const clean = url.split('?')[0].toLowerCase();
    return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.endsWith('.ogg') || clean.endsWith('.mkv') || (clean.includes('/uploads/') && !clean.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i));
  };

  // Helper to resize/format any image into width 1920px and height 1080px (16:9 Full HD)
  const resizeImageToSocialMediaDimensions = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (file.type === 'image/svg+xml') {
        resolve(file);
        return;
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        const targetWidth = 1920;
        const targetHeight = 1080;
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fit and crop preserving exact 1920 x 1080 (16:9) aspect ratio
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const x = (targetWidth - img.width * scale) / 2;
        const y = (targetHeight - img.height * scale) / 2;

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '') + '-1920x1080.jpg',
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              );
              resolve(resizedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.95
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  };

  // Form state
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    client: '',
    category: 'Branding',
    year: new Date().getFullYear().toString(),
    coverImage: '',
    imageAlt: '',
    galleryImages: [],
    videoUrl: '',
    videoAspectRatio: '16:9',
    overview: '',
    services: [],
    approach: '',
    externalLink: '',
    isFeatured: false,
    published: true,
    order: 1,
  });

  const [servicesInput, setServicesInput] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      client: '',
      category: 'Branding',
      year: new Date().getFullYear().toString(),
      coverImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=1200&q=80',
      imageAlt: '',
      galleryImages: [],
      videoUrl: '',
      videoAspectRatio: '16:9',
      overview: '',
      services: [],
      approach: '',
      externalLink: '',
      isFeatured: false,
      published: true,
      order: projects.length + 1,
    });
    setServicesInput('');
    setModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setFormData({
      ...p,
      galleryImages: [...(p.galleryImages || [])],
      videoUrl: p.videoUrl || '',
      videoAspectRatio: p.videoAspectRatio || '16:9',
    });
    setServicesInput((p.services || []).join(', '));
    setModalOpen(true);
  };

  const handleVideoUpload = async (file: File) => {
    try {
      setUploadingVideo(true);

      // Check max size: 100MB
      if (file.size > 100 * 1024 * 1024) {
        showToast('Video size exceeds 100MB limit. Please compress or optimize the video.', 'error');
        return;
      }

      showToast(`Uploading video (${(file.size / (1024 * 1024)).toFixed(1)} MB)... Please wait`);

      const url = await uploadMediaFile(file);
      if (url) {
        setFormData((prev) => ({ ...prev, videoUrl: url }));
        showToast('Showcase video uploaded successfully!');
      } else {
        throw new Error('Failed to upload video');
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleFileUpload = async (file: File, isGallery = false) => {
    try {
      if (isGallery) setUploadingGallery(true);
      else setUploadingCover(true);

      showToast(`Uploading ${isGallery ? 'gallery media' : 'cover photo'}...`);
      const url = await uploadMediaFile(file);

      if (url) {
        if (isGallery) {
          setFormData((prev) => ({
            ...prev,
            galleryImages: [...(prev.galleryImages || []), url],
          }));
          showToast('Gallery photo added successfully!');
        } else {
          setFormData((prev) => ({ ...prev, coverImage: url }));
          showToast('Cover image updated successfully!');
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      if (isGallery) setUploadingGallery(false);
      else setUploadingCover(false);
    }
  };

  const handleBatchGalleryUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    try {
      setUploadingGallery(true);
      showToast(`Processing & uploading ${fileList.length} photo${fileList.length > 1 ? 's' : ''}...`);

      const urls = await uploadMultipleMediaFiles(fileList);
      if (urls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          galleryImages: [...(prev.galleryImages || []), ...urls],
        }));
        showToast(`Successfully added ${urls.length} photo${urls.length > 1 ? 's' : ''} to gallery!`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.client || !formData.coverImage) {
      showToast('Title, client, and cover image are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const parsedServices = servicesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...formData,
        services: parsedServices,
      };

      if (editingProject) {
        // Update existing
        const res = await adminFetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update project');
        }
        showToast('Project updated successfully!');
      } else {
        // Create new
        const res = await adminFetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to create project');
        }
        showToast('New project created and published!');
      }

      await onRefresh();
      setModalOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await adminFetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      showToast('Project deleted successfully');
      setDeleteConfirmId(null);
      await onRefresh();
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  const togglePublish = async (project: Project) => {
    try {
      const res = await adminFetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !project.published }),
      });
      if (!res.ok) throw new Error('Failed to toggle publication');
      await onRefresh();
      showToast(project.published ? 'Project unpublished (Draft)' : 'Project published!');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  const toggleFeatured = async (project: Project) => {
    try {
      const res = await adminFetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !project.isFeatured }),
      });
      if (!res.ok) throw new Error('Failed to toggle featured status');
      await onRefresh();
      showToast(project.isFeatured ? 'Removed from featured' : 'Marked as featured!');
    } catch (err: unknown) {
      const error = err as Error;
      showToast(error.message, 'error');
    }
  };

  // Filter projects list
  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Portfolio Project Management
          </h2>
          <p className="text-xs text-[#A3A3A3]">
            Add, update, feature, or reorder showcase work displayed on the public site.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#141414] border border-white/10">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by project title or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white placeholder-[#525252] focus:outline-none focus:border-[#FF4D00]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {['All', 'Branding', 'Logo Design', 'Social Media', 'Packaging', 'Web Design'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-[#FF4D00] text-black font-semibold'
                  : 'bg-[#0a0a0a] text-[#A3A3A3] hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table / Card List */}
      {filtered.length === 0 ? (
        <div className="luxury-card rounded-3xl p-12 text-center border border-white/10">
          <ImageIcon className="w-10 h-10 text-[#737373] mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No projects found</h3>
          <p className="text-xs text-[#A3A3A3] mt-1">Try adjusting your search criteria or add a new project.</p>
        </div>
      ) : (
        <div className="luxury-card rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#A3A3A3]">
              <thead className="bg-[#0d0d0d] text-[11px] uppercase tracking-wider text-white border-b border-white/10">
                <tr>
                  <th className="py-4 px-5">Project</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Client / Year</th>
                  <th className="py-4 px-4">Order</th>
                  <th className="py-4 px-4 text-center">Featured</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Project Title & Cover Preview */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-11 rounded-lg overflow-hidden bg-black border border-white/10 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.coverImage}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="block font-bold text-white text-sm hover:text-[#FF4D00] transition-colors">
                              {p.title}
                            </span>
                            {p.videoUrl && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30"
                                title={`Has ${p.videoAspectRatio === '9:16' ? 'Story Size (9:16)' : 'YouTube Size (16:9)'} video`}
                              >
                                {p.videoAspectRatio === '9:16' ? (
                                  <>
                                    <Smartphone className="w-2.5 h-2.5" /> Story Video
                                  </>
                                ) : (
                                  <>
                                    <Monitor className="w-2.5 h-2.5" /> YouTube Video
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          {p.isSample && (
                            <span className="inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] bg-white/10 text-[#A3A3A3]">
                              Sample Preview
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#1a1a1a] text-[#F5F5F5] border border-white/10">
                        {p.category}
                      </span>
                    </td>

                    {/* Client & Year */}
                    <td className="py-4 px-4">
                      <span className="block font-medium text-white">{p.client}</span>
                      <span className="text-[10px] text-[#737373]">{p.year}</span>
                    </td>

                    {/* Order */}
                    <td className="py-4 px-4 font-mono text-white">
                      #{p.order}
                    </td>

                    {/* Featured toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(p)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          p.isFeatured
                            ? 'bg-[#FF4D00]/20 border-[#FF4D00]/40 text-[#FF4D00]'
                            : 'bg-[#0a0a0a] border-white/5 text-[#525252] hover:text-white'
                        }`}
                        title={p.isFeatured ? 'Featured on home' : 'Click to feature'}
                      >
                        <Star className={`w-4 h-4 ${p.isFeatured ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Published toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => togglePublish(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                          p.published
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {p.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{p.published ? 'Published' : 'Draft'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white transition-colors"
                          title="Edit project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors"
                          title="Delete project"
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#141414] border border-red-500/30 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Delete this project?</h3>
            <p className="text-xs text-[#A3A3A3]">
              This action cannot be undone and will permanently remove this case study from the website.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors shadow-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 bg-[#141414] border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#FF4D00]" />
                <h3 className="text-base font-bold text-white">
                  {editingProject ? `Edit Project: ${editingProject.title}` : 'Create New Portfolio Project'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Row 1: Title & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Aethelgard Spirits"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="e.g. Distillers Co."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Row 2: Category & Year & Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Project['category'] })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  >
                    <option value="Branding">Branding</option>
                    <option value="Logo Design">Logo Design</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Web Design">Web Design</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Year
                  </label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2025"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Social Media Dimension Indicator */}
              {formData.category === 'Social Media' && (
                <div className="p-3.5 rounded-2xl bg-[#FF4D00]/10 border border-[#FF4D00]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#FF4D00] flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white">
                        Social Media Upload Standard: 1920 × 1080 px
                      </p>
                      <p className="text-[11px] text-[#A3A3A3]">
                        Uploads are automatically formatted to <strong>Width: 1920px</strong> and <strong>Height: 1080px</strong> (16:9 Full HD).
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#FF4D00] text-black">
                    1920 × 1080 PX
                  </span>
                </div>
              )}

              {/* Cover Image & Alt */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#141414] border border-white/10">
                <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                  Cover Image & Preview *
                </label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Image Preview Box */}
                  <div className={`w-full sm:w-44 ${formData.category === 'Social Media' ? 'aspect-[16/9]' : 'aspect-[16/10]'} rounded-xl overflow-hidden bg-black border border-white/10 flex-shrink-0`}>
                    {formData.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formData.coverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#737373]">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Image URL (e.g. https://...)"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />

                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer text-white transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                        <span>{uploadingCover ? 'Uploading...' : 'Upload Cover File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleFileUpload(f, false);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                      <span className="text-[10px] text-[#737373]">Supports JPG, PNG, WEBP, SVG</span>
                    </div>

                    <input
                      type="text"
                      placeholder="Image Alt Text (accessibility)"
                      value={formData.imageAlt}
                      onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />
                  </div>
                </div>
              </div>

              {/* Gallery Images & Media List */}
              <div className="space-y-3 p-4 rounded-2xl bg-[#141414] border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Gallery Mockups & Media Assets ({formData.galleryImages?.length || 0})
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer text-white transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>{uploadingGallery ? 'Uploading...' : 'Upload Media'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov,.ogg"
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          handleBatchGalleryUpload(files);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or enter gallery image/video URL and press Add..."
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newGalleryUrl.trim()) {
                          setFormData((prev) => ({
                            ...prev,
                            galleryImages: [...(prev.galleryImages || []), newGalleryUrl.trim()],
                          }));
                          setNewGalleryUrl('');
                          showToast('Added media URL to gallery list');
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newGalleryUrl.trim()) {
                        setFormData((prev) => ({
                          ...prev,
                          galleryImages: [...(prev.galleryImages || []), newGalleryUrl.trim()],
                        }));
                        setNewGalleryUrl('');
                        showToast('Added media URL to gallery list');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white"
                  >
                    Add
                  </button>
                </div>

                {formData.galleryImages && formData.galleryImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                    {formData.galleryImages.map((mediaUrl, idx) => {
                      const isVid = isDirectVideo(mediaUrl);
                      return (
                        <div key={idx} className="relative group aspect-[16/10] rounded-lg overflow-hidden bg-black border border-white/10">
                          {isVid ? (
                            <div className="relative w-full h-full bg-black">
                              <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] bg-black/80 text-[#FF4D00] font-mono flex items-center gap-0.5">
                                <Play className="w-2.5 h-2.5 fill-current" /> Video
                              </span>
                            </div>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={mediaUrl} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                galleryImages: prev.galleryImages?.filter((_, i) => i !== idx),
                              }));
                            }}
                            className="absolute top-1 right-1 p-1 rounded bg-black/80 hover:bg-red-600 text-white transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Project Video Showcase (Direct Upload or Link) */}
              <div className="space-y-4 p-4 rounded-2xl bg-[#141414] border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#FF4D00]" />
                    <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                      Project Video / Motion Showcase (Optional)
                    </label>
                  </div>
                  {formData.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, videoUrl: '' }))}
                      className="text-[11px] text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove Video</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[#737373]">
                  Upload an MP4, WebM, or MOV motion reel (up to 100MB), or paste a direct video / YouTube / Vimeo link.
                </p>

                {/* Video Size / Aspect Ratio Selector: YouTube (16:9) vs Story (9:16) */}
                <div className="space-y-1.5 p-3 rounded-xl bg-[#0a0a0a] border border-white/10">
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#A3A3A3]">
                    Video Display Size / Format *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, videoAspectRatio: '16:9' }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        (formData.videoAspectRatio || '16:9') === '16:9'
                          ? 'bg-[#FF4D00]/15 border-[#FF4D00] text-white shadow-[0_0_15px_rgba(255,77,0,0.25)]'
                          : 'bg-[#141414] border-white/10 text-[#A3A3A3] hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-[#FF4D00]">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">YouTube Size (16:9)</span>
                        <span className="block text-[10px] text-[#737373]">Standard horizontal widescreen</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, videoAspectRatio: '9:16' }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        formData.videoAspectRatio === '9:16'
                          ? 'bg-[#FF4D00]/15 border-[#FF4D00] text-white shadow-[0_0_15px_rgba(255,77,0,0.25)]'
                          : 'bg-[#141414] border-white/10 text-[#A3A3A3] hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-black/60 border border-white/10 text-[#FF4D00]">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-white">Story Size (9:16)</span>
                        <span className="block text-[10px] text-[#737373]">Vertical format for Stories & Reels</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Video Preview Box if videoUrl exists */}
                {formData.videoUrl && (
                  <div className="p-4 rounded-xl bg-black/60 border border-white/5 flex flex-col items-center justify-center">
                    <div className="w-full flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-[#A3A3A3]">
                        Live Player Preview:
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40">
                        {formData.videoAspectRatio === '9:16' ? (
                          <>
                            <Smartphone className="w-3 h-3" /> 9:16 Story Size
                          </>
                        ) : (
                          <>
                            <Monitor className="w-3 h-3" /> 16:9 YouTube Size
                          </>
                        )}
                      </span>
                    </div>

                    <div
                      className={`relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center transition-all ${
                        formData.videoAspectRatio === '9:16'
                          ? 'w-[230px] aspect-[9/16] ring-1 ring-white/20'
                          : 'w-full aspect-video max-h-72'
                      }`}
                    >
                      {getEmbedUrl(formData.videoUrl) ? (
                        <iframe
                          src={getEmbedUrl(formData.videoUrl)!}
                          className="w-full h-full border-0"
                          title="Video preview"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={formData.videoUrl}
                          controls
                          playsInline
                          className={`w-full h-full bg-black ${
                            formData.videoAspectRatio === '9:16' ? 'object-cover' : 'object-contain'
                          }`}
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Paste video URL (e.g. /uploads/...mp4 or https://youtube.com/watch?v=...)"
                      value={formData.videoUrl || ''}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-xl bg-[#0a0a0a] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                    />

                    <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs cursor-pointer text-white transition-colors flex-shrink-0">
                      <Upload className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>{uploadingVideo ? 'Uploading Video...' : 'Upload Video File'}</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov,.ogg"
                        disabled={uploadingVideo}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleVideoUpload(f);
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#737373]">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Max 100MB
                    </span>
                    <span>•</span>
                    <span>Supports MP4, WebM, MOV, OGG</span>
                    <span>•</span>
                    <span>YouTube & Vimeo embeds supported</span>
                  </div>
                </div>
              </div>

              {/* Overview & Services */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Overview Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.overview}
                    onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                    placeholder="Concise overview of the client brief and outcome..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Services Provided (comma-separated tags)
                  </label>
                  <input
                    type="text"
                    value={servicesInput}
                    onChange={(e) => setServicesInput(e.target.value)}
                    placeholder="e.g. Brand Strategy, Custom Lettering, Packaging Architecture"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    Strategic Approach & Execution
                  </label>
                  <textarea
                    rows={4}
                    value={formData.approach}
                    onChange={(e) => setFormData({ ...formData, approach: e.target.value })}
                    placeholder="Narrative explaining the creative process, typography choices, color theory..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-semibold text-[#A3A3A3]">
                    External Case Study Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.externalLink}
                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                    placeholder="https://behance.net/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-xs text-white focus:outline-none focus:border-[#FF4D00]"
                  />
                </div>
              </div>

              {/* Toggles: Featured & Published */}
              <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-[#141414] border border-white/10">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF4D00] focus:ring-0"
                  />
                  <span>Feature on Highlight Grid</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF4D00] focus:ring-0"
                  />
                  <span>Published (Visible to public)</span>
                </label>
              </div>

              {/* Save / Cancel Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-7 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-black bg-[#FF4D00] hover:bg-[#FF7A00] transition-all shadow-[0_0_20px_rgba(255,77,0,0.4)] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
