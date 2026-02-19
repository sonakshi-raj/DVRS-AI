# Troubleshooting Interview Page Loading

## Issue: Interview Page Stuck Loading

### Most Common Causes:

#### 1. **Not Logged In** (Most Likely)
The interview endpoints require authentication. If you're not logged in:
- All API calls return 401 Unauthorized
- Loading state never completes
- You won't see errors unless you check the console

**Solution:**
1. First go to `/login` 
2. Log in with your credentials
3. THEN navigate to dashboard
4. Click "Start New Interview" from dashboard

**DO NOT** navigate directly to `/interview` URL!

#### 2. **Browser Cache**
Old JavaScript might be cached.

**Solution:**
- Press **Ctrl + Shift + R** (hard refresh)
- Or clear browser cache

#### 3. **Backend Not Running**
If backend isn't running, API calls will fail.

**Check:**
```powershell
# In backend folder
npm start
```

Should see:
```
Server running on 5002
MongoDB connected
```

#### 4. **Frontend Not Running**
**Check:**
```powershell
# In frontend folder
ng serve
```

Should see:
```
Application bundle generation complete.
```

## Debug Steps:

### Step 1: Open Browser Console
1. Press **F12**
2. Go to **Console** tab
3. Refresh page
4. Look for errors in RED

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Refresh page
3. Look for failed requests (red color)
4. Click on failed requests to see error details

### Common Error Messages:

#### `401 Unauthorized`
**Problem:** Not logged in
**Solution:** Go to `/login` first

#### `Failed to fetch` or `net::ERR_CONNECTION_REFUSED`
**Problem:** Backend not running
**Solution:** Start backend (`npm start` in backend folder)

#### `404 Not Found`
**Problem:** Wrong API endpoint
**Solution:** Check if routes are registered in backend/app.js

#### `CORS Error`
**Problem:** CORS configuration issue
**Solution:** Verify backend app.js has:
```javascript
app.use(cors({origin: 'http://localhost:4200', credentials: true}));
```

## Proper User Flow:

```
1. Start backend:
   cd backend
   npm start

2. Start frontend (in new terminal):
   cd frontend
   ng serve

3. Open browser:
   http://localhost:4200

4. Register/Login:
   - If new user: Go to /register, create account
   - If existing: Go to /login, enter credentials

5. After login, you're redirected to dashboard

6. Click "Start New Interview" button

7. Interview page loads with questions
```

## Quick Test:

Open browser console and run:
```javascript
// Check if user is logged in
fetch('http://localhost:5002/api/user', {credentials: 'include'})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If you get `{status: "error", msg: "No Tokens Found!!"}`, you're NOT logged in!

## Fixed Issues in Latest Code:

✅ Fixed `protect` middleware export
✅ Fixed `logout()` method in auth service
✅ Added proper error handling in interview component
✅ Added proper error handling in dashboard component
✅ Loading state now always resolves (won't get stuck)
✅ Error messages now display to user

## Current Status:

- **Backend**: Running on http://localhost:5002
- **Frontend**: Running on http://localhost:4200
- **MongoDB**: Connected
- **Authentication**: Cookie-based with JWT

After the fixes, error messages will now show on screen. Check the red error box at the top of the page!
