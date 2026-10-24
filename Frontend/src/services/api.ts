import { Campus, POI, Language } from '../types';

const API_BASE = '/api/v1';

// Initial bundled fallback snapshot in case network is 100% offline on first load
export const INITIAL_POIS_FALLBACK: POI[] = [
  {
    poi_id: "vnqt_tam_quan",
    code: "POI_01",
    campus_id: "viet-nam-quoc-tu",
    latitude: 10.77125,
    longitude: 106.67115,
    geofence_radius: 18.0,
    location_type: "outdoor",
    order_index: 1,
    is_active: true,
    qr_code_url: "/static/qr/qr_vnqt_tam_quan.png",
    translations: {
      vi: {
        language_code: "vi",
        title: "Cổng Tam Quan – Lối Vào Thanh Tịnh",
        description: "Cổng Tam Quan Việt Nam Quốc Tự bề thế tọa lạc uy nghiêm trên trục đường Ba Tháng Hai. Ba tầng cổng tượng trưng cho Tam Giải Thoát Môn: Không môn, Vô tướng môn và Vô tác môn, dẫn dắt Phật tử rời xa bụi trần để bước vào chốn thiền môn thanh tịnh.",
        audio_url: "/static/audio/vnqt_tam_quan_vi.mp3",
        audio_duration: 18.0
      },
      en: {
        language_code: "en",
        title: "Tam Quan Gate – Gateway to Serenity",
        description: "The grand Triple Gate stands majestically along 3/2 Boulevard. The three gateways symbolize the Three Doors of Liberation in Buddhism: Emptiness, Signlessness, and Aimlessness, leading pilgrims away from worldly dust into pure tranquility.",
        audio_url: "/static/audio/vnqt_tam_quan_en.mp3",
        audio_duration: 19.0
      }
    },
    media: [
      {
        image_url: "/static/images/tam_quan.jpg",
        caption_vi: "Cổng Tam Quan uy nghiêm nhìn từ đường Ba Tháng Hai",
        caption_en: "Majestic Tam Quan Triple Gate facing 3/2 Boulevard",
        display_order: 1
      }
    ]
  },
  {
    poi_id: "vnqt_bao_thap",
    code: "POI_02",
    campus_id: "viet-nam-quoc-tu",
    latitude: 10.77160,
    longitude: 106.67185,
    geofence_radius: 20.0,
    location_type: "outdoor",
    order_index: 2,
    is_active: true,
    qr_code_url: "/static/qr/qr_vnqt_bao_thap.png",
    translations: {
      vi: {
        language_code: "vi",
        title: "Bảo Tháp 13 Tầng – Biểu Tượng Bất Diệt",
        description: "Bảo tháp cao 63 mét với 13 tầng lầu uy nghiêm, tượng trưng cho tinh thần đoàn kết của 13 tổ chức giáo phái Phật giáo trong phong trào đấu tranh bất bạo động năm 1963. Đây là nơi tôn trí thiêng liêng xá lợi Trái tim Bất diệt của Bồ tát Thích Quảng Đức – bảo vật vô giá minh chứng cho tâm từ bi và dũng lực hộ pháp của Phật giáo Việt Nam.",
        audio_url: "/static/audio/vnqt_bao_thap_vi.mp3",
        audio_duration: 25.0
      },
      en: {
        language_code: "en",
        title: "13-Storey Stupa – Eternal Memorial Tower",
        description: "Rising 63 meters high with 13 majestic tiers, this memorial stupa honors the unity of 13 Buddhist organizations during the historic 1963 non-violent movement. It enshrines the revered immortal heart relic of Bodhisattva Thich Quang Duc, an eternal symbol of compassion and boundless sacrifice.",
        audio_url: "/static/audio/vnqt_bao_thap_en.mp3",
        audio_duration: 26.0
      }
    },
    media: [
      {
        image_url: "/static/images/bao_thap.jpg",
        caption_vi: "Bảo Tháp 13 tầng vươn cao 63 mét giữa trời xanh",
        caption_en: "The 63-meter 13-Storey Stupa soaring into the blue sky",
        display_order: 1
      }
    ]
  },
  {
    poi_id: "vnqt_chanh_dien",
    code: "POI_03",
    campus_id: "viet-nam-quoc-tu",
    latitude: 10.77230,
    longitude: 106.67140,
    geofence_radius: 25.0,
    location_type: "indoor",
    order_index: 3,
    is_active: true,
    qr_code_url: "/static/qr/qr_vnqt_chanh_dien.png",
    translations: {
      vi: {
        language_code: "vi",
        title: "Tòa Đại Chánh Điện – Đại Tượng Phật 35 Tấn",
        description: "Trái tim tâm linh của Việt Nam Quốc Tự là Tòa Đại Chánh Điện tráng lệ với mái ngói cong truyền thống. Nơi đây tôn trí pho đại tượng Đức Phật Bổn Sư Thích Ca Mâu Ni bằng đồng nguyên chất nặng 35 tấn, cao 7.5 mét. Đây là pho tượng Phật bằng đồng trong nhà lớn nhất Việt Nam, tỏa ánh quang minh từ bi cứu độ chúng sinh.",
        audio_url: "/static/audio/vnqt_chanh_dien_vi.mp3",
        audio_duration: 26.0
      },
      en: {
        language_code: "en",
        title: "Main Sanctuary – 35-Ton Bronze Buddha",
        description: "The spiritual heart of the temple is the Great Main Sanctuary, featuring classical curved tiled roofs. It enshrines a 35-ton pure bronze statue of Sakyamuni Buddha standing 7.5 meters tall—the largest indoor bronze Buddha in Vietnam, radiating serenity and boundless compassion.",
        audio_url: "/static/audio/vnqt_chanh_dien_en.mp3",
        audio_duration: 27.0
      }
    },
    media: [
      {
        image_url: "/static/images/chanh_dien.jpg",
        caption_vi: "Không gian trang nghiêm tôn kính bên trong Tòa Chánh Điện",
        caption_en: "Solemn and revered interior of the Main Sanctuary",
        display_order: 1
      }
    ]
  },
  {
    poi_id: "vnqt_thap_chuong",
    code: "POI_04",
    campus_id: "viet-nam-quoc-tu",
    latitude: 10.77170,
    longitude: 106.67080,
    geofence_radius: 16.0,
    location_type: "outdoor",
    order_index: 4,
    is_active: true,
    qr_code_url: "/static/qr/qr_vnqt_thap_chuong.png",
    translations: {
      vi: {
        language_code: "vi",
        title: "Tháp Chuông Đại Hồng Chung 3 Tấn",
        description: "Tháp chuông cổ kính nằm bên tả khuôn viên, lưu giữ quả Đại Hồng Chung bằng đồng nặng gần 3 tấn, cao 2.9 mét, do các nghệ nhân đúc đồng nổi tiếng xứ Huế chế tác. Mỗi tiếng chuông ngân vang mang năng lượng thức tỉnh, xua tan phiền não, cầu nguyện quốc thái dân an và hòa bình thế giới.",
        audio_url: "/static/audio/vnqt_thap_chuong_vi.mp3",
        audio_duration: 24.0
      },
      en: {
        language_code: "en",
        title: "Great Bell Tower – 3-Ton Sacred Bell",
        description: "Located on the western flank, the Bell Tower houses a bronze Great Bell weighing nearly 3 tons and measuring 2.9 meters high, handcrafted by master artisans from Hue. Each resonant chime dispels worries, awakens mindfulness, and prays for world peace.",
        audio_url: "/static/audio/vnqt_thap_chuong_en.mp3",
        audio_duration: 25.0
      }
    },
    media: [
      {
        image_url: "/static/images/thap_chuong.jpg",
        caption_vi: "Đại Hồng Chung gần 3 tấn đúc bằng đồng cổ truyền",
        caption_en: "Traditional handcrafted 3-ton bronze Great Bell",
        display_order: 1
      }
    ]
  },
  {
    poi_id: "vnqt_nha_to",
    code: "POI_05",
    campus_id: "viet-nam-quoc-tu",
    latitude: 10.77285,
    longitude: 106.67140,
    geofence_radius: 18.0,
    location_type: "indoor",
    order_index: 5,
    is_active: true,
    qr_code_url: "/static/qr/qr_vnqt_nha_to.png",
    translations: {
      vi: {
        language_code: "vi",
        title: "Nhà Tổ – Tri Ân Chư Vị Tiền Bối",
        description: "Nhà Tổ nằm phía sau Chánh Điện, nơi tôn thờ Bồ Đề Đạt Ma và chư vị Thánh Tăng, chư Trưởng lão Hòa thượng lãnh đạo Phật giáo Việt Nam qua các thời kỳ. Không gian toát lên vẻ trang nghiêm, gợi nhắc đạo lý 'Uống nước nhớ nguồn' và tinh thần tiếp nối mạng mạch truyền thừa Phật giáo.",
        audio_url: "/static/audio/vnqt_nha_to_vi.mp3",
        audio_duration: 22.0
      },
      en: {
        language_code: "en",
        title: "Ancestral Hall – Honoring Buddhist Forefathers",
        description: "Situated directly behind the Sanctuary, the Ancestral Hall venerates Patriarch Bodhidharma and revered late Buddhist leaders across generations, embodying the virtue of gratitude and Buddhist lineage continuity.",
        audio_url: "/static/audio/vnqt_nha_to_en.mp3",
        audio_duration: 23.0
      }
    },
    media: [
      {
        image_url: "/static/images/nha_to.jpg",
        caption_vi: "Không gian tưởng niệm chư Thánh Tăng tại Nhà Tổ",
        caption_en: "Memorial hall venerating Patriarchs and Buddhist Masters",
        display_order: 1
      }
    ]
  },
  {
    poi_id: "vnqt_phong_trung_bay",
    code: "POI_06",
    campus_id: "viet-nam-quoc-tu",
    latitude: 10.77210,
    longitude: 106.67210,
    geofence_radius: 18.0,
    location_type: "indoor",
    order_index: 6,
    is_active: true,
    qr_code_url: "/static/qr/qr_vnqt_phong_trung_bay.png",
    translations: {
      vi: {
        language_code: "vi",
        title: "Phòng Trưng Bày Văn Hóa Phật Giáo",
        description: "Không gian lưu giữ các hiện vật, kinh sách cổ, mộc bản, chuỗi tràng hạt và kỷ vật quý giá của phong trào Phật giáo năm 1963. Du khách có thể chiêm ngưỡng những hình ảnh lịch sử vô giá và tìm hiểu về sự giao thoa văn hóa Phật giáo Việt Nam qua các triều đại.",
        audio_url: "/static/audio/vnqt_phong_trung_bay_vi.mp3",
        audio_duration: 23.0
      },
      en: {
        language_code: "en",
        title: "Buddhist Cultural Exhibition Hall",
        description: "An indoor gallery preserving sacred artifacts, ancient scriptures, woodblocks, and historical mementos of the 1963 Buddhist movement, illustrating centuries of Vietnamese Buddhist heritage.",
        audio_url: "/static/audio/vnqt_phong_trung_bay_en.mp3",
        audio_duration: 24.0
      }
    },
    media: [
      {
        image_url: "/static/images/phong_trung_bay.jpg",
        caption_vi: "Các cổ vật và pháp khí Phật giáo trưng bày tại bảo tàng",
        caption_en: "Sacred artifacts and Buddhist liturgical instruments on display",
        display_order: 1
      }
    ]
  },
  {
    poi_id: "vnqt_vuon_lam_ty_ni",
    code: "POI_07",
    campus_id: "viet-nam-quoc-tu",
    latitude: 10.77135,
    longitude: 106.67195,
    geofence_radius: 16.0,
    location_type: "outdoor",
    order_index: 7,
    is_active: true,
    qr_code_url: "/static/qr/qr_vnqt_vuon_lam_ty_ni.png",
    translations: {
      vi: {
        language_code: "vi",
        title: "Vườn Lâm Tỳ Ni & Hồ Sen Thanh Tịnh",
        description: "Khu hoa viên tái hiện cảnh Thái tử Tất Đạt Đa đản sinh tại vườn Lâm Tỳ Ni với hình tượng bảy bước hoa sen nâng gót ngọc. Không gian cây xanh tĩnh mịch và hồ sen thơm ngát mang lại cảm giác an lạc, buông xả cho du khách hành hương.",
        audio_url: "/static/audio/vnqt_vuon_lam_ty_ni_vi.mp3",
        audio_duration: 21.0
      },
      en: {
        language_code: "en",
        title: "Lumbini Garden & Lotus Pond",
        description: "A serene garden depicting the nativity of Prince Siddhartha at Lumbini with seven lotus blossoms blossoming beneath his footsteps, surrounded by fragrance and quietude.",
        audio_url: "/static/audio/vnqt_vuon_lam_ty_ni_en.mp3",
        audio_duration: 22.0
      }
    },
    media: [
      {
        image_url: "/static/images/vuon_lam_ty_ni.jpg",
        caption_vi: "Tượng Phật Đản Sinh và hồ sen ngát hương",
        caption_en: "Nativity of the Buddha surrounded by blooming lotuses",
        display_order: 1
      }
    ]
  }
];

