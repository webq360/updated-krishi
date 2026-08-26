import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DataDocument from '../src/lib/models/DataDocument';
import User from '../src/lib/models/User';

dotenv.config();

async function seedDatabase() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishi-bondhu';
    console.log('🔄 Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoUrl);
    console.log('✅ Connected to MongoDB');

    // 1. Seed Admin User
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        email: adminEmail,
        password: 'adminadmin',
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        role: 'admin',
        isVerified: true
      });
      await adminUserSave(admin);
      console.log('✅ Seeded Admin User: admin@gmail.com');
    }

    // Helper to insert or skip collection items
    async function seedCollection(collectionName: string, items: any[]) {
      const count = await DataDocument.countDocuments({ collectionName });
      if (count === 0) {
        for (const item of items) {
          const doc = new DataDocument({
            collectionName,
            data: item
          });
          await doc.save();
        }
        console.log(`✅ Seeded ${items.length} items into [${collectionName}]`);
      } else {
        console.log(`ℹ️  [${collectionName}] already has ${count} records. Skipping.`);
      }
    }

    async function adminUserSave(user: any) {
      await user.save();
    }

    // 2. Seed Species
    const speciesData = [
      {
        name_bn: 'হোলস্টেইন ফ্রিজিয়ান গরু',
        name_en: 'Holstein Friesian Cow',
        category: 'livestock',
        origin: 'Netherlands / Global',
        description_bn: 'উচ্চ দুগ্ধ উৎপাদনকারী জাত। বাংলাদেশে ডেইরি খামারে সর্বাধিক জনপ্রিয়।',
        description_en: 'High milk yielding breed, extremely popular in commercial dairy farms in Bangladesh.',
        image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53',
        feedAdvice: 'এবিএস ক্যাটেল ফিড (ABS Cattle Feed) এবং পুষ্টিকর সাইলেজ ব্যবহার করুন।'
      },
      {
        name_bn: 'ব্ল্যাক বেঙ্গল ছাগল',
        name_en: 'Black Bengal Goat',
        category: 'livestock',
        origin: 'Bangladesh',
        description_bn: 'বাংলাদেশের বিশ্বখ্যাত মাংস ও চামড়ার জন্য পরিচিত দেশি জাতের ছাগল।',
        description_en: 'World-famous indigenous goat breed known for superior meat quality and skin.',
        image: 'https://images.unsplash.com/photo-1524024973431-2ad916746881',
        feedAdvice: 'উন্নত দানাদার খাদ্য এবং সবুজ ঘাস সরবরাহ করুন।'
      },
      {
        name_bn: 'সোনালী মুরগি',
        name_en: 'Sonali Chicken',
        category: 'poultry',
        origin: 'Bangladesh',
        description_bn: 'রোড আইল্যান্ড রেড ও ফাউমি জাতের ক্রসব্রিড। রোগ প্রতিরোধ ক্ষমতা বেশি এবং দেশি স্বাদের মাংস।',
        description_en: 'Crossbreed of RIR and Fayoumi with high disease resistance and indigenous taste.',
        image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7',
        feedAdvice: 'এবিএস পোল্ট্রি ফিড (ABS Poultry Feed) নিয়মিত প্রদান করুন।'
      },
      {
        name_bn: 'রুই মাছ',
        name_en: 'Rohu Carp',
        category: 'fisheries',
        origin: 'Bangladesh & South Asia',
        description_bn: 'বাংলাদেশের প্রধান ও জনপ্রিয় কার্প জাতীয় মাছ। মিশ্র চাষে দ্রুত বর্ধনশীল।',
        description_en: 'Primary and popular major carp in Bangladesh with fast growth in composite culture.',
        image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5',
        feedAdvice: 'এবিএস ফ্লোটিং ফিশ ফিড (ABS Floating Fish Feed) ব্যবহার করুন।'
      },
      {
        name_bn: 'টমেটো (উন্নত জাত)',
        name_en: 'Hybrid Tomato',
        category: 'vegetables',
        origin: 'Bangladesh',
        description_bn: 'শীত ও গ্রীষ্মকালীন উচ্চফলনশীল হাইব্রিড টমেটো।',
        description_en: 'High yielding hybrid tomato suitable for commercial cultivation.',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
        feedAdvice: 'সুষম জৈব সার ও ড্রিপ ইরিগেশন নিশ্চিত করুন।'
      }
    ];
    await seedCollection('species', speciesData);

    // 3. Seed ABS Feed & Agro Products
    const productsData = [
      {
        name: 'ABS Cattle Feed Premium (৫০ কেজি)',
        nameEn: 'ABS Cattle Feed Premium (50kg)',
        category: 'livestock',
        price: 1850,
        unit: 'ব্যাগ',
        stock: 500,
        description: 'দুগ্ধবতী ও মোটাতাজাকরণ গরুর জন্য সুষম পুষ্টিসমৃদ্ধ ফিড।',
        image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff'
      },
      {
        name: 'ABS Poultry Broiler Starter (৫০ কেজি)',
        nameEn: 'ABS Poultry Broiler Starter (50kg)',
        category: 'poultry',
        price: 2650,
        unit: 'ব্যাগ',
        stock: 350,
        description: 'ব্রয়লার বাচ্চার দ্রুত বৃদ্ধির জন্য প্রয়োজনীয় প্রোটিন সমৃদ্ধ প্রিমিয়াম স্টার্টার ফিড।',
        image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7'
      },
      {
        name: 'ABS Floating Fish Feed (২৫ কেজি)',
        nameEn: 'ABS Floating Fish Feed (25kg)',
        category: 'fisheries',
        price: 1450,
        unit: 'ব্যাগ',
        stock: 420,
        description: 'কার্প ও পাঙ্গাশ মাছের জন্য ভাসমান পুষ্টিকর ফিড।',
        image: 'https://images.unsplash.com/photo-1534043464124-3be32fe00099'
      },
      {
        name: 'জৈব ট্রাইকো-কম্পোস্ট (৪০ কেজি)',
        nameEn: 'Organic Tricho-Compost (40kg)',
        category: 'fertilizer',
        price: 650,
        unit: 'ব্যাগ',
        stock: 600,
        description: 'মাটির উর্বরতা ও ফসল রোগমুক্ত রাখতে কার্যকর ট্রাইকোডার্মা সমৃদ্ধ জৈব সার।',
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5'
      }
    ];
    await seedCollection('products', productsData);

    // 4. Seed Market Prices
    const marketPriceData = [
      { cropName: 'মিনিকেট চাল', category: 'শস্য', wholesalePrice: 68, retailPrice: 75, unit: 'কেজি', district: 'ঢাকা', trend: 'stable', date: new Date().toISOString() },
      { cropName: 'আলু (ডায়মন্ড)', category: 'সবজি', wholesalePrice: 28, retailPrice: 35, unit: 'কেজি', district: 'ঢাকা', trend: 'down', date: new Date().toISOString() },
      { cropName: 'পেঁয়াজ (দেশি)', category: 'মসলা', wholesalePrice: 65, retailPrice: 75, unit: 'কেজি', district: 'ঢাকা', trend: 'up', date: new Date().toISOString() },
      { cropName: 'রুই মাছ (বড়)', category: 'মৎস্য', wholesalePrice: 320, retailPrice: 380, unit: 'কেজি', district: 'ঢাকা', trend: 'stable', date: new Date().toISOString() },
      { cropName: 'ব্রয়লার মুরগি', category: 'পোল্ট্রি', wholesalePrice: 170, retailPrice: 190, unit: 'কেজি', district: 'ঢাকা', trend: 'stable', date: new Date().toISOString() }
    ];
    await seedCollection('marketPrices', marketPriceData);

    // 5. Seed Knowledge Base Articles
    const knowledgeData = [
      {
        title: 'ধানের ব্লাস্ট ও মাজরা পোকা দমন ব্যবস্থাপনা',
        category: 'শস্য রোগ ও প্রতিকার',
        content: 'ব্লাস্ট রোগ দেখা দিলে জমিতে অতিরিক্ত নাইট্রোজেন বা ইউরিয়া সার প্রয়োগ বন্ধ করতে হবে। আক্রান্ত জমিতে ট্রাইসাইক্লাজল জাতীয় ছত্রাকনাশক স্প্রে করুন। মাজরা পোকা দমনে পার্চিং ও আলোক ফাঁদ স্থাপন করুন।',
        iconName: 'Sprout',
        order: 1
      },
      {
        title: 'শীতকালে মাছের ক্ষতরোগ (EUS) প্রতিরোধ',
        category: 'মৎস্য চাষ',
        content: 'শীতের শুরুতে প্রতি শতাংশে ১ কেজি হারে চুন ও ২৫০ গ্রাম লবণ প্রয়োগ করুন। পুকুরের পানির গভীরতা কমপক্ষে ৫-৬ ফুট বজায় রাখুন এবং নিয়মিত ABS Floating Fish Feed প্রদান করুন।',
        iconName: 'ShieldCheck',
        order: 2
      },
      {
        title: 'দুগ্ধবতী গাভীর সাইলেজ তৈরি ও সুষম খাদ্য ব্যবস্থাপনা',
        category: 'গবাদি পশু পালন',
        content: 'সবুজ ঘাস সংরক্ষণ করে সাইলেজ বানালে সারা বছর পুষ্টিকর খাদ্য পাওয়া যায়। এর সাথে উচ্চমানের এবিএস ক্যাটেল ফিড যোগ করে গাভীর দুধ উৎপাদন সর্বোচ্চ করা সম্ভব।',
        iconName: 'Lightbulb',
        order: 3
      }
    ];
    await seedCollection('knowledgeBase', knowledgeData);

    // 6. Seed Pest Warnings
    const pestData = [
      {
        title: 'বাদামী গাছফড়িং (বিপিএইচ) সতর্কবার্তা',
        titleBn: 'বাদামী গাছফড়িং (বিপিএইচ) সতর্কবার্তা',
        district: 'Mymensingh',
        severity: 'high',
        affectedCrops: 'Aman & Boro Rice',
        description: 'আর্দ্র ও গরম আবহাওয়ার কারণে ধানের জমিতে কারেন্ট পোকার উপদ্রব বাড়তে পারে। কৃষকদের ধানের গোড়া পরীক্ষা করার নির্দেশ দেওয়া হচ্ছে।',
        createdAt: new Date().toISOString()
      },
      {
        title: 'টমেটো ও আলুর নাবি ধসা (Late Blight) সতর্কতা',
        titleBn: 'টমেটো ও আলুর নাবি ধসা রোগ সতর্কতা',
        district: 'Rangpur',
        severity: 'medium',
        affectedCrops: 'Potato, Tomato',
        description: 'কুয়াশাচ্ছন্ন আবহাওয়ায় আলুর নাবি ধসা রোগ দেখা দিতে পারে। অনুমোদিত ছত্রাকনাশক অগ্রিম স্প্রে করার পরামর্শ দেওয়া হচ্ছে।',
        createdAt: new Date().toISOString()
      }
    ];
    await seedCollection('pestWarnings', pestData);

    console.log('\n🎉 MongoDB Seeding Complete! Project is 100% ready with rich data.\n');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
}

seedDatabase();

