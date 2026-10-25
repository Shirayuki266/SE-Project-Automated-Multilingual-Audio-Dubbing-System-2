/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RichPOI } from './server/types.js';
import { LanguageCode, speechEngine } from './utils/audioSpeech.js';
import { translations } from './translations/index.js';
import { useGPSTracker } from './hooks/useGPSTracker.js';
import { Header } from './components/Header.tsx';
import { WelcomeModal } from './components/WelcomeModal.tsx';
import { RealCampusMap } from './components/RealCampusMap.tsx';
import { AudioPlayerBar } from './components/AudioPlayerBar.tsx';
import { POIDetailDrawer } from './components/POIDetailDrawer.tsx';
import { QRScannerModal } from './components/QRScannerModal.tsx';
import { VoiceSelectorModal } from './components/VoiceSelectorModal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import {
  Compass,
  Map as MapIcon,
  Calendar,
  List,
  Volume2,
  Sparkles,
  BookOpen,
  QrCode,
  MapPin,
  ChevronRight,
  Shield,
  Layers,
  Search,
  Mic,
  ArrowRight,
  Navigation,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  Bookmark,
  MoreVertical,
  Sun,
  CloudSun,
  Check,
  Plane,
  Heart,
  Share2,
  Home,
  FileText,
  VolumeX,
  Eye,
  Info,
} from 'lucide-react';
import { calculateHaversineDistance } from './utils/geo.js';

