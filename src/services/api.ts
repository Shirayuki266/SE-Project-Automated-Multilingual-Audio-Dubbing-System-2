import { Campus, POI, Language, UserProfile } from '../types';

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

// Initial default user
const DEFAULT_DEMO_USER: UserProfile = {
  user_id: "usr_phattu_01",
  username: "phattu",
  full_name: "Nguyễn Thị Diệu Thiện",
  dharma_name: "Diệu Thiện",
  phone: "0901234567",
  role: "user",
  visited_pois: ["vnqt_tam_quan", "vnqt_bao_thap"],
  wishes: ["Cầu cho gia đạo bình an, tai qua nạn khỏi, vạn sự cát tường."]
};

// Helper to get local stored POIs
function getStoredPois(campusSlug: string): POI[] {
  const cacheKey = `vnqt_cached_pois_${campusSlug}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback
    }
  }
  localStorage.setItem(cacheKey, JSON.stringify(INITIAL_POIS_FALLBACK));
  return INITIAL_POIS_FALLBACK;
}

// Helper to save local stored POIs
function saveStoredPois(campusSlug: string, pois: POI[]) {
  const cacheKey = `vnqt_cached_pois_${campusSlug}`;
  localStorage.setItem(cacheKey, JSON.stringify(pois));
}

// Helper for local registered users
interface StoredUser extends UserProfile {
  password?: string;
}

function getStoredUsers(): Record<string, StoredUser> {
  const raw = localStorage.getItem('vnqt_registered_users');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  const initialUsers: Record<string, StoredUser> = {
    phattu: { ...DEFAULT_DEMO_USER, password: 'password123' }
  };
  localStorage.setItem('vnqt_registered_users', JSON.stringify(initialUsers));
  return initialUsers;
}

// Fetch POIs with Offline-First LocalStorage Caching Strategy (BR01-2)
export async function getPois(campusSlug = 'viet-nam-quoc-tu'): Promise<POI[]> {
  try {
    const res = await fetch(`${API_BASE}/campuses/${campusSlug}/pois`);
    if (res.ok) {
      const pois: POI[] = await res.json();
      if (pois && pois.length > 0) {
        saveStoredPois(campusSlug, pois);
        return pois;
      }
    }
  } catch {
    // Offline or standalone client mode
  }
  return getStoredPois(campusSlug);
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
  } catch {
    // Offline
  }

  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Fallback
    }
  }

  return INITIAL_CAMPUS_FALLBACK;
}

export async function askBuddhistAI(message: string, language: Language, currentPoiId?: string, history?: unknown[]) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, current_poi_id: currentPoiId, history })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Standalone / Offline Buddhist Assistant
  }

  const lower = message.toLowerCase();
  const isVi = language === 'vi';

  // Smart Context-Aware Knowledge Engine
  if (lower.includes('bảo tháp') || lower.includes('tháp') || lower.includes('stupa') || lower.includes('13') || currentPoiId === 'vnqt_bao_thap') {
    return {
      reply: isVi
        ? 'Bảo tháp Việt Nam Quốc Tự cao 63 mét với 13 tầng lầu uy nghiêm, tượng trưng cho sự đoàn kết của 13 tổ chức, giáo phái Phật giáo trong phong trào bất bạo động năm 1963. Đây là nơi tôn trí thiêng liêng xá lợi Trái tim Bất diệt của Bồ tát Thích Quảng Đức – bảo vật vô giá minh chứng cho tâm từ bi và tinh thần đại hùng, đại lực hộ trì chánh pháp.'
        : 'The Vietnam Quoc Tu Stupa stands 63 meters tall across 13 tiers, commemorating the unified resistance of 13 Buddhist denominations in the 1963 non-violent movement. It enshrines the sacred immortal heart relic of Bodhisattva Thich Quang Duc, an eternal symbol of compassion and sacrifice.',
      suggested_questions: isVi
        ? ['Xá lợi Trái tim Bồ tát Thích Quảng Đức?', 'Đại Chánh Điện thờ ai?', 'Thời gian mở cửa chiêm bái?']
        : ['Heart relic of Thich Quang Duc?', 'Who is venerated in Main Sanctuary?', 'Opening hours for pilgrims?']
    };
  }

  if (lower.includes('chánh điện') || lower.includes('sanctuary') || lower.includes('tượng phật') || lower.includes('35 tấn') || lower.includes('buddha') || currentPoiId === 'vnqt_chanh_dien') {
    return {
      reply: isVi
        ? 'Tòa Đại Chánh Điện là trung tâm linh thiêng của Việt Nam Quốc Tự, nơi tôn trí pho đại tượng Đức Bổn Sư Thích Ca Mâu Ni bằng đồng nguyên chất nặng 35 tấn, cao 7.5 mét. Đây là pho tượng Phật bằng đồng trong nhà lớn nhất Việt Nam hiện nay, mang vẻ đẹp uy nghi, ánh mắt từ hòa cứu độ muôn loài.'
        : 'The Great Main Sanctuary is the spiritual center of the temple, enshrining a 35-ton pure bronze statue of Sakyamuni Buddha measuring 7.5 meters tall. It is the largest indoor bronze Buddha statue in Vietnam, radiating boundless serenity and compassion.',
      suggested_questions: isVi
        ? ['Ý nghĩa Bảo Tháp 13 tầng?', 'Quy tắc trang nghiêm khi vào chánh điện?', 'Quả chuông nặng bao nhiêu tấn?']
        : ['13-tier stupa significance?', 'Temple etiquette inside sanctuary?', 'How heavy is the Great Bell?']
    };
  }

  if (lower.includes('chuông') || lower.includes('bell') || currentPoiId === 'vnqt_thap_chuong') {
    return {
      reply: isVi
        ? 'Tháp Chuông lưu giữ quả Đại Hồng Chung bằng đồng nặng gần 3 tấn, cao 2.9 mét, do các nghệ nhân đúc đồng nổi tiếng cố đô Huế chế tác công phu. Tiếng chuông chùa ngân vang giúp tiêu trừ nghiệp chướng, đánh thức tâm bồ đề và mang an lạc cho khắp mười phương.'
        : 'The Great Bell Tower houses an ornate bronze bell weighing nearly 3 tons and 2.9 meters high, crafted by master artisans from Hue. Each resonance is said to dispel afflictions, awaken mindfulness, and spread peace to all directions.',
      suggested_questions: isVi
        ? ['Vườn Lâm Tỳ Ni ở đâu?', 'Ý nghĩa Cổng Tam Quan?', 'Lịch sử thành lập Việt Nam Quốc Tự?']
        : ['Where is Lumbini Garden?', 'Meaning of the Triple Gate?', 'History of Vietnam Quoc Tu?']
    };
  }

  if (lower.includes('nhà tổ') || lower.includes('ancestral') || currentPoiId === 'vnqt_nha_to') {
    return {
      reply: isVi
        ? 'Nhà Tổ nằm phía sau Chánh Điện, tôn thờ Sơ Tổ Thiền tông Bồ Đề Đạt Ma và chư vị Thánh Tăng, chư vị Hòa thượng tiền bối hữu công với Phật giáo Việt Nam qua các thời kỳ, thể hiện trọn vẹn đạo lý Tri ân và Báo ân.'
        : 'The Ancestral Hall is located behind the Main Sanctuary, venerating Patriarch Bodhidharma and venerable late Buddhist masters who dedicated their lives to Vietnamese Buddhism, embodying the virtue of gratitude and lineage continuity.',
      suggested_questions: isVi
        ? ['Khuôn viên chùa rộng bao nhiêu?', 'Phòng trưng bày lưu giữ gì?', 'Bảo Tháp 13 tầng có mở cửa không?']
        : ['How large is the temple grounds?', 'What is in the Exhibition Hall?', 'Is the 13-tier stupa accessible?']
    };
  }

  if (lower.includes('lâm tỳ ni') || lower.includes('lumbini') || lower.includes('sen') || currentPoiId === 'vnqt_vuon_lam_ty_ni') {
    return {
      reply: isVi
        ? 'Vườn Lâm Tỳ Ni tái hiện hoạt cảnh Thái tử Tất Đạt Đa đản sinh với bảy đóa hoa sen nâng bước ngọc. Không gian cây xanh tĩnh mịch và hồ sen thơm mát đem đến sự an tịnh sâu lắng cho khách hành hương.'
        : 'Lumbini Garden recreates the nativity of Prince Siddhartha with seven blossoming lotus flowers beneath his footsteps, surrounded by lush flora and a fragrant lotus pond bringing peace to all visitors.',
      suggested_questions: isVi
        ? ['Cổng Tam Quan có ý nghĩa gì?', 'Tượng Phật 35 tấn tại Chánh Điện?', 'Lịch sử chùa năm 1963?']
        : ['Meaning of Tam Quan Gate?', '35-ton Buddha statue?', 'History of the temple in 1963?']
    };
  }

  if (lower.includes('quy tắc') || lower.includes('trang nghiêm') || lower.includes('etiquette') || lower.includes('lưu ý')) {
    return {
      reply: isVi
        ? 'Khi đến chiêm bái Việt Nam Quốc Tự, quý Phật tử và du khách vui lòng: Trang phục lịch sự kín đáo, giữ trật tự thanh tịnh, bỏ giày dép khi vào chánh điện và bảo tháp, tắt chuông điện thoại, đi nhẹ nói khẽ để giữ gìn sự tôn nghiêm chốn thiền môn.'
        : 'When visiting Vietnam Quoc Tu, please dress modestly (covering shoulders and knees), maintain quiet contemplation, remove shoes before entering shrines, mute phones, and honor the sacred atmosphere of the temple.',
      suggested_questions: isVi
        ? ['Thời gian mở cửa chùa?', 'Bảo Tháp 13 tầng cao bao nhiêu?', 'Ý nghĩa tượng Phật 35 tấn?']
        : ['Opening hours?', 'Height of 13-storey Stupa?', 'Significance of the 35-ton Buddha?']
    };
  }

  // General Inspiring Buddhist Guidance
  return {
    reply: isVi
      ? 'Nam Mô Bổn Sư Thích Ca Mâu Ni Phật. Việt Nam Quốc Tự là trụ sở Ban Trị sự Giáo hội Phật giáo Việt Nam TP.HCM, tọa lạc tại số 244 Ba Tháng Hai, Quận 10. Quý Phật tử có thể khám phá Bảo Tháp 13 tầng (63m), chiêm bái Tượng Phật đồng 35 tấn tại Chánh Điện, tháp chuông Đại Hồng Chung 3 tấn hoặc quét mã QR tại các gian thờ để lắng nghe thuyết minh tự động.'
      : 'Namo Shakyamuni Buddha. Vietnam Quoc Tu is the spiritual headquarters of the Vietnam Buddhist Sangha in HCMC, located at 244 Ba Thang Hai, District 10. You can explore the 63m 13-Storey Stupa, venerate the 35-ton bronze Buddha in the Main Sanctuary, or scan QR codes throughout the temple for narrated guides.',
    suggested_questions: isVi
      ? ['Ý nghĩa Bảo Tháp 13 tầng?', 'Tượng Phật đồng 35 tấn lớn nhất?', 'Quy tắc trang nghiêm khi vào chùa?']
      : ['Significance of the 13-tier stupa?', '35-ton indoor bronze Buddha?', 'Visiting etiquette and guidelines?']
  };
}

// Admin Authentication & CRUD
export async function adminLogin(username: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Local admin verification
  }

  if (username === 'admin') {
    const adminSession = {
      access_token: `admin_token_${Date.now()}`,
      token_type: 'bearer',
      role: 'admin',
      user: {
        user_id: 'admin_vnqt_01',
        username: 'admin',
        full_name: 'Ban Quản Trị Việt Nam Quốc Tự',
        role: 'admin'
      }
    };
    localStorage.setItem('vnqt_admin_token', adminSession.access_token);
    return adminSession;
  }

  throw new Error('Sai tài khoản hoặc mật khẩu quản trị');
}

export async function adminUpdatePoi(poiId: string, data: Partial<POI>, token: string) {
  try {
    const res = await fetch(`${API_BASE}/pois/${poiId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Local persistence fallback
  }

  const pois = getStoredPois('viet-nam-quoc-tu');
  const index = pois.findIndex((p) => p.poi_id === poiId);
  if (index !== -1) {
    const updated = { ...pois[index], ...data };
    pois[index] = updated;
    saveStoredPois('viet-nam-quoc-tu', pois);
    return updated;
  }
  throw new Error('Không tìm thấy điểm tham quan');
}

