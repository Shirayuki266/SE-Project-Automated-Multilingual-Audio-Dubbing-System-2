import React, { useState, useEffect, useRef } from 'react';
import { RichPOI, POITranslation } from '../server/types.js';
import { LanguageCode, speechEngine } from '../utils/audioSpeech.js';
import { SUPPORTED_LANGUAGES } from '../config/languages.js';
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
  Upload,
  Trash2,
} from 'lucide-react';

interface POIArticlePopupProps {
  poi: RichPOI;
  authToken: string | null;
  onClose: () => void;
  onRefreshPOIs: () => void;
  onShowNotify: (msg: string) => void;
}

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
  const [audioUrl, setAudioUrl] = useState('');
  const [mediaItems, setMediaItems] = useState(poi.media || []);
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // AI, audio, and media states
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Sync form data when switching language or POI
  useEffect(() => {
    const trans: POITranslation | undefined = poi.translations[selectedLang];
    if (trans) {
      setTitle(trans.title || '');
      setIntro(trans.introduction || '');
      setDesc(trans.description || '');
      setAudioUrl(trans.audio_url || '');
      setIsManuallyEdited(Boolean(trans.is_manually_edited));
    } else {
      setTitle('');
      setIntro('');
      setDesc('');
      setAudioUrl('');
      setIsManuallyEdited(false);
    }
    setMediaItems(poi.media || []);
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
          audio_url: audioUrl || undefined,
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

  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    try {
      const res = await fetch(`/api/pois/${poi.poi_id}/translations/${selectedLang}/draft`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể kết nối AI lúc này, vui lòng nhập nội dung dịch thủ công');
      }
      setTitle(data.data.title);
      setIntro(data.data.introduction || '');
      setDesc(data.data.description);
      setIsManuallyEdited(false);
      setHasUnsavedChanges(true);
      onShowNotify('AI đã tạo bản nháp. Vui lòng rà soát và bấm Lưu để xuất bản.');
    } catch (err: any) {
      alert(err.message || 'Không thể kết nối AI lúc này, vui lòng nhập nội dung dịch thủ công');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleDeleteTranslation = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản dịch ngôn ngữ này?')) return;
    try {
      const res = await fetch(`/api/pois/${poi.poi_id}/translations/${selectedLang}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể xóa bản dịch.');
      setSelectedLang('vi');
      setHasUnsavedChanges(false);
      onShowNotify('Đã xóa bản dịch thành công.');
      onRefreshPOIs();
    } catch (err: any) {
      alert('Lỗi xóa bản dịch: ' + err.message);
    }
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh vượt quá 5MB, vui lòng nén ảnh trước khi tải lên');
      return;
    }

    setIsUploadingImage(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const uploadResponse = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body,
      });
      const uploaded = await uploadResponse.json();
      if (!uploadResponse.ok || !uploaded.success) {
        throw new Error(uploaded.error || 'Không thể tải ảnh lên.');
      }

      const mediaResponse = await fetch(`/api/pois/${poi.poi_id}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ image_url: uploaded.imageUrl, caption_vi: title || poi.code }),
      });
      const media = await mediaResponse.json();
      if (!mediaResponse.ok || !media.success) {
        throw new Error(media.error || 'Không thể gắn ảnh vào POI.');
      }
      setMediaItems((items) => [...items, media.data.media]);
      onShowNotify('Đã tải và lưu ảnh media cho POI.');
      onRefreshPOIs();
    } catch (err: any) {
      alert('Lỗi tải ảnh: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAudioFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      alert('Chỉ chấp nhận file âm thanh MP3.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('Kích thước audio vượt quá 20MB.');
      return;
    }

    setIsUploadingAudio(true);
    try {
      const body = new FormData();
      body.append('audio', file);
      const res = await fetch('/api/admin/upload-audio', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể tải audio lên.');
      setAudioUrl(data.audioUrl);
      setHasUnsavedChanges(true);
      onShowNotify('Đã tải audio lên. Bấm Lưu để gắn audio vào bản dịch.');
    } catch (err: any) {
      alert('Lỗi tải audio: ' + err.message);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh media này?')) return;
    try {
      const res = await fetch(`/api/pois/${poi.poi_id}/media/${mediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể xóa ảnh.');
      setMediaItems((items) => items.filter((item) => item.media_id !== mediaId));
      onShowNotify('Đã xóa ảnh media.');
      onRefreshPOIs();
    } catch (err: any) {
      alert('Lỗi xóa ảnh: ' + err.message);
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
      if (!data.success) {
        if (res.status === 401 || (data.error && data.error.includes('Quản trị'))) {
          throw new Error('Phiên làm việc đã hết hạn hoặc máy chủ vừa khởi động lại. Vui lòng đóng cửa sổ này, bấm [Đăng xuất] ở góc phải trên và đăng nhập lại (admin / vnqt@2026).');
        }
        throw new Error(data.error);
      }
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

        {/* Translation language tabs and add-language control */}
        <div className="px-5 py-2.5 border-b border-[#e2eae4] bg-white flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                  {hasData && hasAudio && <span title="Đã có bài viết & file audio">✓</span>}
                  {isManual && <span title="Bản dịch đã được Admin chỉnh sửa">Tay</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Body Form */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#fafcfa]">
          {/* AI translation draft */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-2xl p-4 border border-[#d6e7da] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#1e3d25] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tạo bản dịch AI cho {selectedLang.toUpperCase()}</span>
                </span>
                <span className="text-[10px] bg-[#2d5a37] text-white px-2 py-0.2 rounded-full font-bold">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-[#5c7362] leading-relaxed">
                Bản dịch được điền vào biểu mẫu để Admin rà soát. Chỉ lưu khi bấm nút Lưu nội dung.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft || selectedLang === 'vi'}
              className="px-4 py-2 rounded-full bg-[#2d5a37] hover:bg-[#1e3d25] text-white disabled:opacity-50 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all flex-shrink-0"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingDraft ? 'animate-spin' : 'text-amber-300'}`} />
              <span>{isGeneratingDraft ? 'Đang dịch...' : 'Tạo bản dịch tự động bằng AI'}</span>
            </button>
          </div>

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
              {poi.translations[selectedLang] && (
                <button
                  type="button"
                  onClick={handleDeleteTranslation}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa bản dịch này
                </button>
              )}
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

                <input
                  ref={audioInputRef}
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isUploadingAudio}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#e2eae4] text-[#19231b] disabled:opacity-50 text-xs font-bold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isUploadingAudio ? 'Đang tải...' : 'Upload file audio MP3'}
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
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu nội dung'}</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#7a8e80]">File MP3 tối đa 20MB. Audio mới chỉ được gắn với bản dịch sau khi bấm Lưu nội dung.</p>
            {audioUrl && <audio controls src={audioUrl} className="w-full" />}
          </div>

          <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2eae4] shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#19231b]">Media của điểm POI</h3>
                <p className="text-xs text-[#7a8e80]">Ảnh JPG, PNG hoặc WebP; dung lượng tối đa 5MB.</p>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                className="px-3.5 py-2 rounded-xl bg-[#2d5a37] text-white disabled:opacity-50 text-xs font-bold flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploadingImage ? 'Đang tải ảnh...' : 'Tải lên hình ảnh'}
              </button>
            </div>
            {mediaItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mediaItems.map((media) => (
                  <div key={media.media_id} className="relative rounded-xl overflow-hidden border border-[#e2eae4]">
                    <img src={media.image_url} alt={media.caption_vi || 'Ảnh POI'} className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(media.media_id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white"
                      aria-label="Xóa ảnh media"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#7a8e80]">Chưa có ảnh media cho POI này.</p>
            )}
          </section>
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
