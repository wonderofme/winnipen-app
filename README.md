# 🧭 Winnipen

A map-based social chat app for Winnipeg, Canada where users can tap anywhere on the map to post text, photos, or videos that others can view, comment on, and reply to in real time.

## 🏗️ Architecture

- **Frontend**: React Native (Expo)
- **Backend**: Node.js (Express)
- **Database**: MongoDB Atlas
- **Realtime**: Socket.IO
- **Media Storage**: Firebase Storage
- **Authentication**: Firebase Auth (Google Sign-In)
- **Hosting**: Render (backend) + Expo build (mobile)

## 🚀 Quick Start

1. Install dependencies:
```bash
npm run install:all
```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/` folders
   - Fill in your MongoDB URI, Firebase config, and other API keys

3. Start development servers:
```bash
npm run dev
```

## 📱 Features

- Interactive map centered on Winnipeg
- Tap-to-post functionality
- Real-time chat and comments
- Photo/video uploads
- Anonymous posting option
- Google Sign-In authentication
- Moderation tools

## 🗂️ Project Structure

```
/winnipen
├── backend/           # Node.js Express server
│   ├── server.js
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── socket/
├── frontend/          # React Native Expo app
│   ├── App.js
│   ├── components/
│   ├── screens/
│   ├── context/
│   └── utils/
└── .env.example
```

## 🛠️ Development

- Backend runs on `http://localhost:5000`
- Frontend runs on Expo development server
- Socket.IO handles real-time communication
- MongoDB stores posts, comments, and user data




