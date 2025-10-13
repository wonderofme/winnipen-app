import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getPosts, createPost } from '../utils/api';
import { WINNIPEG_COORDINATES, MAP_CONFIG } from '../utils/config';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';
import CreatePostModal from '../components/CreatePostModal';
import PostPin from '../components/PostPin';
import LocationSearchBar from '../components/LocationSearchBar';

const { width, height } = Dimensions.get('window');

const MapScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(WINNIPEG_COORDINATES);
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  const mapRef = useRef(null);
  const { user } = useAuth();
  const { onEvent, offEvent } = useSocket();

  useEffect(() => {
    loadPosts();
    requestLocationPermission();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, []);

  const setupSocketListeners = () => {
    onEvent('post:new', handleNewPost);
    onEvent('post:deleted', handlePostDeleted);
    onEvent('post:liked', handlePostLiked);
  };

  const cleanupSocketListeners = () => {
    offEvent('post:new', handleNewPost);
    offEvent('post:deleted', handlePostDeleted);
    offEvent('post:liked', handlePostLiked);
  };

  const handleNewPost = (newPost) => {
    console.log('📝 New post received on map:', newPost._id);
    setPosts(prevPosts => {
      // Check if post already exists to prevent duplicates
      const exists = prevPosts.some(post => post._id === newPost._id);
      if (exists) {
        console.log('⚠️ Post already exists on map, skipping:', newPost._id);
        return prevPosts;
      }
      console.log('✅ Adding new post to map:', newPost._id);
      return [newPost, ...prevPosts];
    });
  };

  const handlePostDeleted = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  const handlePostLiked = (updatedPost) => {
    console.log('❤️ Post like update received on map:', updatedPost._id, 'likeCount:', updatedPost.likeCount);
    console.log('🔍 Updated post data:', JSON.stringify(updatedPost, null, 2));
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post =>
        post._id === updatedPost._id ? updatedPost : post
      );
      console.log('🗺️ Map posts updated, new like count for post', updatedPost._id, ':', updatedPosts.find(p => p._id === updatedPost._id)?.likeCount);
      return updatedPosts;
    });
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        // Update map region to user location if within Winnipeg bounds
        if (isWithinWinnipegBounds(location.coords.latitude, location.coords.longitude)) {
          setMapRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: MAP_CONFIG.defaultZoomLevel * 0.01,
            longitudeDelta: MAP_CONFIG.defaultZoomLevel * 0.01,
          });
        }
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const isWithinWinnipegBounds = (lat, lng) => {
    return lat >= 49.7 && lat <= 50.1 && lng >= -97.4 && lng <= -96.8;
  };

  // Calculate distance between two coordinates in meters
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of the earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in meters
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await getPosts({
        limit: 100
        // No location filtering - show all posts
      });

      if (response.success) {
        setPosts(response.data.posts);
      } else {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Load posts error:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Only allow posting within Winnipeg bounds
    if (!isWithinWinnipegBounds(latitude, longitude)) {
      Alert.alert(
        'Location Out of Bounds',
        'You can only post within the Winnipeg area.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedLocation({ latitude, longitude });
    setShowCreateModal(true);
  };

  const handleCreatePost = async (postData) => {
    try {
      const response = await createPost({
        ...postData,
        coordinates: selectedLocation
      });

      if (response.success) {
        // Don't add the post directly here - let the Socket.IO event handle it
        // This prevents duplicate posts from appearing
        console.log('✅ Post created successfully, waiting for Socket.IO event');
        setShowCreateModal(false);
        setSelectedLocation(null);
      } else {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Create post error:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const handleMarkerPress = (post) => {
    navigation.navigate('PostDetail', { postId: post._id });
  };

  const handleLocationSelect = (location) => {
    if (mapRef.current && location) {
      const region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01, // Street-level zoom
        longitudeDelta: 0.01,
      };
      
      mapRef.current.animateToRegion(region, 500);
    }
  };

  const toggleSearchBar = () => {
    setShowSearchBar(!showSearchBar);
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const centerOnWinnipeg = () => {
    mapRef.current?.animateToRegion(WINNIPEG_COORDINATES, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Image source={require('../../assets/logo.png')} style={styles.bannerLogo} />
          <Text style={styles.bannerTitle}>Winnipen</Text>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={toggleSearchBar}
          >
            <Ionicons 
              name={showSearchBar ? "close" : "search"} 
              size={24} 
              color={WINNIPEG_COLORS.jetsWhite} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Search Bar */}
      {showSearchBar && (
        <LocationSearchBar 
          onSelectLocation={handleLocationSelect}
          onClose={() => setShowSearchBar(false)}
          placeholder="Search for places in Winnipeg..."
        />
      )}
      
      <MapView
        ref={mapRef}
        style={[styles.map, { marginTop: showSearchBar ? 160 : 100 }]}
        initialRegion={mapRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        minZoomLevel={MAP_CONFIG.minZoomLevel}
        maxZoomLevel={MAP_CONFIG.maxZoomLevel}
      >
        {posts.map((post) => (
          <Marker
            key={post._id}
            coordinate={{
              latitude: post.coordinates.latitude,
              longitude: post.coordinates.longitude,
            }}
            onPress={(e) => {
              e.stopPropagation();
              handleMarkerPress(post);
            }}
            tracksViewChanges={false}
          >
            <PostPin post={post} currentUser={user} />
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutText} numberOfLines={2}>
                  {post.text}
                </Text>
                <Text style={styles.calloutAuthor}>
                  {post.author.username}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Map Controls */}
      <View style={[styles.controls, { top: showSearchBar ? 180 : 120 }]}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnWinnipeg}
        >
          <Ionicons name="location" size={24} color={WINNIPEG_COLORS.jetsWhite} />
        </TouchableOpacity>
        
        {userLocation && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={centerOnUserLocation}
          >
            <Ionicons name="person" size={24} color={WINNIPEG_COLORS.jetsWhite} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={loadPosts}
        >
          <Ionicons name="refresh" size={24} color={WINNIPEG_COLORS.jetsWhite} />
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedLocation(null);
        }}
        onSubmit={handleCreatePost}
        location={selectedLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: WINNIPEG_COLORS.jetsNavy,
    paddingTop: 50, // Account for status bar
    paddingBottom: WINNIPEG_SPACING.lg,
    paddingHorizontal: WINNIPEG_SPACING.lg,
    zIndex: 1000,
    ...WINNIPEG_SHADOWS.lg,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerLogo: {
    width: 32,
    height: 32,
    borderRadius: WINNIPEG_RADIUS.md,
    marginRight: WINNIPEG_SPACING.md,
  },
  bannerTitle: {
    fontSize: WINNIPEG_TYPOGRAPHY.xl,
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsWhite,
    flex: 1,
  },
  searchButton: {
    padding: WINNIPEG_SPACING.sm,
    borderRadius: WINNIPEG_RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: width,
    height: height,
    marginTop: 100, // Account for banner height
  },
  controls: {
    position: 'absolute',
    right: 20,
    top: 120,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: WINNIPEG_COLORS.jetsNavy,
    borderRadius: WINNIPEG_RADIUS['2xl'],
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: WINNIPEG_SPACING.sm,
    ...WINNIPEG_SHADOWS.md,
  },
  callout: {
    width: 200,
    padding: WINNIPEG_SPACING.sm,
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderRadius: WINNIPEG_RADIUS.md,
  },
  calloutText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: WINNIPEG_COLORS.jetsNavy,
  },
  calloutAuthor: {
    fontSize: 12,
    color: WINNIPEG_COLORS.gray[600],
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default MapScreen;
