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
import { getFollowers } from '../utils/api';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const FollowersScreen = ({ route, navigation }) => {
  const { userId, username } = route.params;
  const { user: currentUser } = useAuth();
  const { onEvent, offEvent } = useSocket();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    const handleFollowEvent = (data) => {
      if (data.targetUserId === userId) {
        // Someone followed this user, refresh the list
        loadFollowers(1, true);
      }
    };

    const handleUnfollowEvent = (data) => {
      if (data.targetUserId === userId) {
        // Someone unfollowed this user, refresh the list
        loadFollowers(1, true);
      }
    };

    onEvent('follow', handleFollowEvent);
    onEvent('unfollow', handleUnfollowEvent);

    return () => {
      offEvent('follow', handleFollowEvent);
      offEvent('unfollow', handleUnfollowEvent);
    };
  }, [userId, onEvent, offEvent]);

  const loadFollowers = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const result = await getFollowers(userId, pageNum, 20);
      
      if (result.success) {
        const newFollowers = result.data.followers || [];
        
        if (pageNum === 1 || refresh) {
          setFollowers(newFollowers);
        } else {
          setFollowers(prev => [...prev, ...newFollowers]);
        }
        
        setTotalCount(result.data.pagination.total);
        setHasMore(newFollowers.length === 20);
        setPage(pageNum);
      } else {
        Alert.alert('Error', result.error || 'Failed to load followers');
      }
    } catch (error) {
      console.error('Load followers error:', error);
      Alert.alert('Error', 'Failed to load followers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadFollowers(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFollowers(page + 1);
    }
  };

  const handleUserPress = (follower) => {
    // Don't navigate to own profile
    if (follower._id === currentUser.id) {
      return;
    }
    
    navigation.navigate('UserProfile', { 
      userId: follower._id, 
      username: follower.username 
    });
  };

  const renderFollower = ({ item: follower }) => (
    <TouchableOpacity
      style={styles.followerItem}
      onPress={() => handleUserPress(follower)}
      activeOpacity={0.7}
    >
      <View style={styles.followerContent}>
        <View style={styles.avatarContainer}>
          {follower.avatar ? (
            <Image source={{ uri: follower.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={24} color={WINNIPEG_COLORS.gray[500]} />
            </View>
          )}
        </View>
        
        <View style={styles.followerInfo}>
          <Text style={styles.followerName}>
            {follower.anonymousMode ? 'Anonymous' : follower.username}
          </Text>
          {follower.anonymousMode && (
            <Text style={styles.anonymousLabel}>Anonymous User</Text>
          )}
        </View>

        {follower._id !== currentUser.id && (
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
      <Ionicons name="people-outline" size={64} color={WINNIPEG_COLORS.gray[400]} />
      <Text style={styles.emptyTitle}>No followers yet</Text>
      <Text style={styles.emptySubtitle}>
        When people follow you, they'll appear here.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || followers.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsBlue} />
      </View>
    );
  };

  if (loading && followers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={WINNIPEG_COLORS.jetsBlue} />
        <Text style={styles.loadingText}>Loading followers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={followers}
        keyExtractor={(item) => item._id}
        renderItem={renderFollower}
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
  followerItem: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    marginHorizontal: WINNIPEG_SPACING.lg,
    marginVertical: WINNIPEG_SPACING.xs,
    borderRadius: WINNIPEG_RADIUS.lg,
    ...WINNIPEG_SHADOWS.sm,
  },
  followerContent: {
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
  followerInfo: {
    flex: 1,
  },
  followerName: {
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

export default FollowersScreen;
