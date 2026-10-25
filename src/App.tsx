import React, { useState, useEffect, useCallback } from 'react';
import { POI, Campus, Language, UserProfile } from './types';
import { getPois, getCampus, getUserProfile, INITIAL_CAMPUS_FALLBACK, INITIAL_POIS_FALLBACK } from './services/api';
import { useGeofencing } from './hooks/useGeofencing';
import { useAudioPlayer } from './hooks/useAudioPlayer';

import { WelcomeGateway } from './components/WelcomeGateway';
import { Header } from './components/Header';
import { MapLibreView } from './components/MapLibreView';
import { AudioPlayerDrawer } from './components/AudioPlayerDrawer';
import { GPSSimulator } from './components/GPSSimulator';
import { QRScannerModal } from './components/QRScannerModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { AdminCMS } from './components/AdminCMS';
import { UserAccountModal } from './components/UserAccountModal';
import { ShareModal } from './components/ShareModal';

export function App() {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('vnqt_preferred_lang') as Language) || 'vi';
  });

  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [campus, setCampus] = useState<Campus>(INITIAL_CAMPUS_FALLBACK);
  const [pois, setPois] = useState<POI[]>(INITIAL_POIS_FALLBACK);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Restore User Session on mount
  useEffect(() => {
    const token = localStorage.getItem('vnqt_user_token');
    if (token) {
      getUserProfile(token)
        .then((profile) => setCurrentUser(profile))
        .catch(() => {
          localStorage.removeItem('vnqt_user_token');
        });
    }
  }, []);

  // Audio Hook
  const {
    currentPoi,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    unlockAudioContext,
    playPoi,
    togglePlay,
    seek,
    skipSeconds,
    changeRate,
    stop,
    setCurrentPoi,
  } = useAudioPlayer(language);

  // Geofence Trigger Callback (BR01-1, BR03-1)
  const handleEnterGeofence = useCallback(
    (poi: POI, distance: number) => {
      console.log(`[GEOFENCE TRIGGER] Entered ${poi.code} (${poi.translations[language]?.title}) at ${distance.toFixed(1)}m`);
      playPoi(poi, true);
    },
    [language, playPoi]
  );

  // Geofencing Hook
  const {
    userLocation,
    visitedPoiIds,
    isAtEntrance,
    setLocationToEntrance,
    markPoiVisited,
    clearVisitedPois,
    setSimulatedLocation,
  } = useGeofencing({
    pois,
    onEnterGeofence: handleEnterGeofence,
    enableSimulation: isSimulating,
  });

  // Track Online / Offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save Language Preference
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('vnqt_preferred_lang', lang);
  };

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [campusData, poisData] = await Promise.all([getCampus(), getPois()]);
      if (campusData) setCampus(campusData);
      if (poisData && poisData.length > 0) setPois(poisData);
    } catch (e) {
      console.warn('Using bundled initial offline data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle URL DeepLink (e.g. ?poi=vnqt_chanh_dien)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const poiParam = params.get('poi');
    if (poiParam && pois.length > 0) {
      const target = pois.find((p) => p.poi_id === poiParam || p.code === poiParam);
      if (target) {
        markPoiVisited(target.poi_id);
        setCurrentPoi(target);
      }
    }
  }, [pois, markPoiVisited, setCurrentPoi]);

  // Handle Start Pilgrimage from Gateway
  const handleStartPilgrimage = async () => {
    await unlockAudioContext();
    setHasStarted(true);

    // If deep link POI exists, start playing
    const params = new URLSearchParams(window.location.search);
    const poiParam = params.get('poi');
    if (poiParam) {
      const target = pois.find((p) => p.poi_id === poiParam || p.code === poiParam);
      if (target) {
        playPoi(target, true);
      }
    }
  };

  // QR Scan Success Handler (UC05)
  const handleQrScanSuccess = (poiId: string) => {
    setIsQrScannerOpen(false);
    const target = pois.find((p) => p.poi_id === poiId || p.code === poiId);
    if (target) {
      markPoiVisited(target.poi_id);
      playPoi(target, true);
    } else {
      alert(`Không tìm thấy điểm tham quan có mã: ${poiId}`);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#faf6f0]">
      {/* 1. Welcome Gateway (Autoplay Unlocker) */}
      {!hasStarted && (
        <WelcomeGateway
          language={language}
          onLanguageChange={handleLanguageChange}
          onStart={handleStartPilgrimage}
        />
      )}

      {/* 2. Top Navigation Bar */}
      <Header
        language={language}
        currentUser={currentUser}
        onLanguageChange={handleLanguageChange}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulator={() => setIsSimulating(!isSimulating)}
        isOnline={isOnline}
      />

      {/* 3. Interactive Map (MapLibre + PMTiles) */}
      <main className="h-full w-full">
        <MapLibreView
          pois={pois}
          userLocation={userLocation}
          visitedPoiIds={visitedPoiIds}
          activePoi={currentPoi}
          isPlaying={isPlaying}
          language={language}
          isAtEntrance={isAtEntrance}
          onResetToEntrance={setLocationToEntrance}
          onSelectPoi={(poi) => {
            markPoiVisited(poi.poi_id);
            playPoi(poi, true);
          }}
        />
      </main>

      {/* 4. GPS Walking Simulator (Desktop Testing & Evaluation) */}
      {isSimulating && (
        <GPSSimulator
          pois={pois}
          userLocation={userLocation}
          visitedPoiIds={visitedPoiIds}
          language={language}
          onSimulateLocation={setSimulatedLocation}
          onClearVisited={clearVisitedPois}
          onClose={() => setIsSimulating(false)}
        />
      )}

      {/* 5. Audio Player Drawer & Mini-Player */}
      <AudioPlayerDrawer
        poi={currentPoi}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        language={language}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onSkipSeconds={skipSeconds}
        onChangeRate={changeRate}
        onClose={() => stop()}
      />

      {/* 6. Indoor Fallback QR Scanner Modal (UC05) */}
      {isQrScannerOpen && (
        <QRScannerModal
          pois={pois}
          language={language}
          onScanSuccess={handleQrScanSuccess}
          onClose={() => setIsQrScannerOpen(false)}
        />
      )}

      {/* 7. Buddhist AI Chatbot Drawer (Gemini 2.5 Flash / ProxyPal) */}
      {isAiChatOpen && (
        <AIChatDrawer
          language={language}
          currentPoi={currentPoi}
          onClose={() => setIsAiChatOpen(false)}
        />
      )}

      {/* 8. User Account Modal (Hộ Chiếu Phật Tử) */}
      {isUserModalOpen && (
        <UserAccountModal
          currentUser={currentUser}
          pois={pois}
          visitedPoiIds={visitedPoiIds}
          language={language}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
          onLogout={() => {
            localStorage.removeItem('vnqt_user_token');
            setCurrentUser(null);
          }}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
          }}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}

      {/* 9. Share Local Modal */}
      {isShareModalOpen && (
        <ShareModal
          language={language}
          localIpUrl={
            window.location.origin.includes('localhost')
              ? 'http://10.141.38.205:5173'
              : window.location.origin
          }
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* 10. Admin CMS Modal */}
      {isAdminOpen && (
        <AdminCMS
          campus={campus}
          pois={pois}
          language={language}
          onRefreshPois={loadData}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
