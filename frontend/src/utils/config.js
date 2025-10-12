import Constants from 'expo-constants';

// API Configuration
export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
  process.env.EXPO_PUBLIC_API_URL || 
  (__DEV__ ? 'http://192.168.111.248:5001' : 'https://winnipen-backend.onrender.com');

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || 
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || 
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || 
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || 
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || 
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || 
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Winnipeg coordinates
export const WINNIPEG_COORDINATES = {
  latitude: 49.8954,
  longitude: -97.1385,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421
};

// Map configuration
export const MAP_CONFIG = {
  initialRegion: WINNIPEG_COORDINATES,
  minZoomLevel: 10,
  maxZoomLevel: 18,
  defaultZoomLevel: 13
};

// App configuration
export const APP_CONFIG = {
  maxPostLength: 500,
  maxCommentLength: 300,
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxVideoSize: 50 * 1024 * 1024, // 50MB
  nearbyRadius: 1000, // 1km in meters
  postsPerPage: 20,
  commentsPerPage: 20
};


