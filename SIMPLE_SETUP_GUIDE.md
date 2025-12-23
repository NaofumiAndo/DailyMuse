# 🚀 DailyMuse - Simple Setup Guide (No Firebase Required!)

Complete setup guide for running DailyMuse locally and deploying it - **no cloud database needed!**

## ✨ What You'll Have

- 🎨 AI-powered comic/image generator
- 📁 Images saved directly to GitHub
- 🔒 Simple password protection
- 🌐 Static website (deploy anywhere for free)
- 💰 Zero cloud costs

---

## 📋 Prerequisites

Install these first:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Git** - [Download](https://git-scm.com/)
3. **Code Editor** (VS Code recommended) - [Download](https://code.visualstudio.com/)

Verify installation:
```bash
node --version
git --version
```

---

## 🛠️ Step-by-Step Setup

### 1️⃣ Clone the Repository

```bash
# Clone your repository
git clone https://github.com/NaofumiAndo/DailyMuse.git

# Navigate into the folder
cd DailyMuse

# Switch to the no-Firebase branch
git checkout claude/save-images-to-github-CnNRO
```

### 2️⃣ Install Dependencies

```bash
npm install
```

This installs React, Express, and other required packages.

### 3️⃣ Set Your Admin Password

Create a `.env` file in the root directory:

**Windows (Command Prompt):**
```cmd
type nul > .env
```

**Windows (PowerShell):**
```powershell
New-Item .env
```

**Mac/Linux:**
```bash
touch .env
```

Then open `.env` and add:

```env
# Admin password for accessing the creator panel
VITE_ADMIN_PASSWORD=your-secret-password-here

# Optional: Custom API URL (default is http://localhost:3001)
# VITE_API_URL=http://localhost:3001
```

**⚠️ IMPORTANT:**
- Replace `your-secret-password-here` with your own secure password
- Don't share this password with anyone
- Default password (if not set) is `admin123` - **change this!**

### 4️⃣ Start the Development Servers

You need **2 servers** running:

**Option A: Two Terminals (Recommended)**

Terminal 1 - Backend API:
```bash
npm run server
```
✅ Should show: `GitHub Storage API running on http://localhost:3001`

Terminal 2 - Frontend:
```bash
npm run dev
```
✅ Should show: `Local: http://localhost:5173/`

**Option B: Single Command**
```bash
npm run dev:all
```

### 5️⃣ Access the App

Open your browser:
```
http://localhost:5173/
```

**Admin Panel:**
```
http://localhost:5173/#/admin
```

Login with the password you set in `.env`!

---

## 🎨 Creating Your First Muse

1. Go to `http://localhost:5173/#/admin`
2. Enter your password
3. Fill in the form:
   - **Character Concept**: "A young detective with blue hair"
   - **Title**: "Mystery at Midnight"
   - **Episode**: "#01"
4. Click **"Generate Title Card"** (wait ~10 seconds)
5. Click **"Next: Create Comic"**
6. Write your story (e.g., "Panel 1: Detective finds a clue...")
7. Click **"Generate 4-Panel Comic"** (wait ~20 seconds)
8. Click **"Review & Schedule"**
9. Select a date
10. Click **"Publish Comic"**

🎉 Your first muse is created!

---

## 📁 Check the Generated Files

Look in your project folder:

```
DailyMuse/
└── public/
    └── data/
        └── muses/
            ├── index.json              ← List of all muses
            ├── 2024-12-23.json         ← Metadata
            ├── 2024-12-23-title.jpg    ← Title image
            └── 2024-12-23-comic.jpg    ← Comic image
```

---

## 💾 Save to GitHub

After creating a muse, commit it to GitHub:

```bash
# Check what was created
git status

# Add the new files
git add public/data/muses/

# Commit
git commit -m "Add muse for 2024-12-23"

# Push to GitHub
git push
```

Your muse is now saved in Git forever! 🎉

---

## 🌐 Deployment Options

### Option 1: GitHub Pages (Free)

1. Build the site:
   ```bash
   npm run build
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add to `package.json` scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages:
   - Go to your repo → Settings → Pages
   - Source: `gh-pages` branch
   - Your site: `https://yourusername.github.io/DailyMuse/`

### Option 2: Netlify (Free)

1. Build the site:
   ```bash
   npm run build
   ```

2. Go to [Netlify](https://netlify.com)
3. Drag & drop the `dist/` folder
4. Done! Your site is live

### Option 3: Vercel (Free)

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Vercel automatically detects Vite
4. Click Deploy
5. Done!

---

## 🔧 Troubleshooting

### "Port 3001 already in use"

**Windows:**
```cmd
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
```

**Mac/Linux:**
```bash
lsof -ti:3001 | xargs kill
```

### "Cannot connect to backend"

- Make sure backend is running: `npm run server`
- Check port 3001 is not blocked by firewall
- Verify `.env` has correct `VITE_API_URL`

### "Password not working"

- Check `.env` file has `VITE_ADMIN_PASSWORD=yourpassword`
- No spaces around the `=` sign
- Restart the dev server after changing `.env`

### "Images not showing"

- Backend API must be running during development
- Check `public/data/muses/` has the image files
- Check browser console for errors

---

## 📖 Project Structure

```
DailyMuse/
├── public/              # Static files (deployed)
│   └── data/
│       └── muses/      # Your muse images and JSON
├── src/
│   ├── pages/          # React pages
│   │   ├── Admin.tsx       # Creator panel
│   │   ├── Home.tsx        # Today's muse
│   │   └── Archive.tsx     # Past muses
│   └── services/
│       ├── gemini.ts       # AI image generation
│       └── githubStorage.ts # File storage
├── server.js           # Backend API (dev only)
├── package.json
└── .env               # Your password (don't commit!)
```

---

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run server` | Start backend API |
| `npm run dev` | Start frontend |
| `npm run dev:all` | Start both servers |
| `npm run build` | Build for production |
| `git add .` | Stage changes |
| `git commit -m "msg"` | Commit changes |
| `git push` | Push to GitHub |

---

## 🔐 Security Notes

1. **Never commit `.env` to GitHub**
   - It's already in `.gitignore`
   - Contains your admin password

2. **Change default password**
   - Default is `admin123`
   - Use a strong password

3. **For production:**
   - Use a strong password
   - Consider adding HTTPS
   - The password is stored in localStorage (browser)

---

## ❓ FAQ

**Q: Do I need Firebase?**
A: No! This version doesn't use Firebase at all.

**Q: Where are images stored?**
A: In your GitHub repository at `public/data/muses/`

**Q: Can other people view my site?**
A: Yes! After deploying, anyone can view (but only you can create with password)

**Q: Is it really free?**
A: Yes! No cloud costs. GitHub hosting is free, Netlify/Vercel free tiers are generous.

**Q: How do I change my password?**
A: Edit `.env` file, change `VITE_ADMIN_PASSWORD`, restart the server

**Q: Can I add multiple admins?**
A: Not currently - this is a simple single-password system

---

## 🎉 You're Ready!

1. ✅ Clone the repo
2. ✅ Set your password in `.env`
3. ✅ Run `npm install`
4. ✅ Start both servers
5. ✅ Create your first muse
6. ✅ Commit to GitHub
7. ✅ Deploy to the web

**Happy creating! 🎨**

---

## 📞 Need Help?

- Check [GITHUB_STORAGE_GUIDE.md](GITHUB_STORAGE_GUIDE.md) for technical details
- Open an issue on GitHub
- Check browser console for errors

---

Made with ❤️ by you, powered by AI
