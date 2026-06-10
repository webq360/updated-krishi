import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import * as crypto from 'crypto';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createAdminInFirestore() {
  const email = 'admin@gmail.com';
  const password = 'adminadmin';
  const hashedPassword = hashPassword(password);
  
  // Generate a custom UID for admin
  const adminUid = 'admin-' + crypto.randomBytes(8).toString('hex');

  try {
    console.log('🔄 Creating admin user in Firestore...');
    
    // Create admin user document
    await setDoc(doc(db, 'users', adminUid), {
      uid: adminUid,
      email: email,
      password: hashedPassword, // Hashed password
      displayName: 'Administrator',
      role: 'admin',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phoneNumber: '+8801700000000',
      district: 'Dhaka',
      farmSize: 'N/A',
      farmType: 'Administration',
      verified: true,
      active: true,
      emailVerified: true
    });

    console.log('✅ Admin user created in Firestore');

    // Create admin settings
    await setDoc(doc(db, 'adminSettings', adminUid), {
      userId: adminUid,
      permissions: {
        manageUsers: true,
        managePosts: true,
        manageProducts: true,
        manageReports: true,
        viewAnalytics: true,
        editContent: true,
        deleteContent: true,
        banUsers: true,
        fullAccess: true
      },
      createdAt: new Date().toISOString()
    });

    console.log('✅ Admin settings created');

    // Create admin credentials reference (for login)
    await setDoc(doc(db, 'credentials', email), {
      uid: adminUid,
      email: email,
      password: hashedPassword,
      role: 'admin',
      lastLogin: null
    });

    console.log('✅ Admin credentials stored');

    console.log('\n🎉 Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', email);
    console.log('🔑 Password: ', password);
    console.log('👤 UID:      ', adminUid);
    console.log('🔐 Hash:     ', hashedPassword.substring(0, 20) + '...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change password after first login!');
    console.log('💡 Login at: http://localhost:3000/#/login\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

createAdminInFirestore();
