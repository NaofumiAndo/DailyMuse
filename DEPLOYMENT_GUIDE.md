# 🚀 Complete Deployment Guide - DailyMuse

This guide will walk you through deploying your DailyMuse application to Firebase Hosting with Google Cloud integration.

## 📋 Prerequisites

Before you begin, make sure you have:
- ✅ Node.js installed (v16 or higher)
- ✅ A Google account
- ✅ Firebase project created: `daily-muse-c79e7`
- ✅ Firebase CLI installed

---

## 🔧 Part 1: Initial Setup

### Step 1: Install Firebase CLI

If you haven't already installed the Firebase CLI:

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

### Step 3: Verify Project Connection

```bash
firebase projects:list
```

You should see `daily-muse-c79e7` in the list.

---

## 🔑 Part 2: Configure API Keys

### Step 1: Create New Firebase API Key (if you deleted the old one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **daily-muse-c79e7**
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **API key**
5. Edit the key and add restrictions:
   - **HTTP referrers**: Add your Firebase Hosting domain (e.g., `daily-muse-c79e7.web.app/*`)
   - **API restrictions**: Select Firebase APIs, Cloud Firestore API, Firebase Storage API
6. Save the API key

### Step 2: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Select your project: **daily-muse-c79e7**
4. Copy the API key

### Step 3: Create Local Environment File

Create a `.env.local` file in your project root:

```bash
# .env.local
VITE_FIREBASE_API_KEY=your_new_firebase_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:** This file is already in `.gitignore` and won't be committed to GitHub.

---

## 👤 Part 3: Create Admin User

You need to create an admin account to login to the Creator Studio.

### Option 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **daily-muse-c79e7**
3. Click **Authentication** in the left sidebar
4. Click **Get Started** (if first time) or **Add user**
5. Click **Add user** manually
6. Enter:
   - **Email**: your-admin-email@example.com
   - **Password**: YourSecurePassword123!
7. Click **Add user**

### Option 2: Using Firebase CLI

```bash
# This creates a user programmatically
firebase auth:import users.json --project daily-muse-c79e7
```

Create `users.json`:
```json
{
  "users": [
    {
      "localId": "admin",
      "email": "your-admin@example.com",
      "passwordHash": "your-password-hash",
      "emailVerified": true
    }
  ]
}
```

---

## 🛡️ Part 4: Configure Firebase Security Rules

### Step 1: Deploy Firestore Rules

The project includes `firestore.rules` which allows:
- ✅ Public read access (anyone can view muses)
- ✅ Authenticated write only (only logged-in admins can create/edit)

Deploy the rules:

```bash
firebase deploy --only firestore:rules
```

### Step 2: Deploy Storage Rules

The project includes `storage.rules` which allows:
- ✅ Public read access to images in `/muses/` folder
- ✅ Authenticated write only (only logged-in admins can upload)

Deploy the rules:

```bash
firebase deploy --only storage:rules
```

### Step 3: Verify Rules in Firebase Console

1. **Firestore Rules**: [Console](https://console.firebase.google.com/) → Storage → Rules
2. **Storage Rules**: [Console](https://console.firebase.google.com/) → Firestore → Rules

---

## 🌐 Part 5: Deploy to Firebase Hosting

### Step 1: Set Environment Variables for Build

For production deployment, you need to pass environment variables during build.

Create a `.env.production` file:

```bash
# .env.production
VITE_FIREBASE_API_KEY=your_new_firebase_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important:** Add `.env.production` to `.gitignore` if you plan to commit this.

### Step 2: Build the Application

```bash
npm run build
```

This creates optimized production files in the `dist/` folder.

### Step 3: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

You'll see output like:

```
✔  Deploy complete!

Hosting URL: https://daily-muse-c79e7.web.app
```

### Step 4: Deploy Everything (Optional)

To deploy hosting, firestore rules, and storage rules all at once:

```bash
firebase deploy
```

---

## 🎨 Part 6: Using the Application

### For You (Admin/Creator):

1. **Visit**: `https://daily-muse-c79e7.web.app/admin`
2. **Login** with your admin credentials
3. **Generate Images**:
   - Enter character description, title, and episode number
   - Click "Generate Title Card"
   - Enter comic concept
   - Click "Generate 4-Panel Comic"
4. **Schedule** the muse for a specific date
5. **Publish** - Images are uploaded to Firebase Storage and metadata to Firestore

