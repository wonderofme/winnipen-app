import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getPost, likePost, createComment, likeComment, deletePost } from '../utils/api';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';
import CommentItem from '../components/CommentItem';
import ReportModal from '../components/ReportModal';

const { width } = Dimensions.get('window');

const PostDetailScreen = ({ route, navigation }) => {
  const { postId, openKeyboard } = route.params;
  console.log('🔍 PostDetailScreen - openKeyboard:', openKeyboard);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likingPost, setLikingPost] = useState(false);
  const [likingComments, setLikingComments] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const { onEvent, offEvent } = useSocket();

  useEffect(() => {
    loadPost();
    setupSocketListeners();

    return () => {
      cleanupSocketListeners();
    };
  }, [postId]);

  useEffect(() => {
    console.log('🔍 useEffect triggered - openKeyboard:', openKeyboard, 'post loaded:', !!post);
    if (openKeyboard && commentInputRef.current) {
      console.log('🔍 Attempting to focus comment input');
      // Multiple attempts to ensure focus works
      const focusInput = () => {
        if (commentInputRef.current) {
          console.log('🔍 Focusing input now');
          commentInputRef.current.focus();
        } else {
          console.log('🔍 Comment input ref not available');
        }
      };
      
      // Try immediately
      focusInput();
      
      // Try after a short delay
      setTimeout(focusInput, 100);
      
      // Try after a longer delay as backup
      setTimeout(focusInput, 800);
    }
  }, [openKeyboard, post]); // Also depend on post to ensure it's loaded

  const setupSocketListeners = () => {
    onEvent('comment:new', handleNewComment);
  };

  const cleanupSocketListeners = () => {
    offEvent('comment:new', handleNewComment);
  };

  const handleNewComment = (newComment) => {
    if (newComment.post === postId) {
      console.log('💬 New comment received:', newComment._id);
      setComments(prevComments => {
        // Check if comment already exists to prevent duplicates
        const exists = prevComments.some(comment => comment._id === newComment._id);
        if (exists) {
          console.log('⚠️ Comment already exists, skipping:', newComment._id);
          return prevComments;
        }
        console.log('✅ Adding new comment:', newComment._id);
        return [newComment, ...prevComments];
      });
    }
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await getPost(postId);
      
      if (response.success) {
        setPost(response.data);
        setComments(response.data.comments || []);
      } else {
        Alert.alert('Error', response.error);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load post error:', error);
      Alert.alert('Error', 'Failed to load post');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async () => {
    if (likingPost) return;
    
    try {
      setLikingPost(true);
      const response = await likePost(postId);
      console.log('🔍 Like post response:', response);
      if (response.success) {
        console.log('✅ Post liked successfully, likeCount:', response.data.likeCount);
        setPost(response.data);
      } else {
        console.log('❌ Like post failed:', response.error);
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Like post error:', error);
      Alert.alert('Error', 'Failed to like post');
    } finally {
      setLikingPost(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (likingComments[commentId]) return;
    
    try {
      setLikingComments(prev => ({ ...prev, [commentId]: true }));
      const response = await likeComment(commentId);
      console.log('🔍 Like comment response:', response);
      if (response.success) {
        console.log('✅ Comment liked successfully, likeCount:', response.data.likeCount);
        setComments(prevComments =>
          prevComments.map(comment =>
            comment._id === commentId ? response.data : comment
          )
        );
      } else {
        console.log('❌ Like comment failed:', response.error);
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Like comment error:', error);
      Alert.alert('Error', 'Failed to like comment');
    } finally {
      setLikingComments(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await createComment({
        text: commentText.trim(),
        postId,
      });

      if (response.success) {
        console.log('📝 Comment created successfully:', response.data._id);
        // Don't add to local state - let Socket.IO handle it
        // This prevents duplicates when the same comment comes via Socket.IO
        setCommentText('');
      } else {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Submit comment error:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveImage = async () => {
    if (!post?.mediaUrl || post.mediaType !== 'image') return;
    
    try {
      setIsSaving(true);
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to save images.');
        return;
      }

      // Download and save the image
      const asset = await MediaLibrary.saveToLibraryAsync(post.mediaUrl);
      
      Alert.alert('Success', 'Image saved to your photo library!');
      console.log('✅ Image saved successfully:', asset);
      
    } catch (error) {
      console.error('Save image error:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleReportSubmitted = () => {
    // Post will be automatically hidden from feed due to backend filtering
    console.log('✅ Report submitted successfully');
    // Optionally navigate back to feed
    navigation.goBack();
  };

  const handleDeletePost = () => {
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
          onPress: confirmDeletePost,
        },
      ]
    );
  };

  const confirmDeletePost = async () => {
    try {
      setIsDeleting(true);
      const result = await deletePost(post._id);
      
      if (result.success) {
        Alert.alert('Success', 'Post deleted successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      Alert.alert('Error', 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAuthorPress = () => {
    if (post.author._id) {
      navigation.navigate('UserProfile', { 
        userId: post.author._id,
        username: post.author.username 
      });
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

  const isPostLiked = user && post?.likes.some(like => like.user === user.id);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Post Content */}
        <View style={styles.postContainer}>
          {/* Options Button - Top Right Corner */}
          <TouchableOpacity 
            onPress={user && post.author._id === user.id ? handleDeletePost : handleReport} 
            style={styles.reportButton}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#9ca3af" />
            ) : (
              <Ionicons 
                name={user && post.author._id === user.id ? "trash-outline" : "ellipsis-horizontal"} 
                size={20} 
                color="#9ca3af" 
              />
            )}
          </TouchableOpacity>
          
          <View style={styles.postHeader}>
            <TouchableOpacity style={styles.authorInfo} onPress={handleAuthorPress}>
              <View style={styles.avatar}>
                {post.author.avatar ? (
                  <Image source={{ uri: post.author.avatar }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color="#6b7280" />
                )}
              </View>
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>
                  {post.author.anonymousMode ? 'Anonymous' : post.author.username}
                </Text>
                <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.postText}>{post.text}</Text>

          {post.mediaUrl && (
            <View style={styles.mediaContainer}>
              <Image source={{ uri: post.mediaUrl }} style={styles.mediaImage} />
            </View>
          )}

          <View style={styles.postActions}>
            <TouchableOpacity 
              style={[styles.actionButton, likingPost && styles.actionButtonDisabled]} 
              onPress={handleLikePost}
              disabled={likingPost}
            >
              {likingPost ? (
                <ActivityIndicator size="small" color="#6b7280" />
              ) : (
                <Ionicons 
                  name={isPostLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isPostLiked ? WINNIPEG_COLORS.jetsBlue : WINNIPEG_COLORS.gray[500]} 
                />
              )}
              <Text style={[styles.actionText, isPostLiked && styles.likedText]}>
                {post.likeCount || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color={WINNIPEG_COLORS.jetsGold} />
              <Text style={styles.actionText}>{comments.length}</Text>
            </TouchableOpacity>

            {/* Save button - only show for image posts */}
            {post.mediaType === 'image' && post.mediaUrl && (
              <TouchableOpacity 
                style={[styles.actionButton, isSaving && styles.actionButtonDisabled]} 
                onPress={handleSaveImage}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsGold} />
                ) : (
                  <Ionicons name="download-outline" size={24} color={WINNIPEG_COLORS.jetsGold} />
                )}
                <Text style={styles.actionText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color="#6b7280" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({comments.length})
          </Text>

          {comments.map((comment, index) => (
            <CommentItem
              key={comment._id || `comment-${index}`}
              comment={comment}
              onLike={() => handleLikeComment(comment._id)}
              isLiking={likingComments[comment._id]}
            />
          ))}

          {comments.length === 0 && (
            <View style={styles.noComments}>
              <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
              <Text style={styles.noCommentsText}>No comments yet</Text>
              <Text style={styles.noCommentsSubtext}>Be the first to comment!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          ref={commentInputRef}
          style={styles.commentInput}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={300}
        />
        <TouchableOpacity
          style={[styles.submitButton, (!commentText.trim() || submittingComment) && styles.submitButtonDisabled]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        post={post}
        onReportSubmitted={handleReportSubmitted}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#374151',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  postContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  reportButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    zIndex: 10,
  },
  postText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  mediaContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  videoContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  likedText: {
    color: WINNIPEG_COLORS.jetsBlue,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  commentsSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: WINNIPEG_COLORS.gray[400],
  },
});

export default PostDetailScreen;
