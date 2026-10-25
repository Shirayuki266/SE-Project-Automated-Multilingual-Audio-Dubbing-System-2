import React, { useState } from 'react';
import { RichPOI } from '../server/types.js';
import { LanguageCode } from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Mic,
  VolumeX,
  RotateCcw,
  RotateCw,
  Maximize2,
  ChevronUp,
} from 'lucide-react';

interface AudioPlayerBarProps {
  currentPOI: RichPOI | null;
  currentLang: LanguageCode;
  isPlaying: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  duration: number;
  visitStatus?: 'unvisited' | 'viewing' | 'visited';
  onPlay: (poi: RichPOI) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRewind?: (seconds?: number) => void;
  onForward?: (seconds?: number) => void;
  onSeek?: (seconds: number) => void;
  onSetRate: (rate: number) => void;
  autoNarrationEnabled?: boolean;
  onToggleAutoNarration?: () => void;
  onNextPOI: () => void;
  onPrevPOI: () => void;
  onOpenVoiceSelector: () => void;
  onOpenDetailModal?: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  currentPOI,
  currentLang,
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
  onNextPOI,
  onPrevPOI,
  onOpenVoiceSelector,
  onOpenDetailModal,
}) => {
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const [isDismissedByUser, setIsDismissedByUser] = useState<boolean>(false);
  const t = translations[currentLang];

  if (!currentPOI) return null;
  if (!isPlaying && !isPaused && isDismissedByUser) return null;

  const activeTranslation = currentPOI.translations[currentLang] || currentPOI.translations['vi'];
  const poiTitle = activeTranslation?.title || currentPOI.code;
  const poiImage =
    currentPOI.media[0]?.image_url ||
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80';
  const safeDuration = Math.max(1, duration || 45);
  const progressPercent = Math.min(100, Math.max(0, (elapsedSeconds / safeDuration) * 100));

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds = [0.9, 1.0, 1.1, 1.25];
    const currentIndex = speeds.indexOf(currentSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setCurrentSpeed(nextSpeed);
    onSetRate(nextSpeed);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCloseAndStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStop();
    setIsDismissedByUser(true);
  };

  return (
    <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-xl border-t border-[#d8e6db] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-all animate-slide-up">
      {/* Top Interactive Progress Seek Bar */}
      <div className="w-full bg-[#e8efe9] h-2 relative group cursor-pointer">
        <input
          type="range"
          min={0}
          max={safeDuration}
          value={elapsedSeconds}
          onChange={(e) => onSeek && onSeek(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className={`h-full transition-all duration-150 relative rounded-r-full ${
            isPlaying && !isPaused ? 'bg-[#2d5a37]' : 'bg-[#7a8e80]'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Status Callout when Audio is actively reading */}
      {(isPlaying || isPaused) && (
        <div className="bg-[#eef5f0] border-b border-[#d8e6db] px-3.5 py-1 flex items-center justify-between text-[11px] text-[#1e3d25]">
          <div
            onClick={onOpenDetailModal}
            className="flex items-center gap-1.5 cursor-pointer hover:underline truncate mr-2"
          >
            <span className="flex h-2 w-2 relative shrink-0">
              {isPlaying && !isPaused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d5a37] opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2d5a37]" />
            </span>
            <span className="font-bold shrink-0">
              {isPlaying && !isPaused ? 'Đang thuyết minh' : 'Tạm dừng'}
            </span>
            {isPlaying && !isPaused && (
              <div className="flex items-end gap-0.5 h-3 ml-1 shrink-0">
                <span className="w-0.5 bg-[#2d5a37] h-2 animate-bounce" />
                <span className="w-0.5 bg-[#2d5a37] h-3 animate-pulse" />
                <span className="w-0.5 bg-[#2d5a37] h-1.5 animate-bounce" />
              </div>
            )}
            <span className="text-[10px] text-[#2d5a37] font-semibold flex items-center gap-0.5 ml-2 bg-white px-2 py-0.5 rounded-full border border-[#cde0d2] shrink-0 hidden xs:inline-flex">
              <ChevronUp className="w-3 h-3" />
              Chi tiết
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenVoiceSelector}
              className="text-[10px] text-[#2d5a37] hover:underline font-semibold flex items-center gap-1 shrink-0"
              title={t.chooseVoice}
            >
              <Mic className="w-3 h-3" />
              <span className="hidden sm:inline">{t.chooseVoice}</span>
            </button>
            <span className="text-[#a0b5a6] hidden sm:inline">|</span>
            <button
              onClick={handleCloseAndStop}
              className="text-[10px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors shrink-0"
              title="Dừng audio & tắt thanh phát"
            >
              <VolumeX className="w-3 h-3" />
              <span>{t.stopClose}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Bar Controls: Mobile Responsive Grid/Flex with Anti-Wrap Isolation */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left: Thumbnail & Title & Progress Time (strictly bounded to prevent squishing) */}
        <div
          onClick={onOpenDetailModal}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group overflow-hidden"
          title="Bấm để mở bảng chi tiết điểm POI"
        >
          {/* Thumbnail */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-[#e0ebe2] shrink-0 shadow-xs">
            <img
              src={poiImage}
              alt={poiTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            {isPlaying && !isPaused && (
              <div className="absolute inset-0 bg-[#2d5a37]/30 flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              </div>
            )}
          </div>

          {/* Text block: Badge + Time on Row 1, Title on Row 2 with guaranteed ellipsis */}
          <div className="min-w-0 flex-1 overflow-hidden pr-1">
            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-[#eef5f0] text-[#2d5a37] border border-[#d6e7da] truncate max-w-[80px] sm:max-w-[130px] shrink-0">
                {currentPOI.code}
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#5c7362] font-mono whitespace-nowrap shrink-0">
                {formatTime(elapsedSeconds)} / {formatTime(safeDuration)}
              </span>
            </div>
            <h3 className="font-serif font-bold text-xs sm:text-sm text-[#19231b] truncate mt-0.5 group-hover:text-[#2d5a37] transition-colors block w-full">
              {poiTitle}
            </h3>
          </div>
        </div>

        {/* Right: Dedicated Audio Controls Cluster (Fixed min-width, non-shrinkable) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-[145px] sm:min-w-[210px] justify-end">
          {/* Rewind 10s button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRewind && onRewind(10);
            }}
            className="w-8 h-8 rounded-full text-[#4a5f50] hover:bg-[#eef5f0] hover:text-[#2d5a37] transition-colors flex items-center justify-center shrink-0 active:scale-95"
            title="Tua lùi 10s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold ml-0.5">10</span>
          </button>

          {/* Prev POI Button (desktop only) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevPOI();
            }}
            className="p-1.5 rounded-full text-[#4a5f50] hover:bg-[#eef5f0] transition-colors hidden md:inline-flex shrink-0"
            title="Điểm trước"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Main Play / Pause Button */}
          {isPlaying && !isPaused ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPause();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              title="Tạm dừng"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          ) : isPaused ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResume();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              title="Tiếp tục nghe"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissedByUser(false);
                onPlay(currentPOI);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
              title="Phát thuyết minh"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          )}

          {/* Forward 10s button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onForward && onForward(10);
            }}
            className="w-8 h-8 rounded-full text-[#4a5f50] hover:bg-[#eef5f0] hover:text-[#2d5a37] transition-colors flex items-center justify-center shrink-0 active:scale-95"
            title="Tua tới 10s"
          >
            <span className="text-[9px] font-bold mr-0.5">10</span>
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Next POI Button (desktop only) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNextPOI();
            }}
            className="p-1.5 rounded-full text-[#4a5f50] hover:bg-[#eef5f0] transition-colors hidden md:inline-flex shrink-0"
            title="Điểm tiếp theo"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Pill (desktop only) */}
          <button
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-full bg-[#f0f5f1] text-[#2d5a37] text-[10px] font-bold border border-[#e0ebe2] hover:bg-[#e4efe6] transition-colors hidden lg:inline-flex shrink-0"
            title="Tốc độ đọc"
          >
            {currentSpeed}x
          </button>

          {/* Voice Selector Quick Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenVoiceSelector();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[#2d5a37] hover:bg-[#eef5f0] flex items-center justify-center transition-colors shrink-0"
            title="Chọn giọng đọc"
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Open Full Detail Drawer Button (desktop/tablet) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetailModal && onOpenDetailModal();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[#2d5a37] bg-[#f0f6f2] hover:bg-[#e2eae4] flex items-center justify-center transition-colors shrink-0 hidden sm:inline-flex"
            title="Mở xem chi tiết điểm POI"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close Bar Button */}
          <button
            onClick={handleCloseAndStop}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-[#7a8e80] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0 ml-0.5"
            title="Đóng thanh phát"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
