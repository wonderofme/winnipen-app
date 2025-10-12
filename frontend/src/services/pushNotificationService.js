import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { registerPushToken, removePushToken } from '../utils/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions not granted');
        return null;
      }
      
      try {
        // Add a small delay to ensure the app is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Let Expo auto-detect the project configuration
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('✅ Expo push token obtained:', token);
      } catch (error) {
        console.error('❌ Error getting push token:', error.message);
        console.log('⚠️ Push notifications not available (will continue without them)');
        return null;
      }
    } else {
      console.log('⚠️ Must use physical device for Push Notifications');
      return null;
    }

    this.expoPushToken = token;
    return token;
  }

  async registerTokenWithBackend() {
    if (!this.expoPushToken) {
      console.log('No push token available');
      return false;
    }

    try {
      const platform = Platform.OS;
      const deviceId = Device.osInternalBuildId || 'unknown';
      
      const result = await registerPushToken(this.expoPushToken, platform, deviceId);
      
      if (result.success) {
        console.log('Push token registered with backend successfully');
        return true;
      } else {
        console.error('Failed to register push token with backend:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error registering push token with backend:', error);
      return false;
    }
  }

  async unregisterTokenFromBackend() {
    if (!this.expoPushToken) {
      return false;
    }

    try {
      const platform = Platform.OS;
      const deviceId = Device.osInternalBuildId || 'unknown';
      
      const result = await removePushToken(this.expoPushToken, platform, deviceId);
      
      if (result.success) {
        console.log('Push token unregistered from backend successfully');
        return true;
      } else {
        console.error('Failed to unregister push token from backend:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error unregistering push token from backend:', error);
      return false;
    }
  }

  setupNotificationListeners() {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can handle the notification here if needed
    });

    // Listener for when user taps on a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data.type === 'new_post' && data.postId) {
        // Navigate to the post
        // You'll need to pass navigation function to this service
        console.log('Navigate to post:', data.postId);
      } else if (data.type === 'new_follower') {
        // Navigate to profile or notifications
        console.log('New follower notification');
      }
    });
  }

  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  async initialize() {
    try {
      console.log('🚀 Initializing push notifications...');
      
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      
      if (token) {
        console.log('📱 Push token obtained, registering with backend...');
        
        // Register token with backend
        const backendSuccess = await this.registerTokenWithBackend();
        
        if (backendSuccess) {
          // Setup notification listeners
          this.setupNotificationListeners();
          console.log('✅ Push notifications initialized successfully');
          return true;
        } else {
          console.log('⚠️ Push notifications initialized but backend registration failed');
          return false;
        }
      } else {
        console.log('⚠️ Push notifications not available (no token)');
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return false;
    }
  }

  async cleanup() {
    try {
      // Unregister token from backend
      await this.unregisterTokenFromBackend();
      
      // Remove notification listeners
      this.removeNotificationListeners();
      
      this.expoPushToken = null;
    } catch (error) {
      console.error('Error cleaning up push notifications:', error);
    }
  }
}

export default new PushNotificationService();
