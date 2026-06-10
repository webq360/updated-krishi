# 🚀 MongoDB দ্রুত শুরু (Quick Start)

## ⚡ 3 ধাপে শুরু করুন:

### ধাপ 1️⃣: MongoDB ইনস্টল করুন

**Windows এ সবচেয়ে সহজ উপায়:**

#### A) Windows Installer ব্যবহার করুন:
1. https://www.mongodb.com/try/download/community এ যান
2. **Windows x64** installer ডাউনলোড করুন
3. Installer চালান এবং "Complete" সিলেক্ট করুন
4. ইনস্টলেশন শেষ হলে MongoDB স্বয়ংক্রিয়ভাবে চলবে ✅

#### B) অথবা Chocolatey ব্যবহার করুন (Admin PowerShell):
```powershell
choco install mongodb
```

---

### ধাপ 2️⃣: Admin User তৈরি করুন

MongoDB চালু হওয়ার পর, Terminal এ চালান:

```bash
npm run create-admin
```

**Output দেখবেন:**
```
✅ Admin user created successfully!
📧 Email: admin@gmail.com
🔐 Password: adminadmin
👤 Role: admin
```

---

### ধাপ 3️⃣: সার্ভার চালু করুন

```bash
npm run dev
```

এবং ব্রাউজারে যান: **http://localhost:3000**

---

## 🎯 প্রথম লগইন

অ্যাপে লগইন করুন:
- **Email:** admin@gmail.com
- **Password:** adminadmin

---

## ✅ সফল হলে:

- ✅ MongoDB চালু আছে
- ✅ Admin user তৈরি হয়েছে
- ✅ অ্যাপ localhost:3000 এ চলছে
- ✅ Admin দিয়ে লগইন করতে পারছেন

---

## 🆘 সমস্যা হলে?

**"Cannot connect to MongoDB"?**
1. MongoDB চালু আছে কিনা চেক করুন:
```bash
# Windows PowerShell এ
Get-Service MongoDB
```
Output হবে: `Running`

2. MongoDB নেই হলে ইনস্টল করুন (উপরের ধাপ 1 দেখুন)

3. তারপর আবার চেষ্টা করুন:
```bash
npm run create-admin
npm run dev
```

---

**Ready to go! 🌾🚀**
