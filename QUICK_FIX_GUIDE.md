# 🚨 Quick Fix Guide - GitHub Actions Deployment Failures

## Problem: Deployment Failed

Your GitHub Actions workflows are failing because they need API keys to build and deploy.

---

## ✅ Solution: Add GitHub Secrets (5 minutes)

### Step 1: Go to Secrets Settings

Visit: **https://github.com/NaofumiAndo/DailyMuse/settings/secrets/actions**

### Step 2: Add Each Secret

Click **"New repository secret"** button for each of these:

---

### Secret #1: VITE_FIREBASE_API_KEY

**Name:** `VITE_FIREBASE_API_KEY`

**How to get the value:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **daily-muse-c79e7**
3. Click **APIs & Services** (left sidebar)
4. Click **Credentials**
5. Look for an API key (or create a new one if you deleted the old one)
6. Click the **copy icon** to copy the key
7. Paste it as the secret value

**If you need to create a new key:**
1. Click **+ CREATE CREDENTIALS** → **API key**
2. A popup shows your new key - copy it
3. Click **EDIT API KEY** (pencil icon)
4. Under **Application restrictions**: Choose **HTTP referrers**
5. Add these referrers:
   - `daily-muse-c79e7.web.app/*`
   - `daily-muse-c79e7.firebaseapp.com/*`
   - `localhost:*` (for local testing)
6. Under **API restrictions**: Choose **Restrict key**
7. Select these APIs:
   - Identity Toolkit API
   - Cloud Firestore API
   - Cloud Storage
   - Firebase Hosting API
8. Click **SAVE**

---

### Secret #2: GEMINI_API_KEY

**Name:** `GEMINI_API_KEY`

**How to get the value:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"** button
3. Choose: **Create API key in existing project**
4. Select: **daily-muse-c79e7**
5. Copy the API key shown
6. Paste it as the secret value

**Note:** Make sure billing is enabled for this API to work for image generation.

---

### Secret #3: FIREBASE_SERVICE_ACCOUNT

**Name:** `FIREBASE_SERVICE_ACCOUNT`

**How to get the value:**

**Method A: Create Service Account (Recommended)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **daily-muse-c79e7**
3. Navigate to: **IAM & Admin** → **Service Accounts**
4. Click **+ CREATE SERVICE ACCOUNT**
5. Enter:
   - **Name**: `github-actions`
   - **ID**: `github-actions` (auto-filled)
   - **Description**: `Service account for GitHub Actions deployment`
6. Click **CREATE AND CONTINUE**
7. Add these roles (click **+ ADD ANOTHER ROLE** for each):
   - **Firebase Hosting Admin**
   - **Cloud Datastore User**
   - **Storage Object Admin**
   - **Firebase Admin SDK Administrator Service Agent**
8. Click **CONTINUE** → **DONE**
9. Find the newly created service account in the list
10. Click on it
11. Go to **KEYS** tab
12. Click **ADD KEY** → **Create new key**
13. Select **JSON** format
14. Click **CREATE**
15. A JSON file downloads - open it in a text editor
16. **Copy the ENTIRE content** of the JSON file (all the curly braces, quotes, everything)
17. Paste it as the secret value in GitHub

**Method B: Using Firebase Token (Alternative)**

If Method A is too complex, you can use a Firebase CI token:

1. Install Firebase CLI locally: `npm install -g firebase-tools`
2. Run: `firebase login:ci`
3. Copy the token generated
4. Use this token instead

For this method, you'd need to:
- Skip adding `FIREBASE_SERVICE_ACCOUNT`
- Add `FIREBASE_TOKEN` instead with the token value
- Modify the workflow to use token authentication

---

## Step 3: Verify Secrets Are Added

After adding all secrets, go back to:
**https://github.com/NaofumiAndo/DailyMuse/settings/secrets/actions**

You should see:
- ✅ `VITE_FIREBASE_API_KEY`
- ✅ `GEMINI_API_KEY`
- ✅ `FIREBASE_SERVICE_ACCOUNT`

---

## Step 4: Re-run the Failed Workflow

1. Go to: **https://github.com/NaofumiAndo/DailyMuse/actions**
2. Click on the **"Deploy to Firebase Hosting"** workflow (the failed one)
3. Click **"Re-run jobs"** dropdown (top right)
4. Click **"Re-run all jobs"**
5. Wait 2-3 minutes

---

## Step 5: Watch for Success

The workflow should now:
- ✅ Checkout code
- ✅ Setup Node.js
- ✅ Install dependencies
- ✅ Build with environment variables
- ✅ Deploy to Firebase Hosting

When complete, you'll see:
- ✅ Green checkmark
- Your live site URL: **https://daily-muse-c79e7.web.app**

---

## 🐛 If It Still Fails

### Check the Error Logs

1. Click on the failed workflow
2. Click on the failed step (red X)
3. Look for the error message

**Common errors and solutions:**

### Error: "Error: HTTP Error: 403, The caller does not have permission"

**Solution:** Service account needs more permissions

1. Go to [IAM Console](https://console.cloud.google.com/iam-admin/iam?project=daily-muse-c79e7)
2. Find `github-actions@daily-muse-c79e7.iam.gserviceaccount.com`
3. Click **Edit** (pencil icon)
4. Make sure these roles are added:
   - Firebase Hosting Admin
   - Cloud Datastore User
   - Storage Object Admin
   - Service Account Token Creator
5. Click **Save**
6. Re-run the workflow

### Error: "Error: No Firebase project detected"

**Solution:** The `.firebaserc` file might be missing or incorrect

1. Check if `.firebaserc` exists in your repo
2. It should contain:
```json
{
  "projects": {
    "default": "daily-muse-c79e7"
  }
}
```

### Error: "API key not configured"

**Solution:** GitHub Secrets not properly set

1. Verify `VITE_FIREBASE_API_KEY` and `GEMINI_API_KEY` are added to secrets
2. Make sure there are no extra spaces or quotes when pasting
3. Re-run the workflow

### Error: "firebase.json not found"

**Solution:** Configuration file missing

1. Make sure `firebase.json` exists in the root of your repository
2. Check that it was committed and merged to main branch

---

## 🎯 Quick Checklist

Before re-running the workflow, verify:

- [ ] All 3 GitHub Secrets added correctly
- [ ] Service account has proper roles
- [ ] Billing enabled on Google Cloud (for Gemini API)
- [ ] Firebase project ID is `daily-muse-c79e7`
- [ ] `.firebaserc` file exists in repo

---

## 📞 Still Having Issues?

Take a screenshot of:
1. The error message from the failed workflow
2. Your GitHub Secrets page (names only, not values)

And I can help diagnose the specific issue!
