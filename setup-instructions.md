# 🚀 Winnipen Setup Instructions

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB Atlas** account
3. **Firebase** project
4. **Expo CLI**: `npm install -g @expo/cli`

## Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `env.example` to `.env`
   - Fill in your MongoDB URI, Firebase credentials, and JWT secret

4. **Start the backend server**:
   ```bash
   npm run dev
   ```

## Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `env.example` to `.env`
   - Fill in your Firebase configuration and API URL

4. **Start the Expo development server**:
   ```bash
   npm start
   ```

## Firebase Configuration

1. **Create a Firebase project** at https://console.firebase.google.com
2. **Enable Authentication** with Google Sign-In
3. **Enable Storage** for media uploads
4. **Get your Firebase config** and add it to both backend and frontend `.env` files

## MongoDB Setup

1. **Create a MongoDB Atlas cluster** at https://cloud.mongodb.com
2. **Get your connection string** and add it to backend `.env` file
3. **Create a database** named `winnipen`

## Running the App

1. **Start backend** (from `backend/` directory):
   ```bash
   npm run dev
   ```

2. **Start frontend** (from `frontend/` directory):
   ```bash
   npm start
   ```

3. **Open the app**:
   - Scan QR code with Expo Go app on your phone
   - Or press `i` for iOS simulator / `a` for Android emulator

## Features Included

✅ **Interactive Map** - Tap anywhere to post  
✅ **Real-time Chat** - Socket.IO integration  
✅ **Media Upload** - Photos and videos via Firebase Storage  
✅ **Google Authentication** - Secure user login  
✅ **Anonymous Mode** - Post anonymously if desired  
✅ **Feed View** - Browse all posts  
✅ **Comments System** - Reply to posts  
✅ **Like System** - Like posts and comments  
✅ **Modern UI** - Clean, responsive design  
✅ **Winnipeg-focused** - Geofenced to Winnipeg area  

## Project Structure

```
winnipen/
├── backend/           # Node.js Express server
│   ├── models/        # MongoDB models
│   ├── routes/        # API routes
│   ├── middleware/    # Auth middleware
│   └── server.js      # Main server file
├── frontend/          # React Native Expo app
│   ├── src/
│   │   ├── screens/   # App screens
│   │   ├── components/# Reusable components
│   │   ├── context/   # React contexts
│   │   └── utils/     # Utility functions
│   └── App.js         # Main app file
└── README.md          # This file
```

## Troubleshooting

- **Backend won't start**: Check MongoDB connection string and Firebase credentials
- **Frontend won't load**: Ensure backend is running and API URL is correct
- **Authentication fails**: Verify Firebase configuration in both backend and frontend
- **Map not showing**: Check if you're running on a physical device or simulator with location permissions

## Next Steps

1. **Deploy backend** to Render, Railway, or Heroku
2. **Build frontend** for production with `expo build`
3. **Set up push notifications** for real-time updates
4. **Add moderation tools** for content management
5. **Implement geofencing** for specific Winnipeg neighborhoods

Happy coding! 🧭✨





