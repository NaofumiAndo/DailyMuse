<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Daily Muse - AI Comic Generator

A creative web app for generating and publishing daily AI-generated comics using Google's Gemini AI.

## Features

- **Creator Studio**: Generate title cards and 4-panel comics with AI
- **Static Hosting**: Images and metadata stored in GitHub, served via GitHub Pages
- **No Cloud Database**: All data is stored as static files in the repository
- **Secure Workflow**: Creator panel runs locally, public site is read-only

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your configuration:
   ```bash
   # Copy the example file
   cp .env.example .env
   ```

3. Edit `.env` and set your values:
   ```
   VITE_ADMIN_PASSWORD=your-secure-password-here
   ```

4. Run both the backend server and frontend:
   ```bash
   npm run dev:all
   ```

   Or run them separately:
   ```bash
   # Terminal 1: Backend server
   npm run server

   # Terminal 2: Frontend dev server
   npm run dev
   ```

## How It Works

1. **Creator Workflow** (Local Only):
   - Run the app locally with `npm run dev:all`
   - Login to the Creator panel at `/admin`
   - Generate images using Gemini AI
   - Images are saved to `public/data/muses/` directory
   - Commit and push changes to GitHub

2. **Public Website** (GitHub Pages):
   - GitHub Pages serves the static files
   - Users see comics on the "Today" and "Archive" pages
   - No authentication required for viewing

## Deployment

The site is deployed on GitHub Pages. To update:

1. Generate new comics locally
2. Commit the generated files in `public/data/muses/`
3. Push to GitHub:
   ```bash
   git add public/data/muses/
   git commit -m "Add new comic for YYYY-MM-DD"
   git push
   ```

## Security Notes

- The `.env` file is gitignored and should NEVER be committed
- Keep your admin password secure and local
- The Creator panel should only be accessed locally
- The deployed site on GitHub Pages is read-only
