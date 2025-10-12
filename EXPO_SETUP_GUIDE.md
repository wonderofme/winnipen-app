# Expo Push Notifications Setup Guide

## Current Status
Push notifications are temporarily disabled to prevent login issues. Your app works perfectly for all other features.

## To Enable Push Notifications (Optional)

### Option 1: Quick Setup (Recommended)
1. **Create Expo Account** (if you don't have one):
   ```bash
   npx expo register
   ```

2. **Login to Expo**:
   ```bash
   npx expo login
   ```

3. **Create Expo Project**:
   ```bash
   cd frontend
   npx expo init --template blank
   ```
   (This will create a proper projectId)

4. **Re-enable Push Notifications**:
   - Uncomment the push notification code in `frontend/src/context/AuthContext.js`
   - Remove the temporary disable messages

### Option 2: Manual Project ID
1. **Get Project ID from Expo**:
   - Go to https://expo.dev
   - Create a new project
   - Copy the project ID (UUID format)

2. **Add to app.json**:
   ```json
   {
     "expo": {
       "projectId": "your-actual-project-id-here"
     }
   }
   ```

3. **Update push notification service**:
   - Replace the projectId in `frontend/src/services/pushNotificationService.js`

### Option 3: Keep Disabled (Simplest)
- Your app works perfectly without push notifications
- All other features (posts, follows, real-time updates) work great
- You can always add push notifications later

## Current App Features (All Working)
✅ User authentication and login
✅ Create and view posts
✅ Follow/unfollow users
✅ Real-time updates via Socket.IO
✅ Location-based posts
✅ Image uploads
✅ Comments and likes
✅ User profiles
✅ Post deletion
✅ Anonymous mode

## What You're Missing Without Push Notifications
❌ Notifications when app is closed
❌ Background notifications when followed users post

## Recommendation
For now, keep push notifications disabled since your app works perfectly. You can set up Expo properly later when you have time, or skip push notifications entirely - the app is fully functional without them.

