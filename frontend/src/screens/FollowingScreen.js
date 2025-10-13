import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getFollowing } from '../utils/api';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const FollowingScreen = ({ route, navigation }) => {
  const { userId, username } = route.params;
  const { user: currentUser } = useAuth();
  const { onEvent, offEvent } = useSocket();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadFollowing();
  }, [userId]);

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    const handleFollowEvent = (data) => {
      if (data.followerId === userId) {
        // This user followed someone, refresh the list
        loadFollowing(1, true);
      }
    };

    const handleUnfollowEvent = (data) => {
      if (data.followerId === userId) {
        // This user unfollowed someone, refresh the list
        loadFollowing(1, true);
      }
    };

    onEvent('follow', handleFollowEvent);
    onEvent('unfollow', handleUnfollowEvent);

    return () => {
      offEvent('follow', handleFollowEvent);
      offEvent('unfollow', handleUnfollowEvent);
    };
  }, [userId, onEvent, offEvent]);

  const loadFollowing = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const result = await getFollowing(userId, pageNum, 20);
      
      if (result.success) {
        const newFollowing = result.data.following || [];
        
        if (pageNum === 1 || refresh) {
          setFollowing(newFollowing);
        } else {
          setFollowing(prev => [...prev, ...newFollowing]);
        }
        
        setTotalCount(result.data.pagination.total);
        setHasMore(newFollowing.length === 20);
        setPage(pageNum);
      } else {
        Alert.alert('Error', result.error || 'Failed to load following');
      }
    } catch (error) {
      console.error('Load following error:', error);
      Alert.alert('Error', 'Failed to load following');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadFollowing(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFollowing(page + 1);
    }
  };

  const handleUserPress = (followingUser) => {
    // Don't navigate to own profile
    if (followingUser._id === currentUser.id) {
      return;
    }
    
    navigation.navigate('UserProfile', { 
      userId: followingUser._id, 
      username: followingUser.username 
    });
  };

  const renderFollowingUser = ({ item: followingUser }) => (
    <TouchableOpacity
      style={styles.followingItem}
      onPress={() => handleUserPress(followingUser)}
      activeOpacity={0.7}
    >
      <View style={styles.followingContent}>
        <View style={styles.avatarContainer}>
          {followingUser.avatar ? (
            <Image source={{ uri: followingUser.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={24} color={WINNIPEG_COLORS.gray[500]} />
            </View>
          )}
        </View>
        
        <View style={styles.followingInfo}>
          <Text style={styles.followingName}>
            {followingUser.username}
          </Text>
        </View>

        {followingUser._id !== currentUser.id && (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={WINNIPEG_COLORS.gray[400]} 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="person-add-outline" size={64} color={WINNIPEG_COLORS.gray[400]} />
      <Text style={styles.emptyTitle}>Not following anyone yet</Text>
      <Text style={styles.emptySubtitle}>
        When you follow people, they'll appear here.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || following.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsBlue} />
      </View>
    );
  };

  if (loading && following.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={WINNIPEG_COLORS.jetsBlue} />
        <Text style={styles.loadingText}>Loading following...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={following}
        keyExtractor={(item) => item._id}
        renderItem={renderFollowingUser}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[WINNIPEG_COLORS.jetsBlue]}
            tintColor={WINNIPEG_COLORS.jetsBlue}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WINNIPEG_COLORS.prairieBeige,
  },
  loadingText: {
    marginTop: WINNIPEG_SPACING.md,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[600],
  },
  listContainer: {
    flexGrow: 1,
  },
  followingItem: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    marginHorizontal: WINNIPEG_SPACING.lg,
    marginVertical: WINNIPEG_SPACING.xs,
    borderRadius: WINNIPEG_RADIUS.lg,
    ...WINNIPEG_SHADOWS.sm,
  },
  followingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: WINNIPEG_SPACING.lg,
  },
  avatarContainer: {
    marginRight: WINNIPEG_SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  defaultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: WINNIPEG_COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingInfo: {
    flex: 1,
  },
  followingName: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.gray[800],
    marginBottom: WINNIPEG_SPACING.xs,
  },
  anonymousLabel: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[500],
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING['2xl'],
  },
  emptyTitle: {
    fontSize: WINNIPEG_TYPOGRAPHY.xl,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.gray[600],
    marginTop: WINNIPEG_SPACING.lg,
    marginBottom: WINNIPEG_SPACING.md,
  },
  emptySubtitle: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: WINNIPEG_SPACING.lg,
    alignItems: 'center',
  },
});

export default FollowingScreen;
