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
import { getUserPosts, deletePost } from '../utils/api';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const UserPostsScreen = ({ route, navigation }) => {
  const { userId, username } = route.params;
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' or 'likeCount'

  useEffect(() => {
    loadPosts();
  }, [userId, sortBy]);

  const loadPosts = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const result = await getUserPosts(userId, { page: pageNum, limit: 20, sortBy, sortOrder: 'desc' });
      
      if (result.success) {
        const newPosts = result.data.posts || result.data;
        
        if (pageNum === 1 || refresh) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        setTotalCount(newPosts.length);
        setHasMore(newPosts.length === 20);
        setPage(pageNum);
      } else {
        Alert.alert('Error', result.error || 'Failed to load posts');
      }
    } catch (error) {
      console.error('Load posts error:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadPosts(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1);
    }
  };

  const toggleSort = () => {
    const newSortBy = sortBy === 'createdAt' ? 'likeCount' : 'createdAt';
    setSortBy(newSortBy);
  };

  const handlePostPress = (post) => {
    navigation.navigate('PostDetail', { postId: post._id });
  };

  const handleDeletePost = (post) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeletePost(post._id),
        },
      ]
    );
  };

  const confirmDeletePost = async (postId) => {
    try {
      setDeletingPostId(postId);
      const result = await deletePost(postId);
      
      if (result.success) {
        // Remove the post from the local list
        setPosts(prev => prev.filter(post => post._id !== postId));
        Alert.alert('Success', 'Post deleted successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      Alert.alert('Error', 'Failed to delete post');
    } finally {
      setDeletingPostId(null);
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / (24 * 60))}d ago`;
  };

  const renderPost = ({ item: post }) => {
    const isOwnPost = currentUser && post.author._id === currentUser.id;
    
    return (
      <View style={styles.postItem}>
        <TouchableOpacity
          style={styles.postContent}
          onPress={() => handlePostPress(post)}
          activeOpacity={0.7}
        >
          <View style={styles.postImageContainer}>
            {post.mediaUrl && post.mediaType === 'image' ? (
              <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
            ) : (
              <View style={styles.postIconContainer}>
                <Ionicons name="chatbubble-outline" size={24} color={WINNIPEG_COLORS.gray[400]} />
              </View>
            )}
          </View>
          
          <View style={styles.postInfo}>
            <Text style={styles.postText} numberOfLines={3}>
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
        </TouchableOpacity>

        {/* Delete Button for Own Posts */}
        {isOwnPost && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePost(post)}
            disabled={deletingPostId === post._id}
          >
            {deletingPostId === post._id ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color={WINNIPEG_COLORS.gray[400]} />
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptySubtitle}>
        {userId === currentUser?.id 
          ? "Start sharing your thoughts and experiences with the community!"
          : "This user hasn't posted anything yet."
        }
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || posts.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsBlue} />
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={WINNIPEG_COLORS.jetsBlue} />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{username}'s Posts</Text>
        <TouchableOpacity style={[styles.sortButton, sortBy === 'likeCount' && styles.sortButtonActive]} onPress={toggleSort}>
          <Ionicons 
            name={sortBy === 'createdAt' ? 'time' : 'heart'} 
            size={20} 
            color={sortBy === 'likeCount' ? WINNIPEG_COLORS.jetsWhite : WINNIPEG_COLORS.jetsGold} 
          />
          <Text style={[styles.sortText, sortBy === 'likeCount' && styles.sortTextActive]}>
            {sortBy === 'createdAt' ? 'Recent' : 'Popular'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.lg,
    paddingVertical: WINNIPEG_SPACING.md,
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderBottomWidth: 1,
    borderBottomColor: WINNIPEG_COLORS.gray[200],
  },
  title: {
    fontSize: WINNIPEG_TYPOGRAPHY.xl,
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.gray[800],
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.md,
    paddingVertical: WINNIPEG_SPACING.sm,
    borderRadius: WINNIPEG_RADIUS.md,
    backgroundColor: WINNIPEG_COLORS.gray[100],
    borderWidth: 1,
    borderColor: WINNIPEG_COLORS.gray[300],
  },
  sortButtonActive: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    borderColor: WINNIPEG_COLORS.jetsBlue,
  },
  sortText: {
    marginLeft: WINNIPEG_SPACING.sm,
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    color: WINNIPEG_COLORS.gray[600],
  },
  sortTextActive: {
    color: WINNIPEG_COLORS.jetsWhite,
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
  postItem: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    marginHorizontal: WINNIPEG_SPACING.lg,
    marginVertical: WINNIPEG_SPACING.xs,
    borderRadius: WINNIPEG_RADIUS.lg,
    ...WINNIPEG_SHADOWS.sm,
    position: 'relative',
  },
  postContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: WINNIPEG_SPACING.lg,
  },
  postImageContainer: {
    marginRight: WINNIPEG_SPACING.md,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: WINNIPEG_RADIUS.md,
  },
  postIconContainer: {
    width: 60,
    height: 60,
    borderRadius: WINNIPEG_RADIUS.md,
    backgroundColor: WINNIPEG_COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: WINNIPEG_COLORS.gray[200],
  },
  postInfo: {
    flex: 1,
  },
  postText: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[800],
    lineHeight: 20,
    marginBottom: WINNIPEG_SPACING.sm,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postTime: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[500],
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[600],
    marginLeft: WINNIPEG_SPACING.xs,
    marginRight: WINNIPEG_SPACING.md,
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
  deleteButton: {
    position: 'absolute',
    top: WINNIPEG_SPACING.sm,
    right: WINNIPEG_SPACING.sm,
    padding: WINNIPEG_SPACING.xs,
    borderRadius: WINNIPEG_RADIUS.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});

export default UserPostsScreen;
