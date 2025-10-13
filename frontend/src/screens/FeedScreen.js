import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSocket } from '../context/SocketContext';
import { getPosts, likePost } from '../utils/api';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';
import PostCard from '../components/PostCard';

const FeedScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt', 'likeCount', or 'distance'
  const [userLocation, setUserLocation] = useState(null);

  const { onEvent, offEvent } = useSocket();

  useEffect(() => {
    loadPosts();
    getUserLocation();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, [sortBy]);

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
    console.log('📝 New post received:', newPost._id);
    setPosts(prevPosts => {
      // Check if post already exists to prevent duplicates
      const exists = prevPosts.some(post => post._id === newPost._id);
      if (exists) {
        console.log('⚠️ Post already exists, skipping:', newPost._id);
        return prevPosts;
      }
      console.log('✅ Adding new post to feed:', newPost._id);
      return [newPost, ...prevPosts];
    });
  };

  const handlePostDeleted = (postId) => {
    console.log('🗑️ Post deleted event received in feed:', postId);
    setPosts(prevPosts => {
      const filteredPosts = prevPosts.filter(post => post._id !== postId);
      console.log('📰 Feed posts updated, removed post:', postId, 'remaining posts:', filteredPosts.length);
      return filteredPosts;
    });
  };

  const handlePostLiked = (updatedPost) => {
    console.log('❤️ Post like update received in feed:', updatedPost._id, 'likeCount:', updatedPost.likeCount);
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  const loadPosts = async (pageNum = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getPosts({
        page: pageNum,
        sortBy,
        sortOrder: 'desc',
        limit: 20
      });

      if (response.success) {
        let newPosts = response.data.posts;
        
        // Sort by distance if user location is available and sortBy is 'distance'
        if (sortBy === 'distance' && userLocation) {
          newPosts = newPosts.map(post => ({
            ...post,
            distance: getDistanceFromLatLonInMeters(
              userLocation.latitude,
              userLocation.longitude,
              post.coordinates.latitude,
              post.coordinates.longitude
            )
          })).sort((a, b) => a.distance - b.distance);
        }
        
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prevPosts => [...prevPosts, ...newPosts]);
        }

        setHasMore(response.data.pagination.hasNext);
        setPage(pageNum);
      } else {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Load posts error:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    loadPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPosts(page + 1);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
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

  const handleLike = async (postId) => {
    try {
      const response = await likePost(postId);
      console.log('🔍 Feed like response:', response);
      if (response.success) {
        console.log('✅ Feed post liked successfully, likeCount:', response.data.likeCount);
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId ? response.data : post
          )
        );
      } else {
        console.log('❌ Feed like failed:', response.error);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { postId: post._id });
  };

  const handleCommentPress = (post) => {
    console.log('🔍 FeedScreen - Navigating to PostDetail with openKeyboard: true');
    navigation.navigate('PostDetail', { postId: post._id, openKeyboard: true });
  };

  const toggleSort = () => {
    let newSortBy;
    if (sortBy === 'createdAt') {
      newSortBy = 'likeCount';
    } else if (sortBy === 'likeCount') {
      // Only allow distance sorting if user location is available
      if (userLocation) {
        newSortBy = 'distance';
      } else {
        newSortBy = 'createdAt'; // Skip distance if no location
      }
    } else {
      newSortBy = 'createdAt';
    }
    setSortBy(newSortBy);
  };

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      userLocation={userLocation}
      onPress={() => handlePostPress(item)}
      onLike={() => handleLike(item._id)}
      onCommentPress={() => handleCommentPress(item)}
      navigation={navigation}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyText}>
        Be the first to share something in Winnipeg!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What's Happening in Winnipeg</Text>
        <TouchableOpacity style={[styles.sortButton, (sortBy === 'likeCount' || sortBy === 'distance') && styles.sortButtonActive]} onPress={toggleSort}>
          <Ionicons 
            name={sortBy === 'createdAt' ? 'time' : sortBy === 'likeCount' ? 'heart' : 'location'} 
            size={20} 
            color={(sortBy === 'likeCount' || sortBy === 'distance') ? WINNIPEG_COLORS.jetsWhite : WINNIPEG_COLORS.jetsGold} 
          />
          <Text style={[styles.sortText, (sortBy === 'likeCount' || sortBy === 'distance') && styles.sortTextActive]}>
            {sortBy === 'createdAt' ? 'Recent' : sortBy === 'likeCount' ? 'Popular' : 'Nearby'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item._id || `post-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WINNIPEG_COLORS.prairieBeige,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.xl,
    paddingTop: 50, // Account for status bar
    paddingBottom: WINNIPEG_SPACING.lg,
    backgroundColor: WINNIPEG_COLORS.jetsNavy,
    borderBottomWidth: 1,
    borderBottomColor: WINNIPEG_COLORS.gray[200],
  },
  title: {
    fontSize: WINNIPEG_TYPOGRAPHY['2xl'],
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsWhite,
    flex: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.md,
    paddingVertical: WINNIPEG_SPACING.sm,
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderRadius: WINNIPEG_RADIUS['2xl'],
    borderWidth: 1,
    borderColor: WINNIPEG_COLORS.jetsGold,
  },
  sortButtonActive: {
    backgroundColor: WINNIPEG_COLORS.jetsGold,
  },
  sortText: {
    marginLeft: WINNIPEG_SPACING.sm,
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.jetsNavy,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
  },
  sortTextActive: {
    color: WINNIPEG_COLORS.jetsWhite,
  },
  listContainer: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default FeedScreen;


