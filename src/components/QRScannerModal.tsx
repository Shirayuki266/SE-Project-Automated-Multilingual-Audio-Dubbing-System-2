import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { RichPOI } from '../server/types.js';
import { LanguageCode, templeSFX } from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';
import { QrCode, Camera, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [scannedPOI, setScannedPOI] = useState<RichPOI | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanTsRef = useRef<number>(0);
  const hasMatchedRef = useRef<boolean>(false);

  const t = translations[currentLang];

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const matchPoiFromPayload = useCallback(
    (rawValue: string): RichPOI | undefined => {
      const trimmed = rawValue.trim();
      if (!trimmed) return undefined;

      let candidateCode = trimmed;
      try {
        if (/^https?:\/\//i.test(trimmed)) {
          const parsedUrl = new URL(trimmed);
          const poiParam = parsedUrl.searchParams.get('poi');
          if (poiParam) {
            candidateCode = poiParam.trim();
          }
        }
      } catch {}

      const lower = candidateCode.toLowerCase();
      return pois.find(
        (p) =>
          p.code.toLowerCase() === lower ||
          p.poi_id.toLowerCase() === lower ||
          lower.includes(p.code.toLowerCase()) ||
          lower.includes(p.poi_id.toLowerCase())
      );
    },
    [pois]
  );

  const handleDecodedValue = useCallback(
    (rawValue: string) => {
      if (hasMatchedRef.current) return;
      const matched = matchPoiFromPayload(rawValue);
      if (matched) {
        hasMatchedRef.current = true;
        setScanWarning(null);
        templeSFX.playTempleBell(280);
        setScannedPOI(matched);
        setTimeout(() => {
          stopCamera();
          onScanSuccess(matched);
        }, 450);
      } else {
        setScanWarning('Mã QR không khớp điểm tham quan nào trong khuôn viên.');
      }
    },
    [matchPoiFromPayload, onScanSuccess, stopCamera]
  );

  const startScanLoop = useCallback(() => {
    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
    const detector = BarcodeDetectorCtor
      ? new BarcodeDetectorCtor({ formats: ['qr_code'] })
      : null;

    const tick = async (timestamp: number) => {
      if (hasMatchedRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA && timestamp - lastScanTsRef.current >= 150) {
        lastScanTsRef.current = timestamp;

        // 1. Try native BarcodeDetector first (fast on Android Chrome)
        if (detector) {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleDecodedValue(barcodes[0].rawValue);
              return;
            }
          } catch {}
        }

        // 2. Fallback to jsQR via offscreen canvas (works on iOS Safari & all browsers)
        const canvas = canvasRef.current;
        if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
          const targetW = Math.min(640, video.videoWidth);
          const targetH = Math.round((targetW / video.videoWidth) * video.videoHeight);
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetW, targetH);
            const imageData = ctx.getImageData(0, 0, targetW, targetH);
            const code = jsQR(imageData.data, targetW, targetH, {
              inversionAttempts: 'dontInvert',
            });
            if (code?.data) {
              handleDecodedValue(code.data);
              return;
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [handleDecodedValue]);

  const startCamera = useCallback(async () => {
    stopCamera();
    hasMatchedRef.current = false;
    setScanWarning(null);
    setErrorMessage(null);

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setErrorMessage('Trình duyệt yêu cầu kết nối HTTPS (hoặc localhost) để mở camera quét QR trên điện thoại.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Trình duyệt không hỗ trợ truy cập camera.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startScanLoop();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMessage('Bạn đã từ chối quyền Camera. Vui lòng cấp quyền Camera trong cài đặt trình duyệt rồi thử lại.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorMessage('Không tìm thấy camera trên thiết bị này.');
      } else {
        setErrorMessage('Không thể mở camera trên trình duyệt này. Vui lòng kiểm tra quyền truy cập camera.');
      }
      setCameraActive(false);
    }
  }, [startScanLoop, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

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
                Hướng camera sau về mã QR dán tại các biển hiệu trong chùa
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#f0f5f1] hover:bg-[#e4efe6] text-[#4a5f50] flex items-center justify-center transition-colors"
            aria-label="Đóng trình quét QR"
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
            autoPlay
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 border-2 border-[#2d5a37] rounded-2xl relative">
                <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400 animate-pulse" />
              </div>
            </div>
          )}

          {!cameraActive && (
            <div className="text-center p-4 space-y-3">
              <Camera className="w-10 h-10 mx-auto text-stone-400" />
              <p className="text-xs text-stone-200 max-w-xs mx-auto leading-relaxed">
                {errorMessage || 'Đang kết nối camera điện thoại...'}
              </p>
              {errorMessage && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại Camera</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Warning for unrecognized QR */}
        {scanWarning && !scannedPOI && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900 mb-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{scanWarning}</span>
          </div>
        )}

        {/* Success Banner */}
        {scannedPOI && (
          <div className="p-3 bg-[#eef5f0] border border-[#2d5a37] rounded-2xl flex items-center gap-2 text-xs text-[#1e3d25] mb-1 animate-fade-in font-medium">
            <CheckCircle className="w-4 h-4 text-[#2d5a37] shrink-0" />
            <span>
              Đã nhận diện: <strong>{scannedPOI.translations[currentLang]?.title || scannedPOI.code}</strong>. Đang nạp thuyết minh...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
