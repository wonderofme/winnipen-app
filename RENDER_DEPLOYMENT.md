# Deploy Winnipen Backend to Render.com

This guide will walk you through deploying your Winnipen backend to Render.com for production use.

## Prerequisites

- ✅ GitHub repository with your code
- ✅ Render.com account (free)
- ✅ MongoDB Atlas database (already configured)
- ✅ Environment variables ready

## Step 1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with your GitHub account (recommended)
4. Verify your email address

## Step 2: Create New Web Service

1. In your Render dashboard, click **"New +"**
2. Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Connect your GitHub account if not already connected
5. Select your **Winnipen2.0** repository
6. Click **"Connect"**

## Step 3: Configure Web Service

### Basic Settings
- **Name**: `winnipen-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users (e.g., `Oregon (US West)` for North America)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` (since your backend code is in the backend folder)

### Build & Deploy Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Advanced Settings
- **Auto-Deploy**: `Yes` (deploys automatically when you push to GitHub)
- **Pull Request Previews**: `No` (optional)

## Step 4: Configure Environment Variables

In the **Environment** section, add these variables:

### Required Environment Variables

```
MONGO_URI=mongodb+srv://templatestore:Theflash1@cluster0.a5k36am.mongodb.net/winnipen?retryWrites=true&w=majority&appName=Cluster0
PORT=5001
JWT_SECRET=Theflash1234
FIREBASE_PROJECT_ID=winnipen-b69b3
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCMqawpBI6OaddF\nVOhr+QF6aXKo+QKnTKgcVeH83bEshnhprbcJia21r8ew3pWBREKZJaHO8KzC8x74\nZ81hTbOS6tewvX/5Y7RnB/klHKcViXw1uKypLjb8e0KpDPcBQ1kVUs4g5s4/DYce\n3DSd1kWg9hG43keOIyTUd2njrc0fjRmd31pSwv7unQy+j3MHDF4GsgQs0iacvvG4\n/9n0V7MJ80jMI7lWiAvN6+1mJgXux2MbGtBx/wQi1Rc3z9DLS+vXp94Y2HvOJUjt\n97P6CdTj2ycM8a+08k+RATlCEsBlBMZoEAYItHpjPCf+GkII2rinTrYnQIF/P4a2\nSgBo+7cBAgMBAAECggEABNpRszSSCn3CTIUKY7c6gtOifgvhOI5femLIIiYv155o\nBxVULEMQuCTxWbvEIqqNNaVjuLT68NrcZauHHWVF3bq2aEWRZbQ35BoVUV90sDyH\nCX9ujYOnp/xEp3poByYgq6iord/om6pG0By+v/dFfbEfmWYpx9CUk7Pu9kjnu7/g\nWE6oNYVdaJUTmRliDcGRmC1/PlyWvcVSp9wSwLeeg7CkapO9/iVm8hEjtxmDkpVC\nzUMySHLT28g7+wg6DQNCexj/gJxzUkQ+0E6M2d9HJ3mSEI4KF7RdjPzykJG4aIqo\nn60u6SaZiwISAoliqon8LVIbOS2+GCdrKnSUcqIAlQKBgQDGF3YIbM3HcV3tfGPx\nJJwPEAfj/l109o+39iod7O0kkHRILg0q71OyltpHxRIrwixWQg85N0Cfm3SMKOnm\n/S82lv0nIM7TN/Ylef/J8NbdOnABcpvsP6xrl8KCmbB2BAjsu3LFG/Ds/gL1EOPY\nGBqCJMpNCP8pD8PwDobzPQABtwKBgQC1yGvAnIYJ3aigbWx7E0f1/3xV3aH405SD\nVg6d717eQz5z2t8gBax4EnzlHvT6qJrktQpIlC2oR/YGqzy/NKh767HHqDhQh72Q\nw90P6xEcQt5ZGw8myOTUFQquVXi2I37U/n9Lwa5NA+T1Q47RqZKAoxf+UMHS9LCK\njfm/7cWtBwKBgHPtswQHOP6pmACuNYcgl7ww8404hdU3nrBYfhl5WOd3KrY7TTV9\nToxLwH8UFChLwMrSajpf3ZAK2FBWeVzXe1QFVS4bAy+VppYUKeAy9GwQERCn1ByU\nvwFQlWL9Mso+XkK9CNPWIE9x8KUfN1h18r2LbmFbDIkpUtAgkFW1s1VNAoGBAJ2u\njEk3fM1yCKOgR0k7IGCyjReueKFuZpTGQUeeK5yAl9vHL2SHh2NgJhZZFAeZ2UIq\nCBGM903RngeK4da5xqw3dq7JrI+uLzEztL3qGZ16I4UHg80Q1e1hkzJF0b+saog3\nehQsnRURG7nkMC6N+Ra8YkOnqXlj5v9IyCtEBQRhAoGABIQ0mrmeT1jsIzbNYWKF\nLKOfynukg5PdxIiX7aI2KPp9L5U9wAUvV6JpLfIBm9mtcc0+JagLgQ4VJ0XOpgfy\ndvKM31+w8gaEfU67TuMrUvR3vqHxTxpGLPJ5KchQVq7pOkXtmMEEGtmSyc+kSgSg\n9cfP3ilNq80QG4yuClCBtMg=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@winnipen-b69b3.iam.gserviceaccount.com
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
```

