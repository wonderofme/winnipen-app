import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WINNIPEG_COLORS, WINNIPEG_SHADOWS } from '../utils/theme';

const PostPin = ({ post, currentUser }) => {
  const isOwnPost = currentUser && post.author && post.author._id === currentUser.id;
  
  const getPinColor = () => {
    if (isOwnPost) {
      // User's own posts - use prairie green for distinction
      if (post.mediaType === 'image' && post.mediaUrl) return WINNIPEG_COLORS.prairieGreen;
      return WINNIPEG_COLORS.prairieGreen;
    } else {
      // Other users' posts - original colors
      if (post.mediaType === 'image' && post.mediaUrl) return WINNIPEG_COLORS.jetsGold;
      return WINNIPEG_COLORS.jetsBlue;
    }
  };

  const getPinIcon = () => {
    if (post.mediaType === 'image' && post.mediaUrl) return 'image';
    return 'chatbubble';
  };

  const getBorderColor = () => {
    if (isOwnPost) {
      // User's own posts get a distinctive gold border
      return WINNIPEG_COLORS.jetsGold;
    }
    return WINNIPEG_COLORS.jetsWhite;
  };

  const getBorderWidth = () => {
    if (isOwnPost) {
      // User's own posts get a thicker border for more distinction
      return 4;
    }
    return 3;
  };

  return (
    <View style={[
      styles.pin, 
      { 
        backgroundColor: getPinColor(),
        borderColor: getBorderColor(),
        borderWidth: getBorderWidth()
      }
    ]}>
      <Ionicons 
        name={getPinIcon()} 
        size={16} 
        color="white" 
      />
      {post.likeCount > 0 && (
        <View style={styles.likeBadge}>
          <Text style={styles.likeCount}>{post.likeCount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: WINNIPEG_COLORS.jetsWhite,
    ...WINNIPEG_SHADOWS.lg,
  },
  likeBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: WINNIPEG_COLORS.jetsNavy,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: WINNIPEG_COLORS.jetsWhite,
  },
  likeCount: {
    color: WINNIPEG_COLORS.jetsWhite,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default PostPin;
