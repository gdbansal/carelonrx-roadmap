# ⚡ Quick Deploy to Render - 5 Minutes

## 🎯 Fastest Way to Deploy

### Step 1: Push to GitHub (2 minutes)

```bash
cd C:\Users\AL51598\CascadeProjects\carelonrx-roadmap
git init
git add .
git commit -m "Initial commit"
```

Go to https://github.com/new and create a repository named `carelonrx-roadmap`

```bash
git remote add origin https://github.com/YOUR_USERNAME/carelonrx-roadmap.git
git push -u origin main
```

### Step 2: Deploy Backend (2 minutes)

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Fill in:
   - Name: `carelonrx-roadmap-api`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Click **"Create Web Service"**
6. **Copy the URL** (e.g., `https://carelonrx-roadmap-api.onrender.com`)

### Step 3: Deploy Frontend (1 minute)

**Option A - Render:**
1. Click **"New +"** → **"Static Site"**
2. Select same repo
3. Publish Directory: `frontend`
4. Click **"Create Static Site"**

**Option B - Netlify (Easier):**
1. Go to https://app.netlify.com/drop
2. Drag and drop the `frontend` folder
3. Done! ✅

### Step 4: Update API URL

Run this command with your backend URL:

```powershell
.\update-api-url.ps1 "https://carelonrx-roadmap-api.onrender.com"
```

Then push changes:

```bash
git add .
git commit -m "Update API URL"
git push
```

### Step 5: Access Your App! 🎉

Visit: `https://your-frontend-url.onrender.com/login.html`

Login: `admin` / `admin123`

---

## 🆓 100% Free Hosting

- ✅ Backend: Render Free Tier
- ✅ Frontend: Render or Netlify Free Tier
- ✅ HTTPS included
- ⚠️ Backend sleeps after 15 min (wakes up in 30-60 sec)

## 📝 Important URLs

After deployment, save these:

- **Frontend**: `https://__________.onrender.com/login.html`
- **Backend**: `https://__________.onrender.com`
- **GitHub**: `https://github.com/YOUR_USERNAME/carelonrx-roadmap`

---

**Need detailed instructions?** See `DEPLOYMENT.md`
