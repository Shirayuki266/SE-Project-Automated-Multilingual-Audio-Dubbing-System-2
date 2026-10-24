import React from 'react';
import { Volume2, MapPin, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface WelcomeGatewayProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onStart: () => void;
}

export const WelcomeGateway: React.FC<WelcomeGatewayProps> = ({
  language,
  onLanguageChange,
  onStart,
}) => {
  const isVi = language === 'vi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#fffcf7] to-[#f4ebe1] shadow-2xl border border-amber-300/40">
        {/* Top Header Image */}
        <div className="relative h-56 w-full overflow-hidden bg-stone-900">
          <img
            src="/static/images/vietnam_quoc_tu_overview.jpg"
            alt="Việt Nam Quốc Tự"
            className="h-full w-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#5c2b16] via-[#5c2b16]/40 to-transparent" />
          
          {/* Language Switcher pill on top right */}
          <div className="absolute top-4 right-4 z-10 flex gap-1 rounded-full bg-black/40 backdrop-blur-md p-1 border border-white/20">
            <button
              onClick={() => onLanguageChange('vi')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                isVi ? 'bg-amber-400 text-stone-900 shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                !isVi ? 'bg-amber-400 text-stone-900 shadow' : 'text-white/80 hover:text-white'
              }`}
            >
              🇬🇧 English
            </button>
          </div>

          {/* Lotus Badge */}
          <div className="absolute bottom-4 left-6 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#5c2b16]">
                <img src="/lotus.svg" alt="Lotus" className="h-7 w-7" />
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase">
                {isVi ? 'DI TÍCH PHẬT GIÁO' : 'BUDDHIST HERITAGE'}
              </span>
              <h1 className="font-serif text-2xl font-bold text-white drop-shadow">
                Việt Nam Quốc Tự
              </h1>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
              <MapPin className="h-4 w-4 text-amber-600" />
              <span>244 đường 3/2, Quận 10, TP. Hồ Chí Minh</span>
            </div>

            <p className="text-sm leading-relaxed text-stone-700">
              {isVi
                ? 'Chào mừng Quý Phật tử và du khách đến với hệ thống Thuyết minh tự động thông minh. Hệ thống sẽ tự động phát âm thanh khi Quý vị đến gần các điểm di tích (Bảo Tháp 13 tầng, Tòa Chánh Điện, Tháp Chuông...).'
                : 'Welcome to the Smart Audio Guide of Vietnam Quoc Tu. Audio commentary will automatically trigger as you approach sacred landmarks (13-Storey Stupa, Main Sanctuary, Great Bell Tower...).'}
            </p>

            <div className="rounded-2xl bg-amber-50/80 p-3.5 border border-amber-200/60 text-xs text-amber-950 flex items-start gap-3">
              <Volume2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  {isVi ? 'Mở khóa âm thanh & Định vị GPS' : 'Autoplay Audio & GPS Discovery'}
                </p>
                <p className="mt-0.5 text-stone-600">
                  {isVi
                    ? 'Nhấn nút bên dưới để mở khóa quyền tự động phát âm thanh trên trình duyệt di động.'
                    : 'Tap below to unlock mobile audio autoplay and explore the campus map.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onStart}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#8b3d1f] via-[#5c2b16] to-[#421b0c] p-4 text-base font-bold text-amber-100 shadow-xl transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Sparkles className="h-5 w-5 text-amber-300 transition-transform group-hover:rotate-12" />
            <span>{isVi ? 'Bắt Đầu Chuyến Chiêm Bái' : 'Begin Pilgrimage'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
