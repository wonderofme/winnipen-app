import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getUserPosts, getUserProfile, checkIsFollowing, followUser, unfollowUser } from '../utils/api';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';
import FollowButton from '../components/FollowButton';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId, username } = route.params;
  const { user: currentUser } = useAuth();
  const { onEvent, offEvent } = useSocket();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [optimisticFollowerCount, setOptimisticFollowerCount] = useState(0);

  useEffect(() => {
    loadUserProfile();
    loadUserPosts();
    loadFollowStatus();
  }, [userId]);

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    const handleFollowEvent = (data) => {
      if (data.targetUserId === userId) {
        setOptimisticFollowerCount(prev => Math.max(0, prev + 1));
      }
    };

    const handleUnfollowEvent = (data) => {
      if (data.targetUserId === userId) {
        setOptimisticFollowerCount(prev => Math.max(0, prev - 1));
      }
    };

    onEvent('follow', handleFollowEvent);
    onEvent('unfollow', handleUnfollowEvent);

    return () => {
      offEvent('follow', handleFollowEvent);
      offEvent('unfollow', handleUnfollowEvent);
    };
  }, [userId, onEvent, offEvent]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const result = await getUserProfile(userId);
      
      if (result.success) {
        // Fix nested data structure - result.data.data instead of result.data
        const userData = result.data.data || result.data;
        setUser(userData);
        setFollowerCount(userData.followerCount || 0);
        setOptimisticFollowerCount(userData.followerCount || 0);
        setFollowingCount(userData.followingCount || 0);
      } else {
        Alert.alert('Error', result.error || 'Failed to load user profile');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load user profile error:', error);
      Alert.alert('Error', 'Failed to load user profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      setLoadingPosts(true);
      const result = await getUserPosts(userId);
      
      if (result.success) {
        // Fix nested data structure - result.data.posts instead of result.data
        const postsData = result.data.posts || result.data;
        setUserPosts(postsData);
      } else {
        console.error('Failed to load user posts:', result.error);
      }
    } catch (error) {
      console.error('Load user posts error:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadFollowStatus = async () => {
    try {
      // Don't check follow status if viewing own profile
      if (currentUser && currentUser.id === userId) {
        return;
      }

      const result = await checkIsFollowing(userId);
      if (result.success) {
        setIsFollowing(result.data.isFollowing);
      }
    } catch (error) {
      console.error('Load follow status error:', error);
    }
  };

  const handleFollowToggle = async (shouldFollow) => {
    // Optimistic update for follower count
    const countChange = shouldFollow ? 1 : -1;
    setOptimisticFollowerCount(prev => Math.max(0, prev + countChange));
    
    try {
      let result;
      if (shouldFollow) {
        result = await followUser(userId);
      } else {
        result = await unfollowUser(userId);
      }

      if (result.success) {
        setIsFollowing(shouldFollow);
        // Update counts if provided in response
        if (result.data.followerCount !== undefined) {
          setFollowerCount(result.data.followerCount);
          setOptimisticFollowerCount(result.data.followerCount);
        }
        // Update following count for current user (optimistic)
        if (result.data.followingCount !== undefined) {
          // This will be handled by Socket.IO events, but we can also update optimistically
        }
      } else {
        // Rollback optimistic update on error
        setOptimisticFollowerCount(prev => Math.max(0, prev - countChange));
        Alert.alert('Error', result.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      // Rollback optimistic update on error
      setOptimisticFollowerCount(prev => Math.max(0, prev - countChange));
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handlePostPress = (postId) => {
    navigation.navigate('PostDetail', { postId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={WINNIPEG_COLORS.jetsBlue} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color="#9ca3af" />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={40} color="#6b7280" />
            </View>
          )}
        </View>
        
        <Text style={styles.username}>
          {user.anonymousMode ? 'Anonymous' : user.username}
        </Text>
        
        {!user.anonymousMode && (
          <Text style={styles.memberSince}>
            Member since {new Date(user.createdAt).getFullYear()}
          </Text>
        )}
        
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{optimisticFollowerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Follow Button - Only show if not viewing own profile */}
        {currentUser && currentUser.id !== userId && (
          <View style={styles.followButtonContainer}>
            <FollowButton
              isFollowing={isFollowing}
              onFollowChange={handleFollowToggle}
              size="medium"
            />
          </View>
        )}
      </View>

      {/* Recent Posts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {user.anonymousMode ? 'Recent Activity' : `${user.username}'s Posts`}
        </Text>
        
        {loadingPosts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsBlue} />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : userPosts.length > 0 ? (
          userPosts.map((post) => (
            <TouchableOpacity
              key={post._id}
              style={styles.postItem}
              onPress={() => handlePostPress(post._id)}
            >
              <View style={styles.postContent}>
                <View style={styles.postImageContainer}>
                  {post.mediaUrl && post.mediaType === 'image' ? (
                    <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
                  ) : (
                    <View style={styles.postIconContainer}>
                      <Ionicons name="chatbubble-outline" size={24} color={WINNIPEG_COLORS.gray[400]} />
                    </View>
                  )}
                </View>
                <View style={styles.postTextContainer}>
                  <Text style={styles.postText} numberOfLines={2}>
                    {post.text}
                  </Text>
                  <View style={styles.postMeta}>
                    <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
                    <View style={styles.postStats}>
                      <Ionicons name="heart" size={14} color="#ef4444" />
                      <Text style={styles.postStatText}>{post.likeCount || 0}</Text>
                      <Ionicons name="chatbubble" size={14} color="#6b7280" />
                      <Text style={styles.postStatText}>{post.commentCount || 0}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyPosts}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyPostsText}>
              {user.anonymousMode ? 'No recent activity' : 'No posts yet'}
            </Text>
            <Text style={styles.emptyPostsSubtext}>
              {user.anonymousMode ? 'This user prefers to stay anonymous' : 'This user hasn\'t shared anything yet'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Winnipen Community</Text>
        <Text style={styles.footerText}>Made with ❤️ for Winnipeg</Text>
      </View>
    </ScrollView>
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
    paddingVertical: WINNIPEG_SPACING['4xl'],
  },
  loadingText: {
    marginTop: WINNIPEG_SPACING.lg,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.xl,
  },
  errorText: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    color: WINNIPEG_COLORS.gray[500],
    marginTop: WINNIPEG_SPACING.lg,
    marginBottom: WINNIPEG_SPACING.xl,
  },
  backButton: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    paddingHorizontal: WINNIPEG_SPACING.xl,
    paddingVertical: WINNIPEG_SPACING.md,
    borderRadius: WINNIPEG_RADIUS.lg,
  },
  backButtonText: {
    color: WINNIPEG_COLORS.jetsWhite,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
  },
  header: {
    backgroundColor: WINNIPEG_COLORS.jetsNavy,
    alignItems: 'center',
    paddingTop: WINNIPEG_SPACING['5xl'],
    paddingBottom: WINNIPEG_SPACING['3xl'],
    paddingHorizontal: WINNIPEG_SPACING.xl,
    marginBottom: WINNIPEG_SPACING.xl,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: WINNIPEG_TYPOGRAPHY['2xl'],
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsWhite,
    marginBottom: 8,
  },
  memberSince: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.jetsWhite,
    opacity: 0.8,
    marginBottom: WINNIPEG_SPACING.lg,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
    marginHorizontal: WINNIPEG_SPACING.xl,
  },
  followButtonContainer: {
    marginTop: WINNIPEG_SPACING.lg,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: WINNIPEG_TYPOGRAPHY['2xl'],
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsWhite,
  },
  statLabel: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.jetsWhite,
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    marginHorizontal: WINNIPEG_SPACING.lg,
    marginBottom: WINNIPEG_SPACING.lg,
    borderRadius: WINNIPEG_RADIUS.lg,
    padding: WINNIPEG_SPACING.lg,
    ...WINNIPEG_SHADOWS.md,
  },
  sectionTitle: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: WINNIPEG_SPACING.lg,
  },
  postItem: {
    backgroundColor: WINNIPEG_COLORS.gray[50],
    padding: WINNIPEG_SPACING.lg,
    borderRadius: WINNIPEG_RADIUS.md,
    marginBottom: WINNIPEG_SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: WINNIPEG_COLORS.jetsBlue,
  },
  postContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  postImageContainer: {
    marginRight: WINNIPEG_SPACING.md,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: WINNIPEG_RADIUS.sm,
    backgroundColor: WINNIPEG_COLORS.gray[200],
  },
  postIconContainer: {
    width: 60,
    height: 60,
    borderRadius: WINNIPEG_RADIUS.sm,
    backgroundColor: WINNIPEG_COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WINNIPEG_COLORS.gray[200],
  },
  postTextContainer: {
    flex: 1,
  },
  postText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    marginRight: 12,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: WINNIPEG_SPACING['3xl'],
  },
  emptyPostsText: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    color: WINNIPEG_COLORS.gray[500],
    marginTop: WINNIPEG_SPACING.lg,
    marginBottom: WINNIPEG_SPACING.sm,
  },
  emptyPostsSubtext: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[400],
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
});

export default UserProfileScreen;
