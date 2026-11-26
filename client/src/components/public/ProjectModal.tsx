'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, Tag, Calendar, User, CheckCircle2, Video, Play, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { Project } from '@/types';

function ModalMediaImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative w-full flex items-center justify-center bg-black overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
      )}
      {hasError ? (
        <div className="w-full h-48 flex flex-col items-center justify-center bg-black p-4 text-center">
          <Sparkles className="w-5 h-5 text-[#FF4D00]/50 mb-1" />
          <span className="text-xs text-[#737373]">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full max-w-[1080px] h-auto max-h-[1920px] object-contain object-center transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}

function isVideoFile(url?: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.mkv') ||
    (clean.includes('/uploads/') && !clean.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i))
  );
}

function getEmbedUrl(url?: string): string | null {
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
}

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key & trap focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (project) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0d0d0d] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col text-[#F5F5F5] focus:outline-none"
      >
        {/* Sticky Close Button */}
        <div className="sticky top-0 z-20 flex justify-between items-center p-5 sm:p-6 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30">
              {project.category}
            </span>
            {project.isSample && (
              <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-white/10 text-[#A3A3A3] border border-white/5">
                Agency Showcase Preview
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
            aria-label="Close Case Study"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 md:p-10 space-y-10">
          {/* Header information */}
          <div className="space-y-4">
            <h2 id="modal-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              {project.title}
            </h2>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-[#A3A3A3]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#FF4D00]" />
                <span>Client: <strong className="text-white font-medium">{project.client}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF4D00]" />
                <span>Year: <strong className="text-white font-medium">{project.year}</strong></span>
              </div>
              {project.externalLink && (
                <a
                  href={project.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#FF4D00] hover:text-[#FF7A00] font-medium transition-colors"
                >
                  <span>Visit Project</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Hero Cover Image (Black Background, 1080px Width x 1920px Height Portrait / Poster Dimensions) */}
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl p-0 border border-white/10 w-full max-w-[1080px] mx-auto flex items-center justify-center">
            <div className="w-full flex items-center justify-center bg-black overflow-hidden">
              <img
                src={project.coverImage}
                alt={project.imageAlt || project.title}
                className="w-full max-w-[1080px] h-auto max-h-[1920px] object-contain object-center rounded-2xl mx-auto block"
              />
            </div>
          </div>

          {/* Dedicated Video & Motion Showcase */}
          {project.videoUrl && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
                      Motion & Video Reel
                    </h3>
                    <p className="text-xs text-[#A3A3A3]">
                      {project.videoAspectRatio === '9:16'
                        ? 'Vertical Story / Reel Showcase (9:16)'
                        : 'Widescreen YouTube / Cinema Showcase (16:9)'}
                    </p>
                  </div>
                </div>

                <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#141414] border border-white/10 text-white">
                  {project.videoAspectRatio === '9:16' ? (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Story Size (9:16)</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>YouTube Size (16:9)</span>
                    </>
                  )}
                </span>
              </div>

              {/* Player Container: Story Size (max-w-[340px] 9:16) vs YouTube Size (w-full 16:9) */}
              <div className="flex justify-center w-full">
                <div
                  className={`relative rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl transition-all ${
                    project.videoAspectRatio === '9:16'
                      ? 'w-full max-w-[340px] aspect-[9/16] ring-1 ring-white/20'
                      : 'w-full aspect-video'
                  }`}
                >
                  {getEmbedUrl(project.videoUrl) ? (
                    <iframe
                      src={getEmbedUrl(project.videoUrl)!}
                      className="w-full h-full border-0"
                      title={`${project.title} - Video Showcase`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={project.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      poster={project.coverImage}
                      className={`w-full h-full bg-black ${
                        project.videoAspectRatio === '9:16' ? 'object-cover' : 'object-contain'
                      }`}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Multiple Gallery Images & Media Assets (Black Background with 1080px Width x 1920px Height Portrait / Poster Dimensions) */}
          {project.galleryImages && project.galleryImages.length > 0 && (
            <div className="space-y-6 sm:space-y-8 pt-2">
              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                {project.galleryImages.map((mediaUrl, i) => {
                  const isVid = isVideoFile(mediaUrl);
                  return (
                    <div
                      key={i}
                      className="rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl p-0 border border-white/10 transition-transform duration-300 hover:scale-[1.005] w-full max-w-[1080px] mx-auto flex items-center justify-center"
                    >
                      {isVid ? (
                        <video
                          src={mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-w-[1080px] h-auto max-h-[1920px] object-contain rounded-2xl bg-black"
                        />
                      ) : (
                        <div className="w-full flex items-center justify-center bg-black overflow-hidden">
                          <img
                            src={mediaUrl}
                            alt={`${project.title} - Showcase Exhibit ${i + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full max-w-[1080px] h-auto max-h-[1920px] object-contain object-center rounded-2xl mx-auto block"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer CTA within Modal */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#A3A3A3]">
              Inspired by this work? Let&apos;s build your distinctive identity.
            </p>
            <a
              href="#contact"
              onClick={onClose}
              className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF4D00] text-black hover:bg-[#FF7A00] transition-colors shadow-lg"
            >
              Discuss a Similar Project
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
