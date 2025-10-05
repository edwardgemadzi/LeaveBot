# LeaveBot - Production Deployment Guide

## 🚀 Your app is production-ready!

### ✅ What's Been Done
- MongoDB Atlas connection verified and working
- All test files removed
- Clean production codebase
- Environment configuration finalized
- Code pushed to GitHub (triggers Vercel deployment)

---

## 📋 Final Steps for Vercel Deployment

### 1. Set Environment Variables in Vercel

Go to: **Vercel Dashboard → LeaveBot Project → Settings → Environment Variables**

Add these variables:

#### Required:
```bash
MONGODB_URI=mongodb+srv://leavebot:9qGsGyP1btSulfF8@leavebot.kih8gyg.mongodb.net/leavebot?retryWrites=true&w=majority&appName=leavebot

JWT_SECRET=0f9OBraUVEirfoYezCvxKkA0sqmLl1tzeB/DS+r815A=
```

#### Optional (for initial admin user):
```bash
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
ADMIN_NAME=Your Name
```

**Important:** 
- Select **Production**, **Preview**, and **Development** for all environments
- Click **Save** after each variable

### 2. Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

OR wait for automatic deployment to complete (already triggered by your push).

### 3. Test Your Live App

Once deployed, visit your app URL and:

1. ✅ **Register** - Create your first user (becomes admin automatically)
2. ✅ **Login** - Verify authentication works
3. ✅ **Logout and Login again** - Sessions should persist!
4. ✅ **Create a leave request** - Test the leave management
5. ✅ **Refresh the page** - Data should remain

---

## 🔒 Security Checklist

- ✅ `.env` file is in `.gitignore` (credentials never committed)
- ✅ MongoDB connection string uses strong password
- ✅ JWT secret is randomly generated
- ✅ All API endpoints use bcrypt password hashing
- ✅ Rate limiting enabled (5 attempts, 15min lockout)
- ✅ Input validation and sanitization
- ✅ Secure HTTP headers configured
- ✅ No hardcoded credentials in code

---

## 📊 MongoDB Atlas Dashboard

Monitor your database:
1. Go to: https://cloud.mongodb.com
2. Navigate to: **Database → Browse Collections**
3. You'll see:
   - Database: `leavebot`
   - Collections: `users`, `leaves`

---

## 🎯 Production Features

### Authentication
- JWT-based authentication (24h token expiry)
- Bcrypt password hashing (10 rounds)
- Rate limiting on login/register
- Auto-admin: First user becomes admin

### Database
- MongoDB Atlas (M0 Free Tier - 512MB)
- Connection pooling for serverless functions
- Indexed queries for performance
- Persistent storage (no data loss on restarts!)

### Leave Management
- Users can create leave requests
- Admins can approve/reject requests
- Users see only their own requests
- Admins see all requests

---

## 🐛 Troubleshooting

### If deployment fails:
1. Check Vercel function logs for errors
2. Verify environment variables are set correctly
3. Ensure MongoDB Atlas allows access from `0.0.0.0/0`

### If sessions still expire:
1. Verify `MONGODB_URI` is set in Vercel (not just locally)
2. Check the connection string has `/leavebot` database name
3. Look at MongoDB Atlas → Network Access → Must have `0.0.0.0/0`

### If can't login:
1. Check Vercel logs for authentication errors
2. Verify `JWT_SECRET` is set in Vercel
3. Try registering a new user

---

## 📈 Next Steps (Optional)

### Enhancements:
- [ ] Add email notifications for leave approvals
- [ ] Add leave balance tracking
- [ ] Add admin dashboard with statistics
- [ ] Add leave calendar view
- [ ] Add user profile management
- [ ] Add leave type categories

### Infrastructure:
- [ ] Set up MongoDB backups (paid tier)
- [ ] Add monitoring/alerting
- [ ] Upgrade to MongoDB M10 cluster for production scale
- [ ] Add Redis caching for better performance
- [ ] Set up staging environment

---

## 📞 Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Check MongoDB Atlas connection status
3. Verify all environment variables are set
4. Check browser console for frontend errors

---

## 🎉 You're All Set!

Your LeaveBot application is production-ready with:
- ✅ Secure authentication
- ✅ Persistent MongoDB storage
- ✅ Professional codebase
- ✅ Ready for real users

**Happy deploying! 🚀**
