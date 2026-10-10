// MongoDB ulanishi. Vercel funksiyalari qayta-qayta ishga tushadi,
// shuning uchun ulanishni global o‘zgaruvchida saqlab, qayta ishlatamiz.
const { MongoClient, ObjectId } = require('mongodb');

let cached = global.__nasiyaMongo || { client: null, promise: null, indexed: false };
global.__nasiyaMongo = cached;

// Testlar uchun soxta bazani ulash imkoniyati
let override = null;
function setTestDb(db) { override = db; }

async function getDb() {
  if (override) return override;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw Object.assign(new Error('MONGODB_URI sozlanmagan'), { status: 500 });
  if (!cached.promise) {
    cached.promise = new MongoClient(uri, { maxPoolSize: 5 }).connect();
  }
  cached.client = await cached.promise;
  const db = cached.client.db(process.env.MONGODB_DB || 'shaffof_nasiya');
  if (!cached.indexed) {
    cached.indexed = true;
    await Promise.all([
      db.collection('sellers').createIndex({ phone: 1 }, { unique: true }),
      db.collection('sellers').createIndex({ linkCode: 1 }),
      db.collection('sales').createIndex({ sellerId: 1, createdAt: -1 }),
      db.collection('sales').createIndex({ customerToken: 1 }, { unique: true }),
      db.collection('notifications').createIndex({ sellerId: 1, key: 1 }, { unique: true }),
    ]).catch(() => {});
  }
  return db;
}

function toId(id) {
  try { return new ObjectId(String(id)); } catch { return null; }
}

module.exports = { getDb, toId, ObjectId, setTestDb };
