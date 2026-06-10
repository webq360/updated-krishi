# 🌾 Krishi Bondhu - লোকাল সেটআপ গাইড

## ✅ প্রিরিকুইজিট (ইতিমধ্যে সম্পন্ন)
- ✅ Node.js ইনস্টল করা আছে
- ✅ npm dependencies ইনস্টল করা আছে
- ✅ `.env` ফাইল তৈরি হয়েছে

## 🔑 API Keys কনফিগার করুন

### 1. Gemini API Key (প্রয়োজনীয়)
AI ফিচার চালানোর জন্য প্রয়োজন।

**কিভাবে পাবেন:**
1. https://aistudio.google.com/app/apikey এ যান
2. "Create API Key" ক্লিক করুন
3. API Key কপি করুন
4. `.env` ফাইলে `GEMINI_API_KEY` এর জায়গায় পেস্ট করুন

```env
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

### 2. Google Maps API Key (ঐচ্ছিক)
ম্যাপ ফিচার চালানোর জন্য প্রয়োজন।

**কিভাবে পাবেন:**
1. https://console.cloud.google.com/google/maps-apis/credentials এ যান
2. নতুন API Key তৈরি করুন
3. Maps JavaScript API সক্রিয় করুন
4. `.env` ফাইলে `GOOGLE_MAPS_PLATFORM_KEY` এ পেস্ট করুন

### 3. Firebase (ইতিমধ্যে কনফিগার করা)
✅ Firebase configuration ফাইল পাওয়া গেছে: `firebase-applet-config.json`

## 🚀 প্রজেক্ট চালানো

### Development Mode (Recommended)
```bash
npm run dev
```

এরপর ব্রাউজারে যান: **http://localhost:3000**

### Production Build
```bash
npm run build
npm start
```

## 📋 উপলব্ধ কমান্ড

| কমান্ড | কাজ |
|---------|------|
| `npm run dev` | Development server চালু (Hot Reload সহ) |
| `npm run build` | Production build তৈরি |
| `npm start` | Production server চালু |
| `npm run lint` | TypeScript type check |

## 🎯 প্রথম ব্যবহার

1. **অ্যাপ খুলুন:** http://localhost:3000
2. **রেজিস্টার করুন:** নতুন অ্যাকাউন্ট তৈরি করুন
3. **লগইন করুন:** আপনার credentials দিয়ে লগইন করুন
4. **ফিচার ব্যবহার করুন:** সব ফিচার অ্যাক্সেস করুন

## 🔧 সমস্যা সমাধান

### Port 3000 ব্যবহৃত হচ্ছে?
`server.ts` ফাইলে `PORT` ভেরিয়েবল পরিবর্তন করুন:
```typescript
const PORT = 3001; // বা অন্য কোন পোর্ট
```

### Firestore Connection Error?
- ইন্টারনেট কানেকশন চেক করুন
- Firebase project সক্রিয় আছে কিনা দেখুন
- Firestore rules সঠিক আছে কিনা চেক করুন

### AI Features কাজ করছে না?
- `.env` ফাইলে `GEMINI_API_KEY` সঠিকভাবে সেট করা আছে কিনা চেক করুন
- API key এর quota শেষ হয়ে গেছে কিনা দেখুন
- Console এ error message দেখুন

## 📚 প্রধান ফিচারসমূহ

- 🌾 **Farm Journal** - খামার পরিচালনা
- 🤖 **AI Disease Detection** - রোগ শনাক্তকরণ
- 🌤️ **Weather Alerts** - আবহাওয়া সতর্কতা
- 💰 **Marketplace** - পণ্য ক্রয়-বিক্রয়
- 📊 **Market Price** - বাজার মূল্য
- 🎓 **Training** - প্রশিক্ষণ ভিডিও
- 💬 **Chat with Expert** - বিশেষজ্ঞ পরামর্শ
- এবং আরও 40+ ফিচার!

## 📞 সাহায্য প্রয়োজন?

কোন সমস্যা হলে:
1. Browser console চেক করুন (F12)
2. Terminal এ error message দেখুন
3. README.md ফাইল পড়ুন

---

**সফল প্রজেক্ট সেটআপের জন্য শুভকামনা! 🎉**
