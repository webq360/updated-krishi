import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const ATLAS_DEFAULT_URI = "mongodb+srv://fakhrulislammaruf360_db_user:BRF5MFpLzTewrHZY@ams.sntx5zp.mongodb.net/krishi-bondhu?retryWrites=true&w=majority&appName=ams";

let cachedConnection: typeof mongoose | null = null;
let isConnecting = false;

export async function connectMongoDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  let mongoUrl = process.env.MONGODB_URI;
  if (!mongoUrl || mongoUrl.includes('your-mongodb') || (!mongoUrl.startsWith('mongodb://') && !mongoUrl.startsWith('mongodb+srv://'))) {
    mongoUrl = ATLAS_DEFAULT_URI;
  }

  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 25) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }
  }

  isConnecting = true;
  try {
    cachedConnection = await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      family: 4,
      retryWrites: true,
      w: 'majority',
    });
    console.log('✅ MongoDB connected successfully to Atlas');
    return cachedConnection;
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error?.message || error);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      try {
        cachedConnection = await mongoose.connect('mongodb://localhost:27017/krishi-bondhu', {
          serverSelectionTimeoutMS: 2000,
        });
        return cachedConnection;
      } catch {
        return null;
      }
    }
    return null;
  } finally {
    isConnecting = false;
  }
}
