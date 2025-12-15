# 🚀 GitHub-Based Deployment Guide

Deploy your DailyMuse application to Firebase Hosting using **only GitHub** - no local terminal needed!

---

## 📋 Overview

This guide shows you how to:
- ✅ Store API keys securely in GitHub Secrets
- ✅ Deploy automatically when you push to the `main` branch
- ✅ Deploy manually from GitHub's web interface
- ✅ Manage everything from your browser

**You won't need to run any commands locally!**

---

## 🔑 Part 1: Get Your API Keys

### Step 1: Create/Get Firebase Web API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **daily-muse-c79e7**
3. Navigate to: **APIs & Services** → **Credentials**
4. If you deleted the old key:
   - Click **+ CREATE CREDENTIALS** → **API key**
   - Click the edit icon (pencil) on the new key
   - **Set HTTP referrers restriction**:
     - Add: `daily-muse-c79e7.web.app/*`
     - Add: `daily-muse-c79e7.firebaseapp.com/*`
   - **Set API restrictions**:
     - Select "Restrict key"
     - Choose: Firebase APIs, Cloud Firestore API, Firebase Storage API
   - Click **Save**
5. **Copy the API key** - you'll need it for GitHub Secrets

### Step 2: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Select project: **daily-muse-c79e7** (or create in new project)
4. **Copy the API key**

### Step 3: Get Firebase Service Account (for GitHub Actions)

**Option A: Using Google Cloud Console (Recommended)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **daily-muse-c79e7**
3. Navigate to: **IAM & Admin** → **Service Accounts**
4. Click **+ CREATE SERVICE ACCOUNT**
5. Fill in:
   - **Service account name**: `github-actions-deployer`
   - **Description**: `Service account for GitHub Actions deployment`
6. Click **CREATE AND CONTINUE**
7. Grant these roles:
   - **Firebase Hosting Admin**
   - **Cloud Datastore User** (for Firestore)
   - **Storage Object Admin**
8. Click **CONTINUE** → **DONE**
9. Click on the newly created service account
10. Go to **KEYS** tab
11. Click **ADD KEY** → **Create new key**
12. Select **JSON** format
13. Click **CREATE** - a JSON file will download
14. **Open the JSON file** and copy its entire contents

**Option B: Using Firebase CLI (if you prefer terminal)**

```bash
# Login to Firebase
firebase login:ci

# This will give you a token - copy it
```

---

## 🔐 Part 2: Configure GitHub Secrets

Now we'll add your API keys to GitHub so they're secure and not in your code.

### Step 1: Go to Repository Settings

1. Go to your GitHub repository: `https://github.com/NaofumiAndo/DailyMuse`
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Secrets

Click **New repository secret** for each of these:

#### Secret 1: `VITE_FIREBASE_API_KEY`
- **Name**: `VITE_FIREBASE_API_KEY`
- **Value**: Paste your Firebase Web API key from Part 1, Step 1
- Click **Add secret**

#### Secret 2: `GEMINI_API_KEY`
- **Name**: `GEMINI_API_KEY`
- **Value**: Paste your Gemini API key from Part 1, Step 2
- Click **Add secret**

#### Secret 3: `FIREBASE_SERVICE_ACCOUNT`
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: Paste the **entire JSON content** from the service account file
- Click **Add secret**

#### Secret 4: `FIREBASE_TOKEN` (Optional - only if using Option B)
- **Name**: `FIREBASE_TOKEN`
- **Value**: Paste the token from `firebase login:ci`
- Click **Add secret**

### Step 3: Verify Secrets

You should now see these secrets listed:
- ✅ `VITE_FIREBASE_API_KEY`
- ✅ `GEMINI_API_KEY`
- ✅ `FIREBASE_SERVICE_ACCOUNT`
- ✅ `FIREBASE_TOKEN` (if using CLI method)

---

## 👤 Part 3: Create Admin User

Before you can use the Creator Studio, you need an admin account.

