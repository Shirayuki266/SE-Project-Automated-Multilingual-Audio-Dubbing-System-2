import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'vietnam_quoc_tu';

const ALLOWED_COLLECTIONS = new Set([
  'campuses',
  'pois',
  'poi_translations',
  'poi_media',
  'admin_users',
  'daily_visits',
]);

async function cleanupMongoDB() {
  console.log('☸️  Bắt đầu kiểm tra và dọn dẹp MongoDB Collections...');
  console.log(`   Database mục tiêu: "${dbName}"`);

  if (!mongoUri || mongoUri.includes('username:password') || mongoUri.trim() === '') {
    console.warn('⚠️ MONGODB_URI chưa được thiết lập trong .env. Bỏ qua kết nối từ xa.');
    console.log('ℹ️ 6 Collections chuẩn được quy định bao gồm:');
    ALLOWED_COLLECTIONS.forEach((col) => console.log(`   - ${col}`));
    return;
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('✅ Kết nối thành công đến MongoDB Atlas!');
    const db = client.db(dbName);

    const existingCollections = await db.listCollections().toArray();
    console.log(`\n📋 Danh sách collections hiện có (${existingCollections.length}):`);
    existingCollections.forEach((c) => console.log(`   - ${c.name}`));

    let droppedCount = 0;
    for (const col of existingCollections) {
      if (col.name.startsWith('system.')) continue;
      if (!ALLOWED_COLLECTIONS.has(col.name)) {
        console.log(`🗑️  Phát hiện collection dư thừa: "${col.name}" -> Tiến hành xóa...`);
        await db.collection(col.name).drop();
        droppedCount++;
        console.log(`   ✓ Đã xóa collection: "${col.name}"`);
      }
    }

    // Đảm bảo tạo index chuẩn cho 6 collections
    console.log('\n🔒 Cập nhật chỉ mục (Indexes) cho 6 collections chuẩn:');
    await db.collection('pois').createIndex({ location: '2dsphere' }, { background: true });
    await db.collection('pois').createIndex({ code: 1 }, { unique: true });
    await db.collection('poi_translations').createIndex({ poi_id: 1, language_code: 1 }, { unique: true });
    await db.collection('daily_visits').createIndex({ day: 1, visitorHash: 1 }, { unique: true });
    await db.collection('daily_visits').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
    await db.collection('admin_users').createIndex({ username: 1 }, { unique: true });
    await db.collection('campuses').createIndex({ campus_id: 1 }, { unique: true });
    await db.collection('poi_media').createIndex({ poi_id: 1, display_order: 1 });
    console.log('   ✓ Đã đảm bảo index 2dsphere, unique compound (day + visitorHash), TTL 24h.');

    const finalCollections = await db.listCollections().toArray();
    console.log(`\n🎉 Dọn dẹp hoàn tất! Số collection đã xóa: ${droppedCount}`);
    console.log(`✅ Danh sách collections hiện tại (${finalCollections.length}):`);
    finalCollections.forEach((c) => console.log(`   ✓ ${c.name}`));
  } catch (err: any) {
    console.error('❌ Lỗi khi dọn dẹp MongoDB:', err.message);
  } finally {
    await client.close();
  }
}

cleanupMongoDB();