export const INITIAL_CAMPUS_FALLBACK: Campus = {
  campus_id: "viet-nam-quoc-tu",
  name: "Việt Nam Quốc Tự",
  address: "244 đường Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh",
  center_latitude: 10.77185,
  center_longitude: 106.67135,
  default_zoom: 18.0,
  description_vi: "Trung tâm Phật giáo quy mô và có ý nghĩa lịch sử - tâm linh quan trọng bậc nhất của TP. Hồ Chí Minh và cả nước, trụ sở Ban Trị sự GHPGVN TP.HCM.",
  description_en: "One of the most prominent Buddhist spiritual and cultural centers in Ho Chi Minh City and Vietnam, headquarters of the Vietnam Buddhist Sangha of HCMC.",
  map_image_url: "/static/images/vietnam_quoc_tu_overview.jpg"
};

// Fetch POIs with Offline-First LocalStorage Caching Strategy (BR01-2)
export async function getPois(campusSlug = 'viet-nam-quoc-tu'): Promise<POI[]> {
  const cacheKey = `vnqt_cached_pois_${campusSlug}`;
  try {
    const res = await fetch(`${API_BASE}/campuses/${campusSlug}/pois`);
    if (res.ok) {
      const pois: POI[] = await res.json();
      if (pois && pois.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(pois));
        return pois;
      }
    }
  } catch (err) {
    console.warn("Network request failed, retrieving POIs from local cache...", err);
  }

  // Fallback to LocalStorage
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error("Error parsing cached POIs:", e);
    }
  }

  // Bundled fallback
  return INITIAL_POIS_FALLBACK;
}

