# Creator Workflow Guide

This guide explains how to use the Daily Muse app as a creator to generate and publish comics.

## Overview

The Daily Muse app has been configured to:
- ✅ Generate images locally using Gemini AI
- ✅ Save images to GitHub repository (NOT cloud database)
- ✅ Keep your creator password local and secure
- ✅ Serve content via GitHub Pages (read-only for public)

## Important Security Notes

⚠️ **Your creator password is ONLY secure when running locally!**

- Never commit your `.env` file to GitHub
- Only use the Creator panel on your local machine
- The deployed GitHub Pages site should be used by viewers only

## Setup (One-Time)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Your Local Environment File
```bash
# Copy the example file
cp .env.example .env
```

### 3. Configure Your Settings

Edit the `.env` file and add your values:

```env
# Get your Gemini API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_actual_gemini_api_key

# Set a secure password for the Creator panel
VITE_ADMIN_PASSWORD=your_secure_password_here
```

**IMPORTANT**: Keep this file safe and NEVER commit it to GitHub!

## Daily Workflow

### Step 1: Run the App Locally

Open two terminals and run:

```bash
# Terminal 1: Start the backend server
npm run server

# Terminal 2: Start the frontend
npm run dev
```

Or run both together:
```bash
npm run dev:all
```

The app will open at: `http://localhost:3000`

### Step 2: Login to Creator Panel

1. Navigate to the "Creator" tab (or go to `http://localhost:3000/#/admin`)
2. Enter your password (the one you set in `.env`)
3. Click "Enter Studio"

### Step 3: Generate Your Comic

#### Phase 1: Character & Title
1. Enter your character description (optional but recommended for consistency)
2. Enter the comic title
3. Enter the episode number (e.g., "#01", "#02")
4. Click "Generate Title Card"
5. Wait for the AI to generate the title image
6. Click "Next: Create Comic"

#### Phase 2: Create Comic
1. Write your 4-panel comic story/concept
   - Each sentence will become one panel
   - Be descriptive about what happens in each panel
2. Click "Generate 4-Panel Comic"
3. Wait for the AI to create your comic
4. Review the preview on the right
5. Click "Review & Schedule"

#### Phase 3: Publish
1. Select the date you want to publish this comic
2. Click "Publish Comic"
3. Wait for the upload to complete
4. You'll see a "Muse Scheduled" success message

### Step 4: Commit to GitHub

After generating your comic, the files are saved locally in:
```
public/data/muses/
  ├── YYYY-MM-DD-title.jpg
  ├── YYYY-MM-DD-comic.jpg
  ├── YYYY-MM-DD.json
  └── index.json
```

To publish to your website:

```bash
# 1. Check what files were added
git status

# 2. Add the new files
git add public/data/muses/

# 3. Commit with a descriptive message
git commit -m "Add new comic for YYYY-MM-DD"

# 4. Push to GitHub
git push
```

### Step 5: Verify on GitHub Pages

After pushing, wait 1-2 minutes for GitHub Pages to rebuild, then visit your site:
- Your GitHub Pages URL (e.g., `https://yourusername.github.io/dailymuse`)

The new comic should appear on the "Today" page (if scheduled for today) or in the "Archive" page.

## Managing Existing Comics

### View Scheduled Comics
At the bottom of the Creator panel, you'll see a list of all scheduled comics.

### Delete a Comic
1. Click the X button next to any comic in the list
2. Confirm the deletion
3. Commit the changes to GitHub:
   ```bash
   git add public/data/muses/
   git commit -m "Remove comic for YYYY-MM-DD"
   git push
   ```

## Troubleshooting

### "API key not configured" Error
- Make sure you've created a `.env` file
- Verify your `GEMINI_API_KEY` is correct
- Restart the dev server after changing `.env`

### "Upload failed" Error
- Make sure the backend server is running (`npm run server`)
- Check that port 3001 is not being used by another app
- Look in the browser console for detailed error messages

### Images Not Appearing on Website
- Verify files were committed to GitHub
- Check GitHub Actions to ensure the deployment succeeded
- Wait 1-2 minutes for GitHub Pages to update
- Clear your browser cache

### Can't Login to Creator Panel
- Verify your password in `.env` matches what you're typing
- Make sure you copied `.env.example` to `.env`
- Restart the dev server

## Best Practices

1. **Generate comics locally** - Never expose your Creator panel publicly
2. **Commit regularly** - Don't let too many comics pile up without committing
3. **Use descriptive commit messages** - Makes it easier to track changes
4. **Test locally first** - Preview your comic before publishing
5. **Keep backups** - Your comics are in the repository, but consider backing up your `.env` file separately

## File Structure

```
dailymuse/
├── .env                    # Your local secrets (NEVER commit!)
├── .env.example            # Template for .env
├── server.js               # Backend API for saving images
├── public/
│   └── data/
│       └── muses/          # All your comics are saved here
│           ├── index.json  # List of all comic dates
│           ├── 2025-01-01.json
│           ├── 2025-01-01-title.jpg
│           └── 2025-01-01-comic.jpg
└── pages/
    └── Admin.tsx           # Creator panel (local use only)
```

## What Gets Deployed to GitHub Pages

When you push to GitHub, GitHub Pages will serve:
- The "Today" page (shows today's comic)
- The "Archive" page (shows all past comics)
- The "Creator" page (but it won't work without your local `.env` file)

Public visitors will only see the comic viewer pages. They won't be able to login or create comics because:
1. Your password is in `.env` (which is not deployed)
2. The backend server is not running on GitHub Pages
3. GitHub Pages only serves static files

## Summary

This workflow ensures:
- ✅ Your password stays private and local
- ✅ Images are stored in GitHub (not a cloud database)
- ✅ The public website is read-only
- ✅ You have full control over what gets published
- ✅ No Firebase or cloud dependencies

Happy creating! 🎨
