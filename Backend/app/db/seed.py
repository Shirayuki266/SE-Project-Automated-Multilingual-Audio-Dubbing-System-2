import asyncio
import logging
from datetime import datetime, timezone
from app.core.config import settings
from app.core.security import hash_password
from app.db.mongo import get_db
from app.services.tts_service import tts_service
from app.services.qr_service import qr_service

logger = logging.getLogger("uvicorn")

SAMPLE_CAMPUS = {
    "campus_id": "viet-nam-quoc-tu",
    "name": "Việt Nam Quốc Tự",
    "address": "244 đường Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh",
    "center_latitude": 10.77185,
    "center_longitude": 106.67135,
    "default_zoom": 18.0,
    "description_vi": "Việt Nam Quốc Tự là trung tâm Phật giáo quy mô và có ý nghĩa lịch sử - tâm linh quan trọng bậc nhất của Thành phố Hồ Chí Minh và cả nước, trụ sở Ban Trị sự Giáo hội Phật giáo Việt Nam TP.HCM. Khuôn viên rộng gần 4 héc-ta gồm Bảo Tháp 13 tầng, Đại Chánh Điện, Tháp Chuông, Nhà Tổ và các công viên cảnh quan thanh tịnh.",
    "description_en": "Vietnam Quoc Tu is one of the most prominent Buddhist spiritual, cultural and historical centers in Ho Chi Minh City and Vietnam, serving as the headquarters of the Executive Committee of the Vietnam Buddhist Sangha in HCMC. The nearly 4-hectare campus features the 13-storey Stupa, the Great Main Sanctuary, the Bell Tower, and serene landscaped gardens.",
    "map_image_url": "/static/images/vietnam_quoc_tu_overview.jpg",
    "created_at": datetime.now(timezone.utc).isoformat(),
    "updated_at": datetime.now(timezone.utc).isoformat()
}

