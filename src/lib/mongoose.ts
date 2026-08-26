import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;
let isConnecting = false;

export async function connectMongoDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (isConnecting) {
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }
  }

  isConnecting = true;
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishi-bondhu';
    cachedConnection = await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false,
    });
    console.log('✅ MongoDB connected successfully');
    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return null;
  } finally {
    isConnecting = false;
  }
}
