import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInWithEmail, createAccountWithEmail, signOutUser } from '../utils/firebase';
import { loginUser, getCurrentUser } from '../utils/api';
import { storeAuthToken, getAuthToken, removeAuthToken } from '../utils/storage';
import pushNotificationService from '../services/pushNotificationService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Clear any existing Firebase auth state to prevent auto-login
    const clearAuthState = async () => {
      try {
        console.log('Clearing Firebase auth state...');
        await signOutUser();
        console.log('Firebase auth state cleared');
      } catch (error) {
        console.log('No Firebase user to sign out');
      }
    };
    
    // Clear auth state and set loading to false
    clearAuthState().then(() => {
      setUser(null);
      setToken(null);
      setLoading(false);
      console.log('Auto-login disabled - user must sign in manually');
    });
    
    // Return empty cleanup function
    return () => {
      console.log('Auth context cleanup');
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting to sign in with:', email);
      const result = await signInWithEmail(email, password);
      console.log('Firebase sign in successful:', result.user.email);
      
      // Manual trigger: If onAuthStateChanged doesn't fire, handle auth manually
      console.log('Manually triggering authentication...');
      try {
        // Add a small delay to ensure Firebase token is fully processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const idToken = await result.user.getIdToken();
        console.log('Firebase ID token received:', idToken ? 'Yes' : 'No');
        console.log('Firebase token length:', idToken ? idToken.length : 0);
        console.log('Firebase token preview:', idToken ? idToken.substring(0, 50) + '...' : 'No token');
        
        const loginResponse = await loginUser(idToken);
        console.log('Backend login response:', loginResponse);
        
        if (loginResponse.success) {
          setUser(loginResponse.user);
          setToken(loginResponse.token);
          await storeAuthToken(loginResponse.token);
          console.log('Manual authentication successful!');
          
          // Initialize push notifications for logged in user (non-blocking)
          setTimeout(() => {
            try {
              pushNotificationService.initialize();
            } catch (error) {
              console.log('📱 Push notification initialization failed (non-blocking):', error.message);
            }
          }, 2000);
        } else {
          console.error('Backend login failed:', loginResponse.error);
          setUser(null);
          setToken(null);
          await removeAuthToken();
        }
      } catch (error) {
        console.error('Manual auth error:', error);
        setUser(null);
        setToken(null);
        await removeAuthToken();
      } finally {
        setLoading(false);
      }
      
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email, password) => {
    try {
      setLoading(true);
      const result = await createAccountWithEmail(email, password);
      // The onAuthStateChanged listener will handle backend login and setLoading(false)
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Cleanup push notifications before signing out
      try {
        pushNotificationService.cleanup();
      } catch (error) {
        console.log('📱 Push notification cleanup failed (non-blocking):', error.message);
      }
      
      await signOutUser();
      setUser(null);
      setToken(null);
      await removeAuthToken();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
