import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInWithEmail, createAccountWithEmail, signOutUser } from '../utils/firebase';
import { loginUser, getCurrentUser } from '../utils/api';
import { storeAuthToken, getAuthToken, removeAuthToken, storeUserData, getUserData, removeUserData } from '../utils/storage';
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
    
    // Check for stored auth data on app start
    const checkStoredAuth = async () => {
      try {
        const storedToken = await getAuthToken();
        const storedUser = await getUserData();
        
        if (storedToken && storedUser) {
          console.log('Found stored auth data, attempting to restore session...');
          
          // Verify the token is still valid by making a test API call
          try {
            const response = await getCurrentUser(storedToken);
            if (response.success) {
              console.log('✅ Stored session is valid, restoring user state');
              setUser(storedUser);
              setToken(storedToken);
              
              // Initialize push notifications for restored user (non-blocking)
              setTimeout(() => {
                try {
                  pushNotificationService.initialize();
                } catch (error) {
                  console.log('📱 Push notification initialization failed (non-blocking):', error.message);
                }
              }, 1000);
            } else {
              console.log('❌ Stored session is invalid, clearing stored data');
              await removeAuthToken();
              await removeUserData();
            }
          } catch (error) {
            console.log('❌ Error verifying stored session, clearing stored data:', error.message);
            await removeAuthToken();
            await removeUserData();
          }
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        console.error('Error checking stored auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkStoredAuth();
    
    // Wake up backend server on app startup (non-blocking)
    const wakeUpBackend = async () => {
      try {
        console.log('🌐 Waking up backend server...');
        const response = await fetch('https://winnipen-backend.onrender.com/api/health', {
          method: 'GET',
          timeout: 10000, // 10 second timeout
        });
        if (response.ok) {
          console.log('✅ Backend server is awake');
        } else {
          console.log('⚠️ Backend server responded with error:', response.status);
        }
      } catch (error) {
        console.log('⚠️ Failed to wake up backend server (non-blocking):', error.message);
      }
    };
    
    // Wake up backend in background
    wakeUpBackend();
    
    // Return empty cleanup function
    return () => {
      console.log('Auth context cleanup');
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting to sign in with:', email);
      
      // Auto-retry logic: attempt login up to 2 times
      let lastError = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`🔄 Login attempt ${attempt}/2`);
          
          const result = await signInWithEmail(email, password);
          console.log('Firebase sign in successful:', result.user.email);
          
          // Add a small delay to ensure Firebase token is fully processed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const idToken = await result.user.getIdToken();
          console.log('Firebase ID token received:', idToken ? 'Yes' : 'No');
          
          const loginResponse = await loginUser(idToken);
          console.log('Backend login response:', loginResponse);
          
          if (loginResponse.success) {
            setUser(loginResponse.user);
            setToken(loginResponse.token);
            await storeAuthToken(loginResponse.token);
            await storeUserData(loginResponse.user);
            console.log('✅ Authentication successful!');
            
            // Initialize push notifications for logged in user (non-blocking)
            setTimeout(() => {
              try {
                pushNotificationService.initialize();
              } catch (error) {
                console.log('📱 Push notification initialization failed (non-blocking):', error.message);
              }
            }, 2000);
            
            setLoading(false);
            return result;
          } else {
            lastError = new Error(loginResponse.error || 'Backend login failed');
            console.error(`❌ Backend login failed (attempt ${attempt}):`, loginResponse.error);
            
            if (attempt === 1) {
              console.log('🔄 Retrying login...');
              // Wait a bit before retry
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        } catch (error) {
          lastError = error;
          console.error(`❌ Login attempt ${attempt} failed:`, error.message);
          
          if (attempt === 1) {
            console.log('🔄 Retrying login...');
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // If we get here, both attempts failed
      console.error('❌ All login attempts failed');
      setUser(null);
      setToken(null);
      await removeAuthToken();
      await removeUserData();
      setLoading(false);
      throw lastError || new Error('Login failed after 2 attempts');
      
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email, password) => {
    try {
      setLoading(true);
      console.log('Creating account for:', email);
      
      const result = await createAccountWithEmail(email, password);
      console.log('Firebase account created successfully:', result.user.email);
      
      // Immediately log in the user after successful signup
      try {
        // Add a small delay to ensure Firebase token is fully processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const idToken = await result.user.getIdToken();
        console.log('Firebase ID token received for new user');
        
        const loginResponse = await loginUser(idToken);
        console.log('Backend login response for new user:', loginResponse);
        
        if (loginResponse.success) {
          setUser(loginResponse.user);
          setToken(loginResponse.token);
          await storeAuthToken(loginResponse.token);
          await storeUserData(loginResponse.user);
          console.log('✅ New user automatically logged in!');
          
          // Initialize push notifications for new user (non-blocking)
          setTimeout(() => {
            try {
              pushNotificationService.initialize();
            } catch (error) {
              console.log('📱 Push notification initialization failed (non-blocking):', error.message);
            }
          }, 2000);
        } else {
          console.error('Backend login failed for new user:', loginResponse.error);
          setUser(null);
          setToken(null);
          await removeAuthToken();
          await removeUserData();
        }
      } catch (error) {
        console.error('Auto-login error for new user:', error);
        setUser(null);
        setToken(null);
        await removeAuthToken();
        await removeUserData();
      } finally {
        setLoading(false);
      }
      
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
      await removeUserData();
      console.log('✅ User signed out and all data cleared');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    // Also update stored user data
    try {
      await storeUserData(updatedUser);
    } catch (error) {
      console.error('Error updating stored user data:', error);
    }
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
