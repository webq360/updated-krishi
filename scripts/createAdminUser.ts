import mongoose from 'mongoose';
import User from '../src/lib/models/User';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

dotenv.config();

async function createAdminUser() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishi-bondhu';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@gmail.com';
    const password = 'adminadmin';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️  Admin user already exists:', email);
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const adminUser = new User({
      email,
      password,
      firstName: 'Admin',
      lastName: 'User',
      name: 'Admin User',
      role: 'admin',
      isVerified: true
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔐 Password: adminadmin');
    console.log('👤 Role: admin');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
