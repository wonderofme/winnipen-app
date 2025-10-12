import { initializeApp, getApps } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from './config';

// Initialize Firebase
console.log('Initializing Firebase with config:', FIREBASE_CONFIG);

// Check if Firebase app is already initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(FIREBASE_CONFIG);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth with proper persistence
let auth;
try {
  // Try to initialize auth with persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  // If already initialized, get the existing instance
  console.log('Firebase Auth already initialized, getting existing instance');
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export { auth };

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Real Firebase Auth functions
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
};

export const createAccountWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Email sign-up error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Compress image before upload
export const compressImage = async (uri, quality = 0.8, maxWidth = 1920, maxHeight = 1920) => {
  try {
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    
    const result = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Image compression error:', error);
    return uri; // Return original if compression fails
  }
};

// Upload file to Firebase Storage with compression
export const uploadFile = async (file, path, options = {}) => {
  try {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    
    let fileToUpload = file;
    
    // Compress image if it's an image file
    if (options.compress && file.uri && file.type?.startsWith('image/')) {
      const compressedUri = await compressImage(file.uri, options.quality || 0.8);
      fileToUpload = { ...file, uri: compressedUri };
    }
    
    // Convert URI to blob for upload
    let blob;
    if (fileToUpload.uri) {
      const response = await fetch(fileToUpload.uri);
      blob = await response.blob();
    } else {
      blob = fileToUpload;
    }
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Delete file from Firebase Storage
export const deleteFile = async (path) => {
  try {
    const { ref, deleteObject } = await import('firebase/storage');
    
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('File delete error:', error);
    throw error;
  }
};
