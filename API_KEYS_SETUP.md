# API Keys Setup Guide

This guide explains how to set up all the necessary API keys to run the DailyMuse application.

## Overview

DailyMuse requires the following services:
- **Gemini API** - For AI-powered image generation
- **Firebase** - For authentication, database, and storage (already configured in code)

## 1. Gemini API Key Setup

### Get Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. If you don't have a project, create one
5. Copy your API key (it will look like `AIzaSy...`)

### Add to Your Project

1. In the root directory of the project (where `package.json` is located), create a file named `.env.local`

2. Add the following content:
   ```
   GEMINI_API_KEY=AIzaSy...your-actual-key-here
   ```

3. Replace `AIzaSy...your-actual-key-here` with your actual API key

### Security Note

- ✅ The `.env.local` file is already in `.gitignore` and will NOT be committed to git
- ✅ Never share your API key publicly or commit it to version control
- ✅ Keep your API key secure

## 2. Firebase Configuration

### Already Set Up ✓

The Firebase configuration is already included in the codebase at `src/services/firebase.ts`. You don't need to add any Firebase API keys manually.

### Firebase Storage Rules Required

However, you **must** configure Firebase Storage rules for images to work properly:

1. See the detailed guide: [FIREBASE_STORAGE_SETUP.md](FIREBASE_STORAGE_SETUP.md)
2. This is required for uploaded images to be visible to all users

## 3. Verify Setup

### Check Your Environment File

Your `.env.local` file should look like this:
```
GEMINI_API_KEY=AIzaSyBsmSLwyS5DfR-PUdMIQ_NyZTbCkAG__IE
```

### Test the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Navigate to the Creator/Admin page and try generating an image
   - If you see API key errors, check your `.env.local` file
   - If images upload but aren't visible, check Firebase Storage rules

## Troubleshooting

### "API key not configured" Error

- ✓ Verify `.env.local` exists in the project root
- ✓ Verify the variable name is exactly `GEMINI_API_KEY`
- ✓ Restart the development server (`npm run dev`)

### "Invalid API key" Error

- ✓ Check that you copied the entire API key
- ✓ Verify the API key is active in [Google AI Studio](https://aistudio.google.com/app/apikey)
- ✓ Make sure you're using a Gemini API key, not another Google API key

### "API quota exceeded" Error

- ✓ Check your usage at [Google AI Studio](https://aistudio.google.com/)
- ✓ You may need to enable billing or wait for quota reset
- ✓ Free tier has limited requests per minute

### Images Not Visible

- ✓ See [FIREBASE_STORAGE_SETUP.md](FIREBASE_STORAGE_SETUP.md)
- ✓ Configure Firebase Storage security rules

## Environment Variables Reference

| Variable | Purpose | Required | Where to Get |
|----------|---------|----------|--------------|
| `GEMINI_API_KEY` | AI image generation | Yes | [Google AI Studio](https://aistudio.google.com/app/apikey) |

## Additional Resources

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Storage Setup Guide](FIREBASE_STORAGE_SETUP.md)
