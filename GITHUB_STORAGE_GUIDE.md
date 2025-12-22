# GitHub Storage Guide

## Overview

DailyMuse now saves images and data directly to **GitHub** instead of cloud databases (Firebase Storage/Firestore). This means:

✅ **No cloud storage costs** for images
✅ **Version control** for all content
✅ **Static file serving** from GitHub
✅ **Simple deployment** - just commit and push

## How It Works

### Architecture

1. **Creator generates images** using the Admin panel
2. **Images saved to `public/data/muses/`** directory as `.jpg` files
3. **Metadata saved as JSON** files in the same directory
4. **Website reads from GitHub** (static files served)
5. **Creator commits and pushes** to GitHub to publish

### File Structure

```
public/data/muses/
├── index.json              # List of all muse dates
├── 2024-12-22.json         # Metadata for Dec 22
├── 2024-12-22-title.jpg    # Title image
├── 2024-12-22-comic.jpg    # Comic image
├── 2024-12-23.json
├── 2024-12-23-title.jpg
└── 2024-12-23-comic.jpg
```

## Development Workflow

### 1. Start the Development Server

You need to run **both** the backend API and the frontend:

```bash
# Terminal 1: Start the backend API (handles file operations)
npm run server

# Terminal 2: Start the frontend dev server
npm run dev
```

Or run both at once:

```bash
npm run dev:all
```

### 2. Create a New Muse

1. Go to `/admin` and log in
2. Fill in character, title, episode number
3. Generate title image
4. Generate comic image
5. Schedule the muse for a specific date
6. Click "Publish Comic"

The backend API will:
- Save images to `public/data/muses/{date}-title.jpg` and `{date}-comic.jpg`
- Save metadata to `public/data/muses/{date}.json`
- Update `public/data/muses/index.json`

### 3. Publish to GitHub

After creating a muse, commit and push the files:

```bash
# Check what files were created
git status

# Add the new files
git add public/data/muses/

# Commit
git commit -m "Add muse for 2024-12-22"

# Push to GitHub
git push
```

### 4. Deploy

The deployed site will automatically read from the `public/data/muses/` directory.

## Production Deployment

### GitHub Pages

1. Build the site:
   ```bash
   npm run build
   ```

2. The `dist/` folder will contain:
   - All compiled assets
   - `data/muses/` with all images and metadata

3. Deploy `dist/` to GitHub Pages

4. The site will serve images from:
   ```
   https://yourusername.github.io/DailyMuse/data/muses/2024-12-22-title.jpg
   ```

### Firebase Hosting

1. Build the site:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

3. Images will be served from:
   ```
   https://your-app.web.app/data/muses/2024-12-22-title.jpg
   ```

## API Reference

### Backend API Endpoints

The development server (`server.js`) provides:

#### Save Muse
```http
POST /api/muses
Content-Type: application/json

{
  "entry": {
    "scheduledDate": "2024-12-22",
    "title": "My Comic",
    "episodeNumber": "#01",
    "titleImage": "data:image/jpeg;base64,...",
    "comicImage": "data:image/jpeg;base64,...",
    "characterDescription": "...",
    "concept": "...",
    "createdAt": 1234567890
  }
}
```

#### Delete Muse
```http
DELETE /api/muses/:date
```

#### Update Muse Date
```http
PUT /api/muses/:oldDate
Content-Type: application/json

{
  "newDate": "2024-12-23"
}
```

## Configuration

### Environment Variables

Create `.env` file:

```env
# Firebase Auth (still used for admin login)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# API URL (optional, defaults to http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

### Production

For production, the API is not needed. The site reads static JSON files directly from the `data/muses/` directory.

## Migration from Firebase Storage

If you have existing muses in Firebase Storage:

1. Download all images from Firebase Storage
2. Rename them to the format: `YYYY-MM-DD-title.jpg` and `YYYY-MM-DD-comic.jpg`
3. Create JSON metadata files for each muse
4. Update `index.json` with all dates
5. Commit to GitHub

## Troubleshooting

### Images not loading

- Check that files exist in `public/data/muses/`
- Check that `index.json` contains the date
- Check browser console for 404 errors

### Cannot save muse

- Make sure the backend API is running (`npm run server`)
- Check that port 3001 is not in use
- Check browser console for CORS errors

### Build fails

- Run `npm install` to install dependencies
- Check TypeScript errors: `npm run build`

## Benefits

✅ **Cost**: No cloud storage fees
✅ **Speed**: Static files served directly
✅ **Version Control**: All content in Git
✅ **Backup**: GitHub is the backup
✅ **Transparency**: Anyone can see the data
✅ **Simplicity**: No database management

## Firebase Still Used

Firebase Auth is still used for:
- Admin login authentication
- Secure access to creator panel

This is inexpensive and provides good security.
