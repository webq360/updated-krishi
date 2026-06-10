# 🚀 Production Deployment Guide - Krishi Bondhu

## Pre-Deployment Checklist

### 1. **Local Testing**
```bash
npm run build
npm start
```
Then test at `http://localhost:3000`

### 2. **Environment Variables Setup**

#### Local Development (`.env`)
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=AIzaSyAiJvbH5oE4A86nlw8dHnnuFTlnWrIMvkk
VITE_FIREBASE_AUTH_DOMAIN=krishi-bondhu-16890.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=krishi-bondhu-16890
GEMINI_API_KEY=your_key_here
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

#### Production on Vercel
Set these in **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Type | Notes |
|----------|------|-------|
| `MONGODB_URI` | Secret | Database connection string |
| `JWT_SECRET` | Secret | Generate a strong random string (min 32 chars) |
| `GEMINI_API_KEY` | Secret | From https://aistudio.google.com/app/apikey |
| `NODE_ENV` | Plain | Set to `production` |

**For Client-Side (Optional on Vercel):**
| Variable | Type | Value |
|----------|------|-------|
| `VITE_API_URL` | Plain | `https://your-vercel-url.vercel.app/api` |
| `VITE_APP_URL` | Plain | `https://your-vercel-url.vercel.app` |
| `VITE_FIREBASE_PROJECT_ID` | Plain | `krishi-bondhu-16890` |

---

## 🔧 Step-by-Step Deployment

### Step 1: Git Setup
```bash
git add .
git commit -m "Production fixes: API URL, env validation, SPA fallback"
git push origin main
```

### Step 2: Vercel Connection
1. Go to https://vercel.com
2. Connect your GitHub repository
3. Click "Deploy"

### Step 3: Set Environment Variables
After Vercel project is created:
1. Go to **Settings → Environment Variables**
2. Add the secret variables above:
   - `MONGODB_URI`
   - `JWT_SECRET` 
   - `GEMINI_API_KEY`

**Example JWT_SECRET generation:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Minimum 0 -Maximum 256) }))

# Or use an online generator: https://tools.ietf.org/html/rfc2898
```

### Step 4: Deploy
1. Push to main branch (automatic deployment)
2. OR manually trigger from Vercel dashboard
3. Wait for build to complete

### Step 5: Verify Deployment
1. Go to your Vercel URL
2. Check browser console for errors (F12)
3. Test login: Create account and login
4. Test API: Open DevTools → Network tab → check API calls

---

## ⚠️ Common Issues & Fixes

### Issue: "MONGODB_URI not found"
**Fix:** Make sure you set `MONGODB_URI` in Vercel Environment Variables
```bash
# Verify it's set correctly
# Check Vercel Dashboard → Settings → Environment Variables
```

### Issue: "API calls return 404"
**Fix:** Check `VITE_API_URL` is correct
```env
# Correct format:
VITE_API_URL=https://your-vercel-url.vercel.app/api

# NOT:
VITE_API_URL=https://your-vercel-url.vercel.app
```

### Issue: "Firestore connection failed"
**Fix:** Firebase is client-side only, should work automatically
- Check console for exact error
- Verify `VITE_FIREBASE_PROJECT_ID` matches your Firebase project

### Issue: "JWT_SECRET is not valid"
**Fix:** Generate a new stronger secret
```bash
# Should be at least 32 characters
# Don't use simple strings like "secret123"
```

### Issue: "Gemini API not working"
**Fix:** 
1. Verify API key is active: https://console.cloud.google.com/
2. Check quota limits aren't exceeded
3. Test with curl:
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

### Issue: "Build fails on Vercel"
**Steps to debug:**
1. Check Vercel Build Logs
2. Try building locally: `npm run build`
3. Fix any TypeScript errors: `npm run lint`
4. Check for missing dependencies: `npm install`

---

## 🔐 Security Checklist

- ✅ `MONGODB_URI` is in Vercel Secrets (not in code)
- ✅ `JWT_SECRET` is a strong random string
- ✅ `GEMINI_API_KEY` is in Vercel Secrets
- ✅ `.env.production` never contains real secrets
- ✅ `.gitignore` includes `.env*` files
- ✅ All API endpoints validate tokens
- ✅ CORS is properly configured (if needed)

---

## 📊 Monitoring

### Check Logs
```bash
# From Vercel CLI
vercel logs --prod

# Or from Vercel Dashboard → Deployments → Logs
```

### Monitor Database
- Go to MongoDB Atlas → Cluster → Metrics
- Check connection count and operations

### Monitor API
- Check Vercel Analytics
- Monitor error rates in browser DevTools

---

## 🔄 Redeployment

After making changes:
```bash
git commit -am "Your changes"
git push origin main
# Vercel auto-deploys!
```

Or manually:
```bash
vercel --prod
```

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Gemini API:** https://ai.google.dev/tutorials

---

**Last Updated:** June 2026
**Status:** Ready for Production ✅
