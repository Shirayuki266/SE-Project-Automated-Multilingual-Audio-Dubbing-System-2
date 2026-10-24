import React, { useState } from 'react';
import { Share2, X, Copy, Check, QrCode, Globe, Wifi, Smartphone } from 'lucide-react';
import { Language } from '../types';

interface ShareModalProps {
  language: Language;
  localIpUrl: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  language,
  localIpUrl,
  onClose,
}) => {
  const isVi = language === 'vi';
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(localIpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate QR code URL using standard public QR renderer API for easy scanning
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    localIpUrl
  )}&color=5c-2b-16&bgcolor=fffcf5`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#fffcf8] to-[#f7f0e6] p-6 shadow-2xl border border-amber-300 text-stone-800 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Title */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-stone-900 shadow mb-3">
          <Share2 className="h-6 w-6" />
        </div>
        <h3 className="font-serif font-bold text-lg text-[#5c2b16]">
          {isVi ? 'Chia Sẻ Cho Bạn Bè Dùng Thử' : 'Share with Friends'}
        </h3>
        <p className="text-xs text-stone-500 mt-0.5 mb-4">
          {isVi
            ? 'Quét mã QR bằng điện thoại (cùng WiFi) để vào app ngay'
            : 'Scan QR with phone (same WiFi) to test the app'}
        </p>

        {/* QR Code Container */}
        <div className="mx-auto h-52 w-52 overflow-hidden rounded-2xl border-2 border-amber-300 p-2 bg-[#fffcf5] shadow-inner mb-4 flex items-center justify-center">
          <img
            src={qrImageSrc}
            alt="Share QR"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Link Copy Box */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white p-2 border border-amber-200 text-xs">
            <Wifi className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />
            <input
              type="text"
              readOnly
              value={localIpUrl}
              className="flex-1 bg-transparent font-mono text-[11px] text-stone-700 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 font-bold text-stone-900 shadow hover:bg-amber-400 active:scale-95 transition-all shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-stone-900" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? (isVi ? 'Đã chép' : 'Copied') : isVi ? 'Sao chép' : 'Copy'}</span>
            </button>
          </div>

          <div className="rounded-xl bg-amber-50/80 p-2.5 text-[10px] text-stone-600 border border-amber-200/60 text-left space-y-1">
            <p className="font-bold text-amber-900 flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5" />
              <span>{isVi ? 'Lưu ý khi mở trên điện thoại:' : 'Note for mobile testing:'}</span>
            </p>
            <p>
              {isVi
                ? '• Điện thoại và máy tính cần kết nối chung một mạng WiFi.'
                : '• Phone and PC must be connected to the same WiFi network.'}
            </p>
            <p>
              {isVi
                ? '• Hoặc mở terminal gõ `npx localtunnel --port 5173` để lấy link HTTPS công khai gửi cho bạn bè ở bất kỳ đâu!'
                : '• Or run `npx localtunnel --port 5173` to get a public HTTPS link!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
