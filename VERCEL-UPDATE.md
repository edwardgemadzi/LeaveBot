# 🚀 FINAL STEP: Update Vercel Environment Variables

## Copy These Values to Vercel

### 1. Go to Vercel
https://vercel.com/dashboard → Select "LeaveBot" → Settings → Environment Variables

### 2. Update MONGODB_URI

**Variable Name:** `MONGODB_URI`

**Value (copy this exactly):**
```
mongodb+srv://leavebot:4AuJfiFNpxw5RuXF@leavebot.kih8gyg.mongodb.net/leavebot?retryWrites=true&w=majority&appName=leavebot
```

**Environments:** ✅ Production ✅ Preview ✅ Development

---

### 3. Update JWT_SECRET

**Variable Name:** `JWT_SECRET`

**Value (copy this exactly):**
```
zymhin-sopraf-2qohDa
```

**Environments:** ✅ Production ✅ Preview ✅ Development

---

### 4. Redeploy

After saving both variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **"..."** menu
4. Click **"Redeploy"**

---

### 5. Test Your App

Once redeployed:
- Visit your app URL
- Try logging in (existing users may need to re-login)
- Create a test leave request
- Verify everything works!

---

## ✅ What's Been Done

- ✅ Exposed credentials removed from GitHub
- ✅ MongoDB password rotated in Atlas
- ✅ JWT secret regenerated
- ✅ Local environment updated and tested
- ✅ Connection verified working

## 🔴 What's Left

- [ ] Update Vercel MONGODB_URI
- [ ] Update Vercel JWT_SECRET
- [ ] Redeploy application
- [ ] Test live application

---

**After completing these steps, the security incident will be fully resolved! 🎉**
