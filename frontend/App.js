import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import MapScreen from './src/screens/MapScreen';
import FeedScreen from './src/screens/FeedScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import FollowersScreen from './src/screens/FollowersScreen';
import FollowingScreen from './src/screens/FollowingScreen';
import UserPostsScreen from './src/screens/UserPostsScreen';

// Components
import LoadingScreen from './src/components/LoadingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Feed') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="PostDetail" 
            component={PostDetailScreen}
            options={{ 
              headerShown: true,
              title: 'Post',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="UserProfile" 
            component={UserProfileScreen}
            options={{ 
              headerShown: true,
              title: 'Profile',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="Notifications" 
            component={NotificationsScreen}
            options={{ 
              headerShown: true,
              title: 'Notifications',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="Followers" 
            component={FollowersScreen}
            options={{ 
              headerShown: true,
              title: 'Followers',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="Following" 
            component={FollowingScreen}
            options={{ 
              headerShown: true,
              title: 'Following',
              headerBackTitle: 'Back'
            }}
          />
          <Stack.Screen 
            name="UserPosts" 
            component={UserPostsScreen}
            options={{ 
              headerShown: true,
              title: 'Posts',
              headerBackTitle: 'Back'
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <SocketProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </SocketProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
