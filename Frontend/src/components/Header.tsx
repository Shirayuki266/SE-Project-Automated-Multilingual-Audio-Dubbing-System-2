import React from 'react';
import { QrCode, Bot, Shield, Compass, Wifi, WifiOff, User, Share2 } from 'lucide-react';
import { Language, UserProfile } from '../types';

interface HeaderProps {
  language: Language;
  currentUser: UserProfile | null;
  onLanguageChange: (lang: Language) => void;
  onOpenQrScanner: () => void;
  onOpenAiChat: () => void;
  onOpenAdmin: () => void;
  onOpenUserModal: () => void;
  onOpenShareModal: () => void;
  isSimulating: boolean;
  onToggleSimulator: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  currentUser,
  onLanguageChange,
  onOpenQrScanner,
  onOpenAiChat,
  onOpenAdmin,
  onOpenUserModal,
  onOpenShareModal,
  isSimulating,
  onToggleSimulator,
  isOnline,
}) => {
  const isVi = language === 'vi';

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-b from-[#5c2b16]/95 via-[#5c2b16]/85 to-transparent backdrop-blur-sm text-amber-50">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-amber-400/20 p-1 border border-amber-300/40 shadow">
          <img src="/lotus.svg" alt="Lotus" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-sm tracking-wide text-amber-200 leading-tight">
            Việt Nam Quốc Tự
          </h1>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-300/80">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-300 font-medium">
                <Wifi className="h-3 w-3" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <WifiOff className="h-3 w-3" /> Offline-Ready
              </span>
            )}
            <span>•</span>
            <span>Low-Cost Core</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        {/* User Account / Pilgrim Passport */}
        <button
          onClick={onOpenUserModal}
          title={
            currentUser
              ? isVi ? 'Hộ chiếu Phật tử' : 'Pilgrim Passport'
              : isVi ? 'Đăng nhập tài khoản' : 'Sign in'
          }
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentUser
              ? 'bg-amber-400 text-stone-900 border-amber-300 shadow'
              : 'bg-black/30 text-amber-200 border-white/20 hover:bg-black/50'
          }`}
        >
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline max-w-[80px] truncate">
            {currentUser ? (currentUser.dharma_name || currentUser.full_name) : (isVi ? 'Phật Tử' : 'Pilgrim')}
          </span>
        </button>

        {/* GPS Simulation Toggle */}
        <button
          onClick={onToggleSimulator}
          title={isVi ? 'Bật/Tắt Giả lập GPS' : 'Toggle GPS Simulation'}
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
            isSimulating
              ? 'bg-amber-400 text-stone-900 border-amber-300 shadow-md'
              : 'bg-black/30 text-amber-200 border-white/20 hover:bg-black/50'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span className="hidden sm:inline">{isVi ? 'Giả Lập' : 'Sim GPS'}</span>
        </button>

        {/* Indoor QR Scanner Button */}
        <button
          onClick={onOpenQrScanner}
          title={isVi ? 'Quét QR trong nhà' : 'Scan Indoor QR'}
          className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 transition-all flex items-center gap-1"
        >
          <QrCode className="h-4 w-4 text-amber-300" />
          <span className="hidden sm:inline text-xs font-semibold">{isVi ? 'Quét QR' : 'QR Scan'}</span>
        </button>

        {/* Buddhist AI Chatbot */}
        <button
          onClick={onOpenAiChat}
          title={isVi ? 'Trợ lý AI Pháp Hỷ' : 'AI Guide Assistant'}
          className="p-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-300/50 text-white shadow hover:brightness-110 transition-all flex items-center gap-1"
        >
          <Bot className="h-4 w-4 text-amber-200" />
          <span className="hidden sm:inline text-xs font-bold">{isVi ? 'AI Pháp Hỷ' : 'AI Guide'}</span>
        </button>

        {/* Language Switch */}
        <button
          onClick={() => onLanguageChange(isVi ? 'en' : 'vi')}
          className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/20 text-xs font-bold text-amber-200 hover:bg-black/60 transition-all"
        >
          {isVi ? '🇬🇧 EN' : '🇻🇳 VI'}
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          title={isVi ? 'Chia sẻ cho bạn bè' : 'Share with friends'}
          className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 transition-all flex items-center gap-1"
        >
          <Share2 className="h-4 w-4 text-amber-300" />
          <span className="hidden sm:inline text-xs font-semibold">{isVi ? 'Chia Sẻ' : 'Share'}</span>
        </button>

        {/* Admin CMS */}
        <button
          onClick={onOpenAdmin}
          title={isVi ? 'Quản Trị CMS' : 'Admin CMS'}
          className="p-2 rounded-xl bg-black/30 border border-white/20 text-white/80 hover:text-white hover:bg-black/50 transition-all"
        >
          <Shield className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
