import React, { useState } from 'react';
import { POI, Language } from '../types';
import { Play, Pause, RotateCcw, RotateCw, ChevronDown, ChevronUp, Volume2, Sparkles, MapPin } from 'lucide-react';

interface AudioPlayerDrawerProps {
  poi: POI | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  language: Language;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipSeconds: (delta: number) => void;
  onChangeRate: (rate: number) => void;
  onClose: () => void;
}

export const AudioPlayerDrawer: React.FC<AudioPlayerDrawerProps> = ({
  poi,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  language,
  onTogglePlay,
  onSeek,
  onSkipSeconds,
  onChangeRate,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!poi) return null;

  const isVi = language === 'vi';
  const trans = poi.translations[language] || poi.translations.vi;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center">
      {/* Minimized Floating Bar */}
      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className="mb-3 mx-4 w-full max-w-lg cursor-pointer rounded-2xl bg-[#5c2b16]/95 backdrop-blur-md p-3 text-amber-100 shadow-2xl border border-amber-400/40 flex items-center justify-between transition-all hover:brightness-105"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-900 border border-amber-300/30">
              <img
                src={poi.media[0]?.image_url || '/static/images/vietnam_quoc_tu_overview.jpg'}
                alt={trans.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/static/images/vietnam_quoc_tu_overview.jpg';
                }}
              />
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="flex items-center gap-0.5 text-amber-300">
                    <span className="audio-bar"></span>
                    <span className="audio-bar"></span>
                    <span className="audio-bar"></span>
                  </div>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-xs font-bold text-amber-200">{trans.title}</h4>
              <p className="text-[11px] text-amber-300/70">
                {formatTime(currentTime)} / {formatTime(duration || trans.audio_duration || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onTogglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-stone-900 shadow hover:bg-amber-300 active:scale-95"
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 text-amber-300 hover:text-white"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Full Bottom Drawer */
        <div className="w-full max-w-lg rounded-t-3xl bg-gradient-to-b from-[#fffcf8] to-[#f7f0e6] shadow-2xl border-t border-amber-300/60 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Drag Handle & Header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-amber-200/50">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 uppercase tracking-wide border border-amber-200">
                {poi.code}
              </span>
              <span className="text-xs font-semibold text-stone-500">
                {poi.location_type === 'outdoor'
                  ? isVi ? 'Khuôn viên ngoài trời' : 'Outdoor Campus'
                  : isVi ? 'Trong nhà / Chánh Điện' : 'Indoor Sanctuary'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-full text-stone-500 hover:bg-amber-100/60 transition-all"
                title="Thu nhỏ"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Image Banner */}
            <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-stone-900 shadow border border-amber-200/40">
              <img
                src={poi.media[0]?.image_url || '/static/images/vietnam_quoc_tu_overview.jpg'}
                alt={trans.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/static/images/vietnam_quoc_tu_overview.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 text-white text-[11px] font-medium drop-shadow">
                {isVi ? poi.media[0]?.caption_vi : poi.media[0]?.caption_en}
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="font-serif text-xl font-bold text-[#5c2b16] leading-snug">
                {trans.title}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-800 font-medium">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                <span>Bán kính kích hoạt Geofence: {poi.geofence_radius}m</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-700 whitespace-pre-line text-justify">
                {trans.description}
              </p>
            </div>
          </div>

          {/* Audio Controls Bar */}
          <div className="bg-[#5c2b16] p-4 text-amber-100 shadow-inner border-t border-amber-400/30">
            {/* Seek Bar */}
            <div className="space-y-1.5">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || trans.audio_duration || 100}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-amber-950 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-between text-[11px] font-medium text-amber-300/80">
                <span>{formatTime(currentTime)}</span>
                <span className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> Edge-TTS Neural Voice
                </span>
                <span>{formatTime(duration || trans.audio_duration || 0)}</span>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="mt-3 flex items-center justify-between">
              {/* Playback speed toggle */}
              <div className="flex items-center gap-1 rounded-xl bg-black/30 p-1 border border-white/10 text-xs font-bold">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onChangeRate(rate)}
                    className={`px-2 py-0.5 rounded-lg transition-all ${
                      playbackRate === rate ? 'bg-amber-400 text-stone-900 shadow' : 'text-amber-200/70 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Central Play Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onSkipSeconds(-10)}
                  title="-10s"
                  className="p-2 text-amber-200 hover:text-white active:scale-95 transition-all"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>

                <button
                  onClick={onTogglePlay}
                  className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-stone-900 shadow-xl hover:brightness-110 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => onSkipSeconds(10)}
                  title="+10s"
                  className="p-2 text-amber-200 hover:text-white active:scale-95 transition-all"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-black/20 text-xs font-semibold text-amber-200 hover:bg-black/40 hover:text-white transition-all"
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
