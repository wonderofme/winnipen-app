import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const CommentItem = ({ comment, onLike, onReply, isLiking = false }) => {
  const { user } = useAuth();

  const formatTime = (timestamp) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const isLiked = user && comment.likes.some(like => like.user === user.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            {comment.author.avatar ? (
              <Image source={{ uri: comment.author.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={16} color="#6b7280" />
            )}
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>
              {comment.author.username}
            </Text>
            <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.commentText}>{comment.text}</Text>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, isLiking && styles.actionButtonDisabled]} 
          onPress={onLike}
          disabled={isLiking}
        >
          {isLiking ? (
            <ActivityIndicator size="small" color="#9ca3af" />
          ) : (
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={16} 
              color={isLiked ? WINNIPEG_COLORS.jetsBlue : WINNIPEG_COLORS.gray[400]} 
            />
          )}
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {comment.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onReply}>
          <Ionicons name="chatbubble-outline" size={16} color="#9ca3af" />
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  header: {
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
  likedText: {
    color: WINNIPEG_COLORS.jetsBlue,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommentItem;


