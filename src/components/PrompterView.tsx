import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Maximize,
  Minimize,
  FlipHorizontal,
  FlipVertical,
  Type,
  Gauge,
  Eye,
  Sliders,
  ArrowLeft,
  Video,
  VideoOff,
  Radio,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Settings,
} from 'lucide-react';
import { ScriptItem, PrompterSettings, ThemeType, FontFamilyType } from '../types';
import { parseScriptContent, calculateStats, formatTimeSeconds } from '../utils/textUtils';
import { CameraOverlay } from './CameraOverlay';
import { FontPickerModal } from './FontPickerModal';
import { FONT_OPTIONS, getFontFamilyStyle } from '../constants/fonts';
import { sendRoomAction } from '../services/api';

interface PrompterViewProps {
  script: ScriptItem;
  settings: PrompterSettings;
  onUpdateSettings: (newSettings: Partial<PrompterSettings>) => void;
  onClose: () => void;
  onEditScript: (script: ScriptItem) => void;
  roomId?: string;
  onOpenSyncModal: () => void;
}

export const PrompterView: React.FC<PrompterViewProps> = ({
  script,
  settings,
  onUpdateSettings,
  onClose,
  onEditScript,
  roomId,
  onOpenSyncModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isFontPickerOpen, setIsFontPickerOpen] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Parse lines for rich rendering
  const parsedLines = React.useMemo(() => {
    return parseScriptContent(script.content);
  }, [script.content]);

  // Calculate speed & stats
  const stats = React.useMemo(() => {
    return calculateStats(script.content, settings.speed);
  }, [script.content, settings.speed]);

  // Hide UI on idle when playing
  const resetControlsTimeout = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
        setIsQuickMenuOpen(false);
      }, 3500);
    }
  }, [isPlaying]);

  // Start / Pause toggle with optional countdown
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (roomId) sendRoomAction(roomId, 'PAUSE');
    } else {
      if (settings.countdownSeconds > 0 && scrollProgress === 0) {
        setCountdown(settings.countdownSeconds);
      } else {
        setIsPlaying(true);
        if (roomId) sendRoomAction(roomId, 'PLAY');
      }
    }
    resetControlsTimeout();
  }, [isPlaying, settings.countdownSeconds, scrollProgress, roomId, resetControlsTimeout]);

  // Countdown timer countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      setIsPlaying(true);
      if (roomId) sendRoomAction(roomId, 'PLAY');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, roomId]);

  // Elapsed timer tracking
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  // Main high-precision animation loop for auto-scrolling
  const scrollLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const el = containerRef.current;
    if (el && isPlaying) {
      // Speed curve: 1 = ~12px/s, 50 = ~120px/s, 100 = ~350px/s
      const pxPerSecond = Math.pow(settings.speed / 100, 1.4) * 320 + 15;
      const scrollStep = pxPerSecond * delta;
      el.scrollTop += scrollStep;

      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll > 0) {
        const progress = Math.min(1, Math.max(0, el.scrollTop / maxScroll));
        setScrollProgress(progress);
        if (progress >= 0.999) {
          setIsPlaying(false);
          if (roomId) sendRoomAction(roomId, 'PAUSE');
        }
      }
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(scrollLoop);
    }
  }, [isPlaying, settings.speed, roomId]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(scrollLoop);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, scrollLoop]);

  // Scroll listener for manual user scrolling/dragging
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      const progress = Math.min(1, Math.max(0, el.scrollTop / maxScroll));
      setScrollProgress(progress);
    }
  };

  // Jump to specific scroll progress
  const jumpToProgress = (ratio: number) => {
    const el = containerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = ratio * maxScroll;
    setScrollProgress(ratio);
    if (roomId) sendRoomAction(roomId, 'SCROLL_JUMP', { scrollProgress: ratio });
  };

  // Rewind / Fast Forward by seconds
  const stepScrollSeconds = (seconds: number) => {
    const el = containerRef.current;
    if (!el) return;
    const pxPerSecond = Math.pow(settings.speed / 100, 1.4) * 320 + 15;
    el.scrollTop += seconds * pxPerSecond;
    handleScroll();
  };

  // Reset to top
  const resetToStart = () => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = 0;
      setScrollProgress(0);
      setElapsedSeconds(0);
      setIsPlaying(false);
      if (roomId) sendRoomAction(roomId, 'SCROLL_JUMP', { scrollProgress: 0 });
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onUpdateSettings({ speed: Math.min(100, settings.speed + 5) });
          break;
        case 'ArrowDown':
          e.preventDefault();
          onUpdateSettings({ speed: Math.max(1, settings.speed - 5) });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stepScrollSeconds(-6);
          break;
        case 'ArrowRight':
          e.preventDefault();
          stepScrollSeconds(6);
          break;
        case 'KeyM':
          e.preventDefault();
          onUpdateSettings({ isMirrored: !settings.isMirrored });
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyR':
          e.preventDefault();
          resetToStart();
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          onUpdateSettings({ fontSize: Math.min(120, settings.fontSize + 4) });
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          onUpdateSettings({ fontSize: Math.max(18, settings.fontSize - 4) });
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, settings, onUpdateSettings, isFullscreen, onClose]);

  // Audio Recording (Voice Rehearsal)
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(audioUrl);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (err) {
        console.error('Audio recording failed:', err);
        alert('Không thể truy cập microphone để ghi âm giọng đọc.');
      }
    }
  };

  // Theme styles mapper
  const getThemeStyles = () => {
    switch (settings.theme) {
      case 'high-contrast-yellow':
        return {
          bg: 'bg-black',
          text: 'text-yellow-300',
          heading: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/40',
          speaker: 'text-amber-200 bg-amber-950/60 border-amber-500/50 font-mono',
          pause: 'text-yellow-400 bg-yellow-900/40 border-yellow-500/50 font-mono',
          focusBar: 'border-yellow-500/30 bg-yellow-500/5 shadow-[0_0_20px_rgba(250,204,21,0.15)]',
        };
      case 'studio-green':
        return {
          bg: 'bg-[#040905]',
          text: 'text-emerald-300',
          heading: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
          speaker: 'text-green-200 bg-green-950/60 border-green-500/50 font-mono',
          pause: 'text-emerald-300 bg-emerald-900/40 border-emerald-500/50 font-mono',
          focusBar: 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(52,211,153,0.15)]',
        };
      case 'navy-blue':
        return {
          bg: 'bg-[#080d1a]',
          text: 'text-sky-100',
          heading: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40',
          speaker: 'text-blue-200 bg-blue-950/60 border-blue-500/50 font-mono',
          pause: 'text-sky-300 bg-sky-900/40 border-sky-500/50 font-mono',
          focusBar: 'border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_20px_rgba(56,189,248,0.15)]',
        };
      case 'sunset-amber':
        return {
          bg: 'bg-[#140e0a]',
          text: 'text-amber-100',
          heading: 'text-orange-400 border-orange-500/40 bg-orange-950/40',
          speaker: 'text-amber-300 bg-amber-950/60 border-amber-500/50 font-mono',
          pause: 'text-orange-300 bg-orange-900/40 border-orange-500/50 font-mono',
          focusBar: 'border-amber-500/30 bg-amber-500/5 shadow-[0_0_20px_rgba(251,191,36,0.15)]',
        };
      case 'paper-light':
        return {
          bg: 'bg-[#f8f9fa]',
          text: 'text-neutral-900',
          heading: 'text-blue-900 border-blue-400/50 bg-blue-100',
          speaker: 'text-neutral-900 bg-neutral-200 border-neutral-400 font-mono',
          pause: 'text-amber-900 bg-amber-100 border-amber-400 font-mono',
          focusBar: 'border-blue-600 bg-blue-500/10 shadow-[0_0_15px_rgba(37,99,235,0.15)]',
        };
      case 'oled':
      default:
        return {
          bg: 'bg-[#0a0a0a]',
          text: 'text-white',
          heading: 'text-[#888888] uppercase tracking-widest font-serif border-[#222222] bg-[#111111]',
          speaker: 'text-amber-500 bg-[#1a1a1a] border-[#333333] font-mono',
          pause: 'text-amber-400 bg-amber-950/30 border-amber-500/30 font-mono',
          focusBar: 'border-amber-500/20 bg-amber-500/5 shadow-[0_0_25px_rgba(251,191,36,0.15)]',
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Font family css class
  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'merriweather':
        return 'font-serif';
      case 'lexend':
        return 'font-sans font-medium tracking-normal';
      case 'mono':
        return 'font-mono';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  return (
    <div
      id="prompter-container"
      className={`fixed inset-0 z-50 select-none overflow-hidden ${themeStyles.bg} flex flex-col font-sans text-[#e0e0e0]`}
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
    >
      {/* Camera Live Preview Overlay if enabled */}
      {settings.cameraOverlay && (
        <CameraOverlay
          opacity={settings.cameraOpacity}
          isMirrored={settings.isMirrored}
          position={settings.cameraPosition}
        />
      )}

      {/* Focus Reading Bar Guide (Dải đọc trọng tâm) */}
      {settings.focusGuide && (
        <div
          className={`absolute left-0 right-0 pointer-events-none z-10 border-t border-b transition-all duration-150 ${themeStyles.focusBar}`}
          style={{
            top: `${settings.focusPosition}%`,
            height: `${settings.focusHeight}px`,
            transform: 'translateY(-50%)',
          }}
        >
          {/* Subtle pointer arrow on the left edge */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500/60">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          </div>
        </div>
      )}

      {/* 3-2-1 Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
          <div className="text-8xl sm:text-9xl font-mono font-black text-amber-500 animate-ping">
            {countdown === 0 ? 'BẮT ĐẦU!' : countdown}
          </div>
          <p className="mt-8 text-lg font-serif text-[#888888]">Chuẩn bị đọc kịch bản...</p>
        </div>
      )}

      {/* Top Floating Control Bar */}
      <div
        className={`relative z-30 transition-all duration-300 px-4 sm:px-6 py-3 flex items-center justify-between border-b backdrop-blur-xl ${
          settings.theme === 'paper-light'
            ? 'bg-white/85 border-neutral-200 text-neutral-800'
            : 'bg-[#111111]/90 border-[#222222] text-[#e0e0e0]'
        } ${isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}
      >
        <div className="flex items-center gap-3">
          <button
            id="btn-prompter-back"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold text-[#e0e0e0]"
            title="Thoát máy nhắc chữ"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Thư viện</span>
          </button>

          <div className="truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            <h2 className="text-sm font-serif font-medium truncate text-white">{script.title}</h2>
            <div className="text-xs text-[#888888] font-mono flex items-center gap-2">
              <span>{stats.words} từ</span>
              <span>•</span>
              <span className="text-amber-500">~{stats.estimatedTimeFormatted}</span>
              {roomId && (
                <>
                  <span>•</span>
                  <span className="text-green-400 flex items-center gap-1">
                    <Radio size={11} className="animate-pulse" /> PIN: {roomId}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Font Picker Quick Button */}
          <button
            id="btn-prompter-font-modal"
            onClick={() => setIsFontPickerOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] hover:border-amber-500/50 transition flex items-center gap-1.5 text-xs text-[#e0e0e0] hover:text-white"
            title="Đổi phông chữ dễ nhìn (Lexend, Be Vietnam, Roboto...)"
          >
            <Type size={14} className="text-amber-500" />
            <span className="font-mono text-[11px] hidden sm:inline">
              {FONT_OPTIONS.find((f) => f.id === settings.fontFamily)?.shortName || 'Lexend'}
            </span>
          </button>

          {/* Audio Rehearsal Record Button */}
          <button
            id="btn-prompter-record"
            onClick={toggleRecording}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs font-semibold ${
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white'
            }`}
            title={isRecording ? 'Dừng ghi âm giọng đọc' : 'Ghi âm thử giọng đọc'}
          >
            {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
            <span className="hidden md:inline">{isRecording ? 'Đang ghi âm' : 'Ghi âm thử'}</span>
          </button>

          {/* Quick Settings Drawer Toggle */}
          <button
            id="btn-prompter-quick-settings"
            onClick={() => setIsQuickMenuOpen((prev) => !prev)}
            className={`p-2 rounded-lg transition ${
              isQuickMenuOpen
                ? 'bg-amber-600 text-black font-bold'
                : 'bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white'
            }`}
            title="Tùy chỉnh cỡ chữ, tốc độ, màu sắc"
          >
            <Sliders size={16} />
          </button>

          {/* Camera Overlay Toggle */}
          <button
            id="btn-prompter-camera-toggle"
            onClick={() => onUpdateSettings({ cameraOverlay: !settings.cameraOverlay })}
            className={`p-2 rounded-lg transition ${
              settings.cameraOverlay
                ? 'bg-indigo-600 text-white'
                : 'bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white'
            }`}
            title="Bật/tắt camera selfie"
          >
            {settings.cameraOverlay ? <Video size={16} /> : <VideoOff size={16} />}
          </button>

          {/* Mirror Flip Toggle */}
          <button
            id="btn-prompter-mirror"
            onClick={() => {
              const val = !settings.isMirrored;
              onUpdateSettings({ isMirrored: val });
              if (roomId) sendRoomAction(roomId, 'TOGGLE_MIRROR');
            }}
            className={`p-2 rounded-lg transition ${
              settings.isMirrored
                ? 'bg-amber-600 text-black font-bold'
                : 'bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white'
            }`}
            title="Chế độ phản chiếu gương (Mirror Mode)"
          >
            <FlipHorizontal size={16} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="btn-prompter-fullscreen"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white transition"
            title="Toàn màn hình (F)"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Quick Settings Floating Drawer / Panel */}
      {isQuickMenuOpen && (
        <div
          className={`relative z-30 p-4 border-b grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 backdrop-blur-2xl animate-fade-in ${
            settings.theme === 'paper-light'
              ? 'bg-neutral-100/95 border-neutral-300 text-neutral-900 shadow-xl'
              : 'bg-[#111111]/95 border-[#222222] text-[#e0e0e0] shadow-2xl'
          }`}
        >
          {/* Font Family Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#888888]">
                <Type size={13} className="text-amber-500" /> Phông chữ
              </span>
              <button
                onClick={() => setIsFontPickerOpen(true)}
                className="text-[10px] text-amber-500 hover:underline font-mono"
              >
                Mở bảng font
              </button>
            </div>
            <select
              value={settings.fontFamily}
              onChange={(e) => {
                const font = e.target.value as FontFamilyType;
                onUpdateSettings({ fontFamily: font });
                if (roomId) sendRoomAction(roomId, 'SET_SETTINGS', { fontFamily: font });
              }}
              className="w-full px-2 py-1.5 text-xs rounded-lg bg-[#1a1a1a] border border-[#333333] text-[#e0e0e0] focus:outline-none focus:border-amber-500 font-sans"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#111111] text-white">
                  {f.name} ({f.tag})
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Adjuster */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#888888]">
                <Type size={13} /> Cỡ chữ ({settings.fontSize}px)
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateSettings({ fontSize: Math.max(18, settings.fontSize - 4) })}
                  className="w-6 h-6 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] flex items-center justify-center font-mono font-bold text-xs"
                >
                  -
                </button>
                <button
                  onClick={() => onUpdateSettings({ fontSize: Math.min(120, settings.fontSize + 4) })}
                  className="w-6 h-6 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] flex items-center justify-center font-mono font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="18"
              max="120"
              step="2"
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg"
            />
          </div>

          {/* Speed Adjuster */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#888888]">
                <Gauge size={13} /> Tốc độ ({stats.wpm} WPM)
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateSettings({ speed: Math.max(1, settings.speed - 5) })}
                  className="w-6 h-6 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] flex items-center justify-center font-mono font-bold text-xs"
                >
                  -
                </button>
                <button
                  onClick={() => onUpdateSettings({ speed: Math.min(100, settings.speed + 5) })}
                  className="w-6 h-6 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] flex items-center justify-center font-mono font-bold text-xs"
                >
                  +
                </button>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={settings.speed}
              onChange={(e) => onUpdateSettings({ speed: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg"
            />
          </div>

          {/* Theme Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#888888] block">Màu tương phản</label>
            <select
              value={settings.theme}
              onChange={(e) => onUpdateSettings({ theme: e.target.value as ThemeType })}
              className="w-full px-2 py-1.5 text-xs rounded-lg bg-[#1a1a1a] border border-[#333333] text-[#e0e0e0] focus:outline-none focus:border-amber-500"
            >
              <option value="oled" className="bg-[#0a0a0a] text-white">
                Sophisticated Dark (OLED Đen)
              </option>
              <option value="sunset-amber" className="bg-[#140e0a] text-amber-200">
                Hoàng Hôn Ấm Áp
              </option>
              <option value="high-contrast-yellow" className="bg-black text-yellow-300">
                Vàng Nổi Bật (High Contrast)
              </option>
              <option value="studio-green" className="bg-[#040905] text-green-300">
                Xanh Studio Matrix
              </option>
              <option value="navy-blue" className="bg-[#080d1a] text-sky-200">
                Xanh Đêm Midnight
              </option>
              <option value="paper-light" className="bg-neutral-100 text-neutral-900">
                Giấy Sáng (Ban ngày)
              </option>
            </select>
          </div>

          {/* Focus Reading Bar Toggle & Alignment */}
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <label className="text-xs font-semibold text-[#888888] block">Căn lề & Vùng đọc</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateSettings({ focusGuide: !settings.focusGuide })}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border ${
                  settings.focusGuide
                    ? 'bg-amber-600 text-black border-amber-500 font-bold'
                    : 'bg-[#1a1a1a] border-[#333333] text-[#888888]'
                }`}
              >
                {settings.focusGuide ? '✓ Vùng đọc' : 'Tắt vùng'}
              </button>
              <button
                onClick={() =>
                  onUpdateSettings({
                    alignment:
                      settings.alignment === 'left'
                        ? 'center'
                        : settings.alignment === 'center'
                        ? 'justify'
                        : 'left',
                  })
                }
                className="px-2 py-1.5 rounded-lg text-xs font-medium bg-[#1a1a1a] border border-[#333333] hover:bg-[#222222] text-[#e0e0e0] capitalize"
              >
                {settings.alignment === 'left' ? 'Trái' : settings.alignment === 'center' ? 'Giữa' : 'Đều'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Scrolling Text Surface with Cinematic Vignette Overlay */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Subtle cinematic top/bottom edge gradient vignette */}
        <div className="absolute inset-0 pointer-events-none vignette-mask z-10" />

        <div
          ref={containerRef}
          id="prompter-scroll-viewport"
          onScroll={handleScroll}
          onClick={togglePlay}
          className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative cursor-pointer no-scrollbar ${
            settings.isMirrored ? 'scale-x-[-1]' : ''
          } ${settings.isFlipped ? 'scale-y-[-1]' : ''}`}
          style={{
            scrollBehavior: isPlaying ? 'auto' : 'smooth',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Top Spacer so script starts near focus bar */}
          <div style={{ height: `${settings.focusPosition || 35}vh` }} />

          {/* Text Container with configurable margins and typography */}
          <div
            ref={scrollContentRef}
            className={`mx-auto transition-all ${themeStyles.text}`}
            style={{
              maxWidth: `${100 - settings.textMargin * 2}%`,
              fontSize: `${settings.fontSize}px`,
              lineHeight: settings.lineHeight,
              textAlign: settings.alignment,
              letterSpacing: `${settings.letterSpacing}px`,
              textTransform: settings.allCaps ? 'uppercase' : 'none',
              fontFamily: getFontFamilyStyle(settings.fontFamily),
            }}
          >
            {parsedLines.map((line, idx) => {
              if (line.type === 'blank') {
                return <div key={line.id} style={{ height: `${settings.fontSize * 0.8}px` }} />;
              }

              if (line.type === 'heading') {
                return (
                  <div
                    key={line.id}
                    className={`my-6 px-4 py-1.5 rounded-lg text-[0.65em] tracking-widest uppercase font-serif border inline-block ${themeStyles.heading}`}
                  >
                    {line.text}
                  </div>
                );
              }

              if (line.type === 'pause') {
                return (
                  <div
                    key={line.id}
                    className={`my-3 px-2.5 py-1 rounded text-[0.6em] font-mono border inline-flex items-center gap-1.5 ${themeStyles.pause}`}
                  >
                    <span>{line.text}</span>
                  </div>
                );
              }

              if (line.type === 'speaker') {
                return (
                  <div key={line.id} className="my-5">
                    <div
                      className={`inline-block px-2.5 py-0.5 mb-2 rounded text-[0.6em] font-mono uppercase tracking-wider border ${themeStyles.speaker}`}
                    >
                      {line.speakerName}
                    </div>
                    <p className="font-medium text-white shadow-amber-500/10 drop-shadow-sm">{line.text}</p>
                  </div>
                );
              }

              if (line.type === 'cue') {
                return (
                  <p key={line.id} className="my-2 italic font-serif text-[0.75em] text-[#666666]">
                    {line.text}
                  </p>
                );
              }

              return (
                <p key={line.id} className="my-4 font-normal break-words text-[#e0e0e0]">
                  {line.text}
                </p>
              );
            })}
          </div>

          {/* Bottom Spacer so user can scroll to very end */}
          <div style={{ height: '80vh' }} className="flex flex-col items-center justify-center text-center text-[#555555]">
            <p className="text-xl font-serif uppercase tracking-widest font-bold">--- HẾT KỊCH BẢN ---</p>
            <p className="text-xs font-mono mt-2">Bấm R hoặc phím Space để bắt đầu lại</p>
          </div>
        </div>
      </div>

      {/* Recorded Audio Playback Bar if audio was recorded */}
      {recordedAudioUrl && (
        <div className="relative z-30 px-4 py-2 bg-[#111111] border-t border-[#222222] flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-amber-500 font-mono flex items-center gap-1">
            <Volume2 size={14} /> Bản ghi âm thử:
          </span>
          <audio src={recordedAudioUrl} controls className="h-8 flex-1 max-w-md accent-amber-500" />
          <button
            onClick={() => setRecordedAudioUrl(null)}
            className="p-1 rounded bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-[#888888] hover:text-white"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Bottom Primary Control Bar (Sophisticated Dark Style) */}
      <div
        className={`relative z-30 transition-all duration-300 border-t backdrop-blur-2xl px-4 sm:px-8 py-3.5 flex flex-col gap-2 ${
          settings.theme === 'paper-light'
            ? 'bg-white/90 border-neutral-300 text-neutral-900'
            : 'bg-[#111111] border-[#222222] text-[#e0e0e0]'
        } ${isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}
      >
        {/* Scrub / Progress Bar */}
        <div className="flex items-center gap-3 text-xs font-mono font-semibold text-[#888888]">
          <span className="w-12 text-right text-[#e0e0e0]">{formatTimeSeconds(elapsedSeconds)}</span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={scrollProgress}
              onChange={(e) => jumpToProgress(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-[#222222] rounded-lg"
            />
          </div>
          <span className="w-12 text-amber-500">{stats.estimatedTimeFormatted}</span>
        </div>

        {/* Transport & Setting Controls Layout */}
        <div className="flex items-center justify-between w-full pt-1">
          {/* Left: Quick Font & Speed Controls */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Font Picker Quick Button */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-tighter text-[#666666] mb-0.5 font-bold font-mono">
                PHÔNG CHỮ
              </span>
              <button
                id="btn-prompter-bottom-font"
                onClick={() => setIsFontPickerOpen(true)}
                className="h-7 px-2 border border-[#333333] hover:border-amber-500/50 flex items-center gap-1 rounded bg-[#1a1a1a] hover:bg-[#222222] text-xs font-mono text-amber-500 hover:text-amber-400 transition"
                title="Bấm để đổi phông chữ dễ nhìn"
              >
                <Type size={12} />
                <span className="max-w-[65px] sm:max-w-[80px] truncate">
                  {FONT_OPTIONS.find((f) => f.id === settings.fontFamily)?.shortName || 'Lexend'}
                </span>
              </button>
            </div>

            {/* Font Size Quick */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-tighter text-[#666666] mb-0.5 font-bold font-mono">
                CỠ CHỮ
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onUpdateSettings({ fontSize: Math.max(18, settings.fontSize - 4) })}
                  className="w-7 h-7 border border-[#333333] flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-[#222222] text-xs font-mono"
                  title="Giảm cỡ chữ"
                >
                  A-
                </button>
                <span className="text-xs font-mono text-amber-500 min-w-[28px] text-center">{settings.fontSize}</span>
                <button
                  onClick={() => onUpdateSettings({ fontSize: Math.min(120, settings.fontSize + 4) })}
                  className="w-7 h-7 border border-[#333333] flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-[#222222] text-xs font-mono"
                  title="Tăng cỡ chữ"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Scroll Speed Quick */}
            <div className="hidden sm:flex flex-col items-center">
              <span className="text-[9px] uppercase tracking-tighter text-[#666666] mb-0.5 font-bold font-mono">
                TỐC ĐỘ
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onUpdateSettings({ speed: Math.max(1, settings.speed - 5) })}
                  className="w-7 h-7 border border-[#333333] flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-[#222222] text-xs font-mono"
                  title="Giảm tốc độ"
                >
                  -
                </button>
                <span className="text-xs font-mono text-amber-500 min-w-[32px] text-center">{stats.wpm}</span>
                <button
                  onClick={() => onUpdateSettings({ speed: Math.min(100, settings.speed + 5) })}
                  className="w-7 h-7 border border-[#333333] flex items-center justify-center rounded bg-[#1a1a1a] hover:bg-[#222222] text-xs font-mono"
                  title="Tăng tốc độ"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Center: Rewind, Big Play/Pause, Forward, Countdown */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            <button
              id="btn-prompter-reset"
              onClick={resetToStart}
              className="p-2 sm:p-2.5 rounded-full border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-white transition active:scale-95"
              title="Về đầu trang (R)"
            >
              <RotateCcw size={16} />
            </button>

            <button
              id="btn-prompter-rewind"
              onClick={() => stepScrollSeconds(-8)}
              className="p-2 sm:p-2.5 rounded-full border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-white transition active:scale-95"
              title="Tua lùi 8 giây (Mũi tên trái)"
            >
              <Rewind size={16} />
            </button>

            {/* Giant Amber Play/Pause Button */}
            <button
              id="btn-prompter-play-pause"
              onClick={togglePlay}
              className="w-13 h-13 sm:w-14 sm:h-14 bg-amber-600 hover:bg-amber-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-amber-950/40 hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? 'Tạm dừng (Space)' : 'Bắt đầu cuộn (Space)'}
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
            </button>

            <button
              id="btn-prompter-forward"
              onClick={() => stepScrollSeconds(8)}
              className="p-2 sm:p-2.5 rounded-full border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] text-[#888888] hover:text-white transition active:scale-95"
              title="Tua nhanh 8 giây (Mũi tên phải)"
            >
              <FastForward size={16} />
            </button>

            {/* Remaining time countdown HUD */}
            <div className="hidden md:flex flex-col items-end pl-2">
              <span className="text-[9px] uppercase tracking-widest text-[#666666] font-mono font-bold">CÒN LẠI</span>
              <span className="text-sm font-mono text-white">
                {stats.estimatedTimeFormatted} <span className="text-[10px] text-[#666666]">MIN</span>
              </span>
            </div>
          </div>

          {/* Right: Mirrored & Focus Mode quick toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const val = !settings.isMirrored;
                onUpdateSettings({ isMirrored: val });
                if (roomId) sendRoomAction(roomId, 'TOGGLE_MIRROR');
              }}
              className={`px-3 py-1.5 text-xs rounded border uppercase tracking-wider font-mono transition ${
                settings.isMirrored
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-400 font-bold'
                  : 'border-[#333333] text-[#888888] hover:bg-[#1a1a1a]'
              }`}
            >
              Mirror
            </button>

            <button
              onClick={() => onUpdateSettings({ focusGuide: !settings.focusGuide })}
              className={`px-3 py-1.5 text-xs rounded border uppercase tracking-wider font-mono transition ${
                settings.focusGuide
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-400 font-bold'
                  : 'border-[#333333] text-[#888888] hover:bg-[#1a1a1a]'
              }`}
            >
              Focus
            </button>
          </div>
        </div>
      </div>

      {/* Floating reveal trigger when controls are hidden */}
      {!isControlsVisible && (
        <button
          onClick={() => setIsControlsVisible(true)}
          className="absolute bottom-4 right-4 z-40 p-3 rounded-full bg-[#111111]/90 hover:bg-black text-amber-500 border border-amber-500/30 backdrop-blur-md shadow-2xl transition animate-pulse"
          title="Hiện bảng điều khiển"
        >
          <Sliders size={20} />
        </button>
      )}

      {/* Font Selection Modal */}
      <FontPickerModal
        isOpen={isFontPickerOpen}
        selectedFont={settings.fontFamily}
        onSelectFont={(font) => {
          onUpdateSettings({ fontFamily: font });
          if (roomId) sendRoomAction(roomId, 'SET_SETTINGS', { fontFamily: font });
        }}
        onClose={() => setIsFontPickerOpen(false)}
      />
    </div>
  );
};