SAMPLE_POIS = [
    {
        "poi_id": "vnqt_tam_quan",
        "code": "POI_01",
        "campus_id": "viet-nam-quoc-tu",
        "latitude": 10.77125,
        "longitude": 106.67115,
        "geofence_radius": 18.0,
        "location_type": "outdoor",
        "order_index": 1,
        "is_active": True,
        "translations": {
            "vi": {
                "language_code": "vi",
                "title": "Cổng Tam Quan – Lối Vào Thanh Tịnh",
                "description": "Cổng Tam Quan Việt Nam Quốc Tự bề thế tọa lạc uy nghiêm trên trục đường Ba Tháng Hai. Ba tầng cổng tượng trưng cho Tam Giải Thoát Môn: Không môn, Vô tướng môn và Vô tác môn, dẫn dắt Phật tử rời xa bụi trần để bước vào chốn thiền môn thanh tịnh.",
                "audio_url": None,
                "audio_duration": 18.0
            },
            "en": {
                "language_code": "en",
                "title": "Tam Quan Gate – Gateway to Serenity",
                "description": "The grand Triple Gate stands majestically along 3/2 Boulevard. The three gateways symbolize the Three Doors of Liberation in Buddhism: Emptiness, Signlessness, and Aimlessness, leading pilgrims away from worldly dust into pure tranquility.",
                "audio_url": None,
                "audio_duration": 19.0
            }
        },
        "media": [
            {
                "image_url": "/static/images/tam_quan.jpg",
                "caption_vi": "Cổng Tam Quan uy nghiêm nhìn từ đường Ba Tháng Hai",
                "caption_en": "Majestic Tam Quan Triple Gate facing 3/2 Boulevard",
                "display_order": 1
            }
        ]
    },
    {
        "poi_id": "vnqt_bao_thap",
        "code": "POI_02",
        "campus_id": "viet-nam-quoc-tu",
        "latitude": 10.77160,
        "longitude": 106.67185,
        "geofence_radius": 20.0,
        "location_type": "outdoor",
        "order_index": 2,
        "is_active": True,
        "translations": {
            "vi": {
                "language_code": "vi",
                "title": "Bảo Tháp 13 Tầng – Biểu Tượng Bất Diệt",
                "description": "Bảo tháp cao 63 mét với 13 tầng lầu uy nghiêm, tượng trưng cho tinh thần đoàn kết của 13 tổ chức giáo phái Phật giáo trong phong trào đấu tranh bất bạo động năm 1963. Đây là nơi tôn trí thiêng liêng xá lợi Trái tim Bất diệt của Bồ tát Thích Quảng Đức – bảo vật vô giá minh chứng cho tâm từ bi và dũng lực hộ pháp của Phật giáo Việt Nam.",
                "audio_url": None,
                "audio_duration": 25.0
            },
            "en": {
                "language_code": "en",
                "title": "13-Storey Stupa – Eternal Memorial Tower",
                "description": "Rising 63 meters high with 13 majestic tiers, this memorial stupa honors the unity of 13 Buddhist organizations during the historic 1963 non-violent movement. It enshrines the revered immortal heart relic of Bodhisattva Thich Quang Duc, an eternal symbol of compassion and boundless sacrifice.",
                "audio_url": None,
                "audio_duration": 26.0
            }
        },
        "media": [
            {
                "image_url": "/static/images/bao_thap.jpg",
                "caption_vi": "Bảo Tháp 13 tầng vươn cao 63 mét giữa trời xanh",
                "caption_en": "The 63-meter 13-Storey Stupa soaring into the blue sky",
                "display_order": 1
            }
        ]
    },
    {
        "poi_id": "vnqt_chanh_dien",
        "code": "POI_03",
        "campus_id": "viet-nam-quoc-tu",
        "latitude": 10.77230,
        "longitude": 106.67140,
        "geofence_radius": 25.0,
        "location_type": "indoor",
        "order_index": 3,
        "is_active": True,
        "translations": {
            "vi": {
                "language_code": "vi",
                "title": "Tòa Đại Chánh Điện – Đại Tượng Phật 35 Tấn",
                "description": "Trái tim tâm linh của Việt Nam Quốc Tự là Tòa Đại Chánh Điện tráng lệ với mái ngói cong truyền thống. Nơi đây tôn trí pho đại tượng Đức Phật Bổn Sư Thích Ca Mâu Ni bằng đồng nguyên chất nặng 35 tấn, cao 7.5 mét. Đây là pho tượng Phật bằng đồng trong nhà lớn nhất Việt Nam, tỏa ánh quang minh từ bi cứu độ chúng sinh.",
                "audio_url": None,
                "audio_duration": 26.0
            },
            "en": {
                "language_code": "en",
                "title": "Main Sanctuary – 35-Ton Bronze Buddha",
                "description": "The spiritual heart of the temple is the Great Main Sanctuary, featuring classical curved tiled roofs. It enshrines a 35-ton pure bronze statue of Sakyamuni Buddha standing 7.5 meters tall—the largest indoor bronze Buddha in Vietnam, radiating serenity and boundless compassion.",
                "audio_url": None,
                "audio_duration": 27.0
            }
        },
        "media": [
            {
                "image_url": "/static/images/chanh_dien.jpg",
                "caption_vi": "Không gian trang nghiêm tôn kính bên trong Tòa Chánh Điện",
                "caption_en": "Solemn and revered interior of the Main Sanctuary",
                "display_order": 1
            }
        ]
    },
    {
        "poi_id": "vnqt_thap_chuong",
        "code": "POI_04",
        "campus_id": "viet-nam-quoc-tu",
        "latitude": 10.77170,
        "longitude": 106.67080,
        "geofence_radius": 16.0,
        "location_type": "outdoor",
        "order_index": 4,
        "is_active": True,
        "translations": {
            "vi": {
                "language_code": "vi",
                "title": "Tháp Chuông Đại Hồng Chung 3 Tấn",
                "description": "Tháp chuông cổ kính nằm bên tả khuôn viên, lưu giữ quả Đại Hồng Chung bằng đồng nặng gần 3 tấn, cao 2.9 mét, do các nghệ nhân đúc đồng nổi tiếng xứ Huế chế tác. Mỗi tiếng chuông ngân vang mang năng lượng thức tỉnh, xua tan phiền não, cầu nguyện quốc thái dân an và hòa bình thế giới.",
                "audio_url": None,
                "audio_duration": 24.0
            },
            "en": {
                "language_code": "en",
                "title": "Great Bell Tower – 3-Ton Sacred Bell",
                "description": "Located on the western flank, the Bell Tower houses a bronze Great Bell weighing nearly 3 tons and measuring 2.9 meters high, handcrafted by master artisans from Hue. Each resonant chime dispels worries, awakens mindfulness, and prays for world peace.",
                "audio_url": None,
                "audio_duration": 25.0
            }
        },
        "media": [
            {
                "image_url": "/static/images/thap_chuong.jpg",
                "caption_vi": "Đại Hồng Chung gần 3 tấn đúc bằng đồng cổ truyền",
                "caption_en": "Traditional handcrafted 3-ton bronze Great Bell",
                "display_order": 1
            }
        ]
    },
    {
        "poi_id": "vnqt_nha_to",
        "code": "POI_05",
        "campus_id": "viet-nam-quoc-tu",
        "latitude": 10.77285,
        "longitude": 106.67140,
        "geofence_radius": 18.0,
        "location_type": "indoor",
        "order_index": 5,
        "is_active": True,
        "translations": {
            "vi": {
                "language_code": "vi",
                "title": "Nhà Tổ – Tri Ân Chư Vị Tiền Bối",
                "description": "Nhà Tổ nằm phía sau Chánh Điện, nơi tôn thờ Bồ Đề Đạt Ma và chư vị Thánh Tăng, chư Trưởng lão Hòa thượng lãnh đạo Phật giáo Việt Nam qua các thời kỳ. Không gian toát lên vẻ trang nghiêm, gợi nhắc đạo lý 'Uống nước nhớ nguồn' và tinh thần tiếp nối mạng mạch truyền thừa Phật giáo.",
                "audio_url": None,
                "audio_duration": 22.0
            },
            "en": {
                "language_code": "en",
                "title": "Ancestral Hall – Honoring Buddhist Forefathers",
                "description": "Situated directly behind the Sanctuary, the Ancestral Hall venerates Patriarch Bodhidharma and revered late Buddhist leaders across generations, embodying the virtue of gratitude and Buddhist lineage continuity.",
                "audio_url": None,
                "audio_duration": 23.0
            }
        },
        "media": [
            {
                "image_url": "/static/images/nha_to.jpg",
                "caption_vi": "Không gian tưởng niệm chư Thánh Tăng tại Nhà Tổ",
                "caption_en": "Memorial hall venerating Patriarchs and Buddhist Masters",
                "display_order": 1
            }
        ]
    },
    {
        "poi_id": "vnqt_phong_trung_bay",
        "code": "POI_06",
        "campus_id": "viet-nam-quoc-tu",
        "latitude": 10.77210,
        "longitude": 106.67210,
        "geofence_radius": 18.0,
        "location_type": "indoor",
        "order_index": 6,
        "is_active": True,
        "translations": {
            "vi": {
                "language_code": "vi",
                "title": "Phòng Trưng Bày Văn Hóa Phật Giáo",
                "description": "Không gian lưu giữ các hiện vật, kinh sách cổ, mộc bản, chuỗi tràng hạt và kỷ vật quý giá của phong trào Phật giáo năm 1963. Du khách có thể chiêm ngưỡng những hình ảnh lịch sử vô giá và tìm hiểu về sự giao thoa văn hóa Phật giáo Việt Nam qua các triều đại.",
                "audio_url": None,
                "audio_duration": 23.0
            },
            "en": {
                "language_code": "en",
                "title": "Buddhist Cultural Exhibition Hall",
                "description": "An indoor gallery preserving sacred artifacts, ancient scriptures, woodblocks, and historical mementos of the 1963 Buddhist movement, illustrating centuries of Vietnamese Buddhist heritage.",
                "audio_url": None,
                "audio_duration": 24.0
            }
        },
        "media": [
            {
                "image_url": "/static/images/phong_trung_bay.jpg",
                "caption_vi": "Các cổ vật và pháp khí Phật giáo trưng bày tại bảo tàng",
                "caption_en": "Sacred artifacts and Buddhist liturgical instruments on display",
                "display_order": 1
            }
        ]
    },
    {
        "poi_id": "vnqt_vuon_lam_ty_ni",
        "code": "POI_07",
        "campus_id": "viet-nam-quoc-tu",
        "latitude": 10.77135,
        "longitude": 106.67195,
        "geofence_radius": 16.0,
        "location_type": "outdoor",
        "order_index": 7,
        "is_active": True,
        "translations": {
            "vi": {
                "language_code": "vi",
                "title": "Vườn Lâm Tỳ Ni & Hồ Sen Thanh Tịnh",
                "description": "Khu hoa viên tái hiện cảnh Thái tử Tất Đạt Đa đản sinh tại vườn Lâm Tỳ Ni với hình tượng bảy bước hoa sen nâng gót ngọc. Không gian cây xanh tĩnh mịch và hồ sen thơm ngát mang lại cảm giác an lạc, buông xả cho du khách hành hương.",
                "audio_url": None,
                "audio_duration": 21.0
            },
            "en": {
                "language_code": "en",
                "title": "Lumbini Garden & Lotus Pond",
                "description": "A serene garden depicting the nativity of Prince Siddhartha at Lumbini with seven lotus blossoms blossoming beneath his footsteps, surrounded by fragrance and quietude.",
                "audio_url": None,
                "audio_duration": 22.0
            }
        },
        "media": [
            {
                "image_url": "/static/images/vuon_lam_ty_ni.jpg",
                "caption_vi": "Tượng Phật Đản Sinh và hồ sen ngát hương",
                "caption_en": "Nativity of the Buddha surrounded by blooming lotuses",
                "display_order": 1
            }
        ]
    }
]