export default function App() {
  const [pois, setPois] = useState<RichPOI[]>([]);
  const [currentLang, setCurrentLang] = useState<LanguageCode>('vi');
  const [activePOI, setActivePOI] = useState<RichPOI | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [showQRScanner, setShowQRScanner] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(false);

  // Visited POI tracking ("Chưa xem", "Đang xem", "Đã xem")
  const [visitedPoiIds, setVisitedPoiIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vnqt_visited_pois');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // POI Detail Bottom Drawer state
  const [selectedDetailPoi, setSelectedDetailPoi] = useState<RichPOI | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);

  // 3 Primary Mobile Tabs matching the reference image layout:
  // 'explore' (Screen 1: Home / Inspiring Destinations)
  // 'itinerary' (Screen 2: Timeline, AI Route Optimized)
  // 'map' (Screen 3: Boarding Pass, Progress, Detailed Interactive Map)
  const [mobileTab, setMobileTab] = useState<'explore' | 'itinerary' | 'map'>('explore');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoNarrationEnabled, setAutoNarrationEnabled] = useState<boolean>(false);
  const [todayStartsCount, setTodayStartsCount] = useState<number>(142);
  const [uniquePilgrimsCount, setUniquePilgrimsCount] = useState<number>(96);

  // Audio Playback State
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [audioElapsed, setAudioElapsed] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(45);

  // AI Translation on-demand state
  const [isAiTranslating, setIsAiTranslating] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string | null>(null);

  // Geofence alert toast
  const [geofenceToast, setGeofenceToast] = useState<{ poi: RichPOI; distance: number } | null>(null);
  const lastAutoSpokenPoiId = useRef<string | null>(null);

  // Checklist items for Screen 3
  const [checklist, setChecklist] = useState({
    attire: true,
    respect: true,
    mindfulness: false,
  });

  const t = translations[currentLang];

  // Check URL query parameters: admin portal is isolated from normal users
  // Only accessible if user enters '?admin=true' or '?admin=login' in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || params.get('admin') === 'login') {
      setShowAdminPortal(true);
    }
  }, []);

  // Fetch POIs from backend API
  const fetchPOIs = async () => {
    try {
      const res = await fetch('/api/pois');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPois(data.data);
        if (!activePOI && data.data.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const requestedCode = params.get('poi');
          if (requestedCode) {
            const found = data.data.find(
              (p: RichPOI) =>
                p.code.toLowerCase() === requestedCode.toLowerCase() ||
                p.poi_id.toLowerCase() === requestedCode.toLowerCase()
            );
            if (found) {
              setActivePOI(found);
              return;
            }
          }
          setActivePOI(data.data[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch POIs:', e);
    }
  };

  const fetchVisitorStats = async () => {
    try {
      const res = await fetch('/api/analytics/stats');
      const data = await res.json();
      if (data.success && data.data) {
        setTodayStartsCount(data.data.todayTotal || 0);
        setUniquePilgrimsCount(data.data.todayUniquePilgrims || 0);
      }
    } catch (e) {
      console.warn('Stats fetch notice:', e);
    }
  };

  const fetchDefaultVoice = async () => {
    try {
      const res = await fetch('/api/settings/default-voice');
      const data = await res.json();
      if (data.success && data.data) {
        speechEngine.syncDefaultFromAdmin(data.data);
      }
    } catch (e) {
      console.warn('Default voice fetch notice:', e);
    }
  };

  useEffect(() => {
    fetchPOIs();
    fetchVisitorStats();
    fetchDefaultVoice();
  }, []);

  // Audio Engine State Listener
  useEffect(() => {
    speechEngine.setOnStateChange((state) => {
      setIsAudioPlaying(state.isSpeaking);
      setIsAudioPaused(state.isPaused);
      setAudioElapsed(state.elapsedSeconds);
      setAudioDuration(state.duration);
    });

    return () => {
      speechEngine.stop();
    };
  }, []);

  // Play POI Narration - ONLY on active user gesture
  const handlePlayPOI = useCallback(
    async (poi: RichPOI, targetLang: LanguageCode = currentLang) => {
      setActivePOI(poi);

      let trans = poi.translations[targetLang];

      if (!trans) {
        // Missing translation & audio -> dynamically generate with AI on backend
        setIsAiTranslating(true);
        const viTitle = poi.translations['vi']?.title || poi.code;
        setAiStatusMsg(`✨ AI đang dịch và tạo giọng đọc [${targetLang.toUpperCase()}] cho "${viTitle}"...`);

        try {
          const res = await fetch(`/api/pois/${poi.poi_id}/ai-translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: targetLang }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            trans = json.data;
            poi.translations[targetLang] = json.data;
            setAiStatusMsg(`✅ Đã lưu bản dịch AI vào cơ sở dữ liệu!`);
            setTimeout(() => setAiStatusMsg(null), 3000);
          }
        } catch (err) {
          console.warn('AI Translation error:', err);
          trans = poi.translations['vi'];
        } finally {
          setIsAiTranslating(false);
        }
      }

      const finalTitle = trans?.title || poi.translations['vi']?.title || poi.code;
      const finalAudioText = trans?.description || poi.translations['vi']?.description || '';

      // Direct speech synthesis without bell chime, passing poi_id and audio_url
      speechEngine.playNarration(finalAudioText, targetLang, finalTitle, false, poi.poi_id, trans?.audio_url);

      // Record visit status
      setVisitedPoiIds((prev) => {
        if (!prev.includes(poi.poi_id)) {
          const next = [...prev, poi.poi_id];
          try {
            localStorage.setItem('vnqt_visited_pois', JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    },
    [currentLang]
  );

  // Helper to determine visit status: "Chưa xem" | "Đang xem" | "Đã xem"
  const getVisitStatus = (poiId: string): 'unvisited' | 'viewing' | 'visited' => {
    if ((isAudioPlaying || isAudioPaused) && activePOI?.poi_id === poiId) {
      return 'viewing';
    }
    if (isDetailDrawerOpen && selectedDetailPoi?.poi_id === poiId) {
      return 'viewing';
    }
    if (visitedPoiIds.includes(poiId)) {
      return 'visited';
    }
    return 'unvisited';
  };

  // Open POI Detail Drawer
  const handleOpenDetail = (poi: RichPOI) => {
    setSelectedDetailPoi(poi);
    setActivePOI(poi);
    setIsDetailDrawerOpen(true);
    setVisitedPoiIds((prev) => {
      if (!prev.includes(poi.poi_id)) {
        const next = [...prev, poi.poi_id];
        try {
          localStorage.setItem('vnqt_visited_pois', JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });
  };

  // Handle Geofence Entry Callback from GPS Tracker
  const handleGeofenceEnter = useCallback(
    (poi: RichPOI, distance: number) => {
      setGeofenceToast({ poi, distance });
      setTimeout(() => setGeofenceToast(null), 5000);

      // Only auto-trigger narration if user explicitly enabled it
      if (autoNarrationEnabled && lastAutoSpokenPoiId.current !== poi.poi_id) {
        lastAutoSpokenPoiId.current = poi.poi_id;
        handlePlayPOI(poi, currentLang);
      }
    },
    [autoNarrationEnabled, currentLang, handlePlayPOI]
  );

  // Real GPS Tracker without walking simulation
  const { userLocation } = useGPSTracker(pois, handleGeofenceEnter);

  const handleNextPOI = () => {
    if (!activePOI || pois.length === 0) return;
    const currentIndex = pois.findIndex((p) => p.poi_id === activePOI.poi_id);
    const nextPoi = pois[(currentIndex + 1) % pois.length];
    handlePlayPOI(nextPoi, currentLang);
  };

  const handlePrevPOI = () => {
    if (!activePOI || pois.length === 0) return;
    const currentIndex = pois.findIndex((p) => p.poi_id === activePOI.poi_id);
    const prevPoi = pois[(currentIndex - 1 + pois.length) % pois.length];
    handlePlayPOI(prevPoi, currentLang);
  };

  const handleQRScanSuccess = (poi: RichPOI) => {
    setShowQRScanner(false);
    setActivePOI(poi);
    handlePlayPOI(poi, currentLang);
  };

  // Language Change: DOES NOT auto-play audio unless audio is already currently speaking
  const handleLanguageChange = (lang: LanguageCode) => {
    setCurrentLang(lang);
    if (isAudioPlaying && activePOI) {
      handlePlayPOI(activePOI, lang);
    }
  };

  // Filtered POIs based on search query
  const filteredPOIs = pois.filter((poi) => {
    const title = poi.translations[currentLang]?.title || poi.translations['vi']?.title || poi.code;
    const desc = poi.translations[currentLang]?.description || poi.translations['vi']?.description || '';
    const matchQuery =
      searchQuery.trim() === '' ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poi.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  if (showAdminPortal) {
    return (
      <AdminPortal
        pois={pois}
        currentLang={currentLang}
        onClose={() => {
          setShowAdminPortal(false);
          try {
            const url = new URL(window.location.href);
            if (url.searchParams.has('admin')) {
              url.searchParams.delete('admin');
              window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
            }
          } catch {}
        }}
        onRefreshPOIs={fetchPOIs}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9f6] text-[#19231b] flex flex-col font-sans selection:bg-[#2d5a37] selection:text-white">
      {/* Top Navigation */}
      <Header
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        userLocation={userLocation}
        onOpenQRScanner={() => setShowQRScanner(true)}
        onOpenVoiceSelector={() => setShowVoiceModal(true)}
        onResetWelcome={() => setShowWelcome(true)}
        onOpenAdmin={() => setShowAdminPortal(true)}
        isAudioPlaying={isAudioPlaying}
        onStopAudio={() => speechEngine.stop()}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-3 pb-36 space-y-5">
        {/* Geofence Detection Toast Notification */}
        {geofenceToast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#2d5a37] text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2.5 border border-[#3e724a] animate-bounce text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>
              {t.poiTriggered}: {geofenceToast.poi.translations[currentLang]?.title || geofenceToast.poi.code} ({geofenceToast.distance}m)
            </span>
          </div>
        )}

        {/* AI Translation Active Banner */}
        {aiStatusMsg && (
          <div className="p-3.5 bg-[#eef5f0] border border-[#2d5a37] rounded-3xl flex items-center justify-between text-xs text-[#1e3d25] shadow-xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <Sparkles className={`w-4 h-4 text-[#2d5a37] ${isAiTranslating ? 'animate-spin' : ''}`} />
              <span className="font-medium">{aiStatusMsg}</span>
            </div>
            {isAiTranslating && (
              <span className="font-mono text-[10px] text-[#2d5a37] bg-white px-2 py-0.5 rounded-full border border-[#d6e7da]">
                Gemini AI
              </span>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: KHÁM PHÁ / EXPLORE (Matching Screen 1 in Image)     */}
        {/* ========================================================= */}
        {mobileTab === 'explore' && (
          <div className="space-y-6 animate-fade-in">
            {/* Hero Section with Typography & Landscape Artwork */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#eaf2ec] to-[#f4f8f5] border border-[#e2eae4] p-6 sm:p-8">
              <div className="relative z-10 max-w-md space-y-2">
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#19231b] leading-[1.15] tracking-tight">
                  {t.heroTitle}
                </h1>
                <p className="text-xs sm:text-sm text-[#5c7362] font-normal leading-relaxed pt-1">
                  {t.heroSubtitle}
                </p>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setShowVoiceModal(true)}
                    className="px-4 py-2 rounded-full bg-white border border-[#d6e7da] hover:bg-[#e4efe6] text-[#2d5a37] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{t.chooseVoice}</span>
                  </button>
                  <button
                    onClick={() => setMobileTab('map')}
                    className="px-4 py-2 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>{t.viewDetailedMap}</span>
                  </button>
                </div>
              </div>

              {/* Decorative pagoda landscape art backdrop */}
              <div className="absolute right-0 bottom-0 top-0 w-1/2 sm:w-2/5 pointer-events-none opacity-85 overflow-hidden flex items-end justify-end">
                <img
                  src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80"
                  alt="Pagoda artwork"
                  className="w-full h-full object-cover rounded-l-3xl mix-blend-multiply"
                />
              </div>
            </div>

            {/* Search Input Bar (Matching Screen 1 Design) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5c7362]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-11 pr-24 py-3 rounded-full bg-white border border-[#e2eae4] text-xs sm:text-sm text-[#19231b] placeholder-[#8ea494] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#2d5a37] focus:border-transparent transition-all"
              />
              <div className="absolute inset-y-1.5 right-1.5 flex items-center gap-1">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="h-8 px-3 rounded-full bg-[#eef5f0] hover:bg-[#2d5a37] hover:text-white text-[#2d5a37] text-xs font-bold flex items-center gap-1 transition-colors"
                  title={t.scanQR}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.scanQR}</span>
                </button>
              </div>
            </div>

            {/* Horizontal Filter Tabs (Matching Screen 1 Categories) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: t.catAll },
                { id: 'sanctuary', label: t.catSanctuary },
                { id: 'relic', label: t.catRelic },
                { id: 'heritage', label: t.catHeritage },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#2d5a37] text-white shadow-xs'
                      : 'bg-white text-[#4a5f50] border border-[#e2eae4] hover:bg-[#f0f5f1]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* "Điểm Chiêm Bái Nổi Bật" Header */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#19231b]">
                {t.featuredPOIs}
              </h2>
              <button
                onClick={() => setMobileTab('itinerary')}
                className="text-xs font-bold text-[#2d5a37] hover:underline flex items-center gap-0.5"
              >
                <span>{t.viewItinerary}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* POI Cards Carousel / Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPOIs.map((poi, idx) => {
                const title = poi.translations[currentLang]?.title || poi.translations['vi']?.title || poi.code;
                const desc = poi.translations[currentLang]?.description || poi.translations['vi']?.description || '';
                const mediaItem = poi.media[0];
                const distance = Math.round(
                  calculateHaversineDistance(userLocation.lat, userLocation.lng, poi.latitude, poi.longitude)
                );
                const isSelected = activePOI?.poi_id === poi.poi_id;
                const status = getVisitStatus(poi.poi_id);

                return (
                  <div
                    key={poi.poi_id}
                    onClick={() => handleOpenDetail(poi)}
                    className={`bg-white rounded-3xl border transition-all cursor-pointer overflow-hidden p-3.5 shadow-xs flex flex-col justify-between group ${
                      isSelected
                        ? 'border-[#2d5a37] ring-2 ring-[#2d5a37]/30'
                        : 'border-[#e2eae4] hover:border-[#2d5a37]'
                    }`}
                  >
                    <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                      <img
                        src={mediaItem?.image_url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80'}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[#2d5a37] shadow-xs">
                          {poi.code}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-xs">
                          {poi.geofence_radius}m
                        </span>
                      </div>

                      {/* Top Right Visit Status Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        {status === 'viewing' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-600/95 px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-xs animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            Đang xem
                          </span>
                        ) : status === 'visited' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-[#2d5a37]/90 px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                            Đã xem
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                            <Eye className="w-3 h-3" />
                            Chưa xem
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                        <span className="text-xs font-bold drop-shadow-xs">
                          {t.distanceTo}: {distance}{t.meters}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPOI(poi);
                          }}
                          className="w-9 h-9 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                          title={t.listenNarration}
                        >
                          <Volume2 className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-[#19231b] group-hover:text-[#2d5a37] transition-colors line-clamp-1">
                        {title}
                      </h3>
                      <p className="text-xs text-[#5c7362] line-clamp-2 mt-1 leading-relaxed">
                        {desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(poi);
                        }}
                        className="text-xs font-semibold text-[#5c7362] hover:text-[#2d5a37] flex items-center gap-1 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPOI(poi);
                        }}
                        className="text-xs font-bold text-[#2d5a37] hover:underline flex items-center gap-1"
                      >
                        <span>{t.listenNarration}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LỘ TRÌNH CHIÊM BÁI (Matching Screen 2 in Image)   */}
        {/* ========================================================= */}
        {mobileTab === 'itinerary' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header with Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#19231b] tracking-tight">
                  {t.itineraryTitle}
                </h2>
                <p className="text-xs text-[#5c7362]">
                  {t.itinerarySub}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowVoiceModal(true)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#e2eae4] text-xs font-semibold text-[#2d5a37] flex items-center gap-1 shadow-xs hover:bg-[#f0f5f1]"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{t.voiceSelector}</span>
                </button>
              </div>
            </div>

            {/* Temple Overview Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e2eae4] shadow-xs flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#19231b]">
                    Việt Nam Quốc Tự
                  </h3>
                  <span className="text-[10px] bg-[#eef5f0] text-[#2d5a37] font-bold px-2 py-0.5 rounded-full border border-[#d6e7da]">
                    {t.eightPOIs}
                  </span>
                </div>
                <p className="text-xs text-[#5c7362]">
                  244 Ba Tháng Hai, Phường 12, Quận 10 • GPS
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-[#7a8e80]">
                  <span>{uniquePilgrimsCount} {t.todayVisits}</span>
                </div>
              </div>

              <img
                src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=300&q=80"
                alt="Chùa"
                className="w-20 h-20 rounded-2xl object-cover border border-[#e0ebe2] flex-shrink-0"
              />
            </div>

            {/* Vertical Timeline / Stepper List */}
            <div className="space-y-3 pt-1">
              {pois.map((poi, index) => {
                const title = poi.translations[currentLang]?.title || poi.translations['vi']?.title || poi.code;
                const desc = poi.translations[currentLang]?.description || poi.translations['vi']?.description || '';
                const mediaItem = poi.media[0];
                const isSelected = activePOI?.poi_id === poi.poi_id;
                const status = getVisitStatus(poi.poi_id);

                return (
                  <div
                    key={poi.poi_id}
                    onClick={() => handleOpenDetail(poi)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#f0f6f2] border-[#2d5a37] shadow-sm ring-1 ring-[#2d5a37]'
                        : 'bg-white border-[#e2eae4] hover:border-[#2d5a37]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-[#2d5a37] text-white'
                              : 'bg-[#eef5f0] text-[#2d5a37] border border-[#d6e7da]'
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold uppercase text-[#2d5a37] bg-white px-2 py-0.2 rounded-full border border-[#d6e7da]">
                            {poi.code}
                          </span>

                          {/* Status Badge */}
                          {status === 'viewing' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full border border-emerald-300 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                              Đang xem
                            </span>
                          ) : status === 'visited' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#2d5a37] bg-[#eef5f0] px-2 py-0.2 rounded-full border border-[#cbe2cf]">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                              Đã xem
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-600 bg-slate-100 px-2 py-0.2 rounded-full border border-slate-200">
                              <Eye className="w-2.5 h-2.5" />
                              Chưa xem
                            </span>
                          )}

                          <span className="text-[10px] text-[#7a8e80]">
                            {t.geofenceRadius} {poi.geofence_radius}{t.meters}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-[#19231b] truncate">
                          {title}
                        </h4>
                        <p className="text-xs text-[#5c7362] line-clamp-1 leading-relaxed">
                          {desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <img
                          src={mediaItem?.image_url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=200&q=80'}
                          alt={title}
                          className="w-16 h-16 rounded-2xl object-cover border border-[#e0ebe2]"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayPOI(poi);
                          }}
                          className="w-8 h-8 rounded-full bg-[#eef5f0] hover:bg-[#2d5a37] hover:text-white text-[#2d5a37] flex items-center justify-center shadow-xs transition-colors"
                          title={t.listenNarration}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BẢN ĐỒ CHI TIẾT (Screen 3 in Reference Image)      */}
        {/* ========================================================= */}
        {mobileTab === 'map' && (
          <div className="space-y-5 animate-fade-in">
            {/* Header with Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileTab('explore')}
                  className="w-9 h-9 rounded-full bg-white border border-[#e2eae4] flex items-center justify-center text-[#19231b] hover:bg-[#eef5f0]"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#19231b] tracking-tight">
                    {t.detailedMapTitle}
                  </h2>
                  <p className="text-[11px] text-[#5c7362]">
                    Việt Nam Quốc Tự • 244 Ba Tháng Hai, Quận 10
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="w-9 h-9 rounded-full bg-white border border-[#e2eae4] flex items-center justify-center text-[#2d5a37] hover:bg-[#eef5f0]"
                  title={t.scanQR}
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowVoiceModal(true)}
                  className="w-9 h-9 rounded-full bg-white border border-[#e2eae4] flex items-center justify-center text-[#2d5a37] hover:bg-[#eef5f0]"
                  title={t.chooseVoice}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real Interactive Leaflet Satellite / Street Map */}
            <RealCampusMap
              pois={pois}
              currentLang={currentLang}
              userLocation={userLocation}
              activePoiId={activePOI?.poi_id || null}
              onSelectPOI={(poi, autoPlay) => {
                setActivePOI(poi);
                if (autoPlay) handlePlayPOI(poi);
                handleOpenDetail(poi);
              }}
            />

            {/* BOARDING PASS / THẺ CHIÊM BÁI ĐIỆN TỬ */}
            <div className="rounded-3xl overflow-hidden bg-white border border-[#e2eae4] shadow-xs">
              {/* Forest Green Top Banner */}
              <div className="bg-[#2d5a37] text-white px-5 py-3 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  {t.boardingPassTitle}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                  {t.gpsLiveStatus}
                </span>
              </div>

              {/* Trip Header */}
              <div className="p-5 border-b border-dashed border-[#e2eae4] flex items-center justify-between">
                <div>
                  <div className="font-serif font-bold text-2xl text-[#19231b]">{t.templeGate}</div>
                  <div className="text-[11px] text-[#7a8e80]">{t.startOrigin}</div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-[#2d5a37] font-semibold">{t.pilgrimage}</div>
                  <div className="flex items-center gap-1 my-1">
                    <span className="w-2 h-2 rounded-full bg-[#2d5a37]" />
                    <span className="w-12 sm:w-20 border-t-2 border-dotted border-[#2d5a37]" />
                    <Compass className="w-4 h-4 text-[#2d5a37]" />
                  </div>
                  <span className="text-[10px] text-[#7a8e80]">{t.durationEst}</span>
                </div>

                <div className="text-right">
                  <div className="font-serif font-bold text-2xl text-[#19231b]">{t.relicTower}</div>
                  <div className="text-[11px] text-[#7a8e80]">{t.thirteenFloors}</div>
                </div>
              </div>

              {/* Detail Metrics Row */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#7a8e80] block text-[10px] uppercase font-bold">{t.destinations}</span>
                  <span className="font-bold text-[#19231b] mt-0.5 block">{t.eightSacredSites}</span>
                </div>
                <div>
                  <span className="text-[#7a8e80] block text-[10px] uppercase font-bold">{t.narration}</span>
                  <span className="font-bold text-[#2d5a37] mt-0.5 block uppercase">
                    {currentLang} • Web Speech
                  </span>
                </div>
                <div>
                  <span className="text-[#7a8e80] block text-[10px] uppercase font-bold">{t.centerCoords}</span>
                  <span className="font-mono text-[11px] text-[#19231b] mt-0.5 block">
                    10.7713°N, 106.6714°E
                  </span>
                </div>
                <div>
                  <span className="text-[#7a8e80] block text-[10px] uppercase font-bold">{t.qrCodeSupport}</span>
                  <span className="font-bold text-[#19231b] mt-0.5 block">{t.fullSupport}</span>
                </div>
              </div>
            </div>

            {/* Direct Play CTA Button */}
            {activePOI && (
              <button
                onClick={() => handlePlayPOI(activePOI)}
                className="w-full py-3.5 px-6 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Volume2 className="w-4 h-4" />
                <span>
                  {t.listenNarration}: {activePOI.translations[currentLang]?.title || activePOI.code}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Footer with Clear Admin Portal Access */}
        <footer className="pt-6 pb-2 text-center border-t border-[#e2eae4]/80 space-y-2">
          <button
            onClick={() => setShowAdminPortal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-50 border border-[#d6e7da] hover:border-amber-400 text-stone-700 hover:text-amber-900 text-xs font-semibold shadow-xs transition-all active:scale-95"
            title="Mở cổng đăng nhập Quản trị viên (Admin Portal)"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Cổng Quản Trị Hệ Thống (Admin Portal)</span>
          </button>
          <p className="text-[10px] text-[#7a8e80]">
            Việt Nam Quốc Tự • 244 Ba Tháng Hai, Phường 12, Quận 10, TP.HCM
          </p>
        </footer>
      </main>

      {/* Floating Audio Player (Docks smoothly above mobile bottom nav) */}
      <AudioPlayerBar
        currentPOI={activePOI}
        currentLang={currentLang}
        isPlaying={isAudioPlaying}
        isPaused={isAudioPaused}
        elapsedSeconds={audioElapsed}
        duration={audioDuration}
        visitStatus={activePOI ? getVisitStatus(activePOI.poi_id) : 'viewing'}
        onPlay={(p) => handlePlayPOI(p, currentLang)}
        onPause={() => speechEngine.pause()}
        onResume={() => speechEngine.resume()}
        onStop={() => speechEngine.stop()}
        onRewind={(sec) => speechEngine.rewind(sec || 10)}
        onForward={(sec) => speechEngine.forward(sec || 10)}
        onSeek={(sec) => speechEngine.seekTo(sec)}
        onSetRate={(rate) => speechEngine.setRate(rate)}
        onNextPOI={handleNextPOI}
        onPrevPOI={handlePrevPOI}
        onOpenVoiceSelector={() => setShowVoiceModal(true)}
        onOpenDetailModal={() => {
          if (activePOI) handleOpenDetail(activePOI);
        }}
      />

      {/* POI Detailed Bottom Drawer with Swipe-Down Gesture */}
      <POIDetailDrawer
        poi={selectedDetailPoi || activePOI}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        visitStatus={
          selectedDetailPoi
            ? getVisitStatus(selectedDetailPoi.poi_id)
            : activePOI
            ? getVisitStatus(activePOI.poi_id)
            : 'unvisited'
        }
        isPlaying={isAudioPlaying && activePOI?.poi_id === (selectedDetailPoi?.poi_id || activePOI?.poi_id)}
        isPaused={isAudioPaused && activePOI?.poi_id === (selectedDetailPoi?.poi_id || activePOI?.poi_id)}
        elapsedSeconds={audioElapsed}
        duration={audioDuration}
        onPlay={() => {
          const target = selectedDetailPoi || activePOI;
          if (target) handlePlayPOI(target, currentLang);
        }}
        onPause={() => speechEngine.pause()}
        onResume={() => speechEngine.resume()}
        onStop={() => speechEngine.stop()}
        onRewind={(sec) => speechEngine.rewind(sec || 10)}
        onForward={(sec) => speechEngine.forward(sec || 10)}
        onSeek={(sec) => speechEngine.seekTo(sec)}
        onSetRate={(rate) => speechEngine.setRate(rate)}
        onOpenVoiceSelector={() => setShowVoiceModal(true)}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR (No admin link - users cannot navigate to admin) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#e2eae4] backdrop-blur-xl py-2 px-3 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {/* Tab 1: Khám phá */}
        <button
          onClick={() => setMobileTab('explore')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-colors ${
            mobileTab === 'explore' ? 'text-[#2d5a37] font-bold' : 'text-[#7a8e80] hover:text-[#19231b]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">{t.tabExplore}</span>
        </button>

        {/* Tab 2: Lộ trình */}
        <button
          onClick={() => setMobileTab('itinerary')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-colors ${
            mobileTab === 'itinerary' ? 'text-[#2d5a37] font-bold' : 'text-[#7a8e80] hover:text-[#19231b]'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">{t.tabItinerary}</span>
        </button>

        {/* Center Button: Quét QR */}
        <button
          onClick={() => setShowQRScanner(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl text-[#2d5a37] hover:scale-105 transition-transform"
          title={t.tabQR}
        >
          <div className="w-7 h-7 rounded-xl bg-[#eef5f0] flex items-center justify-center text-[#2d5a37] shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold">{t.tabQR}</span>
        </button>

        {/* Tab 3: Bản đồ chi tiết */}
        <button
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-colors ${
            mobileTab === 'map' ? 'text-[#2d5a37] font-bold' : 'text-[#7a8e80] hover:text-[#19231b]'
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <span className="text-[10px]">{t.tabMap}</span>
        </button>
      </nav>

      {/* Welcome Screen with single "Bắt Đầu Chiêm Bái" action */}
      {showWelcome && (
        <WelcomeModal
          currentLang={currentLang}
          onStartPilgrimage={() => {
            setShowWelcome(false);
            fetchVisitorStats();
          }}
          todayStartsCount={todayStartsCount}
          uniquePilgrimsCount={uniquePilgrimsCount}
        />
      )}

      {/* Voice Selector Modal */}
      {showVoiceModal && (
        <VoiceSelectorModal
          currentLang={currentLang}
          onClose={() => setShowVoiceModal(false)}
        />
      )}

      {/* QR Code Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal
          pois={pois}
          currentLang={currentLang}
          onClose={() => setShowQRScanner(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      )}
    </div>
  );
}
