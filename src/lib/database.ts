// MongoDB Database Connection Module
import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishi-bondhu';
    
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    isConnected = false;
    throw error;
  }
}

export function getDB() {
  if (!isConnected || !mongoose.connection) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return mongoose.connection;
}

export default mongoose;
