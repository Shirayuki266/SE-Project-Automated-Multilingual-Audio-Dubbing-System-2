import React, { useState, useEffect, useRef } from 'react';
import { RichPOI, Campus } from '../server/types.js';
import { LanguageCode, speechEngine, VOICE_ENGINES, VoiceEngineId, DEFAULT_SPEED } from '../utils/audioSpeech.js';
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
  TrendingUp,
  Smartphone,
  Monitor,
  Calendar,
  PieChart,
  Award,
  Clock,
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

  // Auto-verify token validity with server on mount / token change
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then((r) => r.json())
        .then((res) => {
          if (!res.success) {
            console.warn('[AdminPortal] Token expired or invalid on server. Resetting session.');
            setAuthToken(null);
            setCurrentUser(null);
            localStorage.removeItem('vnqt_admin_token');
          } else if (res.user) {
            setCurrentUser(res.user);
          }
        })
        .catch(() => {});
    }
  }, [authToken]);

  // Active Tabs: 3 Main Tabs (Dashboard & Thống kê lưu lượng là 1, POIs, Audio Settings)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pois' | 'audio'>('dashboard');

  // Analytics & Stats State
  const [statsSummary, setStatsSummary] = useState<any>(null);
  const [visitorGranularity, setVisitorGranularity] = useState<'day' | 'month'>('day');
  const [statsDateFrom, setStatsDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  });
  const [statsDateTo, setStatsDateTo] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  });
  const [visitorStatsData, setVisitorStatsData] = useState<any>(null);
  const [deviceStatsData, setDeviceStatsData] = useState<any>(null);
  const [topPOIsData, setTopPOIsData] = useState<any>(null);
  const [topPoiLangFilter, setTopPoiLangFilter] = useState<string>('all');
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Popup "Xem/Sửa bài viết" State
  const [articlePopupPoi, setArticlePopupPoi] = useState<RichPOI | null>(null);

  // Default Voice Configuration State
  const [defaultVoiceEngine, setDefaultVoiceEngine] = useState<VoiceEngineId>('chi-google');
  const [defaultVoiceRate, setDefaultVoiceRate] = useState<number>(DEFAULT_SPEED);
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
    priority: 0,
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

  // Fetch Analytics & Stats Data
  const fetchStatsData = async () => {
    if (!authToken) return;
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [sumRes, visRes, devRes, topRes] = await Promise.all([
        fetch('/api/admin/stats/summary', { headers }),
        fetch(
          `/api/admin/stats/visitors?granularity=${visitorGranularity}&from=${statsDateFrom}&to=${statsDateTo}`,
          { headers }
        ),
        fetch(`/api/admin/stats/devices?from=${statsDateFrom}&to=${statsDateTo}`, { headers }),
        fetch(
          `/api/admin/stats/poi-top?from=${statsDateFrom}&to=${statsDateTo}&lang=${topPoiLangFilter}&limit=10`,
          { headers }
        ),
      ]);

      const [sumData, visData, devData, topData] = await Promise.all([
        sumRes.json(),
        visRes.json(),
        devRes.json(),
        topRes.json(),
      ]);

      if (sumData.success) setStatsSummary(sumData.data);
      if (visData.success) setVisitorStatsData(visData.data);
      if (devData.success) setDeviceStatsData(devData.data);
      if (topData.success) setTopPOIsData(topData.data);
    } catch (err: any) {
      setStatsError(err.message || 'Không thể tải dữ liệu thống kê');
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (authToken && activeTab === 'dashboard') {
      fetchDashboardMetrics();
      fetchStatsData();
    }
  }, [authToken, activeTab, visitorGranularity, statsDateFrom, statsDateTo, topPoiLangFilter]);

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
      priority: 0,
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
      priority: poi.priority ?? 0,
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
          <span>1. Dashboard </span>
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
        {/* TAB 1: DASHBOARD & THỐNG KÊ LƯU LƯỢNG (HỢP NHẤT TOÀN DIỆN) */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            {/* 1. THANH TIÊU ĐỀ & BỘ ĐIỀU KHIỂN THỜI GIAN */}
            <div className="bg-white rounded-3xl p-5 border border-[#e2eae4] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-[#2d5a37] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#2d5a37]" />
                  <span>Trung Tâm Điều Hành & Thống Kê Lưu Lượng</span>
                </span>
                <h2 className="font-serif font-bold text-xl text-[#19231b] mt-0.5">
                  Tổng Quan Hoạt Động & Lưu Lượng Du Khách
                </h2>
                <p className="text-xs text-[#5c7362] mt-0.5">
                  Dữ liệu tổng hợp ẩn danh bảo vệ quyền riêng tư du khách (không lưu IP thô hay chuỗi UA)
                </p>
              </div>

              {/* Bộ điều khiển chọn ngày & đơn vị */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* Chuyển đổi Ngày / Tháng */}
                <div className="flex items-center bg-[#f7f9f6] p-1 rounded-2xl border border-[#e2eae4] text-xs font-semibold">
                  <button
                    onClick={() => setVisitorGranularity('day')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      visitorGranularity === 'day'
                        ? 'bg-[#2d5a37] text-white shadow-xs'
                        : 'text-[#5c7362] hover:text-[#19231b]'
                    }`}
                  >
                    Theo Ngày
                  </button>
                  <button
                    onClick={() => setVisitorGranularity('month')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      visitorGranularity === 'month'
                        ? 'bg-[#2d5a37] text-white shadow-xs'
                        : 'text-[#5c7362] hover:text-[#19231b]'
                    }`}
                  >
                    Theo Tháng
                  </button>
                </div>

                {/* Nút lọc nhanh */}
                <div className="hidden sm:flex items-center gap-1 bg-[#f7f9f6] p-1 rounded-2xl border border-[#e2eae4] text-xs">
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 6);
                      setStatsDateFrom(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
                      setStatsDateTo(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
                      setVisitorGranularity('day');
                    }}
                    className="px-2.5 py-1 rounded-xl text-[#5c7362] hover:bg-white hover:text-[#19231b] transition-colors"
                  >
                    7 ngày
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 29);
                      setStatsDateFrom(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
                      setStatsDateTo(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
                      setVisitorGranularity('day');
                    }}
                    className="px-2.5 py-1 rounded-xl text-[#5c7362] hover:bg-white hover:text-[#19231b] transition-colors"
                  >
                    30 ngày
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - 5);
                      d.setDate(1);
                      setStatsDateFrom(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
                      setStatsDateTo(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }));
                      setVisitorGranularity('month');
                    }}
                    className="px-2.5 py-1 rounded-xl text-[#5c7362] hover:bg-white hover:text-[#19231b] transition-colors"
                  >
                    6 tháng
                  </button>
                </div>

                {/* Chọn ngày tùy chỉnh */}
                <div className="flex items-center gap-1 text-xs">
                  <input
                    type="date"
                    value={statsDateFrom}
                    onChange={(e) => setStatsDateFrom(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] outline-hidden focus:border-[#2d5a37]"
                    title="Từ ngày"
                  />
                  <span className="text-[#5c7362]">-</span>
                  <input
                    type="date"
                    value={statsDateTo}
                    onChange={(e) => setStatsDateTo(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs text-[#19231b] outline-hidden focus:border-[#2d5a37]"
                    title="Đến ngày"
                  />
                </div>

                {/* Nút Refresh */}
                <button
                  onClick={() => {
                    fetchDashboardMetrics();
                    fetchStatsData();
                  }}
                  disabled={isLoadingStats || isLoadingHealth}
                  className="p-2 rounded-xl bg-[#f7f9f6] hover:bg-[#eef5f0] border border-[#e2eae4] text-[#5c7362] hover:text-[#2d5a37] transition-colors"
                  title="Tải lại số liệu thống kê"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingStats || isLoadingHealth ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Thông báo lỗi nếu có */}
            {statsError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{statsError}</span>
              </div>
            )}

            {/* 2. KHỐI 3 THẺ TỔNG QUAN CHỈ SỐ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Thẻ 1: Hôm nay */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#2d5a37] to-[#1e3d25] text-white shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-300" />
                    <span>Hôm Nay (Thực)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
                    1 máy = 1 lượt
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold">
                  {todayVisitors} <span className="text-xs font-normal font-sans text-emerald-100">khách hành hương</span>
                </div>
                <p className="text-[11px] text-emerald-200/90 leading-tight">
                  Chống spam: HMAC-SHA256 lưu tạm 24h trên MongoDB và tự hủy bằng TTL Index.
                </p>
              </div>

              {/* Thẻ 2: 7 Ngày Gần Nhất */}
              <div className="p-5 rounded-3xl bg-white border border-[#e2eae4] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#5c7362] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#2d5a37]" />
                    <span>7 Ngày Gần Nhất</span>
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#19231b]">
                  {statsSummary?.sevenDaysDevices ?? 1}{' '}
                  <span className="text-xs font-normal font-sans text-[#5c7362]">thiết bị</span>
                </div>
                <p className="text-[11px] text-[#5c7362] leading-tight">
                  Tổng lượt thiết bị duy nhất viếng thăm trong 7 ngày qua.
                </p>
              </div>

              {/* Thẻ 3: Tháng Này */}
              <div className="p-5 rounded-3xl bg-white border border-[#e2eae4] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#5c7362] flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#2d5a37]" />
                    <span>Tháng Này</span>
                  </span>
                  <span className="text-[10px] bg-[#eef5f0] text-[#2d5a37] px-2 py-0.5 rounded-full font-semibold">
                    Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#19231b]">
                  {statsSummary?.thisMonthDevices ?? 1}{' '}
                  <span className="text-xs font-normal font-sans text-[#5c7362]">thiết bị</span>
                </div>
                <p className="text-[11px] text-[#5c7362] leading-tight">
                  Lưu lượng tích lũy của khách hành hương trong tháng hiện hành.
                </p>
              </div>
            </div>

            {/* 3. BIỂU ĐỒ LƯU LƯỢNG DU KHÁCH THỰC TẾ (THEO NGÀY / THEO THÁNG) */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2eae4] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f0f3f1] gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#2d5a37]" />
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                    Biểu Đồ Lưu Lượng Du Khách Thực Tế ({visitorGranularity === 'day' ? 'Theo Ngày' : 'Theo Tháng'})
                  </h3>
                </div>
                <div className="text-xs text-[#5c7362]">
                  Tổng khoảng thời gian:{' '}
                  <span className="font-bold text-[#2d5a37]">
                    {visitorStatsData?.totalUniqueDevices || 0} thiết bị
                  </span>
                </div>
              </div>

              {/* Khu vực vẽ biểu đồ SVG */}
              {isLoadingStats ? (
                <div className="py-20 flex flex-col items-center justify-center text-[#5c7362] gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#2d5a37]" />
                  <span className="text-xs font-semibold">Đang tổng hợp dữ liệu lưu lượng...</span>
                </div>
              ) : !visitorStatsData || !visitorStatsData.items || visitorStatsData.items.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#5c7362]">
                  Không có dữ liệu trong khoảng thời gian đã chọn.
                </div>
              ) : (
                (() => {
                  const items = visitorStatsData.items;
                  const maxVal = Math.max(...items.map((i: any) => i.uniqueDevices || 0), 4);
                  const chartWidth = 800;
                  const chartHeight = 220;
                  const padBottom = 35;
                  const padTop = 20;
                  const padLeft = 45;
                  const padRight = 20;
                  const drawWidth = chartWidth - padLeft - padRight;
                  const drawHeight = chartHeight - padTop - padBottom;
                  const slotWidth = drawWidth / items.length;
                  const barWidth = Math.max(10, Math.min(36, slotWidth * 0.65));

                  return (
                    <div className="relative">
                      <div className="w-full overflow-x-auto no-scrollbar">
                        <svg
                          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                          className="w-full min-w-[600px] h-56 select-none"
                        >
                          {/* Đường lưới ngang & nhãn trục Y */}
                          {[0, 0.33, 0.66, 1].map((pct, idx) => {
                            const y = padTop + drawHeight * (1 - pct);
                            const val = Math.round(maxVal * pct);
                            return (
                              <g key={idx}>
                                <line
                                  x1={padLeft}
                                  y1={y}
                                  x2={chartWidth - padRight}
                                  y2={y}
                                  stroke="#e8efe9"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x={padLeft - 8}
                                  y={y + 3}
                                  textAnchor="end"
                                  className="text-[10px] fill-[#7a8e80] font-mono"
                                >
                                  {val}
                                </text>
                              </g>
                            );
                          })}

                          {/* Cột dữ liệu */}
                          {items.map((item: any, idx: number) => {
                            const val = item.uniqueDevices || 0;
                            const barH = (val / maxVal) * drawHeight;
                            const x = padLeft + idx * slotWidth + (slotWidth - barWidth) / 2;
                            const y = padTop + drawHeight - barH;
                            const isHovered = hoveredBarIndex === idx;

                            let label = item.period;
                            if (visitorGranularity === 'day') {
                              const parts = item.period.split('-');
                              label = `${parts[2]}/${parts[1]}`;
                            }

                            return (
                              <g
                                key={idx}
                                onMouseEnter={() => setHoveredBarIndex(idx)}
                                onMouseLeave={() => setHoveredBarIndex(null)}
                                className="cursor-pointer group"
                              >
                                <rect
                                  x={x}
                                  y={val > 0 ? y : padTop + drawHeight - 2}
                                  width={barWidth}
                                  height={val > 0 ? barH : 2}
                                  rx="4"
                                  className={`transition-all duration-200 ${
                                    isHovered
                                      ? 'fill-[#1e3d25] opacity-100'
                                      : val > 0
                                      ? 'fill-[#2d5a37] opacity-90 group-hover:opacity-100'
                                      : 'fill-[#e2eae4]'
                                  }`}
                                />

                                {val > 0 && (
                                  <text
                                    x={x + barWidth / 2}
                                    y={y - 5}
                                    textAnchor="middle"
                                    className="text-[10px] font-mono font-bold fill-[#2d5a37]"
                                  >
                                    {val}
                                  </text>
                                )}

                                {(items.length <= 15 || idx % Math.ceil(items.length / 12) === 0) && (
                                  <text
                                    x={x + barWidth / 2}
                                    y={chartHeight - 10}
                                    textAnchor="middle"
                                    className="text-[9px] fill-[#5c7362] font-mono"
                                  >
                                    {label}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {hoveredBarIndex !== null && items[hoveredBarIndex] && (
                        <div className="absolute top-2 right-4 bg-[#1e3d25] text-white p-3 rounded-2xl shadow-xl text-xs z-10 space-y-1 pointer-events-none animate-fade-in border border-[#2d5a37]">
                          <div className="font-bold text-emerald-200 flex items-center justify-between gap-4">
                            <span>
                              {visitorGranularity === 'day' ? 'Ngày: ' : 'Tháng: '}
                              {items[hoveredBarIndex].period}
                            </span>
                            <span className="font-mono text-white text-sm">
                              {items[hoveredBarIndex].uniqueDevices} thiết bị
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-100/80 pt-1 border-t border-emerald-800/60 grid grid-cols-2 gap-x-3 gap-y-0.5">
                            <span>iPhone (iOS): {items[hoveredBarIndex].iphone}</span>
                            <span>Android: {items[hoveredBarIndex].android}</span>
                            <span>Máy tính: {items[hoveredBarIndex].pc}</span>
                            <span>Khác: {items[hoveredBarIndex].other}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>

            {/* 4. HÀNG 2 CỘT: PHÂN LOẠI THIẾT BỊ VÀ BẢNG XẾP HẠNG TOP POIS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PHÂN LOẠI THIẾT BỊ (DONUT CHART & PERCENTAGES) */}
              <div className="bg-white rounded-3xl p-6 border border-[#e2eae4] shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#f0f3f1]">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-[#2d5a37]" />
                      <h3 className="font-serif font-bold text-base text-[#19231b]">Phân Loại Thiết Bị</h3>
                    </div>
                    <span className="text-xs font-mono text-[#5c7362]">
                      Tổng: {deviceStatsData?.total || 0}
                    </span>
                  </div>

                  <div className="py-4 flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                        <circle
                          cx="100"
                          cy="100"
                          r="65"
                          fill="none"
                          stroke="#f0f3f1"
                          strokeWidth="24"
                        />
                        {(() => {
                          const dev = deviceStatsData?.breakdown || { iphone: 0, android: 0, pc: 0, other: 0 };
                          const total = deviceStatsData?.total || 0;
                          if (total === 0) return null;

                          const circumference = 2 * Math.PI * 65;
                          const slices = [
                            { key: 'iphone', val: dev.iphone, color: '#10b981' },
                            { key: 'android', val: dev.android, color: '#06b6d4' },
                            { key: 'pc', val: dev.pc, color: '#8b5cf6' },
                            { key: 'other', val: dev.other, color: '#94a3b8' },
                          ];

                          let accumulated = 0;
                          return slices.map((s, idx) => {
                            if (s.val <= 0) return null;
                            const sliceLength = (s.val / total) * circumference;
                            const offset = (accumulated / total) * circumference;
                            accumulated += s.val;

                            return (
                              <circle
                                key={idx}
                                cx="100"
                                cy="100"
                                r="65"
                                fill="none"
                                stroke={s.color}
                                strokeWidth="24"
                                strokeDasharray={`${sliceLength} ${circumference}`}
                                strokeDashoffset={-offset}
                                className="transition-all duration-500"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-xl font-serif font-bold text-[#19231b]">
                          {deviceStatsData?.total || 0}
                        </span>
                        <span className="text-[10px] text-[#5c7362] uppercase tracking-wider font-semibold">
                          Thiết bị
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                        <span className="font-semibold text-[#19231b]">iPhone (iOS)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#19231b]">
                          {deviceStatsData?.breakdown?.iphone || 0}
                        </span>
                        <span className="text-[#5c7362] ml-1.5 text-[11px]">
                          ({deviceStatsData?.percentages?.iphone || 0}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#06b6d4]" />
                        <span className="font-semibold text-[#19231b]">Android</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#19231b]">
                          {deviceStatsData?.breakdown?.android || 0}
                        </span>
                        <span className="text-[#5c7362] ml-1.5 text-[11px]">
                          ({deviceStatsData?.percentages?.android || 0}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                        <span className="font-semibold text-[#19231b]">PC (Win/Mac/Linux)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#19231b]">
                          {deviceStatsData?.breakdown?.pc || 0}
                        </span>
                        <span className="text-[#5c7362] ml-1.5 text-[11px]">
                          ({deviceStatsData?.percentages?.pc || 0}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#f7f9f6] border border-[#e2eae4]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#94a3b8]" />
                        <span className="font-semibold text-[#19231b]">Khác</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#19231b]">
                          {deviceStatsData?.breakdown?.other || 0}
                        </span>
                        <span className="text-[#5c7362] ml-1.5 text-[11px]">
                          ({deviceStatsData?.percentages?.other || 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#f0f3f1] text-[10px] text-[#7a8e80] leading-relaxed">
                  🛡️ Phân loại ẩn danh từ nhãn User-Agent & Client Hints (iPadOS nhận diện qua touch points); không lưu trữ User-Agent thô hay IP.
                </div>
              </div>

              {/* BẢNG XẾP HẠNG TOP POIS ĐƯỢC NGHE NHIỀU NHẤT */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#e2eae4] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f0f3f1] gap-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                        Xếp Hạng Điểm Chiêm Bái Được Nghe Nhiều Nhất
                      </h3>
                      <p className="text-xs text-[#5c7362]">
                        Lượt nghe thực tế đã phát $\ge$ 5 giây từ du khách
                      </p>
                    </div>
                  </div>

                  {/* Lọc theo ngôn ngữ */}
                  <div className="flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-[#5c7362]" />
                    <select
                      value={topPoiLangFilter}
                      onChange={(e) => setTopPoiLangFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-[#f7f9f6] border border-[#e2eae4] text-xs font-semibold text-[#19231b] outline-hidden focus:border-[#2d5a37]"
                    >
                      <option value="all">Tất cả ngôn ngữ</option>
                      <option value="vi">Tiếng Việt (vi)</option>
                      <option value="en">English (en)</option>
                      <option value="zh">Tiếng Trung (zh)</option>
                      <option value="ja">Tiếng Nhật (ja)</option>
                      <option value="ko">Tiếng Hàn (ko)</option>
                      <option value="fr">Tiếng Pháp (fr)</option>
                      <option value="th">Tiếng Thái (th)</option>
                      <option value="km">Tiếng Khmer (km)</option>
                      <option value="my">Tiếng Myanmar (my)</option>
                      <option value="lo">Tiếng Lào (lo)</option>
                      <option value="hi">Tiếng Hindi (hi)</option>
                      <option value="de">Tiếng Đức (de)</option>
                    </select>
                  </div>
                </div>

                {isLoadingStats ? (
                  <div className="py-12 flex justify-center items-center text-xs text-[#5c7362]">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#2d5a37] mr-2" />
                    <span>Đang tải bảng xếp hạng...</span>
                  </div>
                ) : !topPOIsData || !topPOIsData.items || topPOIsData.items.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#5c7362]">
                    Chưa có lượt nghe nào được ghi nhận cho bộ lọc này.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#f0f3f1] text-[#7a8e80] font-semibold">
                          <th className="py-2.5 px-3 w-12 text-center">Hạng</th>
                          <th className="py-2.5 px-3">Điểm Chiêm Bái</th>
                          <th className="py-2.5 px-3 text-right">Lượt Nghe</th>
                          <th className="py-2.5 px-3 text-right">Thiết Bị</th>
                          <th className="py-2.5 px-3 text-right">Thời Lượng TB</th>
                          <th className="py-2.5 px-3 w-28 text-center">Tỷ Lệ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f7f9f6]">
                        {(() => {
                          const maxTopListens = Math.max(
                            ...topPOIsData.items.map((i: any) => i.listens || 0),
                            1
                          );

                          return topPOIsData.items.map((item: any, idx: number) => {
                            const pct = Math.round((item.listens / maxTopListens) * 100);
                            const rankBadgeColor =
                              idx === 0
                                ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-800 border-slate-300 font-bold'
                                : idx === 2
                                ? 'bg-orange-100 text-orange-800 border-orange-300 font-bold'
                                : 'bg-[#f7f9f6] text-[#5c7362] border-[#e2eae4]';

                            const dur = item.avgDurationSeconds || 0;
                            const durStr = dur >= 60 ? `${Math.floor(dur / 60)}m ${dur % 60}s` : `${dur}s`;

                            return (
                              <tr key={item.poiId} className="hover:bg-[#f7f9f6]/70 transition-colors">
                                <td className="py-3 px-3 text-center">
                                  <span
                                    className={`inline-block w-6 h-6 leading-6 text-[11px] rounded-full border ${rankBadgeColor}`}
                                  >
                                    #{idx + 1}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-[#19231b]">{item.title}</div>
                                  <div className="font-mono text-[10px] text-[#7a8e80]">{item.poiId}</div>
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-bold text-[#2d5a37]">
                                  {item.listens}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-[#19231b]">
                                  {item.uniqueDevices}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-[#5c7362]">
                                  {durStr}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="w-full bg-[#f0f3f1] rounded-full h-2 overflow-hidden">
                                    <div
                                      className="bg-[#2d5a37] h-full rounded-full transition-all duration-300"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-mono text-[#7a8e80]">{pct}%</span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* 5. KHỐI TRẠNG THÁI HẠ TẦNG (MONGODB, GEMINI AI, TTS SERVICE) */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2eae4] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f0f3f1] pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-[#2d5a37]" />
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                    Trạng Thái Hạ Tầng & Dịch Vụ Hệ Thống
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

            {/* 6. KHỐI DANH SÁCH ĐIỂM CHIÊM BÁI TÓM TẮT ({pois.length} POIs) */}
            <div className="bg-white rounded-3xl p-6 border border-[#e2eae4] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#f0f3f1] pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#2d5a37]" />
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                    Danh Sách Điểm Chiêm Bái ({pois.length} POIs)
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
                        <div className="grid grid-cols-2 gap-3 p-3 bg-[#f7f9f6] rounded-2xl border border-[#e2eae4]">
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
                        </div>
                      )}

                      {/* Bán Kính Geofence & Độ Ưu Tiên Phát Tự Động */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#f7f9f6] rounded-2xl border border-[#e2eae4]">
                        <div>
                          <label className="block text-xs font-semibold text-[#19231b] mb-1">Bán Kính Geofence (mét)</label>
                          <input
                            type="number"
                            min="5"
                            max="50"
                            value={formData.geofence_radius}
                            onChange={(e) => setFormData({ ...formData, geofence_radius: parseInt(e.target.value) || 20 })}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs font-mono font-bold text-[#19231b]"
                            required
                          />
                          <p className="text-[10px] text-[#7a8e80] mt-1">
                            Vùng kích hoạt thuyết minh tự động khi du khách đến gần.
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#19231b] mb-1 flex items-center justify-between">
                            <span>Độ Ưu Tiên (Priority)</span>
                            <span className="text-[10px] font-mono text-[#2d5a37] font-bold">Mặc định: 0</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.priority ?? 0}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-[#e2eae4] text-xs font-mono font-bold text-[#2d5a37]"
                          />
                          <p className="text-[10px] text-[#7a8e80] mt-1">
                            Ưu tiên phát khi nằm trong vùng giao nhau của 2 geofence (số càng lớn càng ưu tiên).
                          </p>
                        </div>
                      </div>
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