export async function getCampus(campusSlug = 'viet-nam-quoc-tu'): Promise<Campus> {
  const cacheKey = `vnqt_cached_campus_${campusSlug}`;
  try {
    const res = await fetch(`${API_BASE}/campuses/${campusSlug}`);
    if (res.ok) {
      const campus: Campus = await res.json();
      localStorage.setItem(cacheKey, JSON.stringify(campus));
      return campus;
    }
  } catch (err) {
    console.warn("Network request failed for campus, reading from cache...", err);
  }

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error("Error parsing cached campus:", e);
    }
  }

  return INITIAL_CAMPUS_FALLBACK;
}

export async function askBuddhistAI(message: string, language: Language, currentPoiId?: string, history?: any[]) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, current_poi_id: currentPoiId, history })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Error calling AI Chat:", err);
  }

  // Graceful Offline AI Fallback
  return {
    reply: language === 'vi' 
      ? 'Nam Mô A Di Đà Phật. Hiện đang hoạt động ở chế độ Ngoại Tuyến (Offline). Quý Phật tử có thể chiêm bái Bảo Tháp 13 Tầng cao 63m, Tòa Đại Chánh Điện tôn trí đại tượng Phật 35 tấn hoặc quét mã QR tại các gian thờ để nghe thuyết minh truyền cảm.'
      : 'Namo Amitabha Buddha. Currently in Offline Mode. You can explore the 13-Storey Stupa (63m), the 35-ton bronze Buddha in the Main Sanctuary, or scan QR codes inside the halls for instant narration.',
    suggested_questions: language === 'vi'
      ? ['Ý nghĩa Bảo Tháp 13 tầng?', 'Pho tượng Phật 35 tấn?', 'Quy tắc trang nghiêm khi vào chùa?']
      : ['Significance of 13-Storey Stupa?', '35-ton bronze Buddha?', 'Visiting etiquette?']
  };
}

