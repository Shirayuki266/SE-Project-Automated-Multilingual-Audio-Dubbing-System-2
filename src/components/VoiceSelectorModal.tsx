import React, { useState, useEffect } from 'react';
import {
  Mic,
  Volume2,
  Check,
  X,
  Sliders,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  speechEngine,
  VOICE_ENGINES,
  VoiceEngineId,
  LanguageCode,
} from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';

interface VoiceSelectorModalProps {
  currentLang: LanguageCode;
  onClose: () => void;
}

export const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({
  currentLang,
  onClose,
}) => {
  const [selectedEngine, setSelectedEngine] = useState<VoiceEngineId>(speechEngine.getEngine());
  const [rate, setRate] = useState<number>(speechEngine.getRate());
  const [pitch, setPitch] = useState<number>(speechEngine.getPitch());
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedSystemURI, setSelectedSystemURI] = useState<string>('');

  const t = translations[currentLang];

  useEffect(() => {
    const voices = speechEngine.getAvailableVoicesForLanguage(currentLang);
    setSystemVoices(voices);

    const onVoicesChanged = () => {
      setSystemVoices(speechEngine.getAvailableVoicesForLanguage(currentLang));
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    }
  }, [currentLang]);

  const handleSelectEngine = (engineId: VoiceEngineId) => {
    setSelectedEngine(engineId);
    speechEngine.setEngine(engineId);
    setRate(speechEngine.getRate());
    setPitch(speechEngine.getPitch());
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    speechEngine.setRate(newRate);
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    speechEngine.setPitch(newPitch);
  };

  const handleTestVoice = () => {
    setIsTesting(true);
    speechEngine.testVoice(undefined, currentLang);
    setTimeout(() => setIsTesting(false), 3000);
  };

  const handleResetDefault = () => {
    handleSelectEngine('chi-google');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#e2eae4] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e2eae4] flex items-center justify-between bg-[#f4f7f5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#2d5a37] text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#19231b]">
                {t.voiceModalTitle}
              </h3>
              <p className="text-[11px] text-[#5c7362]">
                {t.voiceModalSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#e2eae4] hover:bg-gray-100 flex items-center justify-center text-[#4a5f50] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Voice Engines Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#5c7362] uppercase tracking-wider mb-1">
              <span>{t.voiceEngineLabel}</span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-[#2d5a37] hover:underline flex items-center gap-1 font-normal lowercase"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mặc định</span>
              </button>
            </div>

            <div className="space-y-2">
              {VOICE_ENGINES.map((engine) => {
                const isSelected = selectedEngine === engine.id;
                return (
                  <div
                    key={engine.id}
                    onClick={() => handleSelectEngine(engine.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#eef5f0] border-[#2d5a37] ring-1 ring-[#2d5a37] shadow-xs'
                        : 'bg-white border-[#e2eae4] hover:bg-[#fbfcfb]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#2d5a37] text-white'
                            : 'bg-[#f0f4f1] text-[#2d5a37] border border-[#d6e7da]'
                        }`}
                      >
                        {engine.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-serif font-bold text-sm text-[#19231b] truncate">
                            {engine.name}
                          </h4>
                          <span className="text-[10px] text-[#7a8e80] bg-white px-2 py-0.5 rounded-full border border-[#e2eae4]">
                            {engine.provider}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5c7362] line-clamp-1 mt-0.5">
                          {engine.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#2d5a37] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional System Device Voice Dropdown */}
          {systemVoices.length > 0 && selectedEngine === 'browser' && (
            <div className="pt-1">
              <label className="text-[11px] font-bold text-[#5c7362] uppercase tracking-wider block mb-1">
                Giọng cài sẵn trên máy ({systemVoices.length})
              </label>
              <select
                value={selectedSystemURI}
                onChange={(e) => {
                  setSelectedSystemURI(e.target.value);
                  speechEngine.setSystemVoiceURI(e.target.value || null);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e2eae4] bg-white text-[#19231b] focus:ring-2 focus:ring-[#2d5a37] focus:outline-none"
              >
                <option value="">-- Mặc định hệ điều hành --</option>
                {systemVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Controls: Tốc độ đọc (Speech Rate) & Độ cao giọng (Pitch) */}
          <div className="p-4 bg-[#f9faf8] rounded-2xl border border-[#e2eae4] space-y-3.5">
            {/* Speed / Rate Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#19231b] flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-[#2d5a37]" />
                  <span>{t.speechRateLabel}</span>
                </span>
                <span className="font-mono font-bold text-[#2d5a37] text-xs bg-white px-2 py-0.5 rounded-full border border-[#d6e7da]">
                  {rate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full accent-[#2d5a37] h-1.5 bg-[#e2eae4] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7a8e80] mt-1">
                <span>0.7x (Chậm rãi)</span>
                <span>1.0x (Chuẩn)</span>
                <span>1.4x (Nhanh)</span>
              </div>
            </div>

            {/* Pitch Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#19231b] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#2d5a37]" />
                  <span>{t.speechPitchLabel}</span>
                </span>
                <span className="font-mono font-bold text-[#2d5a37] text-xs bg-white px-2 py-0.5 rounded-full border border-[#d6e7da]">
                  {pitch.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full accent-[#2d5a37] h-1.5 bg-[#e2eae4] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#7a8e80] mt-1">
                <span>0.7 (Trầm ấm)</span>
                <span>1.0 (Tự nhiên)</span>
                <span>1.4 (Thanh cao)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Test Button and Apply Button */}
        <div className="p-4 bg-[#f4f7f5] border-t border-[#e2eae4] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={isTesting}
            className="px-4 py-2.5 rounded-full bg-white border border-[#d6e7da] hover:bg-[#eaf3ec] text-[#2d5a37] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors active:scale-95 disabled:opacity-50"
          >
            <Volume2 className="w-4 h-4 text-[#2d5a37]" />
            <span>{isTesting ? 'Đang phát...' : t.testVoiceButton}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            {t.applyClose}
          </button>
        </div>
      </div>
    </div>
  );
};
