import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

let cachedConnection: typeof mongoose | null = null;
let isConnecting = false;

export async function connectMongoDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const mongoUrl = process.env.MONGODB_URI;
  if (!mongoUrl || mongoUrl.includes('your-mongodb') || (!mongoUrl.startsWith('mongodb://') && !mongoUrl.startsWith('mongodb+srv://'))) {
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      // Local development default
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
  }

  if (isConnecting) {
    let attempts = 0;
    while (isConnecting && attempts < 20) {
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
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return null;
  } finally {
    isConnecting = false;
  }
}