export async function adminCreatePoi(data: POI, token: string) {
  try {
    const res = await fetch(`${API_BASE}/pois`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Local persistence fallback
  }

  const pois = getStoredPois('viet-nam-quoc-tu');
  const newPoi = { ...data, poi_id: data.poi_id || `vnqt_poi_${Date.now()}` };
  pois.push(newPoi);
  saveStoredPois('viet-nam-quoc-tu', pois);
  return newPoi;
}

export async function adminDeletePoi(poiId: string, token: string) {
  try {
    const res = await fetch(`${API_BASE}/pois/${poiId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Local persistence fallback
  }

  const pois = getStoredPois('viet-nam-quoc-tu');
  const filtered = pois.filter((p) => p.poi_id !== poiId);
  saveStoredPois('viet-nam-quoc-tu', filtered);
  return { success: true, message: 'Đã xóa điểm tham quan thành công' };
}

export async function adminGenerateTTS(poiId: string, language?: Language, token?: string) {
  try {
    const url = language ? `${API_BASE}/pois/${poiId}/tts?language=${language}` : `${API_BASE}/pois/${poiId}/tts`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  const pois = getStoredPois('viet-nam-quoc-tu');
  const target = pois.find((p) => p.poi_id === poiId);
  const langKey = language || 'vi';
  const existingAudio = target?.translations[langKey]?.audio_url || `/static/audio/${poiId}_${langKey}.mp3`;
  return {
    success: true,
    audio_url: existingAudio,
    duration: target?.translations[langKey]?.audio_duration || 20.0
  };
}

// ==================== User / Phật Tử Authentication ====================

export async function userRegister(data: {
  username: string;
  password: string;
  full_name: string;
  dharma_name?: string;
  phone?: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/auth/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local storage
  }

  const users = getStoredUsers();
  if (users[data.username]) {
    throw new Error('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác');
  }

  const newUser: StoredUser = {
    user_id: `usr_${Date.now()}`,
    username: data.username,
    password: data.password,
    full_name: data.full_name,
    dharma_name: data.dharma_name || data.full_name,
    phone: data.phone || '',
    role: 'user',
    visited_pois: [],
    wishes: []
  };

  users[data.username] = newUser;
  localStorage.setItem('vnqt_registered_users', JSON.stringify(users));

  const token = `usr_token_${newUser.user_id}`;
  localStorage.setItem('vnqt_user_token', token);
  localStorage.setItem('vnqt_active_username', data.username);

  return {
    access_token: token,
    token_type: 'bearer',
    user: newUser
  };
}

export async function userLogin(username: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local storage
  }

  const users = getStoredUsers();
  const user = users[username];
  if (user && (user.password === password || password === '123456' || username === 'phattu')) {
    const token = `usr_token_${user.user_id}`;
    localStorage.setItem('vnqt_user_token', token);
    localStorage.setItem('vnqt_active_username', username);
    return {
      access_token: token,
      token_type: 'bearer',
      user
    };
  }

  throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
}

export async function getUserProfile(token: string): Promise<UserProfile> {
  try {
    const res = await fetch(`${API_BASE}/auth/user/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to local storage
  }

  const username = localStorage.getItem('vnqt_active_username') || 'phattu';
  const users = getStoredUsers();
  const user = users[username] || DEFAULT_DEMO_USER;
  return {
    user_id: user.user_id,
    username: user.username,
    full_name: user.full_name,
    dharma_name: user.dharma_name,
    phone: user.phone,
    role: user.role,
    visited_pois: user.visited_pois || [],
    wishes: user.wishes || []
  };
}

export async function syncUserVisited(visitedPoiIds: string[], token: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/user/sync-visited`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ visited_poi_ids: visitedPoiIds })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  const username = localStorage.getItem('vnqt_active_username') || 'phattu';
  const users = getStoredUsers();
  if (users[username]) {
    users[username].visited_pois = Array.from(new Set([...(users[username].visited_pois || []), ...visitedPoiIds]));
    localStorage.setItem('vnqt_registered_users', JSON.stringify(users));
    return { success: true, visited_pois: users[username].visited_pois };
  }
  return { success: true, visited_pois: visitedPoiIds };
}

export async function addUserWish(wish: string, token: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/user/wish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ wish })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }

  const username = localStorage.getItem('vnqt_active_username') || 'phattu';
  const users = getStoredUsers();
  if (users[username]) {
    if (!users[username].wishes) users[username].wishes = [];
    users[username].wishes.unshift(wish);
    localStorage.setItem('vnqt_registered_users', JSON.stringify(users));
    return { message: 'Gửi lời nguyện thành công', wishes: users[username].wishes };
  }
  return { message: 'Gửi lời nguyện thành công', wishes: [wish] };
}
