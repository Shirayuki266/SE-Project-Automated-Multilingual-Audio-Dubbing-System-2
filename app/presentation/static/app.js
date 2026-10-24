const translations = {
  vi: {
    campusLabel: 'Chùa',
    campusName: 'Việt Nam Quốc Tự',
    welcomeTitle: 'Khởi đầu hành trình chiêm bái',
    welcomeText:
      'Khám phá thành tựu lịch sử, không gian tôn giáo và các điểm tham quan bằng thuyết minh tự động theo vị trí.',
    startButton: 'Bắt đầu chuyến chiêm bái',
    listenCta: 'Nghe thuyết minh',
    scanQr: 'Quét QR',
    gpsLabel: 'Cấp quyền GPS',
    refreshLabel: 'Tải dữ liệu',
    poiListTitle: 'Các điểm tham quan',
    detailLabel: 'Chi tiết',
    audioReady: 'Sẵn sàng phát',
    playAudio: 'Nghe thuyết minh',
    manualTrigger: 'Mở bài viết',
    backToMap: 'Về bản đồ',
    scanQrModal: 'Quét mã QR',
    scanHint: 'Hướng camera vào mã QR để mở nội dung điểm tham quan trong nhà.',
    openPoi: 'Mở điểm tham quan',
  },
  en: {
    campusLabel: 'Temple',
    campusName: 'Viet Nam Quoc Tu',
    welcomeTitle: 'Begin the pilgrimage',
    welcomeText:
      'Explore the heritage, sacred spaces, and highlights of the temple using location-based narration.',
    startButton: 'Begin the pilgrimage',
    listenCta: 'Listen to narration',
    scanQr: 'Scan QR',
    gpsLabel: 'Allow GPS',
    refreshLabel: 'Refresh data',
    poiListTitle: 'Points of interest',
    detailLabel: 'Detail',
    audioReady: 'Ready to play',
    playAudio: 'Listen to narration',
    manualTrigger: 'Open article',
    backToMap: 'Back to map',
    scanQrModal: 'Scan QR',
    scanHint: 'Point the camera at the QR code to open the indoor point of interest.',
    openPoi: 'Open point',
  },
};

const fallbackPois = [
  {
    id: 'tam-quan',
    title_vi: 'Cổng Tam Quan',
    title_en: 'Tam Quan Gate',
    description_vi: 'Lối vào chính của chùa, mang sắc thái nghi thức và hướng dẫn hành trình tham quan.',
    description_en: 'The main entrance of the temple, marking the ceremonial threshold of the pilgrimage.',
    status: 'new',
    x: 58,
    y: 22,
    audio: '/audio/tam-quan.mp3',
  },
  {
    id: 'bao-thap',
    title_vi: 'Bảo Tháp 13 Tầng',
    title_en: '13-level Stupa',
    description_vi: 'Một công trình nổi bật với hình dáng kiến trúc truyền thống và biểu tượng tâm linh.',
    description_en: 'A prominent structure with traditional architecture and spiritual symbolism.',
    status: 'visited',
    x: 70,
    y: 52,
    audio: '/audio/bao-thap.mp3',
  },
  {
    id: 'chinh-dien',
    title_vi: 'Đại Chánh Điện',
    title_en: 'Main Hall',
    description_vi: 'Nơi diễn ra các nghi lễ và biểu tượng trung tâm của không gian tôn giáo.',
    description_en: 'The ceremonial center of the sacred space and the focal point of worship.',
    status: 'playing',
    x: 40,
    y: 62,
    audio: '/audio/chinh-dien.mp3',
  },
];

const state = {
  language: 'vi',
  currentPoi: null,
  userPos: { x: 50, y: 52 },
  accuracy: 38,
  playing: false,
  sheetOpen: false,
  pois: [],
  apiReady: false,
};

