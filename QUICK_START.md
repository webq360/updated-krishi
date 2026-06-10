# 🚀 Krishi Bondhu - Quick Start

## ✅ সার্ভার চালু হয়েছে!

আপনার Krishi Bondhu অ্যাপ্লিকেশন এখন চলছে:

🌐 **URL:** http://localhost:3000

---

## 🎯 এখন কী করবেন?

### 1. ব্রাউজারে অ্যাপ খুলুন
আপনার ব্রাউজারে যান: **http://localhost:3000**

### 2. প্রথম ব্যবহার
- **নতুন ইউজার?** → Register করুন
- **ইতিমধ্যে অ্যাকাউন্ট আছে?** → Login করুন

### 3. ফিচার এক্সপ্লোর করুন
লগইন করার পর সব ফিচার অ্যাক্সেস করতে পারবেন:
- 🌾 Farm Journal
- 🤖 AI Disease Detection
- 🌤️ Weather Alerts
- 💰 Marketplace
- এবং আরও অনেক কিছু!

---

## ⚠️ গুরুত্বপূর্ণ: API Keys

### 🔴 Gemini API Key সেট করুন (AI ফিচারের জন্য)

AI ফিচার (Disease Detection, Chat with Expert) চালাতে:

1. https://aistudio.google.com/app/apikey থেকে API Key নিন
2. `.env` ফাইল খুলুন
3. এই লাইনটি আপডেট করুন:
   ```
   GEMINI_API_KEY=আপনার_actual_api_key_এখানে
   ```
4. সার্ভার রিস্টার্ট করুন:
   - Terminal এ `Ctrl+C` চাপুন
   - আবার `npm run dev` চালান

### 🟡 Google Maps API Key (ঐচ্ছিক)

ম্যাপ ফিচার চালাতে চাইলে:
1. https://console.cloud.google.com/google/maps-apis/credentials থেকে Key নিন
2. `.env` ফাইলে `GOOGLE_MAPS_PLATFORM_KEY` সেট করুন

---

## 🛑 সার্ভার বন্ধ করতে

Terminal এ **Ctrl+C** চাপুন

## 🔄 সার্ভার রিস্টার্ট করতে

```bash
npm run dev
```

---

## 📊 সার্ভার স্ট্যাটাস

✅ Development Mode চালু আছে  
✅ Hot Reload সক্রিয়  
✅ Port: 3000  
✅ Vite Middleware সক্রিয়  

---

## 🐛 সমস্যা হলে?

### সার্ভার চালু হচ্ছে না?
```bash
# Dependencies পুনরায় ইনস্টল করুন
npm install

# আবার চেষ্টা করুন
npm run dev
```

### Port 3000 ব্যবহৃত?
`server.ts` ফাইলে PORT পরিবর্তন করুন (যেমন: 3001)

### Browser এ খুলছে না?
- সার্ভার চালু আছে কিনা দেখুন
- URL সঠিক আছে কিনা চেক করুন: http://localhost:3000
- ব্রাউজার cache clear করুন (Ctrl+Shift+Delete)

---

## 📚 আরও তথ্যের জন্য

বিস্তারিত সেটআপ গাইড: `SETUP_GUIDE.md` দেখুন

---

**Happy Farming! 🌾🚜**