async def seed_data():
    db = get_db()
    
    # 1. Seed Admin User
    admin_count = await db["admin_users"].count_documents({"username": "admin"})
    if admin_count == 0:
        logger.info("Seeding default Admin user (admin / vietnamquoctu2026)...")
        await db["admin_users"].insert_one({
            "user_id": "admin_vnqt_01",
            "username": "admin",
            "password_hash": hash_password("vietnamquoctu2026"),
            "full_name": "Ban Quản Trị Việt Nam Quốc Tự",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user created successfully.")

    # 1.1 Seed Default Sample User (Phật Tử)
    user_count = await db["users"].count_documents({"username": "phattu"})
    if user_count == 0:
        logger.info("Seeding default user (phattu / 123456)...")
        await db["users"].insert_one({
            "user_id": "usr_phattu_01",
            "username": "phattu",
            "password_hash": hash_password("123456"),
            "full_name": "Nguyễn Thị Diệu Thiện",
            "dharma_name": "Diệu Thiện",
            "phone": "0901234567",
            "role": "user",
            "visited_pois": ["vnqt_tam_quan", "vnqt_bao_thap"],
            "wishes": ["Cầu cho gia đạo bình an, tai qua nạn khỏi, vạn sự cát tường."],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Default sample user created successfully.")

    # 2. Seed Campus
    campus = await db["campuses"].find_one({"campus_id": "viet-nam-quoc-tu"})
    if not campus:
        logger.info("Seeding campus info for Việt Nam Quốc Tự...")
        await db["campuses"].insert_one(SAMPLE_CAMPUS)
    
    # 3. Seed POIs with QR codes and Audio
    poi_count = await db["pois"].count_documents({"campus_id": "viet-nam-quoc-tu"})
    if poi_count == 0:
        logger.info(f"Seeding {len(SAMPLE_POIS)} POIs with QR codes and Edge-TTS audio...")
        for poi_data in SAMPLE_POIS:
            poi_id = poi_data["poi_id"]
            deep_link = f"{settings.FRONTEND_URL}/?poi={poi_id}"
            title_vi = poi_data["translations"]["vi"]["title"]
            
            # Generate QR Code
            qr_url = qr_service.save_poi_qr(poi_id, deep_link, title_vi)
            poi_data["qr_code_url"] = qr_url
            poi_data["created_at"] = datetime.now(timezone.utc).isoformat()
            poi_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            # Pre-generate Edge-TTS audio for each language
            for lang in ["vi", "en"]:
                trans = poi_data["translations"].get(lang)
                if trans and trans.get("description"):
                    text_to_speak = f"{trans['title']}. {trans['description']}"
                    filename = f"{poi_id}_{lang}.mp3"
                    try:
                        audio_url = await tts_service.synthesize(text=text_to_speak, language=lang, filename=filename)
                        trans["audio_url"] = audio_url
                    except Exception as e:
                        logger.warning(f"Failed pre-generating TTS for {poi_id} ({lang}): {e}")
                        trans["audio_url"] = f"/static/audio/{filename}"

            await db["pois"].insert_one(poi_data)
        logger.info("All POIs seeded successfully with QR codes and audio!")