function normalizeBackendPoi(poi) {
  const title = state.language === 'vi' ? poi.title_vi : (poi.title_en || poi.title_vi);
  const description = state.language === 'vi' ? poi.description_vi : (poi.description_en || poi.description_vi);
  const x = 20 + ((Number(poi.longitude ?? 0) + 180) / 360) * 60;
  const y = 80 - ((Number(poi.latitude ?? 0) + 90) / 180) * 60;

  return {
    id: poi.id,
    title_vi: poi.title_vi ?? title,
    title_en: poi.title_en ?? title,
    description_vi: poi.description_vi ?? description,
    description_en: poi.description_en ?? description,
    status: 'new',
    x: Number.isFinite(x) ? Math.min(90, Math.max(10, x)) : 50,
    y: Number.isFinite(y) ? Math.min(85, Math.max(10, y)) : 50,
    audio: poi.media?.find((item) => item.media_type === 'AUDIO_VI' || item.media_type === 'AUDIO_EN')?.file_url || '/audio/default.mp3',
  };
}

async function loadCampusData() {
  try {
    const [versionRes, poisRes] = await Promise.all([
      fetch('/api/v1/campuses/viet-nam-quoc-tu/version'),
      fetch('/api/v1/campuses/viet-nam-quoc-tu/pois'),
    ]);

    if (versionRes.ok && poisRes.ok) {
      const versionData = await versionRes.json();
      const poiData = await poisRes.json();
      const normalizedPois = Array.isArray(poiData?.pois) && poiData.pois.length > 0
        ? poiData.pois.map(normalizeBackendPoi)
        : fallbackPois;
      state.pois = normalizedPois;
      state.apiReady = true;
      els.modeStatus.textContent = `API ready · v${versionData.version || '1.0.0'}`;
      return;
    }
  } catch (error) {
    console.warn('Backend fetch failed, using local fallback data', error);
  }

  state.pois = fallbackPois;
  state.apiReady = false;
  els.modeStatus.textContent = 'Offline fallback';
}

const els = {
  welcomeScreen: document.getElementById('welcomeScreen'),
  tourScreen: document.getElementById('tourScreen'),
  startTour: document.getElementById('startTour'),
  langToggle: document.getElementById('langToggle'),
  requestGpsBtn: document.getElementById('requestGpsBtn'),
  refreshDataBtn: document.getElementById('refreshDataBtn'),
  gpsStatus: document.getElementById('gpsStatus'),
  modeStatus: document.getElementById('modeStatus'),
  poiList: document.getElementById('poiList'),
  poiCounter: document.getElementById('poiCounter'),
  poiMarkers: document.getElementById('poiMarkers'),
  userMarker: document.getElementById('userMarker'),
  accuracyRing: document.getElementById('accuracyRing'),
  poiSheet: document.getElementById('poiSheet'),
  sheetTitle: document.getElementById('sheetTitle'),
  sheetDescription: document.getElementById('sheetDescription'),
  playPauseBtn: document.getElementById('playPauseBtn'),
  rewindBtn: document.getElementById('rewindBtn'),
  forwardBtn: document.getElementById('forwardBtn'),
  audioStatus: document.getElementById('audioStatus'),
  audioProgress: document.getElementById('audioProgress'),
  playbackFill: document.getElementById('playbackFill'),
  qrBtn: document.getElementById('qrBtn'),
  scanModal: document.getElementById('scanModal'),
  activateQrPoi: document.getElementById('activateQrPoi'),
  closeScanModal: document.getElementById('closeScanModal'),
  closeSheet: document.getElementById('closeSheet'),
  showMapBtn: document.getElementById('showMapBtn'),
  listenBtn: document.getElementById('listenBtn'),
  manualTriggerBtn: document.getElementById('manualTriggerBtn'),
};

function applyLanguage(lang) {
  state.language = lang;
  const dict = translations[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (dict[key]) node.textContent = dict[key];
  });
  els.langToggle.textContent = lang === 'vi' ? '🇻🇳 / EN' : '🇻🇳 / EN';
  renderPoiList();
}

