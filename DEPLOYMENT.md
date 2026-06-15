# 🚀 Deployment Guide - Render

This guide will help you deploy the CarelonRx Roadmap application to Render for free.

## 📋 Prerequisites

1. **GitHub Account** - Create one at https://github.com if you don't have one
2. **Render Account** - Sign up at https://render.com (free tier available)
3. **Git installed** - Download from https://git-scm.com/downloads

## 🔧 Step 1: Push Code to GitHub

### Option A: Using Git Command Line

1. **Initialize Git repository** (if not already done):
   ```bash
   cd C:\Users\AL51598\CascadeProjects\carelonrx-roadmap
   git init
   ```

2. **Create .gitignore file** (already exists, verify it contains):
   ```
   node_modules/
   .env
   *.log
   ```

3. **Add all files**:
   ```bash
   git add .
   git commit -m "Initial commit - CarelonRx Roadmap"
   ```

4. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name it: `carelonrx-roadmap`
   - Don't initialize with README (we already have code)
   - Click "Create repository"

5. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/carelonrx-roadmap.git
   git branch -M main
   git push -u origin main
   ```

### Option B: Using GitHub Desktop

1. Download GitHub Desktop from https://desktop.github.com/
2. Open GitHub Desktop
3. File → Add Local Repository → Select your project folder
4. Click "Publish repository" button
5. Choose repository name and click "Publish"

## 🌐 Step 2: Deploy Backend to Render

1. **Go to Render Dashboard**:
   - Visit https://dashboard.render.com/
   - Click "New +" → "Web Service"

2. **Connect GitHub Repository**:
   - Click "Connect GitHub" (first time only)
   - Select your `carelonrx-roadmap` repository
   - Click "Connect"

3. **Configure Backend Service**:
   - **Name**: `carelonrx-roadmap-api`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

4. **Add Environment Variables** (Optional):
   - Click "Advanced" → "Add Environment Variable"
   - Add: `NODE_ENV` = `production`

5. **Click "Create Web Service"**

6. **Wait for deployment** (5-10 minutes)
   - Render will install dependencies and start your server
   - Once done, you'll see "Live" status
   - Copy your backend URL (e.g., `https://carelonrx-roadmap-api.onrender.com`)

## 🎨 Step 3: Deploy Frontend to Render

### Option A: Deploy as Static Site (Recommended)

1. **Go to Render Dashboard**:
   - Click "New +" → "Static Site"

2. **Connect Same Repository**:
   - Select your `carelonrx-roadmap` repository

3. **Configure Frontend Service**:
   - **Name**: `carelonrx-roadmap`
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `echo "Static site"`
   - **Publish Directory**: `frontend`

4. **Click "Create Static Site"**

5. **Wait for deployment** (2-3 minutes)
   - Copy your frontend URL (e.g., `https://carelonrx-roadmap.onrender.com`)

### Option B: Use Alternative Free Hosting for Frontend

**Netlify** (Easier for static sites):
1. Go to https://www.netlify.com/
2. Drag and drop your `frontend` folder
3. Site is live instantly!

**Vercel**:
1. Go to https://vercel.com/
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Deploy

## 🔗 Step 4: Update Frontend Configuration

1. **Update API URL in frontend files**:
   
   Open each HTML file in the `frontend` folder and replace:
   ```javascript
   'http://localhost:5000'
   ```
   
   With your Render backend URL:
   ```javascript
   'https://carelonrx-roadmap-api.onrender.com'
   ```

   **Files to update**:
   - `login.html`
   - `dashboard.html`
   - `intake.html`
   - `roadmap.html`
   - `admin.html`

2. **Alternative: Use config.js** (Better approach):
   
   Add this line to the `<head>` section of each HTML file:
   ```html
   <script src="config.js"></script>
   ```
   
   Then replace all instances of `'http://localhost:5000'` with:
   ```javascript
   API_CONFIG.API_URL
   ```

3. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push
   ```

4. **Render will auto-deploy** the changes

## ✅ Step 5: Test Your Deployment

1. **Visit your frontend URL**:
   - Example: `https://carelonrx-roadmap.onrender.com/login.html`

2. **Login with demo credentials**:
   - Username: `admin`
   - Password: `admin123`

3. **Test all features**:
   - ✅ Login/Logout
   - ✅ Dashboard view
   - ✅ Create new initiative
   - ✅ Edit initiative
   - ✅ Roadmap visualization
   - ✅ Admin panel

## ⚠️ Important Notes

### Free Tier Limitations

**Render Free Tier**:
- ✅ 750 hours/month (enough for 1 service running 24/7)
- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ **Cold start**: First request after spin-down takes 30-60 seconds
- ✅ Automatic HTTPS
- ✅ Custom domains supported

### Keeping Your App Awake

If you want to prevent cold starts, you can:

1. **Use a monitoring service** (free):
   - UptimeRobot: https://uptimerobot.com/
   - Ping your backend every 14 minutes

2. **Upgrade to paid plan** ($7/month):
   - No spin-down
   - Faster performance
   - More resources

### Data Persistence

⚠️ **Important**: The current app uses in-memory storage. Data will be lost when the server restarts.

**To persist data**, consider:
1. Adding a database (PostgreSQL free tier on Render)
2. Using file-based storage
3. Implementing session storage

## 🔧 Troubleshooting

### Backend not responding
- Check Render logs: Dashboard → Your Service → Logs
- Verify environment variables are set
- Check if service is "Live"

### Frontend can't connect to backend
- Verify API URL is correct in frontend files
- Check CORS settings in backend
- Open browser console (F12) to see errors

### Cold start is too slow
- Consider using a ping service
- Upgrade to paid tier
- Use a different hosting provider for backend

## 📱 Access Your App

Once deployed, you can access your app from anywhere:

- **Frontend**: `https://your-app-name.onrender.com/login.html`
- **Backend API**: `https://your-api-name.onrender.com/api/health`

Share the frontend URL with your team!

## 🎉 You're Done!

Your CarelonRx Roadmap is now live on the internet! 🚀

### Next Steps:
- [ ] Set up custom domain (optional)
- [ ] Add database for data persistence
- [ ] Set up monitoring/uptime checks
- [ ] Configure environment variables for security
- [ ] Enable automatic deployments from GitHub

---

**Need Help?**
- Render Documentation: https://render.com/docs
- GitHub Issues: Create an issue in your repository
