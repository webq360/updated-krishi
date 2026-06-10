# 🗄️ MongoDB লোকাল সেটআপ গাইড

## ⚙️ MongoDB ইনস্টলেশন

### Windows এ MongoDB ইনস্টল করুন:

#### অপশন 1: MongoDB Community Edition (Recommended)
1. https://www.mongodb.com/try/download/community থেকে Windows installer ডাউনলোড করুন
2. Installer চালান এবং default settings এ ইনস্টল করুন
3. MongoDB সেবা স্বয়ংক্রিয়ভাবে সক্রিয় হবে

#### অপশন 2: MongoDB চালানোর জন্য প্রি-বিল্ট বাইনারি
1. https://www.mongodb.com/try/download/community থেকে ZIP ফাইল ডাউনলোড করুন
2. একটি ফোল্ডারে extract করুন (যেমন: `C:\mongodb`)
3. MongoDB চালু করুন:
```bash
C:\mongodb\bin\mongod.exe --dbpath "C:\mongodb\data"
```

#### অপশন 3: Chocolatey দিয়ে (Admin PowerShell এ):
```powershell
choco install mongodb
```

---

## 🚀 MongoDB চেক করুন

### MongoDB চলছে কিনা দেখুন:
```bash
# Windows PowerShell এ
Get-Service MongoDB
```

Output: `Running` হলে MongoDB চালু আছে

### MongoDB সরাসরি চালান (Standalone):
```bash
mongod --dbpath "C:\data\db"
```

---

## 👤 Admin User তৈরি করুন

MongoDB চালু হওয়ার পর, এই কমান্ড চালান:

```bash
npm run create-admin
```

এটি নিম্নলিখিত admin user তৈরি করবে:
- **Email:** admin@gmail.com
- **Password:** adminadmin
- **Role:** admin

✅ সফল হলে এই বার্তা দেখবেন:
```
✅ Admin user created successfully!
📧 Email: admin@gmail.com
🔐 Password: adminadmin
👤 Role: admin
```

---

## 🔧 MongoDB ম্যানেজমেন্ট টুলস

### MongoDB Compass (GUI - Recommended)
- https://www.mongodb.com/products/compass ডাউনলোড করুন
- GUI থেকে সহজেই ডেটা দেখতে/এডিট করতে পারবেন

### MongoDB Shell (CLI)
MongoDB এর সাথে আসে। চেষ্টা করুন:
```bash
mongosh
```

---

## 🧪 MongoDB সংযোগ টেস্ট

### Node.js এ টেস্ট করুন:
```javascript
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/krishi-bondhu')
  .then(() => console.log('✅ Connected'))
  .catch(err => console.log('❌ Error:', err));
```

---

## 🚨 সমস্যা সমাধান

### MongoDB চালু হচ্ছে না?
```bash
# MongoDB সেবা রিস্টার্ট করুন
net stop MongoDB
net start MongoDB
```

### "Cannot connect to localhost:27017"?
1. MongoDB সেবা চালু আছে কিনা চেক করুন
2. Firewall এ port 27017 খোলা আছে কিনা দেখুন
3. এটি চেষ্টা করুন:
```bash
netstat -ano | findstr :27017
```

### Data folder পাওয়া যাচ্ছে না?
```bash
# Data folder তৈরি করুন
mkdir C:\data\db

# এবং তারপর MongoDB চালান
mongod --dbpath "C:\data\db"
```

---

## 📊 Krishi Bondhu এ MongoDB ব্যবহার

### API Endpoints:

**Login:**
```bash
POST /api/auth/login
{
  "email": "admin@gmail.com",
  "password": "adminadmin"
}
```

**Register:**
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

## ✅ চেকলিস্ট

- [ ] MongoDB ইনস্টল করা হয়েছে
- [ ] MongoDB সেবা চালু আছে
- [ ] `npm run create-admin` সফল হয়েছে
- [ ] Admin user তৈরি হয়েছে
- [ ] `npm run dev` চালু করা হয়েছে
- [ ] http://localhost:3000 এ অ্যাপ খোলা হয়েছে

---

**MongoDB সেটআপ সম্পন্ন! ✨**
