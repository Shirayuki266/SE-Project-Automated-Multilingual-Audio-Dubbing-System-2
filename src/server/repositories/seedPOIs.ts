import { POIEntity } from '../types.js';

export interface RawSeedPOI {
  poi: POIEntity;
  translations: Record<string, { title: string; intro?: string; desc: string; audioUrl?: string }>;
  media: Array<{ url: string; caption_vi: string; caption_en: string }>;
}

export const rawSeedPOIs: RawSeedPOI[] = [
  // 1. CỔNG TAM QUAN
  {
    poi: {
      poi_id: 'poi-tam-quan',
      campus_id: 'vnqt-campus-01',
      code: 'VNQT-TAM-QUAN',
      latitude: 10.77165,
      longitude: 106.67115,
      geofence_radius: 20,
      location_type: 'gate',
      qr_code_url: '/?poi=VNQT-TAM-QUAN',
      created_at: new Date().toISOString(),
    },
    translations: {
      vi: {
        title: 'Cổng Tam Quan & Quảng Trường Đài Sen',
        desc: 'Lối vào uy nghiêm mở ra không gian thanh tịnh giữa lòng TP. Hồ Chí Minh náo nhiệt. Ba cửa tượng trưng cho Tam Giải Thoát Môn: Không, Vô Tướng, Vô Tác.',
      },
      en: {
        title: 'Tam Quan Gate & White Lotus Plaza',
        desc: 'Majestic three-arched gateway welcoming pilgrims from the bustling city into sacred tranquility. Represents the Three Doors of Liberation.',
      },
      zh: {
        title: '三关门与白莲花广场',
        desc: '庄严肃穆的山门，三门象征佛教“三解脱门”：空门、无相门与无愿门，引众生入清凉佛境。',
      },
      ja: {
        title: '三門（山門）と白蓮広場',
        desc: '都会の喧騒を離れ、清らかな聖域へと参拝者を迎える壮麗な三門。空・無相・無作の三解脱門を表します。',
      },
      ko: {
        title: '삼관문과 백련 광장',
        desc: '번화한 도심에서 벗어나 성스러운 사찰로 들어서는 웅장한 문. 해탈의 삼문을 상징합니다.',
      },
      fr: {
        title: 'Porte Tam Quan & Place du Lotus',
        desc: 'Entrée majestueuse ouvrant vers la sérénité bouddhique au cœur de la métropole animée.',
      },
      de: {
        title: 'Tam-Quan-Tor & Weißer Lotusplatz',
        desc: 'Majestätisches dreibogiges Tor, das Pilger aus der geschäftigen Stadt in die heilige Stille führt. Symbol der drei Tore der Befreiung.',
      },
      es: {
        title: 'Puerta Tam Quan y Plaza del Loto Blanco',
        desc: 'Majestuosa puerta de tres arcos que recibe a los peregrinos hacia la sagrada tranquilidad budista.',
      },
      ru: {
        title: 'Ворота Там Куан и Площадь Белого Лотоса',
        desc: 'Величественные трехпролетные ворота, ведущие из шумного мегаполиса в обитель священного покоя.',
      },
      th: {
        title: 'ซุ้มประตูตามกวานและลานดอกบัวขาว',
        desc: 'ซุ้มประตูสามช่องอันสง่างาม ต้อนรับผู้แสวงบุญเข้าสู่ความสงบอันศักดิ์สิทธิ์ เป็นสัญลักษณ์แห่งประตูหลุดพ้นสามประการ',
      },
      id: {
        title: 'Gerbang Tam Quan & Plaza Teratai Putih',
        desc: 'Pintu gerbang megah bercabang tiga yang menyambut para peziarah menuju kedamaian suci di tengah kota.',
      },
      it: {
        title: 'Porta Tam Quan & Piazza del Loto Bianco',
        desc: 'Maestosa porta a tre archi che accoglie i pellegrini verso la sacra serenità buddhista nel cuore della città.',
      },
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption_vi: 'Cổng Tam Quan hướng ra đường Ba Tháng Hai',
        caption_en: 'Tam Quan Entrance Gate facing 3 Thang 2 Avenue',
      },
    ],
  },

  // 2. CHÁNH ĐIỆN - ĐẠI HÙNG BỬU ĐIỆN
  {
    poi: {
      poi_id: 'poi-chinh-dien',
      campus_id: 'vnqt-campus-01',
      code: 'VNQT-CHINH-DIEN',
      latitude: 10.77125,
      longitude: 106.67140,
      geofence_radius: 25,
      location_type: 'sanctuary',
      qr_code_url: '/?poi=VNQT-CHINH-DIEN',
      created_at: new Date().toISOString(),
    },
    translations: {
      vi: {
        title: 'Đại Hùng Bửu Điện (Chính Điện)',
        desc: 'Điện thờ chính tôn nghiêm với pho tượng Đức Bổn Sư Thích Ca Mâu Ni bằng đồng mạ vàng nặng 35 tấn, cao 7,5m – pho tượng Phật lớn nhất trong các tự viện Việt Nam.',
      },
      en: {
        title: 'Great Heroic Sanctuary (Đại Hùng Bửu Điện)',
        desc: 'The spiritual heart of Việt Nam Quốc Tự enshrining the 35-ton, 7.5-meter gilded bronze Shakyamuni Buddha radiating infinite compassion.',
      },
      zh: {
        title: '大雄宝殿（Đại Hùng Bửu Điện）',
        desc: '庄严正殿供奉重达35吨、高7.5米的纯铜贴金释迦牟尼佛金身圣像，佛光普照十方。',
      },
      ja: {
        title: '大雄宝殿（本堂 - Đại Hùng Bửu Điện）',
        desc: '35トンの金箔青銅釈迦牟尼仏坐像が鎮座する、荘厳な信仰の中心。慈悲の光で満たされています。',
      },
      ko: {
        title: '대웅보전 (본전 - Đại Hùng Bửu Điện)',
        desc: '높이 7.5미터, 무게 35톤의 금동 석가모니불 좌상이 봉안된 사찰의 가장 신성한 중심 전각.',
      },
      fr: {
        title: 'Grand Sanctuaire Đại Hùng Bửu Điện',
        desc: 'Cœur spirituel de la pagode abritant la statue majestueuse du Bouddha Shakyamuni en bronze doré de 35 tonnes.',
      },
      de: {
        title: 'Große Haupthalle (Đại Hùng Bửu Điện)',
        desc: 'Das spirituelle Herz der Pagode mit der 35 Tonnen schweren, 7,5 Meter hohen vergoldeten Bronze-Buddha-Statue.',
      },
      es: {
        title: 'Gran Santuario Đại Hùng Bửu Điện',
        desc: 'El corazón espiritual de la pagoda que consagra la estatua de Buda Shakyamuni de bronce dorado de 35 toneladas.',
      },
      ru: {
        title: 'Главный Храм (Đại Hùng Bửu Điện)',
        desc: 'Духовное сердце пагоды, где установлена 35-тонная позолоченная бронзовая статуя Будды Шакьямуни высотой 7,5 метров.',
      },
      th: {
        title: 'พระอุโบสถประธาน (Đại Hùng Bửu Điện)',
        desc: 'ศูนย์กลางจิตวิญญาณของวัด ประดิษฐานพระพุทธรูปศากยมุนีสำริดปิดทองคำ หนัก 35 ตัน สูง 7.5 เมตร',
      },
      id: {
        title: 'Aula Utama (Đại Hùng Bửu Điện)',
        desc: 'Pusat spiritual wihara yang memuliakan rupang Buddha Shakyamuni dari perunggu berlapis emas seberat 35 ton setinggi 7,5 meter.',
      },
      it: {
        title: 'Grande Santuario Đại Hùng Bửu Điện',
        desc: 'Il cuore spirituale della pagoda che custodisce la statua in bronzo dorato del Buddha Shakyamuni da 35 tonnellate e alta 7,5 metri.',
      },
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
        caption_vi: 'Gian thờ chính trang nghiêm lộng lẫy',
        caption_en: 'Main shrine interior with magnificent Buddha statue',
      },
    ],
  },

  // 3. BẢO THÁP 13 TẦNG (XÁ LỢI TRÁI TIM BỒ TÁT THÍCH QUẢNG ĐỨC)
  {
    poi: {
      poi_id: 'poi-bao-thap-13-tang',
      campus_id: 'vnqt-campus-01',
      code: 'VNQT-BAO-THAP',
      latitude: 10.77095,
      longitude: 106.67180,
      geofence_radius: 22,
      location_type: 'stupa',
      qr_code_url: '/?poi=VNQT-BAO-THAP',
      created_at: new Date().toISOString(),
    },
    translations: {
      vi: {
        title: 'Bảo Tháp Đa Bảo 13 Tầng (63m)',
        desc: 'Tháp đá 13 tầng cao 63m cao nhất Việt Nam, biểu trưng tinh thần đoàn kết 13 tổ chức Phật giáo 1963, nơi phụng thờ Xá Lợi Trái Tim Bất Diệt của Bồ Tát Thích Quảng Đức.',
      },
      en: {
        title: '13-Storey Stupa (Heart Relic of Thích Quảng Đức)',
        desc: 'Vietnam tallest stone pagoda stupa (63m), sacred sanctuary preserving the Immortal Heart Relic of Bodhisattva Thích Quảng Đức.',
      },
      zh: {
        title: '十三层多宝佛塔（释广德菩萨心脏舍利）',
        desc: '越南最高石塔（63米），奉安Bồ Tát Thích Quảng Đức永恒不灭的心脏舍利圣物，见证和平与无畏慈悲精神。',
      },
      ja: {
        title: '十三重多宝塔（釈広徳菩薩 不滅の心臓舎利）',
        desc: 'ベトナム最高峰の石造多宝塔（63m）。Bồ Tát Thích Quảng Đứcの不滅の心臓仏舎利を奉安しています。',
      },
      ko: {
        title: '13층 다보탑 (틱꽝득 보살 심장 사리탑)',
        desc: '베트남 최고 높이(63m)의 석조 다보탑. Bồ Tát Thích Quảng Đức의 불멸의 심장 사리를 영구 봉안한 성지.',
      },
      fr: {
        title: 'Stupa à 13 Étages (Relique du Cœur de Thích Quảng Đức)',
        desc: 'Le plus haut stupa du Vietnam (63m), abritant la relique sacrée du Cœur Immortel de Bồ Tát Thích Quảng Đức.',
      },
      de: {
        title: '13-stöckige Stupa (Herzreliquie von Thích Quảng Đức)',
        desc: 'Vietnams höchste Steinstupa (63m), heiliger Schrein zur Bewahrung der unsterblichen Herzreliquie von Bồ Tát Thích Quảng Đức.',
      },
      es: {
        title: 'Estupa de 13 Pisos (Reliquia del Corazón de Thích Quảng Đức)',
        desc: 'La estupa de piedra más alta de Vietnam (63m), santuario sagrado que custodia la Reliquia Inmortal del Corazón de Bồ Tát Thích Quảng Đức.',
      },
      ru: {
        title: '13-ярусная Ступа (Сердечная Реликвия Thích Quảng Đức)',
        desc: 'Самая высокая каменная ступа во Вьетнаме (63м), хранящая бессмертную сердечную реликвию Bồ Tát Thích Quảng Đức.',
      },
      th: {
        title: 'พระมหาเจดีย์ 13 ชั้น (พระสารีริกธาตุหัวใจ Thích Quảng Đức)',
        desc: 'เจดีย์หินสูงที่สุดในเวียดนาม (63 เมตร) ประดิษฐานพระสารีริกธาตุหัวใจอันเป็นอมตะของ Bồ Tát Thích Quảng Đức',
      },
      id: {
        title: 'Stupa 13 Lantai (Relik Hati Thích Quảng Đức)',
        desc: 'Stupa batu tertinggi di Vietnam (63m), tempat suci bersemayamnya Relik Hati Abadi dari Bồ Tát Thích Quảng Đức.',
      },
      it: {
        title: 'Stupa a 13 Piani (Reliquia del Cuore di Thích Quảng Đức)',
        desc: 'Lo stupa in pietra più alto del Vietnam (63m), santuario che custodisce la sacra Reliquia Immortale del Cuore di Bồ Tát Thích Quảng Đức.',
      },
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
        caption_vi: 'Bảo tháp 13 tầng vươn cao 63 mét',
        caption_en: '13-storey stupa reaching 63 meters into the sky',
      },
    ],
  },

  // 4. ĐẠI HỒNG CHUNG 3 TẤN
  {
    poi: {
      poi_id: 'poi-dai-hong-chung',
      campus_id: 'vnqt-campus-01',
      code: 'VNQT-DAI-HONG-CHUNG',
      latitude: 10.77145,
      longitude: 106.67185,
      geofence_radius: 18,
      location_type: 'bell',
      qr_code_url: '/?poi=VNQT-DAI-HONG-CHUNG',
      created_at: new Date().toISOString(),
    },
    translations: {
      vi: {
        title: 'Đại Hồng Chung 3 Tấn (Lầu Chuông)',
        desc: 'Chuông đồng nặng gần 3 tấn đúc thủ công theo hoa văn Lý – Trần, âm thanh thanh lương ngân vang hóa giải muôn vàn phiền não.',
      },
      en: {
        title: '3-Ton Great Bell Tower (Đại Hồng Chung)',
        desc: 'Sacred bronze bell weighing nearly 3 tons cast with ancient motifs. Its resonating chime awakens mindfulness and inner peace.',
      },
      zh: {
        title: '三吨大洪钟（Đại Hồng Chung）',
        desc: '重达3吨的青铜大洪钟，铭刻李陈朝古韵龙纹，晨钟暮鼓涤荡尘劳。',
      },
      ja: {
        title: '三トン大梵鐘（鐘楼 - Đại Hồng Chung）',
        desc: '重量約3トンの大梵鐘。清らかな響きは人々の煩悩を払い、安らぎをもたらします。',
      },
      ko: {
        title: '3톤 대홍종 (Đại Hồng Chung)',
        desc: '3톤 무게의 대홍종으로 맑고 깊은 울림이 온갖 번뇌를 씻어줍니다.',
      },
      fr: {
        title: 'Tour de la Grande Cloche (Đại Hồng Chung)',
        desc: 'Cloche sacrée en bronze de 3 tonnes dont le son profond dissipe les tourments de l esprit.',
      },
      de: {
        title: 'Große 3-Tonnen-Glocke (Đại Hồng Chung)',
        desc: 'Heilige Bronzeglocke mit einem Gewicht von fast 3 Tonnen. Ihr Hall bringt inneren Frieden und Achtsamkeit.',
      },
      es: {
        title: 'Gran Campana de 3 Toneladas (Đại Hồng Chung)',
        desc: 'Campana sagrada de bronce de 3 toneladas cuyo sonido disipa las aflicciones y despierta la serenidad.',
      },
      ru: {
        title: 'Колокольня с 3-тонным Колоколом (Đại Hồng Chung)',
        desc: 'Священный бронзовый колокол весом около 3 тонн, звон которого пробуждает осознанность и покой.',
      },
      th: {
        title: 'หอระฆังใหญ่ 3 ตัน (Đại Hồng Chung)',
        desc: 'ระฆังสำริดศักดิ์สิทธิ์หนักเกือบ 3 ตัน เสียงกังวานช่วยขจัดความกังวลและนำความสงบสู่จิตใจ',
      },
      id: {
        title: 'Menara Genta 3 Ton (Đại Hồng Chung)',
        desc: 'Genta perunggu suci seberat hampir 3 ton. Dentang suaranya membangkitkan kesadaran dan kedamaian batin.',
      },
      it: {
        title: 'Torre della Grande Campana (Đại Hồng Chung)',
        desc: 'Sacra campana in bronzo di circa 3 tonnellate. I suoi rintocchi risvegliano pace interiore e consapevolezza.',
      },
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=1200&q=80',
        caption_vi: 'Lầu chuông uy nghiêm bên phải sân lễ',
        caption_en: 'Bell tower beside the central ceremonial court',
      },
    ],
  },

  // 5. TƯỢNG BỒ TÁT QUÁN THẾ ÂM
  {
    poi: {
      poi_id: 'poi-tuong-quan-am',
      campus_id: 'vnqt-campus-01',
      code: 'VNQT-QUAN-AM',
      latitude: 10.77175,
      longitude: 106.67160,
      geofence_radius: 20,
      location_type: 'statue',
      qr_code_url: '/?poi=VNQT-QUAN-AM',
      created_at: new Date().toISOString(),
    },
    translations: {
      vi: {
        title: 'Tôn Tượng Bồ Tát Quán Thế Âm Lộ Thiên',
        desc: 'Pho tượng Mẹ Quán Thế Âm Bồ Tát tay cầm bình cam lộ ban rải từ bi cho chúng sanh, đứng trang nghiêm trên đài sen tinh khiết.',
      },
      en: {
        title: 'Outdoor Avalokiteshvara Bodhisattva Statue',
        desc: 'Compassionate Bodhisattva of Mercy holding the sacred nectar vase, blessing all sentient beings with peace and healing.',
      },
      zh: {
        title: '露天观世音菩萨圣像',
        desc: '大慈大悲观世音菩萨手持甘露净瓶，屹立于清净莲台之上，甘露普润，普度众生。',
      },
      ja: {
        title: '露天 観世音菩薩立像',
        desc: '甘露の水瓶を手に持ち、衆生に慈悲を注ぐ観世音菩薩の清らかな立像。',
      },
      ko: {
        title: '야외 관세음보살 입상',
        desc: '감로수병을 들고 모든 중생에게 자비를 베푸시는 대자대비 관세음보살 성상.',
      },
      fr: {
        title: 'Statue d Avalokiteshvara en Plein Air',
        desc: 'La statue du Bodhisattva de la Compassion tenant le vase de nectar sacré pour apaiser tous les êtres.',
      },
      de: {
        title: 'Freiluft-Statue des Bodhisattva Avalokiteshvara',
        desc: 'Die mitfühlende Bodhisattva der Barmherzigkeit mit der Nektarvase zur Heilung und Segnung aller Wesen.',
      },
      es: {
        title: 'Estatua al Aire Libre de Avalokiteshvara',
        desc: 'La compasiva Bodhisattva de la Misericordia sosteniendo el jarrón de néctar para bendecir a todos los seres.',
      },
      ru: {
        title: 'Статуя Бодхисаттвы Авалокитешвары под открытым небом',
        desc: 'Милосердная статуя Бодхисаттвы с сосудом священного нектара, дарующая мир и сострадание.',
      },
      th: {
        title: 'พระโพธิสัตว์กวนอิมกลางแจ้ง',
        desc: 'พระโพธิสัตว์แห่งความเมตตาถือคนโทน้ำทิพย์ ประทานพรอันประเสริฐและความสงบแก่สรรพสัตว์',
      },
      id: {
        title: 'Rupang Bodhisatwa Avalokiteshvara Terbuka',
        desc: 'Bodhisatwa Welas Asih memegang guci air amrta suci, mencurahkan berkah kedamaian bagi semua makhluk.',
      },
      it: {
        title: 'Statua all Aperto del Bodhisattva Avalokiteshvara',
        desc: 'La compassionevole Bodhisattva della Misericordia che regge il vaso del nettare sacro per donare benedizione.',
      },
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
        caption_vi: 'Tôn tượng Bồ Tát Quán Thế Âm lộ thiên',
        caption_en: 'Outdoor statue of Bodhisattva Avalokiteshvara',
      },
    ],
  },

  // 6. VƯỜN BỒ ĐỀ LÂM TỲ NI
  {
    poi: {
      poi_id: 'poi-vuon-bo-de',
      campus_id: 'vnqt-campus-01',
      code: 'VNQT-VUON-BO-DE',
      latitude: 10.77150,
      longitude: 106.67085,
      geofence_radius: 18,
      location_type: 'garden',
      qr_code_url: '/?poi=VNQT-VUON-BO-DE',
      created_at: new Date().toISOString(),
    },
    translations: {
      vi: {
        title: 'Vườn Bồ Đề Lâm Tỳ Ni & Hồ Sen An Lạc',
        desc: 'Cây Bồ đề thiêng chiết nhánh từ Đất Phật Bodh Gaya Ấn Độ và hồ sen thanh tịnh, nơi tĩnh tâm thiền hành lý tưởng cho quý Phật tử.',
      },
      en: {
        title: 'Bodhi Grove & Tranquil Lotus Pond',
        desc: 'Sacred Bodhi tree descended from Bodh Gaya, India, beside quiet lotus waters designed for mindful walking meditation.',
      },
      zh: {
        title: '菩提圣树园与安乐莲池',
        desc: '移植自印度菩提迦耶圣地的菩提树与清幽荷花池，清凉怡人，为经行禅修圣地。',
      },
      ja: {
        title: '菩提樹の庭と安楽蓮池',
        desc: 'インド・ブッダガヤの菩提樹から株分けされた聖木と、静かな蓮池。歩行瞑想に最適です。',
      },
      ko: {
        title: '보리수 정원과 안락 연못',
        desc: '인도 부다가야에서 온 성스러운 보리수와 고요한 연꽃 연못이 있는 명상 공간.',
      },
      fr: {
        title: 'Jardin de la Bodhi & Bassin de Lotus',
        desc: 'Arbre sacré de la Bodhi issu de Bodh Gaya en Inde bordant un bassin de lotus paisible pour la méditation.',
      },
      de: {
        title: 'Bodhi-Hain & Stiller Lotusteich',
        desc: 'Heiliger Bodhi-Baum aus Bodh Gaya, Indien, an einem ruhigen Lotusteich für Gehmeditation.',
      },
      es: {
        title: 'Jardín del Árbol Bodhi y Estanque de Lotos',
        desc: 'Árbol Bodhi sagrado traído de Bodh Gaya, India, junto a un estanque de lotos ideal para meditación.',
      },
      ru: {
        title: 'Сад Дерева Бодхи и Лотосовый Пруд',
        desc: 'Священное дерево Бодхи из Бодх-Гаи (Индия) у спокойного лотосового пруда для медитации.',
      },
      th: {
        title: 'สวนโพธิ์พุทธคยาและสระบัวอันสงบ',
        desc: 'ต้นพระศรีมหาโพธิ์ศักดิ์สิทธิ์ที่นำกิ่งมาจากพุทธคยา ประเทศอินเดีย ข้างสระบัวอันเงียบสงบสำหรับเจริญสมาธิ',
      },
      id: {
        title: 'Taman Pohon Bodhi & Kolam Teratai Damai',
        desc: 'Pohon Bodhi suci keturunan langsung dari Bodh Gaya, India, di samping kolam teratai yang hening untuk meditasi jalan.',
      },
      it: {
        title: 'Giardino dell Albero della Bodhi & Stagno di Loti',
        desc: 'Sacro albero della Bodhi originario di Bodh Gaya in India, accanto a uno specchio d acqua con fiori di loto per la meditazione.',
      },
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        caption_vi: 'Không gian xanh mát của vườn bồ đề',
        caption_en: 'Peaceful greenery of the Bodhi garden',
      },
    ],
  },

  // 7. NHÀ HẬU TỔ
  {
    poi: {
      poi_id: 'poi-nha-hau-to',
      campus_id: 'vnqt-campus-01',
      code: 'VNQT-NHA-TO',
      latitude: 10.77100,
      longitude: 106.67130,
      geofence_radius: 18,
      location_type: 'ancestral',
      qr_code_url: '/?poi=VNQT-NHA-TO',
      created_at: new Date().toISOString(),
    },
    translations: {
      vi: {
        title: 'Nhà Hậu Tổ & Điện Thờ Chư Tôn Đức Tiền Bối',
        desc: 'Nơi phụng thờ các vị Lịch Đại Tổ Sư, chư tôn đức tiền bối hữu công qua các thời kỳ có công đức lớn lao xây dựng và hoằng dương Phật pháp.',
      },
      en: {
        title: 'Ancestral Hall (Nhà Hậu Tổ)',
        desc: 'Sanctuary honoring the lineage of Buddhist Patriarchs and venerable masters who dedicated their lives to Dharma propagation.',
      },
      zh: {
        title: '祖师殿（Nhà Hậu Tổ）',
        desc: '奉祀历代祖师与高僧大德，感念祖师开山弘法、续佛慧命之崇高功德。',
      },
      ja: {
        title: '開山祖師堂（Nhà Hậu Tổ）',
        desc: '歴代の祖師方や仏法興隆に尽力された高僧を奉祀し、その大徳を称える祖師堂。',
      },
      ko: {
        title: '조사실 (Nhà Hậu Tổ)',
        desc: '역대 종사 및 불법 홍포에 헌신한 고승 대덕들을 모신 숭고한 사당.',
      },
      fr: {
        title: 'Salle des Maîtres Ancêtres (Nhà Hậu Tổ)',
        desc: 'Sanctuaire dédié à la lignée des patriarches bouddhistes et vénérables maîtres fondateurs.',
      },
      de: {
        title: 'Ahnenhalle der Meister (Nhà Hậu Tổ)',
        desc: 'Halle zur Würdigung der Ahnenlinie buddhistischer Patriarchen und ehrwürdiger Meister.',
      },
      es: {
        title: 'Sala de los Maestros Ancestrales (Nhà Hậu Tổ)',
        desc: 'Santuario en honor a los patriarcas budistas y venerables maestros que preservaron el Dharma.',
      },
      ru: {
        title: 'Зал Предков и Патриархов (Nhà Hậu Tổ)',
        desc: 'Святилище, посвященное линии буддийских патриархов и наставников.',
      },
      th: {
        title: 'วิหารบูรพาจารย์ (Nhà Hậu Tổ)',
        desc: 'สถานที่สักการะบูรพาจารย์และพระเถระผู้มีคุณูปการในการเผยแผ่พระพุทธศาสนา',
      },
      id: {
        title: 'Aula Leluhur dan Mahaguru (Nhà Hậu Tổ)',
        desc: 'Tempat suci penghormatan bagi silsilah para Patriark dan Yang Arya pembina Dharma.',
      },
      it: {
        title: 'Sala degli Antenati e Patriarchi (Nhà Hậu Tổ)',
        desc: 'Santuario dedicato al lignaggio dei Patriarchi e maestri che hanno preservato il Dharma.',
      },
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
        caption_vi: 'Gian thờ Nhà Tổ trang nghiêm ấm cúng',
        caption_en: 'Ancestral hall interior honoring Buddhist masters',
      },
    ],
  },

  // 8. NHÀ LƯU NIỆM & TRƯNG BÀY LỊCH SỬ GIÁO HỘI
  {
    poi: {
      poi_id: 'poi-nha-luu-niem',
      campus_id: 'vnqt-campus-01',
      code: 'VNQT-NHA-LUU-NIEM',
      latitude: 10.77075,
      longitude: 106.67120,
      geofence_radius: 20,
      location_type: 'memorial',
      qr_code_url: '/?poi=VNQT-NHA-LUU-NIEM',
      created_at: new Date().toISOString(),
    },
    translations: {
      vi: {
        title: 'Nhà Lưu Niệm & Trưng Bày Lịch Sử Giáo Hội',
        desc: 'Không gian bảo tồn hàng trăm pháp bảo, kỷ vật, y bát và tư liệu lịch sử quý giá ghi dấu phong trào Phật giáo 1963 và lịch sử Việt Nam Quốc Tự.',
      },
      en: {
        title: 'Historical Memorial Hall & Buddhist Archives',
        desc: 'Safeguarding hundreds of sacred scriptures, robes, historical photographs, and priceless artifacts of the 1963 Buddhist movement.',
      },
      zh: {
        title: '历史纪念与法宝陈列馆',
        desc: '珍藏数百件珍贵历史文物、袈裟法器与历史档案，记录1963年佛教运动壮阔历史。',
      },
      ja: {
        title: '仏教歴史記念館・文化遺産展示館',
        desc: '貴重な法衣、経典、歴史写真など数百点を保存展示する記念館。1963年仏教運動の軌跡を伝えます。',
      },
      ko: {
        title: '역사 기념관 및 불교 아카이브',
        desc: '1963년 불교 운동의 귀중한 사진 자료, 법의, 경전 등 수백 점의 문화재를 전시한 기념관.',
      },
      fr: {
        title: 'Pavillon Mémorial & Archives Historiques',
        desc: 'Conservatoire de centaines de reliques, photographies et trésors retraçant le mouvement bouddhiste de 1963.',
      },
      de: {
        title: 'Historische Gedenkhalle & Buddhistisches Archiv',
        desc: 'Aufbewahrungsort von Hunderten heiligen Schriften, Roben und Dokumenten der buddhistischen Bewegung von 1963.',
      },
      es: {
        title: 'Sala Conmemorativa y Archivos Históricos',
        desc: 'Espacio que preserva cientos de escrituras sagradas, vestiduras y fotografías históricas del movimiento budista de 1963.',
      },
      ru: {
        title: 'Исторический Мемориальный Музей и Архивы',
        desc: 'Хранилище сотен священных реликвий, одеяний и исторических документов буддийского движения 1963 года.',
      },
      th: {
        title: 'หอจดหมายเหตุประวัติศาสตร์และโบราณวัตถุ',
        desc: 'สถานที่จัดแสดงวัตถุโบราณ ภาพถ่ายประวัติศาสตร์ และเอกสารสำคัญของขบวนการพุทธศาสนาปี 1963',
      },
      id: {
        title: 'Balai Peringatan Sejarah & Arsip Buddhis',
        desc: 'Menyimpan ratusan naskah suci, jubah, foto sejarah, dan artefak berharga dari gerakan Buddhis tahun 1963.',
      },
      it: {
        title: 'Padiglione Memoriale & Archivio Storico',
        desc: 'Custodia di centinaia di sacre scritture, paramenti e documenti storici del movimento buddhista del 1963.',
      },
    },
    media: [
      {
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
        caption_vi: 'Khu trưng bày tư liệu Phật giáo',
        caption_en: 'Exhibition of Buddhist historical treasures',
      },
    ],
  },
];