**Important Notes:**
- Copy the exact values from your current `.env` file
- For `FRONTEND_URL`, you can use a placeholder for now (e.g., `https://winnipen-app.com`)
- The `FIREBASE_PRIVATE_KEY` must include the `\n` characters exactly as shown

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will start building your application
3. Wait for the build to complete (usually 2-5 minutes)
4. Your backend will be available at: `https://winnipen-backend.onrender.com`

## Step 6: Test Your Deployment

### Health Check
Visit: `https://winnipen-backend.onrender.com/api/health`

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-01-XX...",
  "uptime": 123.456
}
```

### Test API Endpoints
Test a few key endpoints to ensure everything works:
- `GET /api/health` - Health check
- `POST /api/auth/login` - Authentication (with proper Firebase token)

## Step 7: Update Frontend Configuration

After successful deployment, update your frontend:

### Update app.json
Replace the placeholder URL in `frontend/app.json`:
```json
"extra": {
  "apiUrl": "https://your-actual-render-url.onrender.com"
}
```

### Update eas.json
Replace the placeholder URL in `frontend/eas.json`:
```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-actual-render-url.onrender.com"
  }
}
```

## Step 8: Rebuild Mobile Apps

Now rebuild your mobile apps with the production backend:

```bash
cd frontend

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

## Step 9: Test Everything

1. **Install the new app builds** on your device
2. **Test all features:**
   - ✅ User registration/login
   - ✅ Creating posts
   - ✅ Real-time notifications
   - ✅ Following/unfollowing users
   - ✅ Push notifications
   - ✅ Map functionality
   - ✅ Image uploads

## Troubleshooting

### Common Issues

**Build Fails:**
- Check that `backend/package.json` has correct `start` script
- Verify all dependencies are in `dependencies` (not `devDependencies`)
- Check Render build logs for specific errors

**Environment Variables Not Working:**
- Ensure no extra spaces in variable names/values
- Check that `FIREBASE_PRIVATE_KEY` includes `\n` characters
- Verify `MONGO_URI` is correct

**Socket.IO Not Working:**
- Render supports WebSockets, but check firewall settings
- Verify CORS settings in your backend

**App Can't Connect to Backend:**
- Check that `FRONTEND_URL` in Render matches your app's domain
- Verify the API URL in your mobile app configuration
- Test the health endpoint directly in browser

### Getting Help

- Check Render logs in the dashboard
- Test API endpoints with Postman or curl
- Verify environment variables are set correctly
- Check MongoDB Atlas connection

## Next Steps

After successful deployment:

1. **Submit to App Stores:**
   - iOS: TestFlight → App Store
   - Android: Internal Testing → Production

2. **Monitor Performance:**
   - Check Render dashboard for uptime
   - Monitor MongoDB Atlas for database performance
   - Set up error tracking (optional)

3. **Scale if Needed:**
   - Render free tier: 750 hours/month
   - Upgrade to paid plan for 24/7 uptime
   - Consider database scaling if needed

## Cost

- **Render Free Tier**: 750 hours/month (enough for development/testing)
- **Render Paid**: $7/month for always-on service
- **MongoDB Atlas**: Free tier available
- **Total**: $0-7/month depending on usage

Your Winnipen backend is now ready for production! 🚀
