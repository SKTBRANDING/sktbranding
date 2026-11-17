'use client';

import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Sparkles, Play, Smartphone } from 'lucide-react';
import { Project, ProjectCategory } from '@/types';
import ProjectModal from './ProjectModal';

interface PortfolioProps {
  projects: Project[];
}

const CATEGORIES: ProjectCategory[] = [
  'All',
  'Branding',
  'Logo Design',
  'Social Media',
  'Packaging',
  'Web Design',
];

export default function Portfolio({ projects }: PortfolioProps) {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filter projects based on selected category tab
  const filteredProjects = useMemo(() => {
    if (activeCategory === 'All') return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [projects, activeCategory]);

  return (
    <section id="works" className="py-28 bg-[#050505] relative border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-white/10 text-xs font-semibold text-[#FF4D00] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Selected Portfolio</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#F5F5F5]">
              Featured <span className="font-serif italic font-normal text-white orange-gradient-text">Creations.</span>
            </h2>
            <p className="text-base text-[#A3A3A3] max-w-lg">
              Explore bespoke brand identities, tactile packaging, and dynamic digital systems crafted with obsessive attention to detail.
            </p>
          </div>

          <div className="text-xs text-[#737373] hidden md:block">
            Showing <strong className="text-white font-medium">{filteredProjects.length}</strong> works
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar" role="tablist">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF4D00] ${
                  isActive
                    ? 'bg-[#FF4D00] text-black shadow-[0_0_20px_rgba(255,77,0,0.4)]'
                    : 'bg-[#141414] text-[#A3A3A3] hover:text-white hover:bg-[#1a1a1a] border border-white/5'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Asymmetric Portfolio Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-[#141414] border border-white/5 p-8">
            <p className="text-[#A3A3A3] text-base">No projects found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {filteredProjects.map((project, index) => {
              // Create dynamic visual rhythm: 1st card takes 7 cols, 2nd takes 5 cols, 3rd takes 5 cols, 4th takes 7 cols
              const isWide = index % 4 === 0 || index % 4 === 3;
              const colSpanClass = isWide ? 'md:col-span-7' : 'md:col-span-5';
              const aspectRatioClass = project.category === 'Social Media'
                ? 'aspect-[16/9]'
                : (isWide ? 'aspect-[16/10]' : 'aspect-[4/3]');

              return (
                <article
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedProject(project);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View case study: ${project.title}`}
                  className={`${colSpanClass} group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D00] rounded-3xl`}
                >
                  <div className="luxury-card rounded-3xl overflow-hidden p-3.5 flex flex-col h-full group-hover:border-[#FF4D00]/50 transition-all duration-500">
                    {/* Image Container */}
                    <div className={`relative ${aspectRatioClass} w-full rounded-2xl overflow-hidden bg-[#0a0a0a]`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.coverImage}
                        alt={project.imageAlt || project.title}
                        className="w-full h-full object-cover object-center filter brightness-95 contrast-105 group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />

                      {/* Ambient hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md text-[#F5F5F5] border border-white/10">
                            {project.category}
                          </span>
                          {project.videoUrl && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FF4D00]/25 text-[#FF4D00] border border-[#FF4D00]/40 backdrop-blur-md"
                              title={project.videoAspectRatio === '9:16' ? 'Story Size (9:16)' : 'YouTube Size (16:9)'}
                            >
                              {project.videoAspectRatio === '9:16' ? (
                                <>
                                  <Smartphone className="w-2.5 h-2.5" /> Story Video
                                </>
                              ) : (
                                <>
                                  <Play className="w-2.5 h-2.5 fill-current" /> Video
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        {project.isSample && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-black/70 backdrop-blur-md text-[#A3A3A3] border border-white/10">
                            Sample Showcase
                          </span>
                        )}
                      </div>

                      {/* Hover Arrow Icon */}
                      <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-[#FF4D00] text-black flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-[0_0_20px_rgba(255,77,0,0.6)]">
                        <ArrowUpRight className="w-5 h-5 font-bold" />
                      </div>
                    </div>

                    {/* Card Content Footer */}
                    <div className="pt-4 px-2 pb-1 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#A3A3A3] uppercase tracking-wider">
                            {project.client}
                          </span>
                          <span className="text-xs text-[#737373]">
                            {project.year}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5] mt-1 group-hover:text-white transition-colors">
                          {project.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#A3A3A3] line-clamp-2 mt-2 leading-relaxed">
                        {project.overview}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Case Study Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
