import { MongoClient } from 'mongodb';
import { rawSeedPOIs } from '../src/server/repositories/seedPOIs.js';
import { hashPassword } from '../src/utils/cryptoUtils.js';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'vietnam_quoc_tu';

if (!mongoUri) {
  console.error('❌ Lỗi: Biến môi trường MONGODB_URI chưa được thiết lập!');
  console.log('\n👉 Vui lòng đặt MONGODB_URI trong file .env hoặc truyền trực tiếp:');
  console.log('   MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net" npm run seed:mongo\n');
  process.exit(1);
}

async function seedMongoDBAtlas() {
  const uri = mongoUri as string;
  console.log('☸️  Bắt đầu kết nối MongoDB Atlas...');
  console.log(`   Cluster URL: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log(`   Database: ${dbName}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Kết nối thành công đến MongoDB Atlas!');

    const db = client.db(dbName);

    // 1. Campuses collection
    console.log('\n📦 1. Khởi tạo Collection "campuses"...');
    const campusCol = db.collection('campuses');
    await campusCol.deleteMany({});
    await campusCol.insertOne({
      campus_id: 'vnqt-campus-01',
      name: 'Việt Nam Quốc Tự',
      address: '244 Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh',
      center_latitude: 10.77125,
      center_longitude: 106.67140,
      description_vi: 'Trung tâm hành chính - văn hóa tâm linh Phật giáo TP. Hồ Chí Minh, ngôi đại tự tiêu biểu cho tinh thần bất khuất vì đạo pháp và dân tộc.',
      description_en: 'Spiritual and cultural hub of Vietnamese Buddhism in Ho Chi Minh City, an iconic sanctuary of Buddhist resilience and peace.',
      map_image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
      created_at: new Date().toISOString(),
    });
    console.log('   ✓ Đã nạp thông tin khuôn viên Việt Nam Quốc Tự');

    // 2. Admin Users collection
    console.log('\n👤 2. Khởi tạo Collection "admin_users"...');
    const adminCol = db.collection('admin_users');
    await adminCol.deleteMany({});
    await adminCol.createIndex({ username: 1 }, { unique: true });
    await adminCol.insertOne({
      user_id: 'adm-001',
      username: 'admin',
      password_hash: hashPassword('vnqt@2026'),
      full_name: 'Ban Trị Sự Việt Nam Quốc Tự',
      created_at: new Date().toISOString(),
    });
    console.log('   ✓ Đã tạo tài khoản quản trị viên: admin / vnqt@2026');

    // 3. POIs with GeoJSON standard
    console.log('\n📍 3. Khởi tạo Collection "pois" & Spatial Index 2dsphere...');
    const poiCol = db.collection('pois');
    await poiCol.deleteMany({});
    await poiCol.createIndex({ location: '2dsphere' });
    await poiCol.createIndex({ code: 1 }, { unique: true });

    const poiDocuments = rawSeedPOIs.map((item) => ({
      ...item.poi,
      location: {
        type: 'Point',
        coordinates: [item.poi.longitude, item.poi.latitude], // GeoJSON standard [lng, lat]
      },
    }));
    await poiCol.insertMany(poiDocuments);
    console.log(`   ✓ Đã nạp ${poiDocuments.length} điểm chiêm bái và thiết lập chỉ mục 2dsphere`);

    // 4. POI Translations
    console.log('\n🌐 4. Khởi tạo Collection "poi_translations"...');
    const transCol = db.collection('poi_translations');
    await transCol.deleteMany({});
    await transCol.createIndex({ poi_id: 1, language_code: 1 }, { unique: true });

    const translationDocs: any[] = [];
    rawSeedPOIs.forEach((item) => {
      Object.entries(item.translations).forEach(([lang, data]) => {
        translationDocs.push({
          translation_id: `trans-${item.poi.poi_id}-${lang}`,
          poi_id: item.poi.poi_id,
          language_code: lang,
          title: data.title,
          introduction: data.intro || (data.desc.length > 100 ? data.desc.slice(0, data.desc.indexOf('.') > 0 ? data.desc.indexOf('.') + 1 : 100) : data.desc),
          description: data.desc,
          audio_url: data.audioUrl || `/audio/${item.poi.poi_id}-${lang}.mp3`,
          is_ai_generated: false,
        });
      });
    });
    await transCol.insertMany(translationDocs);
    console.log(`   ✓ Đã nạp ${translationDocs.length} bản dịch thuyết minh đa ngôn ngữ`);

    // 5. POI Media
    console.log('\n🖼️  5. Khởi tạo Collection "poi_media"...');
    const mediaCol = db.collection('poi_media');
    await mediaCol.deleteMany({});
    const mediaDocs: any[] = [];
    rawSeedPOIs.forEach((item) => {
      item.media.forEach((m, idx) => {
        mediaDocs.push({
          media_id: `media-${item.poi.poi_id}-${idx + 1}`,
          poi_id: item.poi.poi_id,
          image_url: m.url,
          caption_vi: m.caption_vi,
          caption_en: m.caption_en,
          display_order: idx + 1,
        });
      });
    });
    await mediaCol.insertMany(mediaDocs);
    console.log(`   ✓ Đã nạp ${mediaDocs.length} hình ảnh & tư liệu chiêm bái`);

    // 6. Daily Visits collection (1 thiết bị = 1 người = tối đa 1 lượt/ngày, đúng 4 trường: _id, visitorHash, day, createdAt)
    console.log('\n📊 6. Khởi tạo Collection "daily_visits" (Chuẩn 4 trường & TTL Index 24h)...');
    const dailyVisitsCol = db.collection('daily_visits');
    await dailyVisitsCol.createIndex({ day: 1, visitorHash: 1 }, { unique: true });
    await dailyVisitsCol.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
    console.log('   ✓ Đã thiết lập chỉ mục kép chống trùng lặp (day + visitorHash) và TTL 24h tự hủy');

    // DỌN DẸP BẤT KỲ COLLECTION DƯ THỪA NÀO - CHỈ GIỮ ĐÚNG 6 COLLECTIONS CHUẨN
    const ALLOWED = new Set(['campuses', 'pois', 'poi_translations', 'poi_media', 'admin_users', 'daily_visits']);
    const existingCols = await db.listCollections().toArray();
    for (const c of existingCols) {
      if (!ALLOWED.has(c.name) && !c.name.startsWith('system.')) {
        await db.collection(c.name).drop();
        console.log(`   ✓ Đã dọn dẹp collection dư thừa: "${c.name}"`);
      }
    }

    console.log('\n==========================================================');
    console.log('🎉 SEED DỮ LIỆU LÊN MONGODB ATLAS THÀNH CÔNG 100%!');
    console.log('   Database: ' + dbName);
    console.log('   Chỉ giữ đúng 6 collections chuẩn:');
    ALLOWED.forEach((col) => console.log(`   - ${col}`));
    console.log('==========================================================\n');
  } catch (err: any) {
    console.error('❌ Lỗi khi thao tác với MongoDB Atlas:', err.message);
  } finally {
    await client.close();
  }
}

seedMongoDBAtlas();
