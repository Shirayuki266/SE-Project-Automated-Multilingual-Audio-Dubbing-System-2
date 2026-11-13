import React, { useState, useEffect, useRef } from 'react';
import { RichPOI, Campus } from '../server/types.js';
import { LanguageCode, speechEngine, VOICE_ENGINES, VoiceEngineId } from '../utils/audioSpeech.js';
import { AdminPOIMapPicker } from './AdminPOIMapPicker.js';
import { POIArticlePopup } from './POIArticlePopup.js';
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
  Eye,
  Search,
  Upload,
  Camera,
  Check,
} from 'lucide-react';

interface AdminPortalProps {
  pois: RichPOI[];
  currentLang: LanguageCode;
  onClose: () => void;
  onRefreshPOIs: () => void;
}

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

  // Active Tabs: 3 Main Tabs (Dashboard, POIs, Audio Settings)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pois' | 'audio'>('dashboard');

  // Popup "Xem/Sửa bài viết" State
  const [articlePopupPoi, setArticlePopupPoi] = useState<RichPOI | null>(null);

  // Default Voice Configuration State
  const [defaultVoiceEngine, setDefaultVoiceEngine] = useState<VoiceEngineId>('chi-google');
  const [defaultVoiceRate, setDefaultVoiceRate] = useState<number>(0.95);
  const [defaultVoicePitch, setDefaultVoicePitch] = useState<number>(1.0);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Audio Live Tester State
  const [audioTestingPoiId, setAudioTestingPoiId] = useState<string | null>(null);
  const [audioTestingLang, setAudioTestingLang] = useState<LanguageCode>('vi');
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);
  const [currentSpeakingTitle, setCurrentSpeakingTitle] = useState<string>('');

  // POI Form State (Add / Edit)
  const [editingPoi, setEditingPoi] = useState<RichPOI | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [coordInputMode, setCoordInputMode] = useState<'map' | 'manual'>('map');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    campus_id: 'vnqt-campus-01',
    code: '',
    title_vi: '',
    intro_vi: '',
    description_vi: '',
    latitude: 10.77125,
    longitude: 106.6714,
    geofence_radius: 20,
    location_type: 'sanctuary' as any,
    image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    display_order: 1,
  });

  // Health & Daily Visit States
  const [healthData, setHealthData] = useState<any>(null);
  const [todayVisitors, setTodayVisitors] = useState<number>(1);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // Search and Filter in POI tab
  const [poiSearchQuery, setPoiSearchQuery] = useState<string>('');
  const [poiTypeFilter, setPoiTypeFilter] = useState<string>('all');

  // QR Modal
  const [qrModalPoi, setQrModalPoi] = useState<RichPOI | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Notifications
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotify = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Check URL hash/query on load to auto-open article popup (e.g. ?poi=ID or #poi=ID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const poiQuery = params.get('poi') || window.location.hash.replace('#poi=', '');
    if (poiQuery && pois.length > 0) {
      const match = pois.find(
        (p) => p.poi_id.toLowerCase() === poiQuery.toLowerCase() || p.code.toLowerCase() === poiQuery.toLowerCase()
      );
      if (match) {
        setArticlePopupPoi(match);
      }
    }
  }, [pois]);

  // Fetch Health & Today Visits
  const fetchDashboardMetrics = async () => {
    setIsLoadingHealth(true);
    try {
      const [healthRes, visitRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/visit/today-count'),
      ]);
      const health = await healthRes.json();
      const visit = await visitRes.json();
      setHealthData(health);
      if (visit.success && visit.data) {
        setTodayVisitors(visit.data.todayUniqueVisitors || 1);
      }
    } catch (err: any) {
      console.warn('Dashboard fetch notice:', err.message);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchDashboardMetrics();
    }
  }, [authToken, activeTab]);

  // Generate QR when modal opens
  useEffect(() => {
    if (!qrModalPoi) {
      setQrDataUrl(null);
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vnquoccu.vn';
    const targetUrl = `${origin}/?poi=${qrModalPoi.code}`;

    QRCode.toDataURL(targetUrl, {
      width: 1024,
      margin: 3,
      errorCorrectionLevel: 'H',
      color: { dark: '#1e3d25', light: '#FFFFFF' },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR gen notice:', err));
  }, [qrModalPoi]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
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

  // Image Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng tệp ảnh không được vượt quá 5MB.');
      return;
    }

    // Client-side instant preview
    const previewReader = new FileReader();
    previewReader.onload = (event) => {
      setUploadPreview(event.target?.result as string);
    };
    previewReader.readAsDataURL(file);

    // Upload to server
    setIsUploadingImage(true);
    const bodyData = new FormData();
    bodyData.append('image', file);
    if (formData.image_url && formData.image_url.startsWith('/uploads/')) {
      bodyData.append('oldImageUrl', formData.image_url);
    }

    try {
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: bodyData,
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        setFormData((prev) => ({ ...prev, image_url: data.imageUrl }));
        showNotify('Tải ảnh công trình lên thành công!');
      } else {
        alert(data.error || 'Lỗi tải ảnh lên');
      }
    } catch (err: any) {
      alert('Lỗi tải ảnh: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
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
    showNotify('Đã dừng phát âm thanh.');
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

    const sampleText =
      'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật. Chào mừng quý khách và chư thiện nam tín nữ đến với Việt Nam Quốc Tự.';
    setCurrentSpeakingTitle('Mẫu Giọng Đọc Mặc Định');
    speechEngine.speak(sampleText, 'Mẫu Thuyết Minh Mặc Định', 'vi');
    setTimeout(() => setIsTestingVoice(false), 2000);
  };

  // POI CRUD
  const handleCreateNewClick = () => {
    setIsCreatingNew(true);
    setEditingPoi(null);
    setUploadPreview(null);
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
      display_order: pois.length + 1,
    });
  };

  const handleEditClick = (poi: RichPOI) => {
    setEditingPoi(poi);
    setIsCreatingNew(false);
    setUploadPreview(null);
    setFormData({
      campus_id: poi.campus_id,
      code: poi.code,
      title_vi: poi.translations['vi']?.title || '',
      intro_vi: poi.translations['vi']?.introduction || '',
      description_vi: poi.translations['vi']?.description || '',
      latitude: poi.latitude,
      longitude: poi.longitude,
      geofence_radius: poi.geofence_radius,
      location_type: poi.location_type || poi.category || 'sanctuary',
      image_url: poi.image || poi.media[0]?.image_url || '',
      display_order: poi.display_order || 1,
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
        showNotify('Đã tạo điểm POI mới thành công vào MongoDB!');
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
        showNotify('Đã cập nhật thông tin điểm POI thành công!');
      }

      setIsCreatingNew(false);
      setEditingPoi(null);
      setUploadPreview(null);
      onRefreshPOIs();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDeletePOI = async (poiId: string) => {
    if (!confirm('Quý vị có chắc chắn muốn xóa điểm POI này? Toàn bộ bản dịch và ảnh liên quan sẽ được dọn sạch.')) return;
    try {
      const res = await fetch(`/api/pois/${poiId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error);
      onRefreshPOIs();
      showNotify('Đã xóa điểm POI thành công khỏi MongoDB.');
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Download QR as PNG or JPG
  const handleDownloadQR = (format: 'png' | 'jpg') => {
    if (!qrModalPoi || !qrDataUrl) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = 1024;
      canvas.height = 1024;
      if (ctx) {
        // Nền trắng thuần khiết #FFFFFF bắt buộc cho JPG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1024, 1024);
        ctx.drawImage(img, 0, 0, 1024, 1024);

        const a = document.createElement('a');
        a.download = `QR-${qrModalPoi.code}.${format}`;
        a.href = format === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.95);
        a.click();
        showNotify(`Đã tải xuống mã QR định dạng .${format.toUpperCase()}`);
      }
    };
    img.src = qrDataUrl;
  };

  // If not logged in, render dedicated secure Admin login screen
  if (!authToken) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f7f9f6] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full border border-[#e2eae4] shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#eef5f0] text-[#2d5a37] mb-2 shadow-xs ring-4 ring-[#2d5a37]/15">
            <Shield className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#1e3d25]">
              Quản Trị Việt Nam Quốc Tự
            </h2>
            <p className="text-xs text-[#5c7362] mt-1">
              Phân hệ quản trị điểm chiêm bái, kịch bản 12 ngôn ngữ và âm thanh
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-[#19231b] mb-1">Tài Khoản</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#19231b] mb-1">Mật Khẩu</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-[#2d5a37] hover:bg-[#23462b] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? 'Đang xác thực...' : 'Đăng Nhập Quản Trị'}</span>
            </button>
          </form>

          <div className="pt-2 border-t border-[#e2eae4] flex items-center justify-between text-xs text-[#5c7362]">
            <span>Phiên bản 2.1.0</span>
            <button onClick={onClose} className="hover:text-[#2d5a37] font-semibold underline">
              Về Trang Khách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f7f9f6] flex flex-col overflow-hidden animate-fade-in font-sans">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-4 right-4 z-[12000] bg-[#1e3d25] text-white px-4 py-2.5 rounded-2xl shadow-xl border border-[#2d5a37] flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Top Admin Navbar */}
      <header className="bg-white border-b border-[#e2eae4] px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#2d5a37] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            VNQT
          </div>
          <div>
            <h1 className="font-serif font-bold text-base sm:text-lg text-[#1e3d25] tracking-tight">
              Trung Tâm Quản Trị Âm Thanh & Điểm Chiêm Bái
            </h1>
            <p className="text-[11px] text-[#5c7362]">
              Việt Nam Quốc Tự · MongoDB Atlas · Gemini AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardMetrics}
            disabled={isLoadingHealth}
            className="p-2 rounded-xl bg-[#f7f9f6] hover:bg-[#eef5f0] border border-[#e2eae4] text-[#5c7362] hover:text-[#2d5a37] transition-colors"
            title="Làm mới trạng thái"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingHealth ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-[#f7f9f6] hover:bg-[#eef5f0] border border-[#e2eae4] text-xs font-semibold text-[#1e3d25] flex items-center gap-1 transition-colors"
          >
            <span>Trang Khách</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Admin Tabs Bar */}
      <div className="bg-white border-b border-[#e2eae4] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-[#2d5a37] text-white shadow-xs'
              : 'bg-[#f7f9f6] text-[#5c7362] hover:bg-[#eef5f0] border border-[#e2eae4]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>1. Dashboard Tổng Quan</span>
        </button>

        <button
          onClick={() => setActiveTab('pois')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'pois'
              ? 'bg-[#2d5a37] text-white shadow-xs'
              : 'bg-[#f7f9f6] text-[#5c7362] hover:bg-[#eef5f0] border border-[#e2eae4]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>2. Quản Lý POIs ({pois.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'audio'
              ? 'bg-[#2d5a37] text-white shadow-xs'
              : 'bg-[#f7f9f6] text-[#5c7362] hover:bg-[#eef5f0] border border-[#e2eae4]'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>3. Cấu Hình Giọng Đọc</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD (CHỈ CÒN 3 KHỐI THEO YÊU CẦU CỦA USER)   */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            {/* KHỐI 1: TỔNG LƯỢT TRUY CẬP THỰC HÔM NAY (1 MÁY = 1 NGƯỜI) */}
            <div className="bg-gradient-to-br from-[#2d5a37] to-[#1e3d25] rounded-3xl p-6 text-white shadow-md border border-[#23462b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-300" />
                  <span>Khối 1: Lưu Lượng Khách Chiêm Bái Thực Hôm Nay</span>
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold">
                  {todayVisitors} <span className="text-base font-normal font-sans text-emerald-100">khách hành hương</span>
                </h3>
                <p className="text-xs text-emerald-200/90 leading-relaxed max-w-xl">
                  Cơ chế chống spam: 1 thiết bị = 1 người = tối đa 1 lượt tính trong ngày. Dữ liệu mã hóa HMAC-SHA256 lưu tạm 24h trên MongoDB và tự hủy bằng TTL Index.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center sm:text-right flex-shrink-0">
                <span className="block text-[11px] text-emerald-200">Múi giờ ghi nhận</span>
                <span className="text-xs font-mono font-bold">Asia/Ho_Chi_Minh (GMT+7)</span>
              </div>
            </div>

            {/* KHỐI 2: TRẠNG THÁI HẠ TẦNG (MONGODB, GEMINI AI, TTS SERVICE) */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2eae4] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f0f3f1] pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-[#2d5a37]" />
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                    Khối 2: Trạng Thái Hạ Tầng & Dịch Vụ Hệ Thống
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#5c7362]">/api/health</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. MongoDB Atlas */}
                <div className="p-4 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#19231b]">MongoDB Atlas</span>
                    {healthData?.database?.connected ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Đang kết nối
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Mất kết nối
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#5c7362] space-y-1">
                    <p>Database: <span className="font-mono text-[#19231b] font-semibold">{healthData?.database?.database || 'vietnam_quoc_tu'}</span></p>
                    <p>Độ trễ: <span className="font-mono text-emerald-700 font-bold">{healthData?.database?.latencyMs ?? 0} ms</span></p>
                    <p>Chỉ mục: <span className="font-mono text-[#2d5a37] font-semibold">{healthData?.database?.geoSpatialIndex || '2dsphere'}</span></p>
                  </div>
                </div>

                {/* 2. Gemini AI */}
                <div className="p-4 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#19231b]">Google Gemini AI</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Sẵn sàng
                    </span>
                  </div>
                  <div className="text-xs text-[#5c7362] space-y-1">
                    <p>Model: <span className="font-mono text-[#19231b] font-semibold">gemini-2.5-flash</span></p>
                    <p>Nhiệm vụ: Dịch kịch bản 12 ngôn ngữ & Chatbot Tuệ Đăng</p>
                    <p>Định dạng: Structured JSON Schema</p>
                  </div>
                </div>

                {/* 3. TTS Service */}
                <div className="p-4 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#19231b]">TTS Audio Engine</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Hoạt động
                    </span>
                  </div>
                  <div className="text-xs text-[#5c7362] space-y-1">
                    <p>Động cơ: <span className="font-mono text-[#19231b] font-semibold">Google Cloud TTS (Multi-chunk)</span></p>
                    <p>Định dạng xuất: MP3 44.1kHz (Vòng 1)</p>
                    <p>Thư mục cache: <span className="font-mono text-[#2d5a37] font-semibold">/public/audio</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* KHỐI 3: DANH SÁCH ĐIỂM CHIÊM BÁI (TÊN, THỨ TỰ, AUDIO, MỨC PHỦ NGÔN NGỮ) */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2eae4] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f0f3f1] pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2d5a37]" />
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                    Khối 3: Danh Sách Điểm Chiêm Bái ({pois.length} POIs)
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('pois')}
                  className="text-xs font-bold text-[#2d5a37] hover:underline flex items-center gap-1"
                >
                  <span>Chuyển sang Quản lý POIs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e2eae4] text-[#7a8e80] font-semibold">
                      <th className="py-2.5 px-3">Thứ Tự</th>
                      <th className="py-2.5 px-3">Mã POI</th>
                      <th className="py-2.5 px-3">Tên Điểm Chiêm Bái</th>
                      <th className="py-2.5 px-3">Trạng Thái Audio</th>
                      <th className="py-2.5 px-3">Mức Phủ Ngôn Ngữ</th>
                      <th className="py-2.5 px-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f3f1]">
                    {pois.map((poi, idx) => {
                      const viTitle = poi.translations['vi']?.title || poi.code;
                      const hasViAudio = Boolean(poi.translations['vi']?.audio_url);
                      const transCount = Object.keys(poi.translations).length;

                      return (
                        <tr key={poi.poi_id} className="hover:bg-[#f7f9f6] transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-[#5c7362]">{poi.display_order || idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-[#1e3d25]">{poi.code}</td>
                          <td className="py-3 px-3 font-medium text-[#19231b]">{viTitle}</td>
                          <td className="py-3 px-3">
                            {hasViAudio ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                ✓ Đã có MP3
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                Chưa có file
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-[#2d5a37]">{transCount} / 12 ngôn ngữ</span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setArticlePopupPoi(poi)}
                              className="px-3 py-1.5 rounded-xl bg-[#eef5f0] hover:bg-[#2d5a37] hover:text-white text-[#2d5a37] font-bold text-xs transition-colors"
                            >
                              Xem/Sửa bài viết
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: QUẢN LÝ POIS (DANH SÁCH THẺ + NÚT XEM/SỬA BÀI VIẾT) */}
        {/* ========================================================= */}
        {activeTab === 'pois' && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            {/* Search and Action Bar */}
            <div className="bg-white rounded-3xl p-5 border border-[#e2eae4] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#7a8e80] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={poiSearchQuery}
                  onChange={(e) => setPoiSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc mã POI..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] outline-hidden focus:border-[#2d5a37]"
                />
                {poiSearchQuery && (
                  <button
                    onClick={() => setPoiSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8e80] hover:text-[#19231b]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCreateNewClick}
                  className="px-4 py-2.5 rounded-2xl bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Điểm Chiêm Bái Mới</span>
                </button>
              </div>
            </div>

            {/* Grid POI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pois
                .filter((p) => {
                  const q = poiSearchQuery.toLowerCase().trim();
                  const vi = (p.translations['vi']?.title || '').toLowerCase();
                  return !q || vi.includes(q) || p.code.toLowerCase().includes(q);
                })
                .map((poi) => {
                  const viTitle = poi.translations['vi']?.title || poi.code;
                  const viDesc = poi.translations['vi']?.description || '';
                  const mediaUrl =
                    poi.image ||
                    poi.media[0]?.image_url ||
                    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80';

                  return (
                    <div
                      key={poi.poi_id}
                      className="bg-white rounded-3xl border border-[#e2eae4] shadow-xs overflow-hidden flex flex-col justify-between hover:border-[#2d5a37] transition-all"
                    >
                      <div>
                        {/* Cover image */}
                        <div className="relative h-44 bg-[#eef5f0] overflow-hidden">
                          <img src={mediaUrl} alt={viTitle} className="w-full h-full object-cover" />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full bg-[#1e3d25]/90 text-white text-[11px] font-mono font-bold backdrop-blur-xs">
                              {poi.code}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-full bg-white/90 text-[#1e3d25] text-[10px] font-bold uppercase backdrop-blur-xs">
                              {poi.location_type || poi.category || 'Công trình'}
                            </span>
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="p-5 space-y-2">
                          <h3 className="font-serif font-bold text-base text-[#19231b] line-clamp-1">
                            {viTitle}
                          </h3>
                          <p className="text-xs text-[#5c7362] line-clamp-2 leading-relaxed">
                            {viDesc}
                          </p>
                          <div className="pt-2 flex items-center justify-between text-[11px] text-[#7a8e80] border-t border-[#f0f3f1]">
                            <span>GPS: {poi.latitude.toFixed(4)}, {poi.longitude.toFixed(4)}</span>
                            <span className="font-semibold text-[#2d5a37]">
                              {Object.keys(poi.translations).length}/12 Ngôn ngữ
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="p-4 pt-0 border-t border-[#f0f3f1] bg-white flex items-center justify-between gap-2">
                        {/* SUPER BUTTON: XEM/SỬA BÀI VIẾT (MỞ POPUP) */}
                        <button
                          onClick={() => setArticlePopupPoi(poi)}
                          className="flex-1 py-2 rounded-xl bg-[#2d5a37] hover:bg-[#1e3d25] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Xem/Sửa bài viết</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(poi)}
                            className="p-2 rounded-xl bg-[#f7f9f6] hover:bg-[#eef5f0] text-[#2d5a37] border border-[#e2eae4] transition-colors"
                            title="Sửa tọa độ & thông tin cơ bản"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setQrModalPoi(poi)}
                            className="p-2 rounded-xl bg-[#f7f9f6] hover:bg-[#eef5f0] text-[#2d5a37] border border-[#e2eae4] transition-colors"
                            title="Mã QR in ấn"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeletePOI(poi.poi_id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Xóa điểm này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Thêm/Sửa POI (Có nút Tải ảnh lên + Chọn trên bản đồ) */}
            {(isCreatingNew || editingPoi) && (
              <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#e2eae4] shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto my-auto">
                  <div className="flex items-center justify-between border-b border-[#e2eae4] pb-3">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#19231b]">
                        {isCreatingNew ? 'Thêm Điểm Chiêm Bái Mới' : `Sửa Thông Tin: ${formData.code}`}
                      </h3>
                      <p className="text-xs text-[#5c7362]">
                        Hỗ trợ tải ảnh lên trực tiếp từ thiết bị/camera và chọn tọa độ trên bản đồ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setEditingPoi(null);
                        setUploadPreview(null);
                      }}
                      className="w-8 h-8 rounded-full bg-[#f7f9f6] hover:bg-[#e2eae4] flex items-center justify-center text-[#5c7362] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSavePOI} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#19231b] mb-1">Mã POI (Code)</label>
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
                        <label className="block text-xs font-semibold text-[#19231b] mb-1">Loại Công Trình</label>
                        <select
                          value={formData.location_type}
                          onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] focus:border-[#2d5a37] focus:bg-white outline-hidden"
                        >
                          <option value="sanctuary">Chính Điện / Điện Thờ</option>
                          <option value="stupa">Bảo Tháp</option>
                          <option value="bell">Chuông / Đại Hồng Chung</option>
                          <option value="gate">Cổng Tam Quan</option>
                          <option value="garden">Vườn Cây / Cội Bồ Đề</option>
                          <option value="memorial">Đài Tưởng Niệm</option>
                          <option value="statue">Tượng Bồ Tát</option>
                          <option value="ancestral">Nhà Hậu Tổ</option>
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

                    {/* UPLOAD ẢNH & XEM TRƯỚC (YÊU CẦU 4) */}
                    <div className="p-4 bg-[#f7f9f6] rounded-2xl border border-[#e2eae4] space-y-3">
                      <label className="block text-xs font-bold text-[#19231b]">
                        Hình Ảnh Điểm Chiêm Bái (Tải Lên Hoặc Dán Link)
                      </label>

                      {/* Preview Image */}
                      {(uploadPreview || formData.image_url) && (
                        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#d6e7da] bg-white">
                          <img
                            src={uploadPreview || formData.image_url}
                            alt="Xem trước"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadPreview(null);
                              setFormData((prev) => ({ ...prev, image_url: '' }));
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                            title="Xóa ảnh này"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Hidden native file input with camera support on mobile */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/*"
                          capture="environment"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="px-3.5 py-2 rounded-xl bg-[#2d5a37] hover:bg-[#1e3d25] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingImage ? 'Đang tải lên...' : 'Tải Ảnh Lên (File/Camera)'}</span>
                        </button>

                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => {
                              setFormData({ ...formData, image_url: e.target.value });
                              setUploadPreview(null);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs text-[#19231b] outline-hidden focus:border-[#2d5a37]"
                            placeholder="Hoặc dán URL ảnh https://..."
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-[#7a8e80]">
                        Chấp nhận JPEG, PNG, WebP (Tối đa 5MB). Khi đổi hoặc xóa ảnh, file cũ sẽ tự động được dọn dẹp.
                      </p>
                    </div>

                    {/* TỌA ĐỘ VÀ BẢN ĐỒ CHỌN ĐIỂM */}
                    <div className="space-y-3 pt-2 border-t border-[#e2eae4]">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#19231b]">Thiết Lập Tọa Độ Vị Trí & Bán Kính</label>
                        <div className="flex p-0.5 bg-[#f0f6f2] rounded-xl border border-[#e2eae4] text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setCoordInputMode('map')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              coordInputMode === 'map' ? 'bg-[#2d5a37] text-white font-bold' : 'text-[#5c7362]'
                            }`}
                          >
                            Chọn Trên Bản Đồ
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoordInputMode('manual')}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              coordInputMode === 'manual' ? 'bg-[#2d5a37] text-white font-bold' : 'text-[#5c7362]'
                            }`}
                          >
                            Nhập Thủ Công
                          </button>
                        </div>
                      </div>

                      {coordInputMode === 'map' ? (
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
                      ) : (
                        <div className="grid grid-cols-3 gap-3 p-3 bg-[#f7f9f6] rounded-2xl border border-[#e2eae4]">
                          <div>
                            <label className="block text-xs font-semibold text-[#19231b] mb-1">Vĩ Độ (Lat)</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={formData.latitude}
                              onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#19231b] mb-1">Kinh Độ (Lng)</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={formData.longitude}
                              onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#19231b] mb-1">Bán Kính (m)</label>
                            <input
                              type="number"
                              min="5"
                              max="50"
                              value={formData.geofence_radius}
                              onChange={(e) => setFormData({ ...formData, geofence_radius: parseInt(e.target.value) || 20 })}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs font-mono"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#e2eae4]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNew(false);
                          setEditingPoi(null);
                          setUploadPreview(null);
                        }}
                        className="px-4 py-2 rounded-full bg-white border border-[#e2eae4] text-xs font-semibold text-[#5c7362] hover:bg-[#f7f9f6]"
                      >
                        Hủy Bỏ
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-[#2d5a37] hover:bg-[#1e3d25] text-xs font-bold text-white shadow-xs"
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
        {/* TAB 3: CẤU HÌNH GIỌNG ĐỌC MẶC ĐỊNH & LIVE AUDIO TESTER    */}
        {/* ========================================================= */}
        {activeTab === 'audio' && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-6 border border-[#e2eae4] shadow-xs space-y-5">
              <div className="border-b border-[#f0f3f1] pb-3">
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                  Cấu Hình Giọng Đọc Mặc Định Toàn Hệ Thống
                </h3>
                <p className="text-xs text-[#5c7362]">
                  Cấu hình này sẽ được áp dụng làm mặc định cho mọi khách hành hương khi truy cập ứng dụng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {VOICE_ENGINES.map((voice) => (
                  <div
                    key={voice.id}
                    onClick={() => setDefaultVoiceEngine(voice.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      defaultVoiceEngine === voice.id
                        ? 'border-[#2d5a37] bg-[#eef5f0]/50 shadow-xs ring-1 ring-[#2d5a37]'
                        : 'border-[#e2eae4] bg-white hover:border-[#2d5a37]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#19231b]">{voice.name}</span>
                      {defaultVoiceEngine === voice.id && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2d5a37]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#5c7362] leading-relaxed">{voice.description}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestVoiceSample}
                  className="px-4 py-2 rounded-xl bg-[#eef5f0] text-[#2d5a37] text-xs font-bold flex items-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isAudioSpeaking ? 'Dừng Nghe' : 'Nghe Thử Mẫu Giọng'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveDefaultVoice}
                  disabled={isSavingVoice}
                  className="px-5 py-2 rounded-full bg-[#2d5a37] text-white text-xs font-bold hover:bg-[#1e3d25] shadow-xs transition-colors"
                >
                  {isSavingVoice ? 'Đang lưu...' : 'Lưu Cấu Hình Giọng'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* POPUP "XEM/SỬA BÀI VIẾT" ĐA NGÔN NGỮ (YÊU CẦU 2) */}
      {articlePopupPoi && (
        <POIArticlePopup
          poi={articlePopupPoi}
          authToken={authToken}
          onClose={() => setArticlePopupPoi(null)}
          onRefreshPOIs={onRefreshPOIs}
          onShowNotify={showNotify}
        />
      )}

      {/* MODAL MÃ QR XUẤT .PNG VÀ .JPG CHUẨN IN ẤN (YÊU CẦU 4 CŨ ĐÃ TÁCH KHỎI USER) */}
      {qrModalPoi && qrDataUrl && (
        <div className="fixed inset-0 z-[11500] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#e2eae4] shadow-2xl p-6 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f3f1] pb-2">
              <span className="font-serif font-bold text-sm text-[#19231b]">Mã QR Điểm Chiêm Bái</span>
              <button
                onClick={() => setQrModalPoi(null)}
                className="w-7 h-7 rounded-full bg-[#f7f9f6] hover:bg-[#e2eae4] flex items-center justify-center text-[#5c7362]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-base text-[#1e3d25]">
                {qrModalPoi.translations['vi']?.title || qrModalPoi.code}
              </h4>
              <span className="text-xs font-mono font-bold text-[#2d5a37]">{qrModalPoi.code}</span>
            </div>

            <div className="p-3 bg-white border border-[#e2eae4] rounded-2xl inline-block shadow-inner">
              <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 mx-auto rounded-lg" />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleDownloadQR('png')}
                className="py-2.5 rounded-xl bg-[#2d5a37] hover:bg-[#1e3d25] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải QR (.PNG)</span>
              </button>
              <button
                onClick={() => handleDownloadQR('jpg')}
                className="py-2.5 rounded-xl bg-white border border-[#e2eae4] hover:bg-[#f7f9f6] text-[#19231b] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải QR (.JPG)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