### Using Firebase Console (No Terminal Needed)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **daily-muse-c79e7**
3. Click **Authentication** in left sidebar
4. Click **Get Started** (if first time)
5. Click **Email/Password** under "Sign-in method"
6. Enable **Email/Password**
7. Click **Save**
8. Go to **Users** tab
9. Click **Add user**
10. Enter:
    - **Email**: your-admin@example.com (your email)
    - **Password**: YourSecurePassword123!
11. Click **Add user**

**Remember these credentials** - you'll use them to login to the Creator Studio!

---

## 🚀 Part 4: Deploy Your Application

### Method 1: Automatic Deployment (Recommended)

Every time you push to the `main` branch, GitHub Actions will automatically:
1. Build your application
2. Deploy to Firebase Hosting
3. Deploy security rules

**To trigger a deployment:**

1. Merge your current branch to `main`:
   - Go to your repository on GitHub
   - Click **Pull requests**
   - Click **New pull request**
   - Base: `main`, Compare: `claude/remove-api-rotate-key-BauUY`
   - Click **Create pull request**
   - Click **Merge pull request**
   - Click **Confirm merge**

2. GitHub Actions will automatically start deploying!

### Method 2: Manual Deployment (From GitHub UI)

You can deploy anytime without pushing code:

1. Go to your repository: `https://github.com/NaofumiAndo/DailyMuse`
2. Click **Actions** tab
3. Click **Deploy to Firebase Hosting** (left sidebar)
4. Click **Run workflow** button
5. Select branch: `main`
6. Click **Run workflow**

GitHub Actions will build and deploy your site!

---

## 📊 Part 5: Monitor Deployment

### Watch the Deployment Progress

1. Go to **Actions** tab in your repository
2. Click on the running workflow
3. Watch each step complete:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Build application (with your API keys)
   - ✅ Deploy to Firebase Hosting

### Check Deployment Status

Once complete, you'll see:
- ✅ Green checkmark = Successful deployment
- ❌ Red X = Failed (click to see error logs)

### View Your Live Site

After successful deployment:
- **Live URL**: `https://daily-muse-c79e7.web.app`
- **Admin URL**: `https://daily-muse-c79e7.web.app/admin`

---

## 🛡️ Part 6: Deploy Security Rules

Security rules control who can read/write to your database and storage.

### Automatic Deployment

The security rules deploy automatically when you:
- Push changes to `firestore.rules`
- Push changes to `storage.rules`
- Push changes to `firestore.indexes.json`

### Manual Deployment

1. Go to **Actions** tab
2. Click **Deploy Firebase Security Rules**
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

This deploys:
- ✅ Firestore rules (database permissions)
- ✅ Storage rules (image permissions)
- ✅ Firestore indexes (query optimization)

---

## ✅ Part 7: Verify Everything Works

### Test Admin Access

1. Visit: `https://daily-muse-c79e7.web.app/admin`
2. Login with your admin credentials (from Part 3)
3. You should see the **Creator Studio**

### Test Image Generation

1. In Creator Studio, fill in:
   - **Character Concept**: "A young detective with blue hair"
   - **Title**: "Mystery Case"
   - **Episode**: "#01"
2. Click **Generate Title Card**
3. Wait for the image to generate (using Gemini AI)
4. Enter a **Comic Concept**: "Panel 1: Detective arrives at crime scene. Panel 2: Detective examines clues. Panel 3: Detective has an idea. Panel 4: Detective solves the case!"
5. Click **Generate 4-Panel Comic**

### Test Publishing

1. After generating both images, click **Next: Review & Schedule**
2. Select a date (e.g., tomorrow)
3. Click **Publish Comic**
4. The images should upload to Firebase Storage
5. The entry should save to Firestore

### Test Public Access

1. Open an **incognito/private window**
2. Visit: `https://daily-muse-c79e7.web.app`
3. You should see the published comic (no login required!)
4. Check the **Archive** page to see all published comics

---

## 🐛 Troubleshooting

### Issue: "Build failed - API key not configured"

**Solution**: Check GitHub Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify these secrets exist:
   - `VITE_FIREBASE_API_KEY`
   - `GEMINI_API_KEY`
