<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ZDGZNDu6J-FGOjA5r7hZHJ2VOPcs_Jr8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. **Important**: Configure Firebase Storage rules for public image access
   - See [FIREBASE_STORAGE_SETUP.md](FIREBASE_STORAGE_SETUP.md) for detailed instructions
   - This is required for images to be visible to all users
4. Run the app:
   `npm run dev`

## Firebase Storage Setup

If images aren't appearing after upload or aren't visible to other users, you need to update your Firebase Storage security rules.

See the detailed guide: [FIREBASE_STORAGE_SETUP.md](FIREBASE_STORAGE_SETUP.md)
