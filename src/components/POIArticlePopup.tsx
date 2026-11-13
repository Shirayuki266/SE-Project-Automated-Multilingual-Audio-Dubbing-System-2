import React, { useState, useEffect } from 'react';
import { RichPOI, POITranslation } from '../server/types.js';
import { LanguageCode, speechEngine } from '../utils/audioSpeech.js';
import {
  X,
  Sparkles,
  RotateCcw,
  Volume2,
  Check,
  Save,
  VolumeX,
  AlertCircle,
  HelpCircle,
  Lock,
  Globe,
} from 'lucide-react';

interface POIArticlePopupProps {
  poi: RichPOI;
  authToken: string | null;
  onClose: () => void;
  onRefreshPOIs: () => void;
  onShowNotify: (msg: string) => void;
}

const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt (Gốc)', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'fr', label: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'ru', label: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'th', label: 'ไทย (Thai)', flag: '🇹🇭' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'hi', label: 'हिन्दी (Hindi)', flag: '🇮🇳' },
];

export const POIArticlePopup: React.FC<POIArticlePopupProps> = ({
  poi,
  authToken,
  onClose,
  onRefreshPOIs,
  onShowNotify,
}) => {
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('vi');
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [desc, setDesc] = useState('');
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // AI & Audio states
  const [isSaving, setIsSaving] = useState(false);
  const [isLocalizingAll, setIsLocalizingAll] = useState(false);
  const [localizeProgressMsg, setLocalizeProgressMsg] = useState('');
  const [localizeStatuses, setLocalizeStatuses] = useState<
    Array<{ lang: string; label: string; status: 'success' | 'skipped_manual' | 'failed'; audioGenerated: boolean; error?: string }>
  >([]);
  const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Sync form data when switching language or POI
  useEffect(() => {
    const trans: POITranslation | undefined = poi.translations[selectedLang];
    const viTrans: POITranslation | undefined = poi.translations['vi'];

    if (trans) {
      setTitle(trans.title || '');
      setIntro(trans.introduction || '');
      setDesc(trans.description || '');
      setIsManuallyEdited(Boolean(trans.is_manually_edited));
    } else {
      setTitle(selectedLang === 'vi' ? poi.code : `${viTrans?.title || poi.code} (${selectedLang.toUpperCase()})`);
      setIntro(viTrans?.introduction || '');
      setDesc(viTrans?.description || '');
      setIsManuallyEdited(false);
    }
    setHasUnsavedChanges(false);
  }, [selectedLang, poi]);

  // Handle ESC key to close with confirmation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges]);

  // Close with warning if unsaved
  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('Quý vị có các thay đổi chưa được lưu vào MongoDB. Quý vị có chắc chắn muốn thoát?');
      if (!confirmLeave) return;
    }
    speechEngine.stop();
    onClose();
  };

  // Save current language translation
  const handleSaveCurrentLanguage = async () => {
    if (!title.trim() || !desc.trim()) {
      alert('Vui lòng nhập đầy đủ Tiêu đề và Nội dung bài viết thuyết minh.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/pois/${poi.poi_id}/translations/${selectedLang}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          introduction: intro.trim(),
          description: desc.trim(),
          is_manually_edited: isManuallyEdited,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setHasUnsavedChanges(false);
      onShowNotify(`Đã lưu bài viết tiếng [${selectedLang.toUpperCase()}] vào MongoDB thành công!`);
      onRefreshPOIs();
    } catch (err: any) {
      alert('Lỗi lưu bài viết: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click AI Localization (12 Languages + TTS)
  const handle1ClickLocalization = async () => {
    const viTitle = selectedLang === 'vi' ? title : poi.translations['vi']?.title;
    const viIntro = selectedLang === 'vi' ? intro : poi.translations['vi']?.introduction;
    const viDesc = selectedLang === 'vi' ? desc : poi.translations['vi']?.description;

    if (!viTitle || !viDesc) {
      alert('Vui lòng hoàn thiện Tiêu đề và Nội dung gốc Tiếng Việt trước khi dịch 12 ngôn ngữ.');
      return;
    }

    setIsLocalizingAll(true);
    setLocalizeStatuses([]);
    setLocalizeProgressMsg('Đang gửi prompt cấu trúc sang Gemini 2.5 Flash để dịch 12 ngôn ngữ & sinh file Audio...');

    try {
      const res = await fetch('/api/admin/localize-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          poiId: poi.poi_id,
          title_vi: viTitle,
          intro_vi: viIntro,
          description_vi: viDesc,
          generateAudio: true,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error);

      if (Array.isArray(data.languageStatuses)) {
        setLocalizeStatuses(data.languageStatuses);
      }
      onShowNotify(data.message || 'Đã tạo thành công 12 ngôn ngữ và Audio MP3!');
      onRefreshPOIs();
    } catch (err: any) {
      alert('Lỗi tạo đa ngôn ngữ bằng AI: ' + err.message);
    } finally {
      setIsLocalizingAll(false);
      setLocalizeProgressMsg('');
    }
  };

  // Regenerate Single Audio
  const handleRegenerateAudio = async () => {
    setIsRegeneratingAudio(true);
    try {
      const res = await fetch(`/api/pois/${poi.poi_id}/translations/${selectedLang}/regenerate-audio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onShowNotify(`Đã tạo lại Audio thuyết minh thành công cho tiếng [${selectedLang.toUpperCase()}]!`);
      onRefreshPOIs();
    } catch (err: any) {
      alert('Lỗi tạo lại audio: ' + err.message);
    } finally {
      setIsRegeneratingAudio(false);
    }
  };

  // Test Audio
  const handlePlayAudio = () => {
    if (isPlayingAudio) {
      speechEngine.stop();
      setIsPlayingAudio(false);
      return;
    }
    const currentTrans = poi.translations[selectedLang];
    const scriptToSpeak = desc || currentTrans?.description;
    const titleToSpeak = `${title || currentTrans?.title || poi.code} (${selectedLang.toUpperCase()})`;

    if (!scriptToSpeak) {
      alert('Chưa có nội dung để nghe thử.');
      return;
    }

    setIsPlayingAudio(true);
    speechEngine.speak(
      scriptToSpeak,
      titleToSpeak,
      selectedLang,
      poi.poi_id,
      currentTrans?.audio_url,
      intro || currentTrans?.introduction
    );
  };

  return (
    <div
      className="fixed inset-0 z-[11000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleAttemptClose();
      }}
    >
      <div className="bg-white text-[#19231b] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl border border-[#e2eae4] shadow-2xl flex flex-col overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#e2eae4] bg-[#f7f9f6] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#2d5a37] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base sm:text-lg text-[#1e3d25] truncate">
                  {poi.translations['vi']?.title || poi.code}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#d6e7da] text-[#2d5a37] font-bold">
                  {poi.code}
                </span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Chưa lưu
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5c7362]">
                Biên tập bài viết đa ngôn ngữ & Quản lý âm thanh thuyết minh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="w-8 h-8 rounded-full bg-white border border-[#e2eae4] hover:bg-[#eef5f0] text-[#5c7362] flex items-center justify-center transition-colors"
              title="Đóng popup (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 12+1 Language Navigation Tabs */}
        <div className="px-5 py-2.5 border-b border-[#e2eae4] bg-white overflow-x-auto no-scrollbar flex items-center gap-1.5 flex-shrink-0">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const hasData = Boolean(poi.translations[lang.code]?.description);
            const hasAudio = Boolean(poi.translations[lang.code]?.audio_url);
            const isManual = Boolean(poi.translations[lang.code]?.is_manually_edited);
            const isSelected = selectedLang === lang.code;

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#2d5a37] text-white border-[#2d5a37] shadow-xs'
                    : 'bg-[#f7f9f6] text-[#5c7362] border-[#e2eae4] hover:bg-[#eef5f0]'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.code.toUpperCase()}</span>
                {hasData && hasAudio && (
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      isSelected ? 'bg-white text-[#2d5a37]' : 'bg-emerald-100 text-emerald-800'
                    }`}
                    title="Đã có bài viết & file audio"
                  >
                    ✓
                  </span>
                )}
                {isManual && (
                  <span
                    className={`text-[9px] font-bold px-1 rounded-sm ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}
                    title="Đã chỉnh tay (Được bảo vệ khỏi AI ghi đè)"
                  >
                    Tay
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Body Form */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#fafcfa]">
          {/* AI 1-Click Banner Action */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-2xl p-4 border border-[#d6e7da] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#1e3d25] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tự Động Hóa 12 Ngôn Ngữ & Audio MP3</span>
                </span>
                <span className="text-[10px] bg-[#2d5a37] text-white px-2 py-0.2 rounded-full font-bold">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-[#5c7362] leading-relaxed">
                Tự động dịch kịch bản gốc sang 12 thứ tiếng, loại bỏ markdown, phiên âm tên riêng và tự động bỏ qua các bản dịch đã chỉnh tay.
              </p>
            </div>

            <button
              type="button"
              onClick={handle1ClickLocalization}
              disabled={isLocalizingAll}
              className="px-4 py-2 rounded-full bg-[#2d5a37] hover:bg-[#1e3d25] text-white disabled:opacity-50 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isLocalizingAll ? 'animate-spin' : 'text-amber-300'}`} />
              <span>{isLocalizingAll ? 'Đang xử lý...' : 'Tạo đa ngôn ngữ & Audio bằng AI'}</span>
            </button>
          </div>

          {/* Progress bar and language statuses if active */}
          {(isLocalizingAll || localizeProgressMsg) && (
            <div className="p-3 bg-white rounded-2xl border border-emerald-300 text-xs text-[#2d5a37] flex items-center gap-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              <span className="font-medium">{localizeProgressMsg}</span>
            </div>
          )}

          {localizeStatuses.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white rounded-2xl border border-[#e2eae4]">
              {localizeStatuses.map((st) => (
                <div key={st.lang} className="flex items-center justify-between p-2 rounded-xl bg-[#f7f9f6] text-xs">
                  <span className="font-bold text-[#19231b]">{st.label}</span>
                  {st.status === 'success' ? (
                    <span className="text-emerald-700 font-bold">✓ Thành công</span>
                  ) : st.status === 'skipped_manual' ? (
                    <span className="text-amber-700 font-bold">Giữ bản tay</span>
                  ) : (
                    <span className="text-rose-600 font-bold" title={st.error}>Thất bại</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Language Form */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2eae4] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f3f1] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#19231b]">
                  Nội Dung: {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.label}
                </span>
                {isManuallyEdited && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Đã chỉnh tay</span>
                  </span>
                )}
              </div>

              {/* Checkbox "Đánh dấu chỉnh tay" */}
              <label className="flex items-center gap-2 text-xs font-semibold text-[#2d5a37] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManuallyEdited}
                  onChange={(e) => {
                    setIsManuallyEdited(e.target.checked);
                    setHasUnsavedChanges(true);
                  }}
                  className="rounded text-[#2d5a37] focus:ring-[#2d5a37]"
                />
                <span>Đánh dấu chỉnh tay (Khóa khỏi AI ghi đè)</span>
              </label>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#19231b] mb-1">
                Tiêu Đề Điểm Chiêm Bái ({selectedLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs font-medium text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden"
                placeholder="Nhập tiêu đề bài viết..."
              />
            </div>

            {/* Intro */}
            <div>
              <label className="block text-xs font-semibold text-[#19231b] mb-1">
                Giới Thiệu Tóm Tắt (1-2 câu mở đầu)
              </label>
              <textarea
                rows={2}
                value={intro}
                onChange={(e) => {
                  setIntro(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden leading-relaxed"
                placeholder="Đoạn tóm tắt ngắn..."
              />
            </div>

            {/* Script Description */}
            <div>
              <label className="block text-xs font-semibold text-[#19231b] mb-1">
                Kịch Bản Thuyết Minh Chi Tiết (Script)
              </label>
              <textarea
                rows={6}
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden leading-relaxed"
                placeholder="Nội dung thuyết minh chi tiết..."
              />
            </div>

            {/* Audio actions for current language */}
            <div className="pt-3 border-t border-[#f0f3f1] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="px-3.5 py-2 rounded-xl bg-[#eef5f0] hover:bg-[#d8ebd9] text-[#2d5a37] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isPlayingAudio ? 'Dừng Nghe' : 'Nghe Thử'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegenerateAudio}
                  disabled={isRegeneratingAudio}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#e2eae4] hover:bg-[#f7f9f6] text-[#19231b] disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Tạo lại file audio MP3 riêng cho ngôn ngữ này từ nội dung vừa sửa"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRegeneratingAudio ? 'animate-spin' : 'text-[#2d5a37]'}`} />
                  <span>{isRegeneratingAudio ? 'Đang tạo Audio...' : 'Tạo lại Audio cho ngôn ngữ này'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCurrentLanguage}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-full bg-[#2d5a37] hover:bg-[#1e3d25] text-white disabled:opacity-50 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu Vào MongoDB'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Info */}
        <div className="px-5 py-3 border-t border-[#e2eae4] bg-[#f7f9f6] text-[11px] text-[#7a8e80] flex items-center justify-between flex-shrink-0">
          <span>Bấm ESC hoặc nhấp nền ngoài để đóng popup</span>
          <span className="font-mono text-[#2d5a37] font-semibold">Tự động đồng bộ MongoDB Atlas</span>
        </div>
      </div>
    </div>
  );
};