3. If missing, add them (see Part 2)

### Issue: "Deploy failed - Permission denied"

**Solution**: Check Service Account permissions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **IAM**
3. Find `github-actions-deployer@...`
4. Click **Edit**
5. Ensure it has:
   - Firebase Hosting Admin
   - Cloud Datastore User
   - Storage Object Admin
6. Click **Save**

### Issue: "Images not visible to public users"

**Solution**: Deploy storage rules

1. Go to **Actions** tab
2. Run **Deploy Firebase Security Rules** workflow
3. Or manually deploy:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select **daily-muse-c79e7**
   - Click **Storage** → **Rules**
   - Copy the rules from `storage.rules` file in your repo
   - Click **Publish**

### Issue: "Cannot login as admin"

**Solution**: Check Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **daily-muse-c79e7**
3. Click **Authentication** → **Users**
4. Verify your admin user exists
5. If not, add it (see Part 3)

### Issue: "Quota exceeded" when generating images

**Solution**: Enable billing for Gemini API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select **daily-muse-c79e7**
3. Navigate to **Billing**
4. Ensure billing is enabled
5. Check **APIs & Services** → **Enabled APIs** → Gemini API quotas

---

## 📈 Monitoring & Costs

### View Usage

1. **Firebase Console**: https://console.firebase.google.com/
   - **Hosting**: See bandwidth and storage usage
   - **Firestore**: See reads/writes
   - **Storage**: See file storage and downloads
   - **Authentication**: See active users

2. **Google Cloud Console**: https://console.cloud.google.com/
   - **APIs & Services**: See Gemini API usage
   - **Billing**: See all costs

### Set Up Cost Alerts

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select **daily-muse-c79e7**
3. Navigate to **Billing** → **Budgets & alerts**
4. Click **CREATE BUDGET**
5. Set alert threshold (e.g., $10/month)
6. Add your email for notifications

### Estimated Free Tier Limits

- **Firebase Hosting**: 10GB storage, 360MB/day transfer
- **Firestore**: 50k reads, 20k writes, 20k deletes per day
- **Storage**: 5GB storage, 1GB/day downloads
- **Gemini API**: Check current free tier at [Google AI Pricing](https://ai.google.dev/pricing)

---

## 🎨 Workflow Summary

### For Creating Content (You as Admin):

1. Visit: `https://daily-muse-c79e7.web.app/admin`
2. Login with admin credentials
3. Generate title image with Gemini AI
4. Generate comic with Gemini AI
5. Schedule for a specific date
6. Publish (uploads to Firebase Storage + Firestore)

### For Viewing Content (Public Users):

1. Visit: `https://daily-muse-c79e7.web.app`
2. View today's muse on home page
3. Browse past muses in Archive
4. No login required!

### For Deployment (Automatic):

1. Make changes to code
2. Push to `main` branch
3. GitHub Actions automatically builds and deploys
4. Site updates within 2-3 minutes

---

## 🎯 Next Steps

1. ✅ Merge your current branch to `main` to trigger first deployment
2. ✅ Create admin user in Firebase Console
3. ✅ Test login at `/admin`
4. ✅ Generate your first muse
5. ✅ Publish it
6. ✅ View it on the home page

---

## 🔗 Quick Links

- **Your Live Site**: https://daily-muse-c79e7.web.app
- **Admin Panel**: https://daily-muse-c79e7.web.app/admin
- **GitHub Actions**: https://github.com/NaofumiAndo/DailyMuse/actions
- **Firebase Console**: https://console.firebase.google.com/project/daily-muse-c79e7
- **Google Cloud Console**: https://console.cloud.google.com/

---

## ✨ You're Done!

Everything is configured for GitHub-based deployment! You can now:
- 🚀 Deploy from GitHub (no local terminal needed)
- 🔐 API keys stored securely in GitHub Secrets
- 🤖 Automatic deployment on every push to `main`
- 🎨 Create and publish content from anywhere
- 🌍 Share your site with the world

**Ready to go live? Merge to `main` and watch GitHub Actions deploy your site!**
