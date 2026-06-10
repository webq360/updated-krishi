import mongoose from 'mongoose';
import User from '../src/lib/models/User';
import dotenv from 'dotenv';

dotenv.config();

async function resetAdminUser() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishi-bondhu';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    const email = 'admin@gmail.com';
    const password = 'adminadmin';

    // Delete existing user if exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('🗑️  Deleting existing admin user...');
      await User.deleteOne({ email });
      console.log('✅ Existing user deleted');
    }

    // Create new admin user
    const adminUser = new User({
      email,
      password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isVerified: true
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔐 Password: adminadmin');
    console.log('👤 Role: admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminUser();
