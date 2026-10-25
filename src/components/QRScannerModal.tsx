import React, { useState, useRef, useEffect } from 'react';
import { RichPOI } from '../server/types.js';
import { LanguageCode, templeSFX } from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';
import { QrCode, Camera, X, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';

interface QRScannerModalProps {
  pois: RichPOI[];
  currentLang: LanguageCode;
  onClose: () => void;
  onScanSuccess: (poi: RichPOI) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  pois,
  currentLang,
  onClose,
  onScanSuccess,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedPOI, setScannedPOI] = useState<RichPOI | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const t = translations[currentLang];

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setErrorMessage('Không thể mở camera trên trình duyệt này. Quý khách có thể chạm vào danh sách mã tem dán bên dưới để kích hoạt tức thì.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleSelectPoiCode = (poi: RichPOI) => {
    templeSFX.playTempleBell(280);
    setScannedPOI(poi);
    setTimeout(() => {
      stopCamera();
      onScanSuccess(poi);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-[#e2eae4] rounded-3xl p-5 sm:p-6 shadow-2xl text-[#19231b] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e2eae4]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#eef5f0] text-[#2d5a37]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                {t.scanQR}
              </h3>
              <p className="text-[11px] text-[#5c7362]">
                Hướng camera về mã QR dán tại các biển hiệu trong chùa
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#f0f5f1] hover:bg-[#e4efe6] text-[#4a5f50] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="my-3 relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-dashed border-[#2d5a37]/50 shadow-inner">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 border-2 border-[#2d5a37] rounded-2xl relative">
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#2d5a37] animate-pulse" />
              </div>
            </div>
          )}

          {!cameraActive && (
            <div className="text-center p-4 space-y-2">
              <Camera className="w-10 h-10 mx-auto text-stone-400 animate-bounce" />
              <p className="text-xs text-stone-300">
                {errorMessage || 'Đang kết nối camera điện thoại...'}
              </p>
            </div>
          )}
        </div>

        {/* Success Banner */}
        {scannedPOI && (
          <div className="p-3 bg-[#eef5f0] border border-[#2d5a37] rounded-2xl flex items-center gap-2 text-xs text-[#1e3d25] mb-3 animate-fade-in font-medium">
            <CheckCircle className="w-4 h-4 text-[#2d5a37]" />
            <span>
              Đã nhận diện: <strong>{scannedPOI.translations[currentLang]?.title || scannedPOI.code}</strong>. Đang nạp thuyết minh...
            </span>
          </div>
        )}

        {/* Quick Tap Selection Fallback */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5c7362]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Hoặc chạm để chọn nhanh biển QR:
            </span>
            <span className="text-[10px] text-[#7a8e80]">8 biển mã số</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {pois.map((p) => {
              const title = p.translations[currentLang]?.title || p.translations['vi']?.title || p.code;
              return (
                <button
                  key={p.poi_id}
                  onClick={() => handleSelectPoiCode(p)}
                  className="flex items-center gap-2 p-2 rounded-2xl bg-[#f7f9f6] hover:bg-[#eef5f0] border border-[#e2eae4] hover:border-[#2d5a37] text-left transition-all group"
                >
                  <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center font-bold text-xs text-[#2d5a37] border border-[#e2eae4] group-hover:bg-[#2d5a37] group-hover:text-white transition-colors">
                    {p.code.replace('POI-', '#')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#19231b] truncate group-hover:text-[#2d5a37]">
                      {title}
                    </div>
                    <div className="text-[10px] text-[#7a8e80]">Mã: {p.code}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
