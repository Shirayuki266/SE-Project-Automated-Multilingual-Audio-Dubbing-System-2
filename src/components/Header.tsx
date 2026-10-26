import React, { useState } from 'react';
import {
  Compass,
  QrCode,
  Volume2,
  Sparkles,
  Menu,
  Globe,
  ChevronDown,
  Check,
  Mic,
  VolumeX,
  Lock,
  Shield,
  X,
  BookOpen,
} from 'lucide-react';
import { LanguageCode } from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';
import { UserLocationState } from '../hooks/useGPSTracker.js';

interface HeaderProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  userLocation: UserLocationState;
  onOpenQRScanner: () => void;
  onOpenVoiceSelector: () => void;
  onResetWelcome: () => void;
  onOpenAdmin: () => void;
  isAudioPlaying: boolean;
  onStopAudio: () => void;
}

const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
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

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  userLocation,
  onOpenQRScanner,
  onOpenVoiceSelector,
  onResetWelcome,
  onOpenAdmin,
  isAudioPlaying,
  onStopAudio,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const currentLangObj = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];
  const t = translations[currentLang];

  return (
    <header className="sticky top-0 z-40 bg-[#f7f9f6]/95 backdrop-blur-md border-b border-[#e5ece6] transition-all">
      {/* Mobile Top Status / Navigation Bar */}
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Rounded Menu Button + Emblem */}
        <div className="flex items-center gap-2.5 relative">
          <button
            onClick={() => setShowMainMenu(!showMainMenu)}
            className="w-10 h-10 rounded-full bg-white border border-[#e2eae4] shadow-xs flex items-center justify-center text-[#2d5a37] hover:bg-[#eef4ef] transition-colors"
            title="Menu chức năng & Quản trị"
          >
            <Menu className="w-5 h-5 text-[#2d5a37]" />
          </button>

          {/* Quick Dropdown Menu */}
          {showMainMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMainMenu(false)} />
              <div className="absolute top-12 left-0 w-64 bg-white rounded-2xl shadow-xl border border-[#e2eae4] p-2 z-50 animate-fade-in space-y-1">
                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    onResetWelcome();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#19231b] hover:bg-[#eef5f0] flex items-center gap-2 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-[#2d5a37]" />
                  <span>{t.welcomeHeading}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    onOpenVoiceSelector();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#19231b] hover:bg-[#eef5f0] flex items-center gap-2 transition-colors"
                >
                  <Mic className="w-4 h-4 text-[#2d5a37]" />
                  <span>{t.chooseVoice}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    onOpenQRScanner();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#19231b] hover:bg-[#eef5f0] flex items-center gap-2 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-[#2d5a37]" />
                  <span>{t.scanQR}</span>
                </button>

                <div className="my-1 border-t border-[#e2eae4]" />

                {/* Explicit Admin Entrance */}
                <button
                  onClick={() => {
                    setShowMainMenu(false);
                    onOpenAdmin();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-2 transition-colors"
                >
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Quản Trị Hệ Thống (Admin)</span>
                </button>
              </div>
            </>
          )}

          <div
            onClick={onResetWelcome}
            className="cursor-pointer select-none leading-tight"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base sm:text-lg text-[#1e3d25] tracking-tight">
                Việt Nam Quốc Tự
              </span>
              {isAudioPlaying && (
                <span className="flex h-2.5 w-2.5 relative" title="Đang phát thuyết minh">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d5a37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2d5a37]"></span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#5c7362] font-medium hidden xs:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Right Actions: Audio Playing Pill / Voice Picker / Language Selector / Admin Button */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Active Audio Indicator pill with Stop/Close button */}
          {isAudioPlaying && (
            <button
              onClick={onStopAudio}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all shadow-xs animate-fade-in"
              title={t.stopClose}
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.stop}</span>
            </button>
          )}

          {/* Voice Selector Pill */}
          <button
            onClick={onOpenVoiceSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e2eae4] hover:border-[#2d5a37] shadow-xs text-xs text-[#1e3d25] font-semibold transition-all hover:bg-[#f0f5f1]"
            title={t.chooseVoice}
          >
            <Mic className="w-3.5 h-3.5 text-[#2d5a37]" />
            <span className="text-[11px] hidden xs:inline">{t.voiceSelector}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-[#e2eae4] hover:border-[#2d5a37] shadow-xs text-xs text-[#1e3d25] font-semibold transition-all"
              title={t.selectLanguage}
            >
              <span className="text-sm">{currentLangObj.flag}</span>
              <span className="hidden sm:inline uppercase text-[11px]">{currentLangObj.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#5c7362]" />
            </button>

            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#e2eae4] p-1.5 z-50 animate-fade-in max-h-72 overflow-y-auto">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7a8e80] border-b border-gray-100">
                    {t.selectLanguage}
                  </div>
                  {LANGUAGES.map((lang) => {
                    const isSelected = lang.code === currentLang;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                          isSelected
                            ? 'bg-[#2d5a37] text-white font-bold'
                            : 'hover:bg-[#f0f5f1] text-[#19231b]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Direct Admin Entrance Button in Header */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
            title="Đăng nhập Cổng Quản Trị Hệ Thống (Admin Portal)"
          >
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            <span>Quản Trị</span>
          </button>
        </div>
      </div>
    </header>
  );
};
