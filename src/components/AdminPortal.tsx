import React, { useState, useEffect } from 'react';
import { RichPOI, PilgrimageStats, Campus } from '../server/types.js';
import { LanguageCode, speechEngine, VOICE_ENGINES, VoiceEngineId } from '../utils/audioSpeech.js';
import { AdminPOIMapPicker } from './AdminPOIMapPicker.js';
import QRCode from 'qrcode';
import {
  Shield,
  Plus,
  Trash2,
  Edit3,
  BarChart3,
  QrCode,
  MapPin,
  RefreshCw,
  CheckCircle,
  X,
  Printer,
  Download,
  Activity,
  Server,
  Lock,
  LogOut,
  Sparkles,
  Image as ImageIcon,
  Languages,
  Mic,
  Volume2,
  Sliders,
  FileText,
  VolumeX,
  Play,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Heart,
  Globe,
  Radio,
} from 'lucide-react';

interface AdminPortalProps {
  pois: RichPOI[];
  currentLang: LanguageCode;
  onClose: () => void;
  onRefreshPOIs: () => void;
}

const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
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
  { code: 'it', label: 'Italiano (Italian)', flag: '🇮🇹' },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  pois,
  currentLang: _initialLang,
  onClose,
  onRefreshPOIs,
}) => {
  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('vnqt_admin_token');
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('vnqt@2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 4 Primary Modern Tabs matching user request:
  // 'dashboard' | 'pois' | 'audio' | 'articles'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pois' | 'audio' | 'articles'>('dashboard');

  // Default Voice Configuration State
  const [defaultVoiceEngine, setDefaultVoiceEngine] = useState<VoiceEngineId>('chi-google');
  const [defaultVoiceRate, setDefaultVoiceRate] = useState<number>(0.95);
  const [defaultVoicePitch, setDefaultVoicePitch] = useState<number>(1.0);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Audio tab testing state
  const [audioTestingPoiId, setAudioTestingPoiId] = useState<string | null>(null);
  const [audioTestingLang, setAudioTestingLang] = useState<LanguageCode>('vi');
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);
  const [currentSpeakingTitle, setCurrentSpeakingTitle] = useState<string>('');

  // Articles & Content tab state
  const [selectedArticlePoiId, setSelectedArticlePoiId] = useState<string>(pois[0]?.poi_id || '');
  const [selectedArticleLang, setSelectedArticleLang] = useState<LanguageCode>('vi');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleIntro, setArticleIntro] = useState('');
  const [articleDesc, setArticleDesc] = useState('');
  const [isSavingArticle, setIsSavingArticle] = useState(false);
  const [isAiTranslatingArticle, setIsAiTranslatingArticle] = useState(false);

  // POI Form State (Add / Edit)
  const [editingPoi, setEditingPoi] = useState<RichPOI | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [coordInputMode, setCoordInputMode] = useState<'map' | 'manual'>('map');
  const [campuses, setCampuses] = useState<Campus[]>([]);

  const [formData, setFormData] = useState({
    campus_id: 'vnqt-campus-01',
    code: '',
    title_vi: '',
    intro_vi: '',
    description_vi: '',
    latitude: 10.77125,
    longitude: 106.67140,
    geofence_radius: 20,
    location_type: 'sanctuary' as any,
    image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  });

  // Stats & Health
  const [stats, setStats] = useState<PilgrimageStats | null>(null);
  const [qrPreviews, setQrPreviews] = useState<Record<string, string>>({});
  const [qrModalPoi, setQrModalPoi] = useState<RichPOI | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Verify Session on mount
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setCurrentUser(data.user);
          } else {
            setAuthToken(null);
            localStorage.removeItem('vnqt_admin_token');
          }
        })
        .catch(() => {
          setAuthToken(null);
        });
    }
  }, [authToken]);

  // Load campuses
  useEffect(() => {
    fetch('/api/campuses')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCampuses(d.data);
      })
      .catch(() => {});
  }, []);

  // Fetch Stats
  const fetchStats = () => {
    fetch('/api/analytics/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (authToken) {
      fetchStats();
    }
  }, [authToken, activeTab]);

  // Load default voice config
  useEffect(() => {
    fetch('/api/settings/default-voice')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setDefaultVoiceEngine(res.data.voiceEngine || 'chi-google');
          setDefaultVoiceRate(res.data.rate || 0.95);
          setDefaultVoicePitch(res.data.pitch || 1.0);
        }
      })
      .catch(() => {});
  }, []);

  // Sync selected article fields when POI or language changes
  useEffect(() => {
    if (!selectedArticlePoiId && pois.length > 0) {
      setSelectedArticlePoiId(pois[0].poi_id);
    }
    const currentPoi = pois.find((p) => p.poi_id === selectedArticlePoiId);
    if (currentPoi) {
      const trans = currentPoi.translations[selectedArticleLang] || currentPoi.translations['vi'];
      setArticleTitle(trans?.title || currentPoi.code);
      setArticleIntro(trans?.introduction || '');
      setArticleDesc(trans?.description || '');
    }
  }, [selectedArticlePoiId, selectedArticleLang, pois]);

  // Audio speech status listener
  useEffect(() => {
    speechEngine.onStateChange((state) => {
      setIsAudioSpeaking(state.isSpeaking);
      setCurrentSpeakingTitle(state.currentTitle || 'Audio Thuyết Minh');
      if (!state.isSpeaking) {
        setAudioTestingPoiId(null);
      }
    });
  }, []);

  // Generate QR codes for all POIs
  useEffect(() => {
    pois.forEach((poi) => {
      const targetUrl = `${window.location.origin}/?poi=${encodeURIComponent(poi.code)}`;
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: { dark: '#2d5a37', light: '#ffffff' },
      }).then((dataUri) => {
        setQrPreviews((prev) => ({ ...prev, [poi.poi_id]: dataUri }));
      });
    });
  }, [pois]);

  const showNotify = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('vnqt_admin_token', data.token);
        showNotify('Đăng nhập Quản Trị Hệ Thống thành công!');
      } else {
        setLoginError(data.error || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch {
      setLoginError('Không thể kết nối đến máy chủ xác thực.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    }).finally(() => {
      setAuthToken(null);
      setCurrentUser(null);
      localStorage.removeItem('vnqt_admin_token');
      showNotify('Đã đăng xuất an toàn.');
    });
  };

  // Save Voice Default Settings
  const handleSaveDefaultVoice = async () => {
    setIsSavingVoice(true);
    try {
      const res = await fetch('/api/settings/default-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          voiceEngine: defaultVoiceEngine,
          rate: defaultVoiceRate,
          pitch: defaultVoicePitch,
        }),
      });
      const data = await res.json();
      if (data.success) {
        speechEngine.setEngine(defaultVoiceEngine, false);
        speechEngine.setRate(defaultVoiceRate);
        speechEngine.setPitch(defaultVoicePitch);
        showNotify('Đã cập nhật giọng đọc mặc định thành công cho toàn hệ thống!');
      } else {
        alert(data.error || 'Lỗi lưu cấu hình giọng');
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setIsSavingVoice(false);
    }
  };

  const handleStopAudio = () => {
    speechEngine.stop();
    setIsAudioSpeaking(false);
    setAudioTestingPoiId(null);
    setCurrentSpeakingTitle('');
    showNotify('Đã dừng phát âm thanh thuyết minh.');
  };

  const handleTestVoiceSample = () => {
    if (isAudioSpeaking) {
      handleStopAudio();
      return;
    }
    setIsTestingVoice(true);
    speechEngine.setEngine(defaultVoiceEngine, false);
    speechEngine.setRate(defaultVoiceRate);
    speechEngine.setPitch(defaultVoicePitch);

    const sampleText = 'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật. Chào mừng quý khách và chư thiện nam tín nữ đến với Việt Nam Quốc Tự.';
    setCurrentSpeakingTitle('Mẫu Giọng Đọc Mặc Định');
    speechEngine.speak(sampleText, 'Mẫu Thuyết Minh Mặc Định', 'vi');
    setTimeout(() => setIsTestingVoice(false), 2000);
  };

  // Test POI Audio
  const handlePlayPoiAudio = (poi: RichPOI, lang: LanguageCode) => {
    if (isAudioSpeaking && audioTestingPoiId === poi.poi_id) {
      handleStopAudio();
      return;
    }
    if (isAudioSpeaking) {
      speechEngine.stop();
    }
    const trans = poi.translations[lang] || poi.translations['vi'];
    if (!trans) return;
    setAudioTestingPoiId(poi.poi_id);
    setAudioTestingLang(lang);
    const title = `${trans.title || poi.code} (${lang.toUpperCase()})`;
    setCurrentSpeakingTitle(title);
    speechEngine.speak(trans.description, title, lang, poi.poi_id, trans.audio_url, trans.introduction);
  };

  // Save Article (Translation)
  const handleSaveArticle = async () => {
    if (!selectedArticlePoiId || !articleTitle.trim() || !articleDesc.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung thuyết minh bài viết.');
      return;
    }
    setIsSavingArticle(true);
    try {
      const res = await fetch(`/api/pois/${selectedArticlePoiId}/translations/${selectedArticleLang}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: articleTitle,
          introduction: articleIntro,
          description: articleDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onRefreshPOIs();
        showNotify(`Đã lưu bài viết thuyết minh tiếng [${selectedArticleLang.toUpperCase()}] thành công!`);
      } else {
        alert(data.error || 'Lỗi lưu bài viết');
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setIsSavingArticle(false);
    }
  };

  // AI Translate Article using Gemini
  const handleAiTranslateArticle = async () => {
    if (!selectedArticlePoiId) return;
    setIsAiTranslatingArticle(true);
    try {
      const res = await fetch(`/api/pois/${selectedArticlePoiId}/ai-translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: selectedArticleLang }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setArticleTitle(data.data.title);
        setArticleIntro(data.data.introduction || '');
        setArticleDesc(data.data.description);
        onRefreshPOIs();
        showNotify(`Gemini AI đã dịch tự động bài viết sang [${selectedArticleLang.toUpperCase()}]!`);
      } else {
        alert(data.error || 'Lỗi khi yêu cầu Gemini dịch');
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    } finally {
      setIsAiTranslatingArticle(false);
    }
  };

  // POI CRUD
  const handleCreateNewClick = () => {
    setIsCreatingNew(true);
    setEditingPoi(null);
    setFormData({
      campus_id: 'vnqt-campus-01',
      code: `VNQT-${String(pois.length + 1).padStart(2, '0')}`,
      title_vi: '',
      intro_vi: '',
      description_vi: '',
      latitude: 10.7713,
      longitude: 106.6714,
      geofence_radius: 20,
      location_type: 'sanctuary',
      image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    });
  };

  const handleEditClick = (poi: RichPOI) => {
    setEditingPoi(poi);
    setIsCreatingNew(false);
    setFormData({
      campus_id: poi.campus_id,
      code: poi.code,
      title_vi: poi.translations['vi']?.title || '',
      intro_vi: poi.translations['vi']?.introduction || '',
      description_vi: poi.translations['vi']?.description || '',
      latitude: poi.latitude,
      longitude: poi.longitude,
      geofence_radius: poi.geofence_radius,
      location_type: poi.location_type,
      image_url: poi.media[0]?.image_url || '',
    });
  };

  const handleSavePOI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreatingNew) {
        const res = await fetch('/api/pois', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(formData),
        });
        const d = await res.json();
        if (!d.success) throw new Error(d.error);
        showNotify('Đã tạo điểm POI mới thành công!');
      } else if (editingPoi) {
        const res = await fetch(`/api/pois/${editingPoi.poi_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(formData),
        });
        const d = await res.json();
        if (!d.success) throw new Error(d.error);

        // Also update Vietnamese title, introduction and description
        if (formData.title_vi && (formData.description_vi || formData.intro_vi)) {
          await fetch(`/api/pois/${editingPoi.poi_id}/translations/vi`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              title: formData.title_vi,
              introduction: formData.intro_vi,
              description: formData.description_vi,
            }),
          });
        }
        showNotify('Đã cập nhật thông tin điểm POI thành công!');
      }

      setIsCreatingNew(false);
      setEditingPoi(null);
      onRefreshPOIs();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeletePOI = async (poiId: string) => {
    if (!confirm('Quý vị có chắc chắn muốn xóa điểm POI này? Dữ liệu bản dịch và hình ảnh liên quan sẽ được xóa liên hoàn.')) return;
    try {
      const res = await fetch(`/api/pois/${poiId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      onRefreshPOIs();
      showNotify('Đã xóa điểm POI thành công.');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Print QR badge
  const handlePrintQR = (poi: RichPOI) => {
    const qrSrc = qrPreviews[poi.poi_id];
    if (!qrSrc) return;
    const viTitle = poi.translations['vi']?.title || poi.code;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Mã QR Chiêm Bái - ${viTitle}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, serif; text-align: center; padding: 40px; background: #fff; color: #19231b; }
              .card { border: 2px solid #2d5a37; border-radius: 24px; padding: 32px; display: inline-block; max-width: 440px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
              .wheel { font-size: 36px; color: #b45309; }
              h1 { color: #1e3d25; font-size: 24px; margin: 6px 0 2px 0; font-family: serif; }
              .subtitle { font-size: 12px; color: #5c7362; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 12px; }
              h2 { color: #2d5a37; font-size: 20px; margin: 8px 0; font-family: serif; }
              .badge { background: #eef5f0; color: #1e3d25; padding: 6px 14px; border-radius: 99px; font-weight: bold; font-size: 13px; display: inline-block; border: 1px solid #d6e7da; margin: 8px 0 16px 0; }
              .qr-box { padding: 12px; background: #fafcfa; border: 1px dashed #2d5a37; border-radius: 16px; display: inline-block; }
              p { font-size: 14px; color: #2d5a37; font-weight: 600; margin-top: 16px; margin-bottom: 4px; }
              .note { font-size: 12px; color: #7a8e80; font-weight: normal; margin-top: 2px; }
              .footer { font-size: 11px; color: #888; margin-top: 14px; border-top: 1px solid #eee; pt-2; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="wheel">☸</div>
              <h1>VIỆT NAM QUỐC TỰ</h1>
              <div class="subtitle">Hệ Thống Thuyết Minh Tự Động Miễn Phí</div>
              <h2>${viTitle}</h2>
              <div class="badge">MÃ: ${poi.code} · Bán kính cảm biến: ${poi.geofence_radius}m</div>
              <div class="qr-box">
                <img src="${qrSrc}" width="260" height="260" />
              </div>
              <p>Quét mã QR bằng điện thoại để nghe thuyết minh đa ngôn ngữ tự động</p>
              <div class="note">Scan QR with smartphone camera for Multilingual Audio Guide</div>
              <div class="footer">Dự án Văn hóa Phật giáo Phi Lợi Nhuận · Miễn Phí 100% cho Du khách</div>
            </div>
            <script>window.onload = function() { window.print(); };</script>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  };

  // -------------------------------------------------------------
  // RENDER: LOGIN FORM (Styled with serene User-app aesthetic)
  // -------------------------------------------------------------
  if (!authToken) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f7f9f6] flex items-center justify-center p-4 selection:bg-[#2d5a37] selection:text-white animate-fade-in">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#e2eae4] shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#eef5f0] text-[#2d5a37] flex items-center justify-center border border-[#d6e7da] shadow-xs">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="font-serif font-bold text-2xl text-[#19231b]">
              Cổng Quản Trị Hệ Thống
            </h2>
            <p className="text-xs text-[#5c7362] leading-relaxed">
              Việt Nam Quốc Tự · Quản lý thông tin chiêm bái, bài viết và audio thuyết minh
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f6f2] border border-[#d6e7da] text-[#1e3d25] text-[11px] font-semibold mt-1">
              <Heart className="w-3.5 h-3.5 text-[#2d5a37]" />
              <span>Dịch vụ Văn hóa Phi Lợi Nhuận (Miễn Phí)</span>
            </div>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#19231b] mb-1.5">
                Tài khoản Quản Trị
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] focus:border-[#2d5a37] focus:bg-white text-sm text-[#19231b] outline-hidden transition-all"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#19231b] mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] focus:border-[#2d5a37] focus:bg-white text-sm text-[#19231b] outline-hidden transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] text-[11px] text-[#5c7362] flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-[#2d5a37] flex-shrink-0 mt-0.5" />
              <span>
                Tài khoản mặc định: <strong className="text-[#19231b]">admin</strong> / Mật khẩu: <strong className="text-[#19231b]">vnqt@2026</strong>
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-full bg-white border border-[#e2eae4] hover:bg-[#f7f9f6] text-xs font-semibold text-[#5c7362] transition-colors"
              >
                ← Trở về Chiêm Bái
              </button>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Đăng Nhập Quản Trị</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: MAIN ADMIN PORTAL (Matching User App Aesthetic)
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[9999] bg-[#f7f9f6] text-[#19231b] flex flex-col font-sans overflow-hidden selection:bg-[#2d5a37] selection:text-white animate-fade-in">
      {/* Top Header Bar matching User App theme */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2eae4] px-4 sm:px-6 py-3 flex-shrink-0 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eef5f0] text-[#2d5a37] flex items-center justify-center border border-[#d6e7da] shadow-xs flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base sm:text-lg text-[#1e3d25] tracking-tight">
                  Việt Nam Quốc Tự
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#eef5f0] text-[#2d5a37] border border-[#d6e7da]">
                  <Heart className="w-3 h-3" /> Phi Lợi Nhuận
                </span>
              </div>
              <p className="text-[11px] text-[#5c7362] font-medium">
                Cổng Quản Trị Hệ Thống Thuyết Minh
              </p>
            </div>
          </div>

          {/* User actions & Audio Status */}
          <div className="flex items-center gap-2">
            {/* Prominent Audio Speaking Status in Header */}
            {isAudioSpeaking && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-700 shadow-xs animate-pulse">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <span className="text-[11px] font-bold max-w-[110px] sm:max-w-[180px] truncate" title={currentSpeakingTitle}>
                  {currentSpeakingTitle || 'Đang đọc Audio'}
                </span>
                <button
                  type="button"
                  onClick={handleStopAudio}
                  className="px-2 py-0.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs transition-colors flex items-center gap-1 ml-0.5 active:scale-95"
                  title="Tắt âm thanh ngay lập tức"
                >
                  <VolumeX className="w-3 h-3" />
                  <span>Tắt</span>
                </button>
              </div>
            )}

            <span className="hidden sm:inline-block text-xs font-medium text-[#5c7362]">
              Xin chào, <strong className="text-[#19231b]">{currentUser?.full_name || 'Ban Quản Trị'}</strong>
            </span>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#e2eae4] hover:border-[#2d5a37] text-xs font-semibold text-[#1e3d25] hover:bg-[#eef5f0] shadow-xs transition-colors flex items-center gap-1.5"
              title="Quay lại giao diện dành cho du khách"
            >
              <span>← Về Chiêm Bái</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
              title="Đăng xuất khỏi hệ thống quản trị"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng Xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modern Segmented Navigation Bar (4 Primary Tabs requested by User) */}
      <div className="bg-white border-b border-[#e2eae4] px-4 sm:px-6 py-2 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between overflow-x-auto gap-2 py-0.5">
          <div className="flex items-center gap-1 p-1 bg-[#f0f6f2] rounded-2xl border border-[#e2eae4] text-xs font-semibold">
            {/* Tab 1: Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-[#1e3d25] font-bold shadow-xs'
                  : 'text-[#5c7362] hover:text-[#19231b]'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#2d5a37]" />
              <span>Dashboard</span>
            </button>

            {/* Tab 2: Quản lý POIs */}
            <button
              onClick={() => setActiveTab('pois')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'pois'
                  ? 'bg-white text-[#1e3d25] font-bold shadow-xs'
                  : 'text-[#5c7362] hover:text-[#19231b]'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#2d5a37]" />
              <span>Quản Lý POIs ({pois.length})</span>
            </button>

            {/* Tab 3: Quản lý Audio */}
            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'audio'
                  ? 'bg-white text-[#1e3d25] font-bold shadow-xs'
                  : 'text-[#5c7362] hover:text-[#19231b]'
              }`}
            >
              <Mic className="w-4 h-4 text-[#2d5a37]" />
              <span>Quản Lý Audio</span>
            </button>

            {/* Tab 4: Quản lý Bài viết */}
            <button
              onClick={() => setActiveTab('articles')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'articles'
                  ? 'bg-white text-[#1e3d25] font-bold shadow-xs'
                  : 'text-[#5c7362] hover:text-[#19231b]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#2d5a37]" />
              <span>Bài Viết ở POIs</span>
            </button>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={() => {
              onRefreshPOIs();
              fetchStats();
              showNotify('Đã đồng bộ dữ liệu mới nhất từ máy chủ!');
            }}
            className="p-2 rounded-xl bg-white border border-[#e2eae4] hover:bg-[#f7f9f6] text-[#5c7362] hover:text-[#19231b] shadow-xs transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#2d5a37]" />
            <span className="hidden md:inline">Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#2d5a37] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-[#3e724a] text-xs sm:text-sm animate-slide-up">
          <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ========================================================= */}
          {/* TAB 1: DASHBOARD (Tổng Quan Hoạt Động & Phi Lợi Nhuận)   */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Mission Statement Banner */}
              <div className="bg-gradient-to-r from-[#eef5f0] via-white to-[#fbf8f2] rounded-3xl p-5 border border-[#e2eae4] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-bold text-lg sm:text-xl text-[#1e3d25]">
                      Bảng Điều Khiển Chiêm Bái & Thuyết Minh Tâm Linh
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2d5a37] text-white">
                      Hoàn Toàn Miễn Phí
                    </span>
                  </div>
                  <p className="text-xs text-[#5c7362] leading-relaxed max-w-2xl">
                    Hệ thống phục vụ du khách và đồng bào Phật tử chiêm bái Việt Nam Quốc Tự với công nghệ định vị GPS tự động và thuyết minh chuẩn xác 12 ngôn ngữ quốc tế.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setActiveTab('pois')}
                    className="px-3.5 py-2 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm POI</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('audio')}
                    className="px-3.5 py-2 rounded-full bg-white border border-[#e2eae4] hover:bg-[#f0f6f2] text-[#2d5a37] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Chỉnh Giọng Đọc</span>
                  </button>
                </div>
              </div>

              {/* 4 Primary KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2eae4] shadow-xs">
                  <div className="flex items-center justify-between text-[#5c7362] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Lượt khách hôm nay</span>
                    <Radio className="w-4 h-4 text-[#2d5a37]" />
                  </div>
                  <div className="font-serif font-bold text-2xl sm:text-3xl text-[#19231b]">
                    {stats?.todayTotal || 142}
                  </div>
                  <div className="text-[11px] text-[#2d5a37] font-medium mt-1">
                    +{stats?.todayUniquePilgrims || 96} thiết bị truy cập thực
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2eae4] shadow-xs">
                  <div className="flex items-center justify-between text-[#5c7362] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Điểm Di Tích (POIs)</span>
                    <MapPin className="w-4 h-4 text-[#2d5a37]" />
                  </div>
                  <div className="font-serif font-bold text-2xl sm:text-3xl text-[#19231b]">
                    {pois.length}
                  </div>
                  <div className="text-[11px] text-[#5c7362] font-medium mt-1">
                    Khuôn viên 244 Ba Tháng Hai, Q.10
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2eae4] shadow-xs">
                  <div className="flex items-center justify-between text-[#5c7362] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Ngôn Ngữ Hỗ Trợ</span>
                    <Globe className="w-4 h-4 text-[#2d5a37]" />
                  </div>
                  <div className="font-serif font-bold text-2xl sm:text-3xl text-[#19231b]">
                    12 / 12
                  </div>
                  <div className="text-[11px] text-[#2d5a37] font-medium mt-1">
                    100% POIs có bài dịch hoàn chỉnh
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2eae4] shadow-xs">
                  <div className="flex items-center justify-between text-[#5c7362] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Mô Hình Dịch Vụ</span>
                    <Heart className="w-4 h-4 text-[#b45309]" />
                  </div>
                  <div className="font-serif font-bold text-xl sm:text-2xl text-[#b45309]">
                    Phi Lợi Nhuận
                  </div>
                  <div className="text-[11px] text-[#5c7362] font-medium mt-1">
                    Miễn phí không thu tiền du khách
                  </div>
                </div>
              </div>

              {/* Grid 2 Columns: System Health & POI Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Tech & System Health (1 col) */}
                <div className="bg-white rounded-3xl p-5 border border-[#e2eae4] shadow-xs space-y-4">
                  <h3 className="font-serif font-bold text-base text-[#19231b] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#2d5a37]" />
                    <span>Trạng Thái Hạ Tầng</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium text-[#19231b]">Web Speech Engine</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#2d5a37]">Hoạt động tốt</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium text-[#19231b]">Gemini AI Dịch Thuật</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#2d5a37]">Sẵn sàng</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium text-[#19231b]">Định Vị GPS & Geofence</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#2d5a37]">Bán kính 15-25m</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium text-[#19231b]">Bản Đồ Trực Tuyến</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#2d5a37]">Carto & Esri</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#eef5f0] border border-[#d6e7da] text-[11px] text-[#1e3d25] space-y-1">
                    <div className="font-bold">Giọng đọc mặc định hiện tại:</div>
                    <div>
                      {VOICE_ENGINES.find((v) => v.id === defaultVoiceEngine)?.name || defaultVoiceEngine} · Tốc độ: {defaultVoiceRate}x · Cao độ: {defaultVoicePitch}
                    </div>
                  </div>
                </div>

                {/* POIs Overview Table (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-[#e2eae4] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-base text-[#19231b] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#2d5a37]" />
                      <span>Danh Sách 8 Điểm Chiêm Bái</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('pois')}
                      className="text-xs font-bold text-[#2d5a37] hover:underline flex items-center gap-1"
                    >
                      <span>Xem tất cả chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#e2eae4] text-[#7a8e80]">
                          <th className="py-2.5 font-bold uppercase tracking-wider">Mã</th>
                          <th className="py-2.5 font-bold uppercase tracking-wider">Tên Điểm Chiêm Bái</th>
                          <th className="py-2.5 font-bold uppercase tracking-wider">Bán Kính</th>
                          <th className="py-2.5 font-bold uppercase tracking-wider">12 Ngôn Ngữ</th>
                          <th className="py-2.5 font-bold uppercase tracking-wider text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pois.map((poi) => {
                          const viTitle = poi.translations['vi']?.title || poi.code;
                          const langCount = Object.keys(poi.translations).length;
                          return (
                            <tr key={poi.poi_id} className="hover:bg-[#f7f9f6] transition-colors">
                              <td className="py-3 font-mono font-bold text-[#2d5a37]">{poi.code}</td>
                              <td className="py-3 font-serif font-semibold text-[#19231b]">{viTitle}</td>
                              <td className="py-3 text-[#5c7362]">{poi.geofence_radius}m</td>
                              <td className="py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#eef5f0] text-[#1e3d25] text-[10px] font-bold border border-[#d6e7da]">
                                  {langCount}/12 Ngôn ngữ
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedArticlePoiId(poi.poi_id);
                                      setActiveTab('articles');
                                    }}
                                    className="p-1.5 rounded-lg bg-[#f0f6f2] hover:bg-[#e2eae4] text-[#2d5a37]"
                                    title="Chỉnh sửa bài viết"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handlePrintQR(poi)}
                                    className="p-1.5 rounded-lg bg-[#f0f6f2] hover:bg-[#e2eae4] text-[#2d5a37]"
                                    title="In mã QR"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: QUẢN LÝ POIs (POIs Management)                     */}
          {/* ========================================================= */}
          {activeTab === 'pois' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#19231b]">
                    Quản Lý Danh Sách Điểm Chiêm Bái (POIs)
                  </h2>
                  <p className="text-xs text-[#5c7362]">
                    Quản lý tọa độ GPS, bán kính kích hoạt cảm ứng, mã QR và hình ảnh thực tế
                  </p>
                </div>

                <button
                  onClick={handleCreateNewClick}
                  className="px-4 py-2.5 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Điểm Chiêm Bái Mới</span>
                </button>
              </div>

              {/* Grid of POI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pois.map((poi) => {
                  const viTitle = poi.translations['vi']?.title || poi.code;
                  const viDesc = poi.translations['vi']?.description || '';
                  const mediaUrl = poi.media[0]?.image_url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80';

                  return (
                    <div
                      key={poi.poi_id}
                      className="bg-white rounded-3xl border border-[#e2eae4] shadow-xs overflow-hidden flex flex-col group hover:border-[#2d5a37] transition-all"
                    >
                      {/* Image header */}
                      <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                        <img
                          src={mediaUrl}
                          alt={viTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/95 text-[#2d5a37] font-bold text-[10px] shadow-xs">
                            {poi.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-black/50 text-white font-semibold text-[10px] backdrop-blur-xs">
                            R = {poi.geofence_radius}m
                          </span>
                        </div>

                        {/* Location Type */}
                        <div className="absolute top-3 right-3">
                          <span className="px-2 py-0.5 rounded-full bg-white/90 text-[#1e3d25] text-[10px] font-semibold uppercase backdrop-blur-xs">
                            {poi.location_type}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="font-serif font-bold text-base text-[#19231b] line-clamp-1">
                            {viTitle}
                          </h3>
                          <p className="text-xs text-[#5c7362] line-clamp-2 mt-1 leading-relaxed">
                            {viDesc}
                          </p>
                        </div>

                        {/* Coordinates */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#7a8e80]">
                          <span>GPS: {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}</span>
                          <span className="text-[#2d5a37] font-semibold">{Object.keys(poi.translations).length}/12 Ngôn ngữ</span>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditClick(poi)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#f0f6f2] hover:bg-[#e2eae4] text-[#2d5a37] text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Sửa thông tin tọa độ & bán kính"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>

                            <button
                              onClick={() => {
                                setSelectedArticlePoiId(poi.poi_id);
                                setActiveTab('articles');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#f0f6f2] hover:bg-[#e2eae4] text-[#2d5a37] text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Biên soạn bài viết đa ngôn ngữ"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Bài viết</span>
                            </button>

                            <button
                              onClick={() => handlePrintQR(poi)}
                              className="p-1.5 rounded-xl bg-white border border-[#e2eae4] hover:bg-[#f7f9f6] text-[#5c7362]"
                              title="Xem và In mã QR"
                            >
                              <QrCode className="w-3.5 h-3.5 text-[#2d5a37]" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeletePOI(poi.poi_id)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Xóa POI này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Create / Edit POI */}
              {(isCreatingNew || editingPoi) && (
                <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
                  <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#e2eae4] shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-[#e2eae4] pb-3">
                      <div>
                        <h3 className="font-serif font-bold text-lg text-[#19231b]">
                          {isCreatingNew ? 'Thêm Điểm Chiêm Bái Mới' : `Sửa Thông Tin: ${formData.code}`}
                        </h3>
                        <p className="text-xs text-[#5c7362]">
                          Chọn vị trí trên bản đồ khuôn viên hoặc nhập tọa độ số liệu
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNew(false);
                          setEditingPoi(null);
                        }}
                        className="w-8 h-8 rounded-full bg-[#f7f9f6] hover:bg-[#e2eae4] flex items-center justify-center text-[#5c7362] transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSavePOI} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#19231b] mb-1">
                            Mã POI (Code)
                          </label>
                          <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs font-mono text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden"
                            placeholder="VNQT-..."
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#19231b] mb-1">
                            Loại Công Trình
                          </label>
                          <select
                            value={formData.location_type}
                            onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                            className="w-full px-3.5 py-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden"
                          >
                            <option value="sanctuary">Chánh Điện / Điện Thờ (Sanctuary)</option>
                            <option value="stupa">Bảo Tháp (Stupa)</option>
                            <option value="bell">Chuông / Đại Hồng Chung (Bell)</option>
                            <option value="gate">Cổng Tam Quan (Gate)</option>
                            <option value="garden">Vườn Cây / Cội Bồ Đề (Garden)</option>
                            <option value="memorial">Đài Tưởng Niệm (Memorial)</option>
                            <option value="statue">Tượng Bồ Tát (Statue)</option>
                            <option value="ancestral">Nhà Hậu Tổ (Ancestral)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#19231b] mb-1">
                          Tên Điểm Chiêm Bái (Tiếng Việt)
                        </label>
                        <input
                          type="text"
                          value={formData.title_vi}
                          onChange={(e) => setFormData({ ...formData, title_vi: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden font-medium"
                          placeholder="Ví dụ: Đại Hùng Bửu Điện"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#19231b] mb-1">
                          Phần Giới Thiệu Tóm Tắt (1-2 câu tổng quan)
                        </label>
                        <textarea
                          rows={2}
                          value={formData.intro_vi}
                          onChange={(e) => setFormData({ ...formData, intro_vi: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden leading-relaxed"
                          placeholder="Đoạn văn ngắn giới thiệu tổng quan điểm di tích..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#19231b] mb-1">
                          Nội Dung Thuyết Minh Chi Tiết (Tiếng Việt)
                        </label>
                        <textarea
                          rows={4}
                          value={formData.description_vi}
                          onChange={(e) => setFormData({ ...formData, description_vi: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden leading-relaxed"
                          placeholder="Bài thuyết minh mở đầu bằng tiếng Việt..."
                          required
                        />
                      </div>

                      {/* 2 PHƯƠNG THỨC THIẾT LẬP TỌA ĐỘ THEO YÊU CẦU CỦA USER */}
                      <div className="space-y-3 pt-2 border-t border-[#e2eae4]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-xs font-bold text-[#19231b]">
                            Thiết Lập Tọa Độ Vị Trí & Bán Kính
                          </label>

                          {/* 2-Way Switcher */}
                          <div className="flex p-0.5 bg-[#f0f6f2] rounded-xl border border-[#e2eae4] text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => setCoordInputMode('map')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                coordInputMode === 'map'
                                  ? 'bg-[#2d5a37] text-white font-bold shadow-xs'
                                  : 'text-[#5c7362] hover:text-[#19231b]'
                              }`}
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>1. Chọn Trên Bản Đồ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCoordInputMode('manual')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                coordInputMode === 'manual'
                                  ? 'bg-[#2d5a37] text-white font-bold shadow-xs'
                                  : 'text-[#5c7362] hover:text-[#19231b]'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>2. Nhập Thủ Công</span>
                            </button>
                          </div>
                        </div>

                        {/* MODE 1: Chọn Trên Bản Đồ Trực Quan */}
                        {coordInputMode === 'map' && (
                          <div className="space-y-3 animate-fade-in">
                            <AdminPOIMapPicker
                              latitude={formData.latitude}
                              longitude={formData.longitude}
                              geofenceRadius={formData.geofence_radius}
                              existingPOIs={pois}
                              currentPoiId={editingPoi?.poi_id}
                              onCoordinatesChange={(lat, lng) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  latitude: lat,
                                  longitude: lng,
                                }));
                              }}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#f7f9f6] rounded-2xl border border-[#e2eae4]">
                              <div>
                                <label className="block text-[11px] font-semibold text-[#5c7362] mb-1">
                                  Tọa độ đã chọn từ bản đồ
                                </label>
                                <div className="font-mono text-xs font-bold text-[#1e3d25] bg-white px-3 py-1.5 rounded-xl border border-[#e2eae4]">
                                  {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-[11px] font-semibold text-[#5c7362] mb-1">
                                  <span>Bán kính Geofence cảm biến</span>
                                  <span className="font-mono font-bold text-[#2d5a37]">{formData.geofence_radius}m</span>
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="40"
                                  step="1"
                                  value={formData.geofence_radius}
                                  onChange={(e) =>
                                    setFormData({ ...formData, geofence_radius: parseInt(e.target.value) || 20 })
                                  }
                                  className="w-full accent-[#2d5a37]"
                                />
                                <div className="flex justify-between text-[10px] text-[#7a8e80] mt-0.5">
                                  <span>10m</span>
                                  <span>Tiêu chuẩn: 20m</span>
                                  <span>40m</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* MODE 2: Nhập Tọa Độ Số Liệu Thủ Công */}
                        {coordInputMode === 'manual' && (
                          <div className="grid grid-cols-3 gap-3 animate-fade-in p-3 bg-[#f7f9f6] rounded-2xl border border-[#e2eae4]">
                            <div>
                              <label className="block text-xs font-semibold text-[#19231b] mb-1">
                                Vĩ Độ (Latitude)
                              </label>
                              <input
                                type="number"
                                step="0.00001"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs font-mono text-[#19231b] focus:border-[#2d5a37] outline-hidden"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#19231b] mb-1">
                                Kinh Độ (Longitude)
                              </label>
                              <input
                                type="number"
                                step="0.00001"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs font-mono text-[#19231b] focus:border-[#2d5a37] outline-hidden"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#19231b] mb-1">
                                Bán Kính Geofence (m)
                              </label>
                              <input
                                type="number"
                                min="5"
                                max="50"
                                value={formData.geofence_radius}
                                onChange={(e) => setFormData({ ...formData, geofence_radius: parseInt(e.target.value) || 20 })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs font-mono text-[#19231b] focus:border-[#2d5a37] outline-hidden"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#19231b] mb-1">
                          Đường Dẫn Hình Ảnh (URL)
                        </label>
                        <input
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b]"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNew(false);
                            setEditingPoi(null);
                          }}
                          className="px-4 py-2 rounded-full bg-white border border-[#e2eae4] text-xs font-semibold text-[#5c7362] hover:bg-[#f7f9f6]"
                        >
                          Hủy Bỏ
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-xs font-bold text-white shadow-xs"
                        >
                          {isCreatingNew ? 'Tạo Điểm Mới' : 'Lưu Thay Đổi'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: QUẢN LÝ CÁC AUDIO & GIỌNG ĐỌC MẶC ĐỊNH             */}
          {/* ========================================================= */}
          {activeTab === 'audio' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div>
                <h2 className="font-serif font-bold text-xl text-[#19231b]">
                  Quản Lý Audio & Cấu Hình Giọng Đọc Mặc Định
                </h2>
                <p className="text-xs text-[#5c7362]">
                  Cài đặt giọng đọc mặc định toàn hệ thống cho du khách và nghe thử audio thuyết minh của từng POI
                </p>
              </div>

              {/* Section 1: System-wide Default Voice Settings */}
              <div className="bg-white rounded-3xl p-5 border border-[#e2eae4] shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#e2eae4] pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#2d5a37]" />
                    <h3 className="font-serif font-bold text-base text-[#19231b]">
                      Cấu Hình Giọng Đọc Mặc Định Toàn Ứng Dụng
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#5c7362]">
                    Áp dụng tự động cho tất cả du khách mới
                  </span>
                </div>

                {/* 5 Voice Engines Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#19231b] mb-2">
                    1. Chọn Động Cơ Giọng Đọc (Voice Engine)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {VOICE_ENGINES.map((engine) => {
                      const isSelected = defaultVoiceEngine === engine.id;
                      return (
                        <div
                          key={engine.id}
                          onClick={() => {
                            setDefaultVoiceEngine(engine.id);
                            setDefaultVoiceRate(engine.defaultRate);
                            setDefaultVoicePitch(engine.defaultPitch);
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#f0f6f2] border-[#2d5a37] ring-1 ring-[#2d5a37] shadow-xs'
                              : 'bg-white border-[#e2eae4] hover:border-[#2d5a37]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-[#19231b]">{engine.name}</span>
                            {isSelected && <CheckCircle className="w-4 h-4 text-[#2d5a37]" />}
                          </div>
                          <div className="text-[10px] text-[#2d5a37] font-semibold">{engine.provider}</div>
                          <p className="text-[11px] text-[#5c7362] mt-1 leading-relaxed">
                            {engine.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sliders: Rate & Pitch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="bg-[#f7f9f6] p-4 rounded-2xl border border-[#e2eae4] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#19231b]">
                      <span>Tốc độ đọc (Speech Rate)</span>
                      <span className="text-[#2d5a37] font-mono">{defaultVoiceRate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.75"
                      max="1.3"
                      step="0.05"
                      value={defaultVoiceRate}
                      onChange={(e) => setDefaultVoiceRate(parseFloat(e.target.value))}
                      className="w-full accent-[#2d5a37]"
                    />
                    <div className="flex justify-between text-[10px] text-[#7a8e80]">
                      <span>Chậm (0.75x)</span>
                      <span>Bình thường (1.0x)</span>
                      <span>Nhanh (1.3x)</span>
                    </div>
                  </div>

                  <div className="bg-[#f7f9f6] p-4 rounded-2xl border border-[#e2eae4] space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#19231b]">
                      <span>Độ cao giọng (Pitch)</span>
                      <span className="text-[#2d5a37] font-mono">{defaultVoicePitch.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={defaultVoicePitch}
                      onChange={(e) => setDefaultVoicePitch(parseFloat(e.target.value))}
                      className="w-full accent-[#2d5a37]"
                    />
                    <div className="flex justify-between text-[10px] text-[#7a8e80]">
                      <span>Trầm ấm (0.8)</span>
                      <span>Tiêu chuẩn (1.0)</span>
                      <span>Trong trẻo (1.3)</span>
                    </div>
                  </div>
                </div>

                {/* Test & Save buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleTestVoiceSample}
                    disabled={isTestingVoice}
                    className="px-4 py-2 rounded-full bg-[#f0f6f2] hover:bg-[#e2eae4] text-[#2d5a37] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{isTestingVoice ? 'Đang đọc thử...' : 'Nghe Thử Mẫu Thuyết Minh'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDefaultVoice}
                    disabled={isSavingVoice}
                    className="px-5 py-2.5 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingVoice ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Lưu Làm Giọng Mặc Định Cho Du Khách</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Section 2: POI Audio Live Tester */}
              <div className="bg-white rounded-3xl p-5 border border-[#e2eae4] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#e2eae4] pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#19231b]">
                      Kiểm Tra & Nghe Trực Tiếp Audio 8 Điểm POI
                    </h3>
                    <p className="text-xs text-[#5c7362]">
                      Chọn ngôn ngữ và bấm nghe thử để kiểm tra ngữ điệu từng bài thuyết minh
                    </p>
                  </div>

                  {/* Language switcher for audio test */}
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setAudioTestingLang(l.code);
                          if (isAudioSpeaking) speechEngine.stop();
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          audioTestingLang === l.code
                            ? 'bg-[#2d5a37] text-white border-[#2d5a37]'
                            : 'bg-white text-[#5c7362] border-[#e2eae4] hover:bg-[#f7f9f6]'
                        }`}
                      >
                        {l.flag} {l.code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio rows */}
                <div className="space-y-3">
                  {pois.map((poi) => {
                    const trans = poi.translations[audioTestingLang] || poi.translations['vi'];
                    const isCurrentlySpeaking = audioTestingPoiId === poi.poi_id && isAudioSpeaking;

                    return (
                      <div
                        key={poi.poi_id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          isCurrentlySpeaking
                            ? 'bg-[#eef5f0] border-[#2d5a37] shadow-xs'
                            : 'bg-[#f7f9f6] border-[#e2eae4] hover:bg-white'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-[#2d5a37] border border-[#d6e7da]">
                              {poi.code}
                            </span>
                            <h4 className="font-serif font-bold text-sm text-[#19231b] truncate">
                              {trans?.title || poi.code}
                            </h4>
                          </div>
                          <p className="text-xs text-[#5c7362] line-clamp-1">
                            {trans?.description || 'Chưa có nội dung thuyết minh'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handlePlayPoiAudio(poi, audioTestingLang)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                              isCurrentlySpeaking
                                ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                                : 'bg-[#2d5a37] text-white hover:bg-[#23462b]'
                            }`}
                          >
                            {isCurrentlySpeaking ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5" />
                                <span>Dừng</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Nghe Audio</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: BÀI VIẾT Ở POIs (Articles & Multilingual Editor)    */}
          {/* ========================================================= */}
          {activeTab === 'articles' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="font-serif font-bold text-xl text-[#19231b]">
                  Quản Lý Bài Viết & Nội Dung Thuyết Minh Ở POIs
                </h2>
                <p className="text-xs text-[#5c7362]">
                  Biên tập chi tiết nội dung bài viết thuyết minh lịch sử, tâm linh theo 12 ngôn ngữ quốc tế
                </p>
              </div>

              {/* Top Controls: Choose POI & Choose Language */}
              <div className="bg-white rounded-3xl p-5 border border-[#e2eae4] shadow-xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select POI */}
                  <div>
                    <label className="block text-xs font-semibold text-[#19231b] mb-1.5">
                      1. Chọn Điểm Chiêm Bái Cần Biên Soạn Bài Viết
                    </label>
                    <select
                      value={selectedArticlePoiId}
                      onChange={(e) => setSelectedArticlePoiId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] text-xs font-semibold text-[#19231b] outline-hidden focus:border-[#2d5a37]"
                    >
                      {pois.map((poi) => (
                        <option key={poi.poi_id} value={poi.poi_id}>
                          {poi.code} · {poi.translations['vi']?.title || poi.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick stats on current POI */}
                  <div className="bg-[#f7f9f6] p-3.5 rounded-2xl border border-[#e2eae4] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#7a8e80] block text-[10px] uppercase font-bold">Trạng thái bài viết</span>
                      <span className="font-bold text-[#19231b] mt-0.5 block">
                        Đã có 12/12 bản dịch
                      </span>
                    </div>
                    <button
                      onClick={handleAiTranslateArticle}
                      disabled={isAiTranslatingArticle}
                      className="px-3 py-1.5 rounded-full bg-white border border-[#2d5a37] text-[#2d5a37] text-xs font-bold hover:bg-[#eef5f0] shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAiTranslatingArticle ? 'animate-spin' : ''}`} />
                      <span>{isAiTranslatingArticle ? 'Đang dịch AI...' : 'Dịch Bằng Gemini AI'}</span>
                    </button>
                  </div>
                </div>

                {/* 12 Language Tabs */}
                <div>
                  <label className="block text-xs font-semibold text-[#19231b] mb-2">
                    2. Chọn Ngôn Ngữ Bài Viết
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = selectedArticleLang === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedArticleLang(lang.code)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                            isSelected
                              ? 'bg-[#2d5a37] text-white shadow-xs'
                              : 'bg-[#f7f9f6] border border-[#e2eae4] text-[#5c7362] hover:text-[#19231b]'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Editor Workspace Card */}
              <div className="bg-white rounded-3xl p-5 border border-[#e2eae4] shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2eae4] pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#2d5a37]" />
                    <h3 className="font-serif font-bold text-base text-[#19231b]">
                      Nội Dung Bài Thuyết Minh [{selectedArticleLang.toUpperCase()}]
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#7a8e80]">
                    <span>Số từ: {articleDesc.trim().split(/\s+/).filter(Boolean).length}</span>
                    <span>·</span>
                    <span>Thời gian đọc ước tính: ~{Math.ceil(articleDesc.length / 15)}s</span>
                  </div>
                </div>

                {/* 1. Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#19231b] mb-1.5">
                    1. Tiêu Đề Công Trình ({selectedArticleLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] text-sm font-serif font-bold text-[#19231b] outline-hidden focus:border-[#2d5a37] focus:bg-white transition-all"
                    placeholder="Tiêu đề di tích..."
                    required
                  />
                </div>

                {/* 2. Introduction */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#19231b]">
                      2. Phần Giới Thiệu Tóm Tắt ({selectedArticleLang.toUpperCase()})
                    </label>
                    <span className="text-[10px] text-[#7a8e80]">
                      Đoạn văn ngắn (1-2 câu) giới thiệu tổng quan điểm chiêm bái
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={articleIntro}
                    onChange={(e) => setArticleIntro(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] text-xs sm:text-sm text-[#19231b] leading-relaxed outline-hidden focus:border-[#2d5a37] focus:bg-white transition-all"
                    placeholder="Nhập phần giới thiệu tổng quan công trình..."
                  />
                </div>

                {/* 3. Description / Article Body */}
                <div>
                  <label className="block text-xs font-semibold text-[#19231b] mb-1.5">
                    3. Toàn Văn Bài Viết Thuyết Minh Chi Tiết
                  </label>
                  <textarea
                    rows={8}
                    value={articleDesc}
                    onChange={(e) => setArticleDesc(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] text-xs sm:text-sm text-[#19231b] leading-relaxed outline-hidden focus:border-[#2d5a37] focus:bg-white transition-all"
                    placeholder="Nhập nội dung thuyết minh văn hóa, lịch sử và tâm linh chi tiết..."
                    required
                  />
                </div>

                {/* Bottom Bar: Action buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isAudioSpeaking) {
                        handleStopAudio();
                      } else {
                        const title = `${articleTitle || 'Bài Thuyết Minh'} (${selectedArticleLang.toUpperCase()})`;
                        setCurrentSpeakingTitle(title);
                        speechEngine.speak(articleDesc, title, selectedArticleLang, undefined, undefined, articleIntro);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                      isAudioSpeaking
                        ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                        : 'bg-[#f0f6f2] hover:bg-[#e2eae4] text-[#2d5a37]'
                    }`}
                  >
                    {isAudioSpeaking ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        <span>Dừng Đọc Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        <span>Nghe Thử Văn Bản Này</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAiTranslateArticle}
                      disabled={isAiTranslatingArticle}
                      className="px-4 py-2 rounded-full bg-white border border-[#2d5a37] text-[#2d5a37] text-xs font-bold hover:bg-[#f0f6f2] shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isAiTranslatingArticle ? 'Đang dịch AI...' : 'Tự Động Dịch Bằng AI'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveArticle}
                      disabled={isSavingArticle}
                      className="px-6 py-2 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingArticle ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Lưu Bài Viết</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* QR Modal Viewer */}
      {qrModalPoi && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#e2eae4] shadow-2xl p-6 text-center space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setQrModalPoi(null)}
                className="w-8 h-8 rounded-full bg-[#f7f9f6] hover:bg-[#e2eae4] flex items-center justify-center text-[#5c7362]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="w-12 h-12 mx-auto rounded-full bg-[#eef5f0] text-[#2d5a37] flex items-center justify-center border border-[#d6e7da]">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#19231b]">
              {qrModalPoi.translations['vi']?.title || qrModalPoi.code}
            </h3>
            <p className="text-xs text-[#5c7362]">
              Tem quét mã QR tự động thuyết minh khi tham quan
            </p>
            {qrPreviews[qrModalPoi.poi_id] && (
              <img
                src={qrPreviews[qrModalPoi.poi_id]}
                alt="QR"
                className="w-56 h-56 mx-auto rounded-2xl border border-[#e2eae4] p-2 bg-white shadow-xs"
              />
            )}
            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => handlePrintQR(qrModalPoi)}
                className="px-4 py-2 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Tem QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Audio Bar across Admin Portal */}
      {isAudioSpeaking && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[10000] bg-white rounded-2xl border-2 border-rose-500 shadow-2xl p-3.5 flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 animate-bounce">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />
                Đang phát Thuyết Minh
              </div>
              <div className="text-xs font-serif font-bold text-[#19231b] truncate" title={currentSpeakingTitle}>
                {currentSpeakingTitle || 'Audio Thuyết Minh'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStopAudio}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all flex-shrink-0"
            title="Dừng đọc âm thanh ngay lập tức"
          >
            <VolumeX className="w-4 h-4" />
            <span>Tắt Audio</span>
          </button>
        </div>
      )}
    </div>
  );
};
