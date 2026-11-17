'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Upload,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Radio,
  FileAudio,
  CheckCircle2,
} from 'lucide-react';
import { TaskAttachment } from '@/types';

// ==========================================
// 1. Sleek Audio Player Component
// ==========================================
interface AudioPlayerProps {
  src: string;
  title?: string;
  duration?: number;
  onDelete?: () => void;
  showDownload?: boolean;
  compact?: boolean;
}

export function AudioPlayer({
  src,
  title = 'Voice Message',
  duration: initialDuration,
  onDelete,
  showDownload = true,
  compact = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatSeconds = (sec: number): string => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`rounded-2xl bg-gradient-to-r from-[#121212] to-[#181818] border border-white/10 hover:border-[#FF4D00]/40 transition-all shadow-lg ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[#FF4D00] hover:bg-[#FF7A00] text-black flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-[0_0_15px_rgba(255,77,0,0.4)]"
          title={isPlaying ? 'Pause' : 'Play Voice Message'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
        </button>

        {/* Title, scrubber, and waveform */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-white truncate">{title}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/30">
                Audio Note
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#A3A3A3] flex-shrink-0">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>

          {/* Interactive Progress Bar */}
          <div className="relative flex items-center group cursor-pointer">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF4D00] focus:outline-none"
              style={{
                background: `linear-gradient(to right, #FF4D00 ${progressPercent}%, rgba(255, 255, 255, 0.1) ${progressPercent}%)`,
              }}
            />
          </div>
        </div>

        {/* Auxiliary Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {showDownload && (
            <a
              href={src}
              download={`${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.webm`}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF4D00] text-[#A3A3A3] hover:text-black transition-colors"
              title="Download Voice Message"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#A3A3A3] hover:text-red-400 transition-colors"
              title="Delete Voice Message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. Voice Recorder & Audio Uploader Control
// ==========================================
interface AudioVoiceControlProps {
  currentAudio?: TaskAttachment | null;
  onAudioChange: (attachment: TaskAttachment | null) => void;
  label?: string;
  description?: string;
  compact?: boolean;
}

export default function AudioVoiceControl({
  currentAudio,
  onAudioChange,
  label = 'Voice Message / Audio Directions',
  description = 'Record a voice message with microphone or upload audio files (MP3, WAV, M4A, WebM)',
  compact = false,
}: AudioVoiceControlProps) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [recordDuration, setRecordDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [localRecordedBlob, setLocalRecordedBlob] = useState<{ url: string; blob: Blob; duration: number } | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setUploadError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setLocalRecordedBlob({ url: audioUrl, blob: audioBlob, duration: recordDuration });
        setMode('preview');
        // Stop all mic tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setMode('recording');
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          // Limit to 10 minutes maximum
          if (prev >= 600) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setUploadError(err.message || 'Could not access microphone. Please grant permission.');
      setMode('idle');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMode('idle');
    setRecordDuration(0);
    setLocalRecordedBlob(null);
  };

  const uploadAudioBlob = async (blob: Blob, fileName: string, dur: number) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const file = new File([blob], fileName, { type: blob.type || 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/tasks/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload audio');

      const attachment: TaskAttachment = {
        ...json,
        category: 'audio',
        duration: dur,
      };

      onAudioChange(attachment);
      setMode('idle');
      setLocalRecordedBlob(null);
    } catch (err: any) {
      console.error('Failed to upload audio blob:', err);
      setUploadError(err.message || 'Failed to upload audio note.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check size limit: 50MB for audio
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Audio file must be under 50MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/tasks/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upload audio file');

      const attachment: TaskAttachment = {
        ...json,
        category: 'audio',
      };

      onAudioChange(attachment);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload audio file.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTimer = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs uppercase font-bold text-[#FF4D00] flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" />
            <span>{label}</span>
          </label>
          <span className="text-[10px] text-[#A3A3A3]">Optional Voice Note</span>
        </div>
      )}

      {description && !compact && (
        <p className="text-[11px] text-[#737373]">{description}</p>
      )}

      {/* If currentAudio exists: Show Player */}
      {currentAudio ? (
        <div className="space-y-2">
          <AudioPlayer
            src={currentAudio.url}
            title={currentAudio.name}
            duration={currentAudio.duration}
            onDelete={() => onAudioChange(null)}
            compact={compact}
          />
        </div>
      ) : mode === 'recording' ? (
        /* Active Recording State */
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.7)]">
              <Radio className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  Recording Voice Message...
                </span>
              </div>
              <p className="text-lg font-mono font-black text-white mt-0.5">
                {formatTimer(recordDuration)} <span className="text-xs text-[#A3A3A3]">/ 10:00</span>
              </p>
            </div>
          </div>

          {/* Sound wave bars animation */}
          <div className="hidden sm:flex items-center gap-1 h-6">
            <span className="w-1 h-3 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-6 bg-[#FF4D00] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-4 bg-red-400 rounded-full animate-bounce [animation-delay:-0.45s]" />
            <span className="w-1 h-5 bg-[#FF4D00] rounded-full animate-bounce" />
            <span className="w-1 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-black" />
              <span>Done Recording</span>
            </button>
          </div>
        </div>
      ) : mode === 'preview' && localRecordedBlob ? (
        /* Recorded Preview State before final attach */
        <div className="p-4 rounded-2xl bg-[#141414] border border-[#FF4D00]/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Voice Note Recorded ({formatTimer(localRecordedBlob.duration)})</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocalRecordedBlob(null);
                  startRecording();
                }}
                className="text-[11px] text-[#A3A3A3] hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Re-record</span>
              </button>
              <button
                type="button"
                onClick={cancelRecording}
                className="text-[11px] text-red-400 hover:text-red-300"
              >
                Discard
              </button>
            </div>
          </div>

          <AudioPlayer
            src={localRecordedBlob.url}
            title="Recorded Voice Message"
            duration={localRecordedBlob.duration}
            showDownload={false}
            compact={compact}
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isUploading}
              onClick={() =>
                uploadAudioBlob(
                  localRecordedBlob.blob,
                  `voice_note_${Date.now()}.webm`,
                  localRecordedBlob.duration
                )
              }
              className="px-4 py-1.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF7A00] text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,77,0,0.3)] disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Attaching...' : 'Attach Voice Note'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Idle Selection Buttons: Record or Upload */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Record Button */}
          <button
            type="button"
            onClick={startRecording}
            className="group p-3.5 rounded-2xl bg-[#141414] hover:bg-[#181818] border border-white/10 hover:border-[#FF4D00]/50 transition-all flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/30 group-hover:bg-[#FF4D00] group-hover:text-black text-[#FF4D00] flex items-center justify-center flex-shrink-0 transition-colors">
              <Mic className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block group-hover:text-[#FF4D00] transition-colors">
                Record Voice Note
              </span>
              <span className="text-[10px] text-[#737373] block truncate">
                Click to record via microphone
              </span>
            </div>
          </button>

          {/* Upload Audio File */}
          <label className="group p-3.5 rounded-2xl bg-[#141414] hover:bg-[#181818] border border-white/10 hover:border-[#FF4D00]/50 transition-all flex items-center gap-3 text-left cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 group-hover:bg-purple-500 group-hover:text-black text-purple-400 flex items-center justify-center flex-shrink-0 transition-colors">
              <FileAudio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block group-hover:text-purple-300 transition-colors">
                Upload Audio File
              </span>
              <span className="text-[10px] text-[#737373] block truncate">
                MP3, WAV, M4A, OGG, WebM
              </span>
            </div>
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.webm"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </label>
        </div>
      )}

      {isUploading && (
        <p className="text-xs text-[#FF4D00] animate-pulse font-medium text-center">
          Uploading voice message...
        </p>
      )}

      {uploadError && (
        <p className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-xl border border-red-500/30">
          {uploadError}
        </p>
      )}
    </div>
  );
}