function setGpsStatus(text, ready = false) {
  els.gpsStatus.textContent = text;
  els.gpsStatus.style.color = ready ? '#207b5b' : '#c5791d';
  const dot = document.getElementById('gpsDot');
  if (dot) {
    dot.style.background = ready ? '#2aa36f' : '#d49a38';
    dot.style.boxShadow = ready
      ? '0 0 0 4px rgba(42,163,111,0.18)'
      : '0 0 0 4px rgba(212,154,56,0.18)';
  }
}

function renderPoiList() {
  const pois = state.pois.length ? state.pois : fallbackPois;
  els.poiList.innerHTML = '';
  pois.forEach((poi) => {
    const item = document.createElement('div');
    item.className = 'poi-item';
    const bullet = document.createElement('span');
    bullet.className = 'poi-bullet';
    if (poi.status === 'visited') bullet.classList.add('visited');
    if (poi.status === 'playing') bullet.classList.add('playing');

    const copy = document.createElement('div');
    copy.className = 'poi-copy';
    const title = document.createElement('h4');
    title.textContent = state.language === 'vi' ? poi.title_vi : poi.title_en;
    const sub = document.createElement('span');
    sub.textContent = poi.status === 'visited'
      ? (state.language === 'vi' ? 'Đã xem' : 'Visited')
      : poi.status === 'playing'
        ? (state.language === 'vi' ? 'Đang phát' : 'Playing')
        : (state.language === 'vi' ? 'Chưa xem' : 'Not viewed');
    copy.appendChild(title);
    copy.appendChild(sub);

    const action = document.createElement('button');
    action.className = 'poi-action';
    action.textContent = state.language === 'vi' ? 'Mở' : 'Open';
    action.addEventListener('click', () => openPoiSheet(poi));

    item.appendChild(bullet);
    item.appendChild(copy);
    item.appendChild(action);
    els.poiList.appendChild(item);
  });
  els.poiCounter.textContent = `${pois.length} điểm`;
}

function renderMarkers() {
  const pois = state.pois.length ? state.pois : fallbackPois;
  const markerContainer = els.poiMarkers;
  markerContainer.innerHTML = '';
  pois.forEach((poi) => {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'poi-marker';
    marker.dataset.status = poi.status;
    marker.style.left = `${poi.x}%`;
    marker.style.top = `${poi.y}%`;
    marker.setAttribute('aria-label', state.language === 'vi' ? poi.title_vi : poi.title_en);
    marker.addEventListener('click', () => openPoiSheet(poi));
    markerContainer.appendChild(marker);
  });

  els.userMarker.style.left = `${state.userPos.x}%`;
  els.userMarker.style.top = `${state.userPos.y}%`;
  els.accuracyRing.style.left = `${state.userPos.x}%`;
  els.accuracyRing.style.top = `${state.userPos.y}%`;
  els.accuracyRing.style.width = `${state.accuracy * 2}px`;
  els.accuracyRing.style.height = `${state.accuracy * 2}px`;
}

function openPoiSheet(poi) {
  state.currentPoi = poi;
  state.sheetOpen = true;
  els.sheetTitle.textContent = state.language === 'vi' ? poi.title_vi : poi.title_en;
  els.sheetDescription.textContent = state.language === 'vi' ? poi.description_vi : poi.description_en;
  els.audioStatus.textContent = state.language === 'vi' ? 'Sẵn sàng phát' : 'Ready to play';
  els.poiSheet.classList.remove('closed');
  els.poiSheet.classList.add('open');
}

function closePoiSheet() {
  state.sheetOpen = false;
  els.poiSheet.classList.remove('open');
  els.poiSheet.classList.add('closed');
}

function openScanModal() {
  els.scanModal.classList.remove('hidden');
}

function closeScanModal() {
  els.scanModal.classList.add('hidden');
}

