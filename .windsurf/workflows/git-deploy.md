---
description: Local development, testing and push to GitHub (triggers CI/CD deploy)
---

## Step 1: Pull latest code from GitHub
```
git pull origin main
```

## Step 2: Create a feature branch for your changes
```
git checkout -b feature/your-feature-name
```

## Step 3: Start backend locally for testing
```
cd backend
npm install
npm start
```

## Step 4: Open frontend in browser
Open `frontend/login.html` in your browser or run:
```
cd frontend
npx http-server -p 8080
```
Then visit http://localhost:8080/login.html

## Step 5: Make and test your changes locally

## Step 6: Stage and commit your changes
```
git add .
git commit -m "feat: describe your change here"
```

## Step 7: Push branch to GitHub
```
git push origin feature/your-feature-name
```

## Step 8: Open a Pull Request on GitHub
- Go to https://github.com/gdbansal/carelonrx-roadmap
- Open a PR from your feature branch to `main`
- CI checks (backend test + frontend validation) will run automatically

## Step 9: Merge PR to main → Auto Deploy
- Once merged to `main`, GitHub Actions triggers Render deploy hooks
- Backend and frontend are deployed automatically

## GitHub Secrets Required (set in repo Settings > Secrets)
- `RENDER_DEPLOY_HOOK_BACKEND` — Render deploy hook URL for backend service
- `RENDER_DEPLOY_HOOK_FRONTEND` — Render deploy hook URL for frontend service
