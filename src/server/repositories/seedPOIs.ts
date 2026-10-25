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
        intro: 'Cổng Tam Quan là biểu tượng cửa ngõ linh thiêng mở ra không gian thanh tịnh giữa lòng TP. Hồ Chí Minh náo nhiệt, đón tiếp chư tôn đức Tăng Ni, Phật tử và du khách bốn phương bước vào cõi thiền an lạc.',
        desc: 'Công trình được kiến tạo uy nghiêm với kiến trúc tam quan truyền thống mang đậm bản sắc văn hóa Phật giáo Việt Nam kết hợp phong cách thời Lý – Trần. Ba vòm cửa tượng trưng cho Tam Giải Thoát Môn trong Phật giáo: Không Môn (vạn pháp giai không), Vô Tướng Môn (không chấp trước hình tướng), và Vô Tác Môn (không tạo tác nghiệp chướng). Phía trước cổng là Quảng trường Đài Sen trắng tinh khiết, nơi Phật tử khởi tâm thanh tịnh, buông bỏ muộn phiền trước khi đảnh lễ Tam Bảo.',
      },
      en: {
        title: 'Tam Quan Gate & White Lotus Plaza',
        intro: 'The majestic Tam Quan Gate serves as the sacred entrance welcoming pilgrims and travelers from the bustling metropolis into deep Buddhist serenity.',
        desc: 'Built in traditional Vietnamese Buddhist architecture with elegant Lý–Trần dynasty motifs, the three archways symbolize the Three Doors of Liberation in Buddhist philosophy: Emptiness (Śūnyatā), Signlessness (Animitta), and Wishlessness (Apraṇihita). Facing the vibrant 3 Thang 2 Avenue, the surrounding White Lotus Plaza allows visitors to cleanse their minds and establish inner peace before entering the main courtyard.',
      },
      zh: {
        title: '三关门与白莲花广场',
        intro: '庄严肃穆的三关山门是引领信众与游人脱离尘嚣、步入清凉佛国净土的庄严通道。',
        desc: '三道拱门象征佛教的核心智慧“三解脱门”：空门、无相门与无愿门。建筑承袭越南李朝与陈朝古朴风韵，飞檐凌空，古朴典雅。门前白莲花广场洁净祥和，供游人整肃身心、虔诚瞻礼。',
      },
      ja: {
        title: '三門（山門）と白蓮広場',
        intro: '都会の喧騒を離れ、清らかな聖域へと参拝者を迎える壮麗な三門。安らぎの瞑想空間への入り口です。',
        desc: '李朝・陳朝の伝統建築様式を受け継ぐ三つの門は、仏教の教えである「空・無相・無作」の三解脱門を象徴しています。白蓮が咲き誇る広場から門をくぐることで、参拝者は日常の雑念を払い、清浄な心で本堂へと向かいます。',
      },
      ko: {
        title: '삼관문과 백련 광장',
        intro: '번화한 도심에서 벗어나 성스러운 사찰로 들어서는 웅장한 정문으로, 평화로운 불교의 세계로 안내합니다.',
        desc: '베트남 전통 리-쩐 왕조 양식의 곡선미를 지닌 삼관문은 해탈의 세 가지 문인 공(空), 무상(無相), 무원(無願)을 상징합니다. 정문 앞 순백의 연꽃 광장은 참배객이 번뇌를 내려놓고 경건한 마음을 갖추도록 돕습니다.',
      },
      fr: {
        title: 'Porte Tam Quan & Place du Lotus',
        intro: 'Entrée majestueuse ouvrant vers la sérénité bouddhique au cœur de la métropole animée de Hô Chi Minh-Ville.',
        desc: 'Les trois arcades majestueuses symbolisent les Trois Portes de la Libération bouddhique : le Vide, le Sans-Signe et le Sans-Désir. Son architecture inspirée des dynasties Lý et Trần invite au recueillement et à la paix de l esprit.',
      },
      de: {
        title: 'Tam-Quan-Tor & Weißer Lotusplatz',
        intro: 'Das monumentale Drei-Bögen-Tor öffnet den Weg aus der geschäftigen Großstadt in die heilsame Stille des buddhistischen Heiligtums.',
        desc: 'Architektonisch im traditionellen vietnamesischen Stil der Lý- und Trần-Dynastien gestaltet, verkörpern die drei Durchgänge die buddhistischen drei Tore der Befreiung: Leerheit, Formlosigkeit und Wunschlosigkeit.',
      },
      es: {
        title: 'Puerta Tam Quan y Plaza del Loto Blanco',
        intro: 'Entrada majestuosa de tres arcos que recibe a los peregrinos hacia la sagrada tranquilidad budista.',
        desc: 'Los tres arcos representan las Tres Puertas de la Liberación budista. Su arquitectura de estilo clásico Lý-Trần evoca la historia milenaria del budismo en Vietnam y prepara al visitante para la meditación.',
      },
      ru: {
        title: 'Ворота Там Куан и Площадь Белого Лотоса',
        intro: 'Величественные трехпролетные ворота, ведущие из шумного мегаполиса в обитель священного буддийского покоя.',
        desc: 'Три свода ворот символизируют Три Врат Освобождения в буддизме: Пустоту, Беспризнаковость и Бесстрастие. Площадь белых лотосов перед храмом настраивает паломников на умиротворение и созерцание.',
      },
      th: {
        title: 'ซุ้มประตูตามกวานและลานดอกบัวขาว',
        intro: 'ซุ้มประตูสามช่องอันสง่างาม ต้อนรับผู้แสวงบุญเข้าสู่ดินแดนแห่งความสงบอันศักดิ์สิทธิ์ใจกลางนครโฮจิมินห์',
        desc: 'ซุ้มประตูเป็นสัญลักษณ์แห่งประตูหลุดพ้นสามประการในพระพุทธศาสนา ได้แก่ สุญญตา อนิมิตตะ และอัปปณิหิตะ สถาปัตยกรรมผสมผสานศิลปะเวียดนามโบราณสมัยราชวงศ์ลี้และเจิ่นอย่างวิจิตรบรรจง',
      },
      id: {
        title: 'Gerbang Tam Quan & Plaza Teratai Putih',
        intro: 'Pintu gerbang megah bercabang tiga yang menyambut para peziarah menuju kedamaian suci di tengah hiruk-pikuk kota.',
        desc: 'Tiga pintu lengkung melambangkan Tiga Pintu Pembebasan dalam ajaran Buddha. Plaza teratai di depannya menjadi tempat menenangkan pikiran sebelum melangkah masuk ke pelataran suci.',
      },
      it: {
        title: 'Porta Tam Quan & Piazza del Loto Bianco',
        intro: 'Maestosa porta a tre archi che accoglie i pellegrini verso la sacra serenità buddhista nel cuore della città.',
        desc: 'I tre archi rappresentano le Tre Porte della Liberazione buddhista. Ispirata all architettura tradizionale delle dinastie Lý e Trần, introduce il visitatore alla contemplazione e alla quiete interiore.',
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
        intro: 'Đại Hùng Bửu Điện là trung tâm văn hóa tâm linh và hành chính tối thượng của Việt Nam Quốc Tự, nơi tôn trí pho tượng Đức Bổn Sư Thích Ca Mâu Ni bằng đồng mạ vàng lớn nhất nước.',
        desc: 'Ngôi bảo điện được xây dựng đồ sộ với kiến trúc mái cong cổ kính nhiều tầng chồng diêm. Gian chính điện tôn trí pho tượng Đức Bổn Sư Thích Ca Mâu Ni bằng đồng mạ vàng uy nghi, nặng 35 tấn và cao 7,5m – là một trong những pho tượng Phật bằng đồng trong nhà lớn nhất Việt Nam. Bao quanh điện Phật là hệ thống cột gỗ lim vững chãi, chạm khắc hoa văn hoa sen và mây cuộn tinh xảo. Ánh sáng vàng dịu từ kim thân Đức Thế Tôn tỏa chiếu khắp bảo điện, đem đến cho hành giả cảm giác an trú vững chãi trong chánh niệm.',
      },
      en: {
        title: 'Great Heroic Sanctuary (Đại Hùng Bửu Điện)',
        intro: 'The magnificent Main Sanctuary stands as the spiritual heart of Việt Nam Quốc Tự, enshrining Vietnam largest indoor gilded bronze Buddha statue.',
        desc: 'The sanctuary rises majestically with traditional curved multi-tiered roofs and solid ironwood pillars. The central altar enshrines the 35-ton, 7.5-meter gilded bronze statue of Shakyamuni Buddha, cast with supreme craftsmanship. Surrounded by exquisite lotus carvings and serene ambient chanting, pilgrims experience profound reverence, compassion, and inner stillness upon entering.',
      },
      zh: {
        title: '大雄宝殿（Đại Hùng Bửu Điện）',
        intro: '大雄宝殿是越南国寺的核心殿堂，供奉着全越南室内体量最大的纯铜贴金释迦牟尼佛圣像。',
        desc: '大殿重檐歇山顶巍峨庄严，立柱皆为上等铁木。殿内正中供奉重达35吨、高7.5米的释迦牟尼佛金身佛像，相好庄严，光降大千。殿堂四壁雕梁画栋，洋溢着浓郁的越式佛教艺术精粹与慈悲祥和氛围。',
      },
      ja: {
        title: '大雄宝殿（本堂 - Đại Hùng Bửu Điện）',
        intro: 'ベトナム国寺の中心を成す本堂。国内最大級の金箔青銅釈迦牟尼仏坐像が安置されています。',
        desc: '重層屋根と頑丈な木造円柱が織りなす威厳ある大殿堂。中央には重量35トン、高さ7.5メートルに及ぶ釈迦牟尼仏坐像が穏やかな慈悲の光を放っています。香煙たなびく厳粛な空間で、心静かに祈りを捧げることができます。',
      },
      ko: {
        title: '대웅보전 (본전 - Đại Hùng Bửu Điện)',
        intro: '베트남 국사의 가장 신성한 중심 전각으로, 베트남 최대 규모의 금동 석가모니불 좌상이 봉안되어 있습니다.',
        desc: '높이 7.5미터, 무게 35톤의 웅장한 금동 석가모니불이 법당 중앙에서 온화한 자비의 빛을 발하고 있습니다. 웅장한 다층 목조 지붕과 정교한 연꽃 조각이 어우러져 경건한 불교 예술의 진수를 보여줍니다.',
      },
      fr: {
        title: 'Grand Sanctuaire Đại Hùng Bửu Điện',
        intro: 'Le Grand Sanctuaire constitue le cœur spirituel de la pagode, abritant la plus grande statue intérieure de Bouddha du pays.',
        desc: 'Édifié dans la plus pure tradition architecturale bouddhiste vietnamienne, le sanctuaire accueille la statue monumentale du Bouddha Shakyamuni en bronze doré de 35 tonnes et 7,5 mètres de haut, rayonnant de sagesse et de sérénité.',
      },
      de: {
        title: 'Große Haupthalle (Đại Hùng Bửu Điện)',
        intro: 'Die Haupthalle bildet das spirituelle Zentrum mit Vietnams größter vergoldeter Bronze-Buddha-Statue im Innenraum.',
        desc: 'Unter den traditionell geschwungenen Ziegeldächern thront die 35 Tonnen schwere und 7,5 Meter hohe Statue des Buddha Shakyamuni. Die kunstvollen Holzschnitzereien und der Duft von Sandelholz schaffen eine Oase tiefen Friedens.',
      },
      es: {
        title: 'Gran Santuario Đại Hùng Bửu Điện',
        intro: 'El santuario principal consagra la majestuosa estatua de Buda Shakyamuni de bronce dorado más grande de Vietnam.',
        desc: 'Con una impresionante estatua de 35 toneladas y 7,5 metros de altura, el santuario principal ofrece un espacio de profunda devoción y contemplación rodeado de fina artesanía tradicional vietnamita.',
      },
      ru: {
        title: 'Главный Храм (Đại Hùng Bửu Điện)',
        intro: 'Духовное сердце пагоды, где установлена 35-тонная позолоченная бронзовая статуя Будды Шакьямуни высотой 7,5 метров.',
        desc: 'Величественное святилище с многоярусными изогнутыми крышами хранит колоссальную фигуру Будды. Атмосфера благоговения и тихие песнопения наполняют сердце каждого паломника глубоким покоем.',
      },
      th: {
        title: 'พระอุโบสถประธาน (Đại Hùng Bửu Điện)',
        intro: 'ศูนย์กลางจิตวิญญาณของวัดเวียดนามกว๊อกตื่อ ประดิษฐานพระพุทธรูปศากยมุนีสำริดปิดทองคำในร่มที่ใหญ่ที่สุดในเวียดนาม',
        desc: 'พระพุทธรูปทองสัมฤทธิ์หนัก 35 ตัน สูง 7.5 เมตร ประดิษฐานอย่างสง่างามท่ามกลางเสาไม้แกะสลักลวดลายบัวอันวิจิตร บรรยากาศเงียบสงบเปี่ยมด้วยพลังแห่งสมาธิและความเมตตา',
      },
      id: {
        title: 'Aula Utama (Đại Hùng Bửu Điện)',
        intro: 'Pusat spiritual wihara yang memuliakan rupang Buddha Shakyamuni dari perunggu berlapis emas terbesar di Vietnam.',
        desc: 'Dengan rupang Buddha seberat 35 ton dan setinggi 7,5 meter, aula suci ini menjadi tempat pemujaan dan meditasi utama yang memancarkan ketenangan serta welas asih tak terbatas.',
      },
      it: {
        title: 'Grande Santuario Đại Hùng Bửu Điện',
        intro: 'Il cuore spirituale della pagoda che custodisce la monumentale statua in bronzo dorato del Buddha Shakyamuni.',
        desc: 'Con un peso di 35 tonnellate e un altezza di 7,5 metri, la statua del Buddha emana pace e compassione universale, accolta sotto i maestosi tetti curvi della tradizione buddhista vietnamita.',
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
        intro: 'Bảo tháp 13 tầng cao 63m là ngọn tháp đá cao nhất Việt Nam, nơi phụng thờ Xá Lợi Trái Tim Bất Diệt của Bồ Tát Thích Quảng Đức.',
        desc: 'Bảo tháp Đa Bảo được tôn tạo nhằm ghi dấu phong trào Phật giáo năm 1963 và tinh thần bất khuất của 13 tổ chức, giáo phái Phật giáo Việt Nam cùng đoàn kết vì hòa bình và tự do tín ngưỡng. Tòa tháp cao 63m vươn thẳng lên trời xanh với đỉnh búp sen vàng rực rỡ. Bên trong bảo tháp là nơi lưu giữ tôn nghiêm Xá Lợi Quả Tim Bất Diệt của Bồ Tát Thích Quảng Đức – minh chứng hùng hồn cho ngọn lửa từ bi bất diệt, cùng hàng nghìn pho tượng Phật quý giá.',
      },
      en: {
        title: '13-Storey Stupa (Heart Relic of Thích Quảng Đức)',
        intro: 'Standing at 63 meters, Vietnam highest stone stupa enshrines the immortal Heart Relic of Bodhisattva Thích Quảng Đức.',
        desc: 'The 13-tier stupa commemorates the unified resilience of 13 Buddhist associations during the 1963 Buddhist movement. Topped with a golden lotus spire, it serves as a holy sanctuary preserving the miraculous unburnt Heart Relic of Bodhisattva Thích Quảng Đức, who self-immolated in 1963 as a supreme plea for religious equality and compassion.',
      },
      zh: {
        title: '十三层多宝佛塔（释广德菩萨心脏舍利）',
        intro: '高63米的十三层多宝佛塔为全越最高石塔，神圣奉安释广德菩萨不灭心脏舍利。',
        desc: '宝塔十三层象征1963年护教运动中精诚团结的十三支佛教组织。塔顶耸立金色莲花宝顶，塔内永久奉安释广德菩萨金刚不坏的心脏舍利圣物，见证着佛教慈悲、无畏与和平的不朽光辉。',
      },
      ja: {
        title: '十三重多宝塔（釈広徳菩薩 不滅の心臓舎利）',
        intro: 'ベトナム最高峰の石造多宝塔（63m）。釈広徳（ティク・クアン・ドック）菩薩の不滅の心臓仏舎利を奉安する至高の聖地です。',
        desc: '1963年の仏教徒連帯運動に賛同した13の宗派・団体を記念する十三層の塔。頂上には金色の蓮華宝珠が輝き、内部には焼身供養により不滅となった釈広徳菩薩の心臓舎利が厳重に安置されています。',
      },
      ko: {
        title: '13층 다보탑 (틱꽝득 보살 심장 사리탑)',
        intro: '높이 63미터로 베트남에서 가장 높은 석조 다보탑이자 틱꽝득 보살의 불멸의 심장 사리를 영구 봉안한 성지입니다.',
        desc: '1963년 불교 자유 수호 운동 당시 단결했던 13개 불교 단체를 상징합니다. 탑 정상의 금빛 연꽃 봉우리가 돋보이며, 자비와 평화를 위해 소신공양을 감행했던 틱꽝득 보살의 불멸의 심장 사리가 모셔져 있습니다.',
      },
      fr: {
        title: 'Stupa à 13 Étages (Relique du Cœur de Thích Quảng Đức)',
        intro: 'Le plus haut stupa du Vietnam (63m), abritant la relique sacrée du Cœur Immortel de Bồ Tát Thích Quảng Đức.',
        desc: 'Érigé en mémoire des 13 organisations bouddhistes unies en 1963, ce chef-d œuvre architectural s élève vers le ciel avec sa flèche en lotus doré, protégeant la relique miraculeuse du cœur incombustible du Bodhisattva Thích Quảng Đức.',
      },
      de: {
        title: '13-stöckige Stupa (Herzreliquie von Thích Quảng Đức)',
        intro: 'Vietnams höchste Steinstupa (63m) bewahrt die unsterbliche Herzreliquie von Bodhisattva Thích Quảng Đức.',
        desc: 'Die 13 Etagen erinnern an den Zusammenschluss der 13 buddhistischen Organisationen im Jahr 1963. Gekrönt von einer goldenen Lotusspitze, birgt die Stupa das wundersam unversehrte Herz des Märtyrers Thích Quảng Đức.',
      },
      es: {
        title: 'Estupa de 13 Pisos (Reliquia del Corazón de Thích Quảng Đức)',
        intro: 'La estupa de piedra más alta de Vietnam (63m), santuario sagrado que custodia la Reliquia Inmortal del Corazón de Bồ Tát Thích Quảng Đức.',
        desc: 'Símbolo de paz y no violencia, conmemora el histórico movimiento budista de 1963. En su interior se resguarda el corazón incorrupto de Thích Quảng Đức como emblema universal de devoción y compasión.',
      },
      ru: {
        title: '13-ярусная Ступа (Сердечная Реликвия Thích Quảng Đức)',
        intro: 'Самая высокая каменная ступа во Вьетнаме (63м), хранящая бессмертную сердечную реликвию Бодхисаттвы Thích Quảng Đức.',
        desc: 'Тринадцать ярусов символизируют единство тринадцати буддийских объединений 1963 года. Золотой шпиль в форме лотоса устремлен в небо, а внутри бережно хранится несгораемое сердце великого монаха.',
      },
      th: {
        title: 'พระมหาเจดีย์ 13 ชั้น (พระสารีริกธาตุหัวใจ Thích Quảng Đức)',
        intro: 'เจดีย์หินสูงที่สุดในเวียดนาม (63 เมตร) ประดิษฐานพระสารีริกธาตุหัวใจอันเป็นอมตะของพระโพธิสัตว์ทิกกว๋างดึ๊ก',
        desc: 'มหาเจดีย์ 13 ชั้นสร้างขึ้นเพื่อรำลึกถึงความสามัคคีของ 13 องค์กรพุทธศาสนาในปี 1963 ยอดเจดีย์ประดับด้วยดอกบัวทองคำ ภายในเป็นสถานที่ศักดิ์สิทธิ์สูงสุดที่ประดิษฐานหัวใจที่ไม่ไหม้ไฟของพระทิกกว๋างดึ๊ก',
      },
      id: {
        title: 'Stupa 13 Lantai (Relik Hati Thích Quảng Đức)',
        intro: 'Stupa batu tertinggi di Vietnam (63m), tempat suci bersemayamnya Relik Hati Abadi dari Bồ Tát Thích Quảng Đức.',
        desc: 'Tiga belas lantainya melambangkan persatuan tiga belas tradisi Buddhis pada gerakan damai 1963. Stupa ini menjadi saksi keteguhan spiritual dan kasih sayang yang menginspirasi perdamaian dunia.',
      },
      it: {
        title: 'Stupa a 13 Piani (Reliquia del Cuore di Thích Quảng Đức)',
        intro: 'Lo stupa in pietra più alto del Vietnam (63m), santuario che custodisce la sacra Reliquia Immortale del Cuore di Bồ Tát Thích Quảng Đức.',
        desc: 'I 13 piani commemorano l unione di 13 organizzazioni buddhiste nel 1963. La cuspide a bocciolo di loto dorato s innalza verso il cielo, custode del cuore miracolosamente scampato al rogo di Thích Quảng Đức.',
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
        title: 'Quả Đại Hồng Chung 3 Tấn (Lầu Chuông)',
        intro: 'Đại Hồng Chung tại lầu chuông Việt Nam Quốc Tự là pháp khí âm thanh thiêng liêng, đúc bằng đồng đỏ nặng gần 3 tấn với âm vang thanh lương nhiệm mầu.',
        desc: 'Quả chuông u minh được các nghệ nhân đúc đồng nổi tiếng tại Huế đúc thủ công tinh xảo, trên thân chuông khắc bài minh kệ chữ Hán và thần chú tiêu tai giải nạn cùng hoa văn rồng mây thời Lý – Trần. Mỗi sớm mai và hoàng hôn, tiếng chuông chùa ngân dài thấu tận cõi u minh, thức tỉnh tâm mê muội, xua tan phiền não và nguyện cầu quốc thái dân an, phong điều vũ thuận, muôn loài an lạc.',
      },
      en: {
        title: '3-Ton Great Bell Tower (Đại Hồng Chung)',
        intro: 'The sacred 3-ton bronze bell tower awakens spiritual mindfulness across the city with deep, resonating harmonics.',
        desc: 'Handcrafted by master artisans from Huế, this magnificent bell features classical dragon and lotus engravings alongside sacred Buddhist dhāraṇī mantras. Traditionally chimed at dawn and twilight, its deep vibrations dispel worldly suffering, awaken mindful compassion, and send peaceful blessings throughout all realms.',
      },
      zh: {
        title: '三吨大洪钟（Đại Hồng Chung）',
        intro: '重达3吨的青铜大洪钟，是越式传统法器铸造工艺之杰作，晨钟暮鼓涤荡尘劳。',
        desc: '此钟由顺化著名铸铜名匠手工浇铸而成，钟体铭刻龙纹与经咒铭文。每当钟声响起，清越悠远，回荡天际，寓意破除一切众生烦恼愚痴，祈愿国泰民安、世界和平。',
      },
      ja: {
        title: '三トン大梵鐘（鐘楼 - Đại Hồng Chung）',
        intro: '重量約3トンの大梵鐘。清らかな響きは人々の煩悩を払い、深い安らぎをもたらします。',
        desc: '古都フエの熟練鋳造職人によって鋳造された見事な梵鐘。表面には伝統的な龍文様と吉祥の偈文が刻まれています。朝夕に響き渡る荘厳な鐘の音は、生きとし生けるものの苦しみを和らげ、智慧の目覚めを促します。',
      },
      ko: {
        title: '3톤 대홍종 (Đại Hồng Chung)',
        intro: '3톤 무게의 웅장한 청동 대홍종으로, 맑고 깊은 울림이 온갖 번뇌를 씻어줍니다.',
        desc: '후에의 장인들이 전통 기법으로 주조한 대홍종으로, 표면에는 용 문양과 액운을 없애는 다라니가 새겨져 있습니다. 아침저녁으로 울려 퍼지는 종소리는 도심 속 중생의 고뇌를 잠재우고 평온을 선사합니다.',
      },
      fr: {
        title: 'Tour de la Grande Cloche (Đại Hồng Chung)',
        intro: 'Cloche sacrée en bronze de 3 tonnes dont le son profond dissipe les tourments de l esprit.',
        desc: 'Coulée à la main par des maîtres fondeurs de Hué, la cloche est gravée de dragons célestes et de mantras bienfaisants. Son timbre grave et apaisant invite à l éveil de la conscience.',
      },
      de: {
        title: 'Große 3-Tonnen-Glocke (Đại Hồng Chung)',
        intro: 'Heilige Bronzeglocke mit einem Gewicht von fast 3 Tonnen. Ihr Hall bringt inneren Frieden und Achtsamkeit.',
        desc: 'Meisterhaft in Huế gegossen und mit traditionellen Drachenmotiven verziert, ertönt die Glocke zu den Gebetszeiten am Morgen und Abend, um den Geist zu klären und Segen zu spenden.',
      },
      es: {
        title: 'Gran Campana de 3 Toneladas (Đại Hồng Chung)',
        intro: 'Campana sagrada de bronce de 3 toneladas cuyo sonido disipa las aflicciones y despierta la serenidad.',
        desc: 'Elaborada artesanalmente por maestros fundidores de Huế, sus sagradas vibraciones invitan a la atención plena y simbolizan la compasión infinita hacia todos los seres vivos.',
      },
      ru: {
        title: 'Колокольня с 3-тонным Колоколом (Đại Hồng Chung)',
        intro: 'Священный бронзовый колокол весом около 3 тонн, звон которого пробуждает осознанность и покой.',
        desc: 'Отлитый вручную в древнем городе Хюэ, колокол украшен изображениями драконов и священными сутрами. Его глубокий бархатистый звон рассеивает тревоги и дарит внутреннюю гармонию.',
      },
      th: {
        title: 'หอระฆังใหญ่ 3 ตัน (Đại Hồng Chung)',
        intro: 'ระฆังสำริดศักดิ์สิทธิ์หนักเกือบ 3 ตัน เสียงกังวานช่วยขจัดความกังวลและนำความสงบสู่จิตใจ',
        desc: 'หล่อขึ้นด้วยช่างฝีมือโบราณจากเมืองเว้ สลักอักขระคาถาและลวดลายมังกร เสียงระฆังที่ดังก้องกังวานในยามเช้าและพลบค่ำช่วยปลุกสติและแผ่เมตตาไปยังสรรพสัตว์',
      },
      id: {
        title: 'Menara Genta 3 Ton (Đại Hồng Chung)',
        intro: 'Genta perunggu suci seberat hampir 3 ton. Dentang suaranya membangkitkan kesadaran dan kedamaian batin.',
        desc: 'Dibuat dengan keahlian tempa tradisional Huế, genta ini memancarkan getaran resonansi mendalam yang meredakan beban batin serta menebarkan kedamaian bagi seluruh semesta.',
      },
      it: {
        title: 'Torre della Grande Campana (Đại Hồng Chung)',
        intro: 'Sacra campana in bronzo di circa 3 tonnellate. I suoi rintocchi risvegliano pace interiore e consapevolezza.',
        desc: 'I rintocchi profondi e armoniosi risuonano ogni alba e tramonto, invitando i devoti a fermarsi, respirare e riscoprire la chiarezza della mente.',
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
        intro: 'Pho tượng Mẹ Quán Thế Âm Bồ Tát lộ thiên uy nghiêm ngự giữa khuôn viên thanh tịnh, hiện thân của tình thương vô điều kiện và đức hạnh lắng nghe nỗi đau của trần thế.',
        desc: 'Được tạc từ đá cẩm thạch nguyên khối tinh khiết, tôn tượng Bồ Tát Quán Âm cao quý đứng trên đài sen hồng, tay phải bắt ấn cát tường, tay trái cầm bình tịnh thủy chứa nước cam lộ tưới mát muôn loài. Ánh mắt Người bao dung nhìn xuống đàn con trần thế với lòng lân mẫn vô hạn. Khách hành hương khi dừng chân trước đài Bồ Tát thường tĩnh lặng chắp tay niệm danh hiệu Nam Mô Đại Bi Quán Thế Âm Bồ Tát để tìm lại sự bình yên trong tâm hồn.',
      },
      en: {
        title: 'Outdoor Avalokiteshvara Bodhisattva Statue',
        intro: 'The majestic outdoor marble statue of Avalokiteshvara (Quán Thế Âm) embodies boundless compassion and the grace of deep listening.',
        desc: 'Sculpted from pure white marble standing gracefully upon a blooming lotus pedestal, the Bodhisattva of Compassion holds the holy nectar vase pouring healing blessings upon all sentient beings. Visitors frequently pause here in silent meditation or chant the sacred mantra of compassion to cultivate loving-kindness.',
      },
      zh: {
        title: '露天观世音菩萨圣像',
        intro: '庄严圣洁的露天观世音菩萨圣像立于清幽园林中，体现慈悲济世、普门示现之弘深誓愿。',
        desc: '菩萨圣像通体由纯白汉白玉雕琢而成，伫立于莲台之上，右手施无畏印，左手托净瓶甘露。圣容慈祥慈悯，俯瞰尘寰，令一切来瞻礼者涤荡尘心、启发菩提。',
      },
      ja: {
        title: '露天 観世音菩薩立像',
        intro: '境内に佇む慈悲深き観世音菩薩の白亜立像。人々の苦しみに耳を傾け、慈愛を注ぐ象徴です。',
        desc: '純白の大理石から彫り出された菩薩像は、蓮華座の上に立ち、甘露の入った水瓶を手にしています。その慈愛に満ちた眼差しは、参拝者の心を温かく包み込み、深い安寧をもたらします。',
      },
      ko: {
        title: '야외 관세음보살 입상',
        intro: '사찰 경내에 자애롭게 서 계신 야외 관세음보살상으로, 중생의 고통을 굽어살피는 대자대비의 상징입니다.',
        desc: '순백의 대리석으로 조성된 관세음보살상은 감로수병을 들고 연화대 위에 서서 세상의 모든 아픔을 치유하는 자비의 손길을 내밀고 있습니다.',
      },
      fr: {
        title: 'Statue d Avalokiteshvara en Plein Air',
        intro: 'La statue du Bodhisattva de la Compassion tenant le vase de nectar sacré pour apaiser tous les êtres.',
        desc: 'Sculptée dans un marbre blanc éclatant sur un socle de lotus, la divinité de la bienveillance infinie offre un havre de prière et de recueillement spirituel.',
      },
      de: {
        title: 'Freiluft-Statue des Bodhisattva Avalokiteshvara',
        intro: 'Die mitfühlende Bodhisattva der Barmherzigkeit mit der Nektarvase zur Heilung und Segnung aller Wesen.',
        desc: 'Aus edlem weißem Marmor gehauen, symbolisiert diese Freiluft-Skulptur das unerschöpfliche Mitgefühl und die Gabe des tiefen Zuhörens im Buddhismus.',
      },
      es: {
        title: 'Estatua al Aire Libre de Avalokiteshvara',
        intro: 'La compasiva Bodhisattva de la Misericordia sosteniendo el jarrón de néctar para bendecir a todos los seres.',
        desc: 'Tallada en mármol blanco sobre una flor de loto, representa la ternura y la escucha atenta de las plegarias humanas.',
      },
      ru: {
        title: 'Статуя Бодхисаттвы Авалокитешвары под открытым небом',
        intro: 'Милосердная статуя Бодхисаттвы с сосудом священного нектара, дарующая мир и сострадание.',
        desc: 'Белоснежная мраморная фигура Бодхисаттвы возвышается над цветущим лотосом, источая благословение и душевное исцеление для всех странников.',
      },
      th: {
        title: 'พระโพธิสัตว์กวนอิมกลางแจ้ง',
        intro: 'พระโพธิสัตว์แห่งความเมตตาถือคนโทน้ำทิพย์ ประทานพรอันประเสริฐและความสงบแก่สรรพสัตว์',
        desc: 'สลักจากหินอ่อนสีขาวบริสุทธิ์ ยืนสง่างามบนฐานดอกบัวบาน หลั่งน้ำทิพย์แห่งความเมตตาเพื่อปัดเป่าความทุกข์ยากของชาวโลก',
      },
      id: {
        title: 'Rupang Bodhisatwa Avalokiteshvara Terbuka',
        intro: 'Bodhisatwa Welas Asih memegang guci air amrta suci, mencurahkan berkah kedamaian bagi semua makhluk.',
        desc: 'Dipahat dari marmer putih alami, sosok welas asih ini mengajak setiap insan untuk menyemai cinta kasih dan ketenangan batin.',
      },
      it: {
        title: 'Statua all Aperto del Bodhisattva Avalokiteshvara',
        intro: 'La compassionevole Bodhisattva della Misericordia che regge il vaso del nettare sacro per donare benedizione.',
        desc: 'Un capolavoro in candido marmo su fiore di loto, rifugio silenzioso dove ritrovare consolazione ed equilibrio interiore.',
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
        intro: 'Vườn Bồ Đề và Hồ Sen An Lạc là không gian sinh thái tâm linh xanh mát, tái hiện khung cảnh thiêng liêng nơi Đức Phật Thích Ca Mâu Ni đắc đạo dưới cội Bồ Đề.',
        desc: 'Cội Bồ đề cổ thụ tại đây được chiết nhánh và thỉnh trực tiếp từ cây Bồ Đề thiêng tại Thánh địa Bồ Đề Đạo Tràng (Bodh Gaya, Ấn Độ) – nơi Đức Phật chứng ngộ Vô thượng Chánh đẳng Chánh giác hơn 2600 năm trước. Cạnh cội thiêng là hồ sen với những đóa sen hồng ngát hương và lối đi thiền hành rợp bóng mát, nơi chư Tăng Ni và Phật tử thực tập thiền hành, nuôi dưỡng tâm định tĩnh và hòa mình trọn vẹn với thiên nhiên thanh khiết.',
      },
      en: {
        title: 'Bodhi Grove & Tranquil Lotus Pond',
        intro: 'A lush ecological sanctuary featuring a sacred Bodhi tree direct descendant from Bodh Gaya, India.',
        desc: 'Cuttings of this sacred Ficus religiosa were ritually brought from Bodh Gaya, where Prince Siddhartha attained supreme enlightenment. Accompanied by fragrant pink lotus waters and shaded walking paths, it is a favored haven for mindful contemplation and breathing meditation.',
      },
      zh: {
        title: '菩提圣树园与安乐莲池',
        intro: '移植自印度菩提迦耶圣地的菩提树与清幽荷花池，清凉怡人，为经行禅修圣地。',
        desc: '此圣树由佛陀成道处菩提迦耶正源分栽而来，郁郁葱葱。湖畔莲花幽香，绿树成荫，为僧俗大众行香静心、体会禅悦之佳境。',
      },
      ja: {
        title: '菩提樹の庭と安楽蓮池',
        intro: 'インド・ブッダガヤの菩提樹から株分けされた聖木と、静かな蓮池。歩行瞑想に最適な緑の庭園です。',
        desc: '釈尊が悟りを開かれたブッダガヤの菩提樹直系の若木が青々と茂り、蓮池の芳香とともに参拝者を爽やかな静寂へと誘います。',
      },
      ko: {
        title: '보리수 정원과 안락 연못',
        intro: '인도 부다가야 성지에서 옮겨 심은 성스러운 보리수와 고요한 연꽃 연못이 있는 명상 공간입니다.',
        desc: '붓다께서 깨달음을 얻으신 바로 그 보리수나무의 후계목이 자라는 곳으로, 산책로를 따라 걸으며 평화롭게 마음을 챙길 수 있습니다.',
      },
      fr: {
        title: 'Jardin de la Bodhi & Bassin de Lotus',
        intro: 'Arbre sacré de la Bodhi issu de Bodh Gaya en Inde bordant un bassin de lotus paisible pour la méditation.',
        desc: 'Cet espace verdoyant abrite un descendant direct de l arbre sous lequel le Bouddha atteignit l Éveil, idéal pour la pratique de la marche méditative.',
      },
      de: {
        title: 'Bodhi-Hain & Stiller Lotusteich',
        intro: 'Heiliger Bodhi-Baum aus Bodh Gaya, Indien, an einem ruhigen Lotusteich für Gehmeditation.',
        desc: 'Ein stiller Gartenbereich, der den Geist erfrischt und den Besuchern ermöglicht, die heilsame Kraft der Natur und der Achtsamkeit zu erfahren.',
      },
      es: {
        title: 'Jardín del Árbol Bodhi y Estanque de Lotos',
        intro: 'Árbol Bodhi sagrado traído de Bodh Gaya, India, junto a un estanque de lotos ideal para meditación.',
        desc: 'Espacio de verdor sereno donde la naturaleza y la espiritualidad se funden para inspirar una calma duradera.',
      },
      ru: {
        title: 'Сад Дерева Бодхи и Лотосовый Пруд',
        intro: 'Священное дерево Бодхи из Бодх-Гаи (Индия) у спокойного лотосового пруда для медитации.',
        desc: 'Прямой потомок священного древа Просветления Будды растет в окружении душистых лотосов, создавая безупречные условия для созерцания.',
      },
      th: {
        title: 'สวนโพธิ์พุทธคยาและสระบัวอันสงบ',
        intro: 'ต้นพระศรีมหาโพธิ์ศักดิ์สิทธิ์ที่นำกิ่งมาจากพุทธคยา ประเทศอินเดีย ข้างสระบัวอันเงียบสงบสำหรับเจริญสมาธิ',
        desc: 'บรรยากาศร่มรื่นใต้ร่มเงาของต้นพระศรีมหาโพธิ์ ช่วยเกื้อหนุนให้จิตใจสงบนิ่งและเข้าถึงความโปร่งเบาในธรรม',
      },
      id: {
        title: 'Taman Pohon Bodhi & Kolam Teratai Damai',
        intro: 'Pohon Bodhi suci keturunan langsung dari Bodh Gaya, India, di samping kolam teratai yang hening untuk meditasi jalan.',
        desc: 'Tempat ideal untuk melatih kesadaran saat berjalan dan menikmati harmoni alam yang menenteramkan.',
      },
      it: {
        title: 'Giardino dell Albero della Bodhi & Stagno di Loti',
        intro: 'Sacro albero della Bodhi originario di Bodh Gaya in India, accanto a uno specchio d acqua con fiori di loto per la meditazione.',
        desc: 'Un angolo di frescura e meditazione camminata, permeato dal profumo dei fiori di loto e dalla quiete naturale.',
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
        intro: 'Nhà Hậu Tổ là chốn phụng thờ trang nghiêm các vị Lịch Đại Tổ Sư khai sáng và các bậc cao tăng tiền bối có công đức lớn lao với đạo pháp và dân tộc.',
        desc: 'Nằm phía sau Chính Điện, Nhà Tổ mang phong cách kiến trúc thuần Việt ấm cúng với rường cột sơn son thếp vàng. Nơi đây thiết lập bàn thờ Đức Tổ Sư Bồ Đề Đạt Ma – vị Sơ Tổ của Thiền tông Đông độ, cùng long vị chư vị Hòa thượng tiền bối lãnh đạo Giáo hội qua các thời kỳ. Đây là không gian nhắc nhở truyền thống "Uống nước nhớ nguồn", tri ân công đức tiền nhân đã gìn giữ mạch nguồn chánh pháp trường tồn.',
      },
      en: {
        title: 'Ancestral Hall (Nhà Hậu Tổ)',
        intro: 'The Patriarchal Memorial Hall pays solemn tribute to Buddhist Patriarchs and venerable masters through the generations.',
        desc: 'Located behind the Main Sanctuary, the Ancestral Hall honors Bodhidharma, the First Patriarch of Zen Buddhism, alongside late supreme Buddhist leaders of Vietnam. With warm lacquered woodwork and ancestor tablets, it embodies the sacred duty of remembering and honoring Buddhist lineage and cultural roots.',
      },
      zh: {
        title: '祖师殿（Nhà Hậu Tổ）',
        intro: '祖师殿庄严奉祀历代开山祖师与高僧大德，感念祖师开山弘法、续佛慧命之崇高功德。',
        desc: '位于正殿之后，殿宇古色古香，中央设东土禅宗初祖达摩祖师法座，并奉安越南佛教近代高僧神位，寄托饮水思源、法脉长存之至诚追思。',
      },
      ja: {
        title: '開山祖師堂（Nhà Hậu Tổ）',
        intro: '歴代の祖師方や仏法興隆に尽力された高僧を奉祀し、その大徳を称える祖師堂です。',
        desc: '本堂の後方に位置し、禅宗初祖達磨大師をはじめ、ベトナム仏教の歴代指導者の尊像と位牌が安置されています。法の恩に感謝を捧げる場所です。',
      },
      ko: {
        title: '조사실 (Nhà Hậu Tổ)',
        intro: '역대 종사 및 불법 홍포에 헌신한 고승 대덕들을 모신 숭고한 사당입니다.',
        desc: '본전 뒤편에 자리 잡고 있으며, 달마대사를 비롯한 역대 조사 스님들의 위패를 모셔 불법의 전승과 선각자들의 은혜를 기립니다.',
      },
      fr: {
        title: 'Salle des Maîtres Ancêtres (Nhà Hậu Tổ)',
        intro: 'Sanctuaire dédié à la lignée des patriarches bouddhistes et vénérables maîtres fondateurs.',
        desc: 'Située derrière le sanctuaire principal, cette salle rend hommage à Bodhidharma et aux maîtres vietnamiens ayant préservé la flamme de l enseignement.',
      },
      de: {
        title: 'Ahnenhalle der Meister (Nhà Hậu Tổ)',
        intro: 'Halle zur Würdigung der Ahnenlinie buddhistischer Patriarchen und ehrwürdiger Meister.',
        desc: 'Erinnert an Bodhidharma und die historischen Würdenträger, die das Erbe des Dharma über Jahrhunderte hinweg bewahrt haben.',
      },
      es: {
        title: 'Sala de los Maestros Ancestrales (Nhà Hậu Tổ)',
        intro: 'Santuario en honor a los patriarcas budistas y venerables maestros que preservaron el Dharma.',
        desc: 'Un espacio sagrado para recordar la continuidad de las enseñanzas y la gratitud hacia los antepasados espirituales.',
      },
      ru: {
        title: 'Зал Предков и Патриархов (Nhà Hậu Tổ)',
        intro: 'Святилище, посвященное линии буддийских патриархов и наставников.',
        desc: 'Здесь почитают память Бодхидхармы и вьетнамских духовных лидеров, посвятивших жизнь служению истине и народу.',
      },
      th: {
        title: 'วิหารบูรพาจารย์ (Nhà Hậu Tổ)',
        intro: 'สถานที่สักการะบูรพาจารย์และพระเถระผู้มีคุณูปการในการเผยแผ่พระพุทธศาสนา',
        desc: 'ประดิษฐานรูปเคารพพระโพธิธรรมและอดีตพระมหาเถระ เพื่อแสดงความกตัญญูกตเวทิตาต่อผู้สืบทอดพระสัทธรรม',
      },
      id: {
        title: 'Aula Leluhur dan Mahaguru (Nhà Hậu Tổ)',
        intro: 'Tempat suci penghormatan bagi silsilah para Patriark dan Yang Arya pembina Dharma.',
        desc: 'Mengenang jasa Bodhidharma dan para guru agung yang telah melestarikan intisari ajaran luhur lintas generasi.',
      },
      it: {
        title: 'Sala degli Antenati e Patriarchi (Nhà Hậu Tổ)',
        intro: 'Santuario dedicato al lignaggio dei Patriarchi e maestri che hanno preservato il Dharma.',
        desc: 'Custodisce la memoria di Bodhidharma e degli insigni maestri buddhisti vietnamiti, invitando alla gratitudine filiale verso i predecessori.',
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
        intro: 'Nhà Lưu Niệm là nơi lưu giữ và trưng bày hàng trăm tư liệu, hình ảnh, kỷ vật và pháp bảo quý giá gắn liền với lịch sử 60 năm thăng trầm của Phật giáo Việt Nam.',
        desc: 'Không gian trưng bày được bố trí khoa học và trang trọng, bảo tồn những hiện vật thiêng liêng như y bát, chuỗi tràng hạt của chư vị danh tăng, hình ảnh tư liệu về phong trào Phật giáo năm 1963, quá trình kiến lập ngôi chùa Việt Nam Quốc Tự nguyên thủy năm 1964 và đại trùng tu năm 2017. Nơi đây là điểm đến văn hóa giáo dục sâu sắc cho thế hệ trẻ tìm hiểu về lịch sử kiên cường và lòng yêu chuộng hòa bình của Phật giáo Việt Nam.',
      },
      en: {
        title: 'Historical Memorial Hall & Buddhist Archives',
        intro: 'The Memorial Museum preserves hundreds of rare historical archives, relics, and artifacts chronicling 60 years of modern Vietnamese Buddhist history.',
        desc: 'Featuring well-curated exhibitions, visitors can observe historical monastic robes, prayer beads, handwritten letters, and rare documentary photographs of the 1963 movement and the 1964 foundation of Việt Nam Quốc Tự. It serves as a vital educational center illuminating Vietnam Buddhist resilience, peaceful diplomacy, and cultural heritage.',
      },
      zh: {
        title: '历史纪念与法宝陈列馆',
        intro: '珍藏数百件珍贵历史文物、袈裟法器与历史档案，生动记录六十年来越南佛教的光辉历程。',
        desc: '展馆典藏有诸山长老法衣锡杖、手迹墨宝、1963年历史图片及1964年开山创寺的珍贵实物，是广大信众与学者探寻越南佛教近现代历史的宝库。',
      },
      ja: {
        title: '仏教歴史記念館・文化遺産展示館',
        intro: '貴重な法衣、経典、歴史写真など数百点を保存展示する記念館。ベトナム仏教60年の軌跡を伝えます。',
        desc: '1963年の平和運動に関する貴重な公文書や歴代管長ゆかりの品々を展示。平和を希求した仏教徒の不屈の歩みを深く学ぶことができます。',
      },
      ko: {
        title: '역사 기념관 및 불교 아카이브',
        intro: '1963년 불교 운동의 귀중한 사진 자료, 법의, 경전 등 수백 점의 문화재를 전시한 기념관입니다.',
        desc: '초기 창건 당시의 유물과 고승들의 유품을 통해 베트남 불교가 겪어온 역사와 평화 수호의 정신을 생생하게 전달합니다.',
      },
      fr: {
        title: 'Pavillon Mémorial & Archives Historiques',
        intro: 'Conservatoire de centaines de reliques, photographies et trésors retraçant le mouvement bouddhiste de 1963.',
        desc: 'Un parcours muséographique émouvant retraçant l histoire contemporaine de la pagode et son rôle pacificateur au sein de la nation.',
      },
      de: {
        title: 'Historische Gedenkhalle & Buddhistisches Archiv',
        intro: 'Aufbewahrungsort von Hunderten heiligen Schriften, Roben und Dokumenten der buddhistischen Bewegung von 1963.',
        desc: 'Präsentiert wertvolle historische Artefakte und vermittelt eindrucksvoll die reiche spirituelle Tradition und Friedensphilosophie.',
      },
      es: {
        title: 'Sala Conmemorativa y Archivos Históricos',
        intro: 'Espacio que preserva cientos de escrituras sagradas, vestiduras y fotografías históricas del movimiento budista de 1963.',
        desc: 'Una valiosa colección documental que atestigua el compromiso del budismo con la paz y la cultura en Vietnam.',
      },
      ru: {
        title: 'Исторический Мемориальный Музей и Архивы',
        intro: 'Хранилище сотен священных реликвий, одеяний и исторических документов буддийского движения 1963 года.',
        desc: 'Экспозиция освещает ключевые этапы становления пагоды и стойкость буддийского сообщества во имя мира.',
      },
      th: {
        title: 'หอจดหมายเหตุประวัติศาสตร์และโบราณวัตถุ',
        intro: 'สถานที่จัดแสดงวัตถุโบราณ ภาพถ่ายประวัติศาสตร์ และเอกสารสำคัญของขบวนการพุทธศาสนาปี 1963',
        desc: 'จัดแสดงจีวรโบราณ คัมภีร์ใบลาน และภาพเหตุการณ์ประวัติศาสตร์ที่สะท้อนถึงการอุทิศตนเพื่อสันติภาพของคณะสงฆ์เวียดนาม',
      },
      id: {
        title: 'Balai Peringatan Sejarah & Arsip Buddhis',
        intro: 'Menyimpan ratusan naskah suci, jubah, foto sejarah, dan artefak berharga dari gerakan Buddhis tahun 1963.',
        desc: 'Pameran sejarah mendalam yang memperlihatkan dedikasi umat Buddha dalam merawat perdamaian dan kerukunan bangsa.',
      },
      it: {
        title: 'Padiglione Memoriale & Archivio Storico',
        intro: 'Custodia di centinaia di sacre scritture, paramenti e documenti storici del movimento buddhista del 1963.',
        desc: 'Offre un viaggio attraverso la storia moderna della pagoda, celebrando l impegno instancabile per la pace e la conservazione del patrimonio culturale.',
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