function togglePlay() {
  if (!state.currentPoi) return;
  state.playing = !state.playing;
  els.playPauseBtn.textContent = state.playing ? (state.language === 'vi' ? 'Tạm dừng' : 'Pause') : (state.language === 'vi' ? 'Nghe thuyết minh' : 'Listen to narration');
  els.audioStatus.textContent = state.playing ? (state.language === 'vi' ? 'Đang phát' : 'Playing') : (state.language === 'vi' ? 'Sẵn sàng phát' : 'Ready to play');
  if (state.playing) {
    els.playbackFill.style.width = '52%';
    els.audioProgress.textContent = '00:32 / 01:02';
  } else {
    els.playbackFill.style.width = '0%';
    els.audioProgress.textContent = '00:00 / 01:02';
  }
}

async function handleTourStart() {
  els.welcomeScreen.classList.add('hidden');
  els.tourScreen.classList.remove('hidden');
  setGpsStatus('Đang chờ GPS', false);
  await loadCampusData();
  renderPoiList();
  renderMarkers();
}

function updateFromGps() {
  const offset = Math.random() * 10 - 5;
  state.userPos.x = Math.min(90, Math.max(10, 52 + offset));
  state.userPos.y = Math.min(82, Math.max(24, 48 + offset * 0.8));
  state.accuracy = 28 + Math.random() * 24;
  setGpsStatus('Vị trí ổn định', true);
  els.modeStatus.textContent = state.language === 'vi' ? 'Geofencing hoạt động' : 'Geofencing active';
  renderMarkers();
}

function simulateQrOpen() {
  openScanModal();
  const poi = (state.pois.length ? state.pois : fallbackPois).find((item) => item.id === 'chinh-dien') ?? (state.pois.length ? state.pois : fallbackPois)[0];
  openPoiSheet(poi);
  state.playing = true;
  els.playPauseBtn.textContent = state.language === 'vi' ? 'Tạm dừng' : 'Pause';
  els.audioStatus.textContent = state.language === 'vi' ? 'Đang phát' : 'Playing';
  els.playbackFill.style.width = '66%';
  closeScanModal();
}

async function refreshData() {
  await loadCampusData();
  renderPoiList();
  renderMarkers();
  setGpsStatus('Dữ liệu đã cập nhật', true);
}

els.startTour.addEventListener('click', handleTourStart);
els.langToggle.addEventListener('click', () => {
  applyLanguage(state.language === 'vi' ? 'en' : 'vi');
});
els.requestGpsBtn.addEventListener('click', updateFromGps);
els.refreshDataBtn.addEventListener('click', () => {
  refreshData();
});
els.qrBtn.addEventListener('click', openScanModal);
els.closeScanModal.addEventListener('click', closeScanModal);
els.activateQrPoi.addEventListener('click', simulateQrOpen);
els.closeSheet.addEventListener('click', closePoiSheet);
els.showMapBtn.addEventListener('click', closePoiSheet);
els.listenBtn.addEventListener('click', () => openPoiSheet((state.pois.length ? state.pois : fallbackPois)[0]));
els.playPauseBtn.addEventListener('click', togglePlay);
els.rewindBtn.addEventListener('click', () => {
  if (!state.playing) return;
  els.playbackFill.style.width = '25%';
  els.audioProgress.textContent = '00:15 / 01:02';
});
els.forwardBtn.addEventListener('click', () => {
  if (!state.playing) return;
  els.playbackFill.style.width = '80%';
  els.audioProgress.textContent = '00:50 / 01:02';
});
els.manualTriggerBtn.addEventListener('click', () => {
  els.audioStatus.textContent = state.language === 'vi' ? 'Bài viết đang mở' : 'Article opened';
});

applyLanguage('vi');
loadCampusData();
renderPoiList();
renderMarkers();
setGpsStatus('Đang chờ GPS', false);
