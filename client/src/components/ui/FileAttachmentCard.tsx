'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileImage,
  FileArchive,
  Film,
  Download,
  Eye,
  X,
  Box,
  Volume2,
  Play,
  Pause,
} from 'lucide-react';
import { TaskAttachment } from '@/types';

interface FileAttachmentCardProps {
  file: TaskAttachment;
  onRemove?: () => void;
  readOnly?: boolean;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileCategory(
  name: string = '',
  type: string = ''
): 'image' | 'pdf' | 'model' | 'audio' | 'archive' | 'video' | 'design' | 'doc' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['obj', 'fbx', 'glb', 'gltf', 'blend', 'c4d', '3ds', 'stl', 'dae', 'step', 'stp'].includes(ext)) {
    return 'model';
  }
  if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'webm'].includes(ext) || type.includes('audio')) {
    return 'audio';
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || type.includes('image')) {
    return 'image';
  }
  if (ext === 'pdf' || type.includes('pdf')) {
    return 'pdf';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'archive';
  }
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext) || type.includes('video')) {
    return 'video';
  }
  if (['psd', 'ai', 'eps', 'indd', 'fig', 'sketch'].includes(ext)) {
    return 'design';
  }
  return 'doc';
}

export default function FileAttachmentCard({ file, onRemove, readOnly = false }: FileAttachmentCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const category = getFileCategory(file.name, file.type);
  const isPng = file.name.toLowerCase().endsWith('.png');
  const canPreview = category === 'image' || category === 'pdf';

  const toggleInlineAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(console.error);
    }
  };

  return (
    <>
      <div className="group relative flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-white/10 hover:border-[#FF4D00]/50 transition-all shadow-sm">
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {/* File Thumbnail or Categorized Icon */}
          <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {category === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to icon if thumbnail fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}

            {category === 'image' && (
              <div className="hidden group-hover:flex absolute inset-0 bg-black/60 items-center justify-center">
                <FileImage className="w-4 h-4 text-emerald-400" />
              </div>
            )}

            {category === 'model' && (
              <div className="text-cyan-400 flex flex-col items-center">
                <Box className="w-5 h-5 animate-pulse" />
              </div>
            )}

            {category === 'audio' && (
              <button
                type="button"
                onClick={toggleInlineAudio}
                className="w-full h-full flex items-center justify-center text-purple-400 hover:text-white bg-purple-950/30 hover:bg-purple-600 transition-colors"
                title={isPlayingAudio ? 'Pause Audio' : 'Play Audio'}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
            )}

            {category === 'pdf' && <FileText className="w-5 h-5 text-red-400" />}
            {category === 'archive' && <FileArchive className="w-5 h-5 text-amber-400" />}
            {category === 'video' && <Film className="w-5 h-5 text-blue-400" />}
            {category === 'design' && <span className="text-[10px] font-black text-[#FF4D00]">PSD</span>}
            {category === 'doc' && <FileText className="w-5 h-5 text-zinc-400" />}
          </div>

          {/* File Details & Badge */}
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-semibold text-white truncate max-w-[170px] sm:max-w-[220px]" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-[#A3A3A3] font-mono">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              {category === 'model' ? (
                <span className="text-cyan-400 font-bold">3D MODEL</span>
              ) : isPng ? (
                <span className="text-emerald-400 font-bold">PNG GRAPHIC</span>
              ) : category === 'pdf' ? (
                <span className="text-red-400 font-bold">PDF DOCUMENT</span>
              ) : category === 'audio' ? (
                <span className="text-purple-400 font-bold">VOICE / AUDIO</span>
              ) : (
                <span className="uppercase">{file.name.split('.').pop() || 'FILE'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Hidden Audio Element for inline playback */}
        {category === 'audio' && (
          <audio
            ref={audioRef}
            src={file.url}
            onEnded={() => setIsPlayingAudio(false)}
            onPause={() => setIsPlayingAudio(false)}
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {category === 'audio' && (
            <button
              type="button"
              onClick={toggleInlineAudio}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                isPlayingAudio ? 'bg-purple-500 text-white' : 'bg-white/5 hover:bg-white/15 text-purple-300'
              }`}
              title={isPlayingAudio ? 'Pause' : 'Play Voice Message'}
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          )}

          {canPreview && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white transition-colors"
              title="Preview file"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href={file.url}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF4D00] text-[#A3A3A3] hover:text-black transition-colors"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
          </a>

          {!readOnly && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#A3A3A3] hover:text-red-400 transition-colors"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox / Preview Modal for Image & PDF */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0d0d0d] border border-white/20 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-md">{file.name}</p>
                <span className="text-[10px] text-[#A3A3A3] font-mono">({formatFileSize(file.size)})</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={file.url}
                  download={file.name}
                  className="px-3 py-1 rounded-full text-xs bg-[#FF4D00] text-black font-semibold flex items-center gap-1.5 hover:bg-[#FF7A00]"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-black/60">
              {category === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
                />
              )}

              {category === 'pdf' && (
                <div className="w-full h-[75vh] flex flex-col items-center justify-center space-y-4">
                  <iframe
                    src={file.url}
                    title={file.name}
                    className="w-full h-full rounded-lg border border-white/10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
