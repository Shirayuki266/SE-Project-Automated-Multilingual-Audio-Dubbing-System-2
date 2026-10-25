import React, { useState, useRef, useEffect } from 'react';
import { RichPOI } from '../server/types.js';
import { LanguageCode } from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Mic,
  Volume2,
  VolumeX,
  BookOpen,
  MapPin,
  Sparkles,
  ChevronDown,
  Globe,
  CheckCircle2,
  Eye,
  Radio,
  Sliders,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface POIDetailDrawerProps {
  poi: RichPOI | null;
  isOpen: boolean;
  onClose: () => void;
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  visitStatus: 'unvisited' | 'viewing' | 'visited';
  isPlaying: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRewind: (seconds?: number) => void;
  onForward: (seconds?: number) => void;
  onSeek: (seconds: number) => void;
  onSetRate: (rate: number) => void;
  onOpenVoiceSelector: () => void;
}

const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

export const POIDetailDrawer: React.FC<POIDetailDrawerProps> = ({
  poi,
  isOpen,
  onClose,
  currentLang,
  onLanguageChange,
  visitStatus,
  isPlaying,
  isPaused,
  elapsedSeconds,
  duration,
  onPlay,
  onPause,
  onResume,
  onStop,
  onRewind,
  onForward,
  onSeek,
  onSetRate,
  onOpenVoiceSelector,
}) => {
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDeltaY, setTouchDeltaY] = useState<number>(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !poi) return null;

  const t = translations[currentLang];
  const trans = poi.translations[currentLang] || poi.translations['vi'];
  const title = trans?.title || poi.code;
  const intro = trans?.introduction || trans?.description?.slice(0, 120) || 'Điểm di tích tâm linh tiêu biểu tại Việt Nam Quốc Tự.';
  const content = trans?.description || 'Nội dung thuyết minh đang được cập nhật...';
  const mediaItem = poi.media[0];
  const imageUrl = mediaItem?.image_url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1000&q=80';

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const cycleSpeed = () => {
    const speeds = [0.85, 1.0, 1.2, 1.35];
    const currentIndex = speeds.indexOf(currentSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setCurrentSpeed(nextSpeed);
    onSetRate(nextSpeed);
  };

  // Touch Swipe-Down to close handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchDeltaY(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY;
    if (delta > 0) {
      setTouchDeltaY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaY > 75) {
      onClose();
    }
    setTouchStartY(null);
    setTouchDeltaY(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Background click to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        style={{
          transform: touchDeltaY > 0 ? `translateY(${touchDeltaY}px)` : undefined,
          transition: touchStartY !== null ? 'none' : 'transform 0.25s ease-out',
        }}
        className="w-full max-w-2xl mx-auto bg-white rounded-t-3xl shadow-2xl border-t border-[#d8e6db] flex flex-col max-h-[92vh] overflow-hidden animate-slide-up"
      >
        {/* Top Swipe Bar / Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full py-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing border-b border-[#f0f4f1] bg-[#fbfdfb] select-none"
        >
          <div className="w-12 h-1.5 rounded-full bg-[#ccd8cf] hover:bg-[#a9bea3] transition-colors" />
          <span className="text-[10px] text-[#7a8e80] font-medium mt-1">
            Vuốt xuống để thu nhỏ thanh phát ngầm
          </span>
        </div>

        {/* Header Bar */}
        <div className="px-5 py-3 border-b border-[#e2eae4] flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            {/* Status Badge */}
            {visitStatus === 'viewing' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                Đang xem
              </span>
            ) : visitStatus === 'visited' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2d5a37] bg-[#eef5f0] px-2.5 py-0.5 rounded-full border border-[#cbe2cf]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã xem
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748b] bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                <Eye className="w-3.5 h-3.5" />
                Chưa xem
              </span>
            )}

            <span className="text-[10px] font-mono font-bold uppercase text-[#2d5a37] bg-[#f0f5f1] px-2 py-0.5 rounded-full border border-[#d6e7da]">
              {poi.code}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative flex items-center">
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="appearance-none bg-[#f7f9f6] border border-[#d6e7da] hover:border-[#2d5a37] text-xs font-semibold text-[#19231b] pl-2.5 pr-6 py-1 rounded-full outline-hidden cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#5c7362] pointer-events-none absolute right-2" />
            </div>

            {/* Close / Minimize Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f0f5f1] hover:bg-[#e2eae4] text-[#4a5f50] flex items-center justify-center transition-colors shadow-2xs"
              title="Đóng (Audio tiếp tục chạy ghim ở đáy)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Hero Banner with Badges */}
          <div className="relative rounded-2xl overflow-hidden h-52 sm:h-60 border border-[#e0ebe2] shadow-sm">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <div className="absolute bottom-3 left-4 right-4 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2d5a37] text-white">
                Bán kính định vị {poi.geofence_radius}m • {poi.location_type}
              </span>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-white mt-1 drop-shadow-sm">
                {title}
              </h1>
            </div>
          </div>

          {/* 1. MỤC TIÊU ĐỀ */}
          <div className="border-b border-[#e2eae4] pb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#2d5a37] bg-[#eef5f0] px-2 py-0.5 rounded-full border border-[#cde0d2]">
                {poi.code}
              </span>
              <span className="text-xs font-semibold text-[#5c7362] capitalize">
                Khuôn viên: {poi.location_type}
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#19231b] leading-snug">
              {title}
            </h2>
          </div>

          {/* 2. MỤC GIỚI THIỆU */}
          <div className="bg-gradient-to-r from-[#f0f6f2] to-[#e8f1ea] border-l-4 border-[#2d5a37] rounded-r-2xl p-4 sm:p-5 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e3d25] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#2d5a37]" />
              <span>Phần Giới Thiệu (Tổng Quan Điểm Chiêm Bái)</span>
            </div>
            <p className="text-sm sm:text-base text-[#192b1d] font-medium leading-relaxed italic">
              "{intro}"
            </p>
          </div>

          {/* 3. MỤC THUYẾT MINH CHI TIẾT */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#e2eae4] pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#19231b] uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-[#2d5a37]" />
                <span>Nội Dung Thuyết Minh Chi Tiết</span>
              </div>
              <span className="text-[11px] text-[#5c7362] font-semibold bg-[#f0f4f1] px-2.5 py-0.5 rounded-full border border-[#d6e5d9]">
                Ngôn ngữ: <strong>{currentLang.toUpperCase()}</strong>
              </span>
            </div>

            <div className="text-sm sm:text-base text-[#1f2c22] leading-relaxed whitespace-pre-line font-normal pt-1 bg-white p-4 sm:p-5 rounded-2xl border border-[#eef3ef] shadow-2xs">
              {content}
            </div>
          </div>

          {/* 4. MỤC AUDIO THUYẾT MINH ĐỐI ỨNG */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-[#eef5f0] border border-[#d2e4d6] shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#2d5a37] text-white flex items-center justify-center shadow-xs">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1e3d25] block">Audio Thuyết Minh Điểm POI</span>
                <span className="text-[11px] text-[#5c7362]">
                  Đang phát chuẩn ngữ điệu [{currentLang.toUpperCase()}] • {poi.code}
                </span>
              </div>
            </div>
            <button
              onClick={isPlaying && !isPaused ? onPause : isPaused ? onResume : onPlay}
              className="px-4 py-2 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              {isPlaying && !isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Tạm dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>{isPaused ? 'Tiếp tục nghe' : 'Nghe Audio'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. MỤC AUDIO PLAYER CONTROLLER - ĐẦY ĐỦ CÁC NÚT ĐIỀU KHIỂN THEO YÊU CẦU */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#fbfdfb] to-[#edf4ee] border-t border-[#d8e6db] shadow-[0_-8px_20px_rgba(0,0,0,0.04)] space-y-3">
          {/* Seekbar & Time Stamp */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#2d5a37]">
              <span>{formatTime(elapsedSeconds)}</span>
              <span className="text-[11px] text-[#5c7362] font-sans font-medium flex items-center gap-1">
                {isPlaying && !isPaused && (
                  <span className="flex items-center gap-0.5 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    Đang phát
                  </span>
                )}
                <span>/ {formatTime(duration)}</span>
              </span>
            </div>

            {/* Range Slider Seekbar */}
            <input
              type="range"
              min={0}
              max={duration || 60}
              value={elapsedSeconds}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="w-full h-2 bg-[#d6e5d9] rounded-lg appearance-none cursor-pointer accent-[#2d5a37]"
            />
          </div>

          {/* Audio Controls Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Speed Button */}
            <button
              onClick={cycleSpeed}
              className="px-3 py-1.5 rounded-full bg-white border border-[#d6e7da] hover:bg-[#e4efe6] text-[#2d5a37] text-xs font-bold shadow-2xs transition-colors"
              title="Tốc độ đọc"
            >
              {currentSpeed}x
            </button>

            {/* Center Controls: Rewind 10s, Play/Pause, Forward 10s */}
            <div className="flex items-center gap-3">
              {/* Tua lùi 10 giây */}
              <button
                onClick={() => onRewind(10)}
                className="w-10 h-10 rounded-full bg-white border border-[#d6e7da] hover:bg-[#eef5f0] text-[#2d5a37] flex flex-col items-center justify-center shadow-xs active:scale-95 transition-all"
                title="Tua lùi 10 giây (-10s)"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[9px] font-bold -mt-0.5">10s</span>
              </button>

              {/* Main Play / Pause Button */}
              {isPlaying && !isPaused ? (
                <button
                  onClick={onPause}
                  className="w-14 h-14 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ring-4 ring-[#2d5a37]/20"
                  title="Tạm dừng"
                >
                  <Pause className="w-6 h-6 fill-current" />
                </button>
              ) : isPaused ? (
                <button
                  onClick={onResume}
                  className="w-14 h-14 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ring-4 ring-[#2d5a37]/20"
                  title="Tiếp tục nghe"
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </button>
              ) : (
                <button
                  onClick={onPlay}
                  className="w-14 h-14 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ring-4 ring-[#2d5a37]/20"
                  title="Phát thuyết minh"
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </button>
              )}

              {/* Tua tới 10 giây */}
              <button
                onClick={() => onForward(10)}
                className="w-10 h-10 rounded-full bg-white border border-[#d6e7da] hover:bg-[#eef5f0] text-[#2d5a37] flex flex-col items-center justify-center shadow-xs active:scale-95 transition-all"
                title="Tua tới 10 giây (+10s)"
              >
                <RotateCw className="w-4 h-4" />
                <span className="text-[9px] font-bold -mt-0.5">10s</span>
              </button>
            </div>

            {/* Right Controls: Choose Voice & Stop */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenVoiceSelector}
                className="p-2.5 rounded-full bg-white border border-[#d6e7da] hover:bg-[#eef5f0] text-[#2d5a37] shadow-2xs transition-colors"
                title="Chọn giọng đọc (Chị Google, Google Cloud, Bing, TikTok)"
              >
                <Mic className="w-4 h-4" />
              </button>

              {(isPlaying || isPaused) && (
                <button
                  onClick={onStop}
                  className="p-2.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 shadow-2xs transition-colors"
                  title="Dừng hẳn audio"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
