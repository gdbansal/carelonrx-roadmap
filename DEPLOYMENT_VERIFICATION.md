# 🚀 Production Deployment Verification Checklist

## ✅ Pre-Deployment (Completed)
- [x] Code changes committed to GitHub
- [x] Backend fix: Map field handling for MongoDB
- [x] Frontend fix: Polling delay and logging
- [x] Changes pushed to main branch

## 🔧 Render Configuration (In Progress)
- [ ] MongoDB URI added to environment variables
- [ ] Frontend URL configured
- [ ] Deployment completed successfully
- [ ] Logs show "MongoDB Connected Successfully"

## 🧪 Testing Checklist

### 1. Backend Health Check
- [ ] Visit: https://carelonrx-roadmap.onrender.com/api/health
- [ ] Should show: `"database": "connected"`

### 2. Story Estimations - Basic Flow
- [ ] Visit: https://carelonrx-roadmap1.onrender.com/story-estimations.html
- [ ] Login with your credentials
- [ ] Create a new session or join existing
- [ ] Add a story

### 3. Estimation Persistence Test
- [ ] Click an estimation number (e.g., [21])
- [ ] Button turns **blue** (selected state)
- [ ] Wait 2 seconds (for polling)
- [ ] Button **stays blue** (not reverting to gray)
- [ ] **Refresh the page** (F5)
- [ ] Estimation **still shows as selected** (blue button)

### 4. PO/Admin Visibility Test
- [ ] Login as PO or Admin
- [ ] Can see all team members' estimations
- [ ] Estimations display correctly with names and roles

### 5. Multi-User Test (If Possible)
- [ ] Open in two different browsers/incognito windows
- [ ] Login as different users
- [ ] Both users click estimations
- [ ] Both users can see each other's estimations (if revealed/PO)

### 6. Data Persistence Test
- [ ] Create estimations
- [ ] Close browser completely
- [ ] Reopen and navigate back to session
- [ ] All estimations should still be there

## 🐛 Troubleshooting

### If estimations don't persist:
1. Check browser console (F12) for errors
2. Look for: `📥 Server estimations: {}` (should NOT be empty)
3. Check Render logs for MongoDB connection errors

### If you see "Failed to fetch":
1. Check if backend is running: https://carelonrx-roadmap.onrender.com/api/health
2. Verify CORS settings in Render environment variables
3. Check browser console for CORS errors

### If MongoDB shows disconnected:
1. Verify MONGODB_URI is set in Render environment
2. Check MongoDB Atlas network access (0.0.0.0/0)
3. Verify database user credentials are correct

## 📊 Expected Results

### Browser Console (Success):
```
✅ Estimation synced to server
🔓 Polling resumed
📥 Server estimations: {storyId: {userKey: {points: 21, ...}}}
✅ Returning points: 21
```

### Render Logs (Success):
```
✅ MongoDB Connected Successfully
📊 Database: carelonrx-roadmap
📝 Updating session: session_...
📦 Received estimations: {"storyId":{"userKey":{...}}}
✅ Session updated, estimations: {"storyId":{"userKey":{...}}}
```

## ✅ Sign-Off

- [ ] All tests passed
- [ ] Estimations persist correctly
- [ ] No console errors
- [ ] Production deployment verified

**Tested by:** _________________
**Date:** _________________
**Status:** ☐ PASS  ☐ FAIL

---

## 📞 Support

If issues persist:
1. Check GitHub repository: https://github.com/gdbansal/carelonrx-roadmap
2. Review commit: `Fix story estimation persistence`
3. Contact: [Your support contact]