// Admin Authentication & CRUD
export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Sai tài khoản hoặc mật khẩu');
  }
  return await res.json();
}

export async function adminUpdatePoi(poiId: string, data: Partial<POI>, token: string) {
  const res = await fetch(`${API_BASE}/pois/${poiId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Cập nhật POI thất bại');
  }
  return await res.json();
}

export async function adminCreatePoi(data: POI, token: string) {
  const res = await fetch(`${API_BASE}/pois`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Thêm POI thất bại');
  }
  return await res.json();
}

export async function adminDeletePoi(poiId: string, token: string) {
  const res = await fetch(`${API_BASE}/pois/${poiId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Xóa POI thất bại');
  }
  return await res.json();
}

export async function adminGenerateTTS(poiId: string, language?: Language, token?: string) {
  const url = language ? `${API_BASE}/pois/${poiId}/tts?language=${language}` : `${API_BASE}/pois/${poiId}/tts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Tạo giọng đọc Edge-TTS thất bại');
  }
  return await res.json();
}

// ==================== User / Phật Tử Authentication ====================

export async function userRegister(data: {
  username: string;
  password: string;
  full_name: string;
  dharma_name?: string;
  phone?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Đăng ký tài khoản thất bại');
  }
  return await res.json();
}

export async function userLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Tên đăng nhập hoặc mật khẩu không đúng');
  }
  return await res.json();
}

export async function getUserProfile(token: string) {
  const res = await fetch(`${API_BASE}/auth/user/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Không thể lấy thông tin tài khoản');
  }
  return await res.json();
}

export async function syncUserVisited(visitedPoiIds: string[], token: string) {
  const res = await fetch(`${API_BASE}/auth/user/sync-visited`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ visited_poi_ids: visitedPoiIds })
  });
  if (!res.ok) {
    throw new Error('Đồng bộ hành trình thất bại');
  }
  return await res.json();
}

export async function addUserWish(wish: string, token: string) {
  const res = await fetch(`${API_BASE}/auth/user/wish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ wish })
  });
  if (!res.ok) {
    throw new Error('Gửi lời nguyện thất bại');
  }
  return await res.json();
}

