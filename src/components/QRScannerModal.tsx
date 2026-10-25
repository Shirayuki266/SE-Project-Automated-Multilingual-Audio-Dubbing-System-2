import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { POI, Language } from '../types';
import { QrCode, X, Sparkles, Camera } from 'lucide-react';

interface QRScannerModalProps {
  pois: POI[];
  language: Language;
  onScanSuccess: (poiId: string) => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  pois,
  language,
  onScanSuccess,
  onClose,
}) => {
  const isVi = language === 'vi';
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader-container',
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        // Parse POI ID from URL or raw text
        let targetId = decodedText.trim();
        if (targetId.includes('poi=')) {
          const match = targetId.match(/poi=([^&]+)/);
          if (match) targetId = match[1];
        }

        scanner.clear();
        onScanSuccess(targetId);
      },
      (error) => {
        // Continuous scan error (ignore standard frame misses)
      }
    );

    scannerRef.current = scanner;

    return () => {
      try {
        scanner.clear().catch(console.error);
      } catch (e) {}
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#fffcf8] p-5 shadow-2xl border border-amber-300">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-800">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#5c2b16]">
                {isVi ? 'Quét Mã QR Trong Nhà' : 'Scan Indoor QR Code'}
              </h3>
              <p className="text-[10px] text-stone-500">
                {isVi ? 'Dành cho Chánh Điện & nơi kín sóng GPS' : 'Indoor Fallback for Sanctuaries'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-black border border-stone-800">
          <div id="qr-reader-container" className="w-full text-stone-800" />
        </div>

        {/* Quick Test Badges for Desktop & Testing */}
        <div className="mt-4 pt-3 border-t border-amber-100">
          <p className="text-[11px] font-bold text-amber-900 mb-2 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>{isVi ? 'Mô phỏng quét nhanh biển đồng:' : 'Simulate scanning plaque:'}</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {pois.map((p) => {
              const trans = p.translations[language] || p.translations.vi;
              return (
                <button
                  key={p.poi_id}
                  onClick={() => {
                    if (scannerRef.current) scannerRef.current.clear();
                    onScanSuccess(p.poi_id);
                  }}
                  className="rounded-xl bg-amber-50 px-2.5 py-1.5 text-left text-xs font-medium text-[#5c2b16] border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 transition-all truncate"
                >
                  <span className="font-bold text-amber-700">#{p.order_index} </span>
                  <span>{trans.title.split('–')[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