### For End Users (Visitors):

1. **Visit**: `https://daily-muse-c79e7.web.app`
2. **View** today's muse on the home page
3. **Browse** past muses in the Archive section
4. **No login required** - public access for viewing only

---

## 🔒 Part 7: Important Security Configurations

### Enable Firebase App Check (Recommended)

App Check helps protect your APIs from abuse:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **daily-muse-c79e7**
3. Click **App Check** in the left sidebar
4. Click **Get Started**
5. Register your web app
6. Enable **reCAPTCHA v3**
7. Update your code to initialize App Check

### Set Up Billing Alerts

To monitor API usage and costs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select **daily-muse-c79e7**
3. Navigate to **Billing** → **Budgets & alerts**
4. Create a budget alert (e.g., alert when you reach $10/month)

### Configure CORS (If needed)

If you encounter CORS errors with Firebase Storage:

```bash
# Create cors.json
echo '[{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]' > cors.json

# Apply to storage bucket
gsutil cors set cors.json gs://daily-muse-c79e7.firebasestorage.app
```

---

## 🧪 Part 8: Testing Your Deployment

### Test Admin Functions:

- [ ] Login to Creator Studio
- [ ] Generate title image
- [ ] Generate comic image
- [ ] Schedule a muse
- [ ] Verify upload to Firebase Storage (check Console → Storage)
- [ ] Verify entry in Firestore (check Console → Firestore)

### Test Public Access:

- [ ] Open an incognito window
- [ ] Visit `https://daily-muse-c79e7.web.app`
- [ ] Verify you can see images without logging in
- [ ] Check Archive page
- [ ] Test on mobile device

---

## 🐛 Troubleshooting

### Issue: "API key not configured"

**Solution**: Make sure you created `.env.production` before running `npm run build`

```bash
# Rebuild with environment variables
npm run build
firebase deploy --only hosting
```

### Issue: "Images not visible to users"

**Solution**: Check Firebase Storage rules

```bash
# Redeploy storage rules
firebase deploy --only storage:rules
```

### Issue: "Cannot login as admin"

**Solution**: Verify user exists in Firebase Authentication

1. Firebase Console → Authentication → Users
2. Check if your admin email is listed
3. If not, add it manually

### Issue: "Quota exceeded" when generating images

**Solution**: Check Gemini API quota

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Enabled APIs → Gemini API
3. Check quotas and billing

### Issue: "Permission denied" when uploading images

**Solution**: Verify you're logged in and storage rules are deployed

```bash
# Check auth status in browser console
# Redeploy storage rules
firebase deploy --only storage:rules
```

---

## 📊 Monitoring & Maintenance

### View Usage Statistics:

1. **Firebase Console** → **Analytics** - User visits, page views
2. **Firebase Console** → **Storage** - Storage usage
3. **Firebase Console** → **Firestore** - Database reads/writes
4. **Google Cloud Console** → **APIs & Services** - API usage

### Estimated Costs:

- **Firebase Hosting**: Free for <10GB/month, <360MB/day
- **Firestore**: Free for <50k reads, <20k writes per day
- **Storage**: Free for <5GB storage, <1GB/day downloads
- **Gemini API**: Check current pricing at [Google AI Pricing](https://ai.google.dev/pricing)

---

## 🚀 Advanced: Custom Domain (Optional)

To use your own domain (e.g., `dailymuse.com`):

1. Firebase Console → Hosting → **Add custom domain**
2. Enter your domain name
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning (can take 24 hours)

---

## 📝 Quick Reference Commands

```bash
# Login
firebase login

# Build for production
npm run build

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only rules
firebase deploy --only firestore:rules,storage:rules

# View deployment history
firebase hosting:channel:list

# Test locally before deploying
npm run build && firebase serve
```

---

## 🎉 Congratulations!

Your DailyMuse app is now live at: **https://daily-muse-c79e7.web.app**

- 🎨 Create and schedule daily muses from the Creator Studio
- 🌍 Users worldwide can view your published content
- 🔒 Secure admin access with Firebase Authentication
- ☁️ Images stored safely in Firebase Storage
- 📊 All data managed in Cloud Firestore

---

## 📞 Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Google AI Studio](https://aistudio.google.com/)
- [Firebase Support](https://firebase.google.com/support)

