<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 🌾 Krishi Bondhu - কৃষি বন্ধু

একটি সম্পূর্ণ কৃষি সহায়তা ওয়েব অ্যাপ্লিকেশন যা বাংলাদেশের কৃষকদের জন্য AI-চালিত সমাধান প্রদান করে।

View your app in AI Studio: https://ai.studio/apps/17efba00-4ef6-44e6-b0a3-aa347e8308ce

---

## ✨ প্রধান ফিচারসমূহ

### 🌾 কৃষি ব্যবস্থাপনা
- **Farm Journal** - খামার পরিচালনা ও রেকর্ড রক্ষণাবেক্ষণ
- **Crop Calendar** - ফসলের ক্যালেন্ডার ও পরিকল্পনা
- **Farming Ledger** - আর্থিক হিসাব-নিকাশ
- **Species Management** - গবাদিপশু, হাঁসমুরগি, মাছ ও সবজি ব্যবস্থাপনা

### 🤖 AI-চালিত সেবা
- **AI Disease Detection** - ছবি দিয়ে রোগ শনাক্তকরণ
- **Chat with Expert** - AI বিশেষজ্ঞের সাথে চ্যাট
- **Problem Solver** - কৃষি সমস্যার সমাধান

### 🌤️ আবহাওয়া ও পর্যবেক্ষণ
- **Weather Alerts** - আবহাওয়া সতর্কতা ও পূর্বাভাস
- **Satellite Monitoring** - স্যাটেলাইট দিয়ে জমি পর্যবেক্ষণ
- **Pest Warning** - কীটপতঙ্গ সতর্কতা

### 💰 বাজার ও ব্যবসা
- **Marketplace** - পণ্য ক্রয়-বিক্রয়
- **Market Price** - বাজার মূল্য তথ্য
- **Export Application** - রপ্তানি আবেদন
- **Global Export Guide** - আন্তর্জাতিক রপ্তানি গাইড

### আরও 40+ ফিচার!
সেচ ব্যবস্থাপনা, মাটি পরীক্ষা, ঋণ সেবা, বীমা, সরকারি প্রকল্প, প্রশিক্ষণ এবং আরও অনেক কিছু...

---

## 🚀 Quick Start (দ্রুত শুরু)

### ✅ সার্ভার ইতিমধ্যে চালু আছে!

আপনার অ্যাপ এখন চলছে: **http://localhost:3000**

### প্রথমবার সেটআপ

**Prerequisites:** Node.js (✅ ইতিমধ্যে ইনস্টল আছে)

1. **Dependencies Install** (✅ সম্পন্ন):
   ```bash
   npm install
   ```

2. **Environment Variables সেট করুন**:
   
   `.env` ফাইল খুলে API Keys যোগ করুন:
   
   ```env
   # Gemini AI API Key (প্রয়োজনীয়)
   GEMINI_API_KEY=আপনার_api_key_এখানে
   
   # Google Maps API Key (ঐচ্ছিক)
   GOOGLE_MAPS_PLATFORM_KEY=আপনার_maps_key_এখানে
   ```
   
   **Gemini API Key পেতে:** https://aistudio.google.com/app/apikey

3. **সার্ভার চালান**:
   ```bash
   npm run dev
   ```
   
   এরপর ব্রাউজারে যান: http://localhost:3000

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server চালু (Hot Reload সহ) |
| `npm run build` | Production build তৈরি |
| `npm start` | Production server চালু |
| `npm run lint` | TypeScript type checking |

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Express.js + Node.js
- **AI:** Google Gemini API
- **Database:** Firebase Firestore
- **Styling:** Tailwind CSS 4
- **Maps:** React Leaflet + Google Maps
- **i18n:** React i18next (বহুভাষিক সাপোর্ট)

---

## 📚 Documentation

- **Quick Start Guide:** `QUICK_START.md` দেখুন
- **Detailed Setup:** `SETUP_GUIDE.md` দেখুন

---

## 🐛 Troubleshooting

### সার্ভার চালু হচ্ছে না?
```bash
npm install
npm run dev
```

### Port 3000 ব্যবহৃত?
`server.ts` ফাইলে `PORT` ভেরিয়েবল পরিবর্তন করুন

### AI Features কাজ করছে না?
`.env` ফাইলে `GEMINI_API_KEY` সঠিকভাবে সেট করুন

---

## 📞 Support

সমস্যা বা প্রশ্ন থাকলে:
1. Browser console চেক করুন (F12)
2. Terminal এ error messages দেখুন
3. Documentation ফাইলগুলো পড়ুন

---

**Made with ❤️ for Bangladeshi Farmers**
