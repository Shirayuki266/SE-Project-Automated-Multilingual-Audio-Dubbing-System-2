import React, { useState } from 'react';
import { Sparkles, MapPin, Compass, Volume2, ShieldCheck, Heart } from 'lucide-react';
import { LanguageCode } from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';
import { getBrowserFingerprint } from '../utils/fingerprint.js';

interface WelcomeModalProps {
  currentLang: LanguageCode;
  onStartPilgrimage: () => void;
  todayStartsCount?: number;
  uniquePilgrimsCount?: number;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  currentLang,
  onStartPilgrimage,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = translations[currentLang];

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const fingerprintHash = await getBrowserFingerprint();
      await fetch('/api/analytics/pilgrimage-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprintHash,
          language: currentLang,
        }),
      });
    } catch (err) {
      console.warn('Analytics log notice:', err);
    } finally {
      setIsSubmitting(false);
      onStartPilgrimage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white text-[#19231b] rounded-3xl shadow-2xl border border-[#e2eae4] p-6 sm:p-8 overflow-hidden my-auto text-center space-y-6">
        {/* Sacred Pagoda Emblem */}
        <div className="inline-flex relative items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#eef5f0] to-[#d8ebd9] border-2 border-[#2d5a37] flex items-center justify-center text-4xl text-[#2d5a37] shadow-md ring-4 ring-[#2d5a37]/15">
            ☸
          </div>
          <span className="absolute -bottom-1 -right-2 bg-[#2d5a37] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
            TP.HCM
          </span>
        </div>

        {/* Title & Spiritual Greeting */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d5a37] bg-[#f0f5f1] px-3 py-1 rounded-full border border-[#d6e7da]">
            Phục Vụ Cộng Đồng Phi Lợi Nhuận
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#19231b] pt-1">
            Việt Nam Quốc Tự
          </h2>
          <p className="text-xs text-[#5c7362] font-medium leading-relaxed max-w-xs mx-auto">
            Hệ thống thuyết minh tự động đa ngôn ngữ & hướng dẫn chiêm bái di tích tâm linh
          </p>
          <div className="inline-flex items-center gap-1.5 text-xs text-[#2d5a37] bg-[#f0f5f1] px-3.5 py-1.5 rounded-full border border-[#d6e7da] mt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#2d5a37] flex-shrink-0" />
            <span>242-244 Ba Tháng Hai, P.12, Q.10, TP.HCM</span>
          </div>
        </div>

        {/* Key Highlights Card */}
        <div className="grid grid-cols-2 gap-2.5 text-left pt-1">
          <div className="p-3 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e3d25]">
              <Compass className="w-3.5 h-3.5 text-[#2d5a37]" />
              <span>Định vị GPS</span>
            </div>
            <p className="text-[11px] text-[#5c7362] leading-tight">
              Tự động nhận diện 8 điểm di tích khi bạn đến gần
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e3d25]">
              <Volume2 className="w-3.5 h-3.5 text-[#2d5a37]" />
              <span>Thuyết Minh AI</span>
            </div>
            <p className="text-[11px] text-[#5c7362] leading-tight">
              Nghe audio và đọc bài viết theo 12 thứ tiếng
            </p>
          </div>
        </div>

        {/* Sole Primary Action Button */}
        <div className="pt-2 space-y-3">
          <button
            onClick={handleStart}
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white font-bold text-base tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Sparkles className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>Bắt Đầu Chiêm Bái</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-[#7a8e80]">
            Nam Mô A Di Đà Phật • Chúc quý khách chuyến chiêm bái an lạc
          </p>
        </div>
      </div>
    </div>
  );
};
