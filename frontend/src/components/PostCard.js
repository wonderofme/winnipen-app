import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';
import { getThumbnailUrlFromFullUrl } from '../utils/cloudinary';
import ReportModal from './ReportModal';
import ImageViewerModal from './ImageViewerModal';

const PostCard = ({ post, userLocation, onPress, onLike, onCommentPress, navigation }) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatDistance = (coordinates) => {
    if (!userLocation || !coordinates) {
      return 'Distance unknown';
    }

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      coordinates.latitude,
      coordinates.longitude
    );

    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    } else {
      return `${distance.toFixed(1)}km away`;
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const handleLike = async () => {
    if (isLiking || !onLike) return;
    
    try {
      setIsLiking(true);
      await onLike();
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      // Create a clean share message with better formatting
      let shareMessage = `"${post.text}"\n\nPosted by ${post.author.displayName || post.author.username}\n\nShared from Winnipen - Winnipeg's Community App`;
      
      const shareContent = {
        title: 'Check out this post from Winnipen',
        message: shareMessage,
      };

      // For image posts, use different sharing approach to encourage "Save Image" option
      if (post.mediaUrl) {
        // Try sharing with both message and URL for better platform support
        shareContent.url = post.mediaUrl;
        
        // On iOS, this should show "Save Image" option
        // On Android, it depends on the receiving app
      }

      const result = await Share.share(shareContent, {
        // Additional options to help with image sharing
        subject: 'Check out this post from Winnipen',
        dialogTitle: 'Share Post',
      });
      
      if (result.action === Share.sharedAction) {
        console.log('✅ Post shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('📱 Share dismissed');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share post. Please try again.');
    }
  };

  const handleSaveImage = async () => {
    if (!post.mediaUrl || !post.mediaType === 'image') return;
    
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
  };

  const handleAuthorPress = () => {
    if (navigation && post.author._id) {
      navigation.navigate('UserProfile', { 
        userId: post.author._id,
        username: post.author.username 
      });
    }
  };

  const isLiked = user && post.likes.some(like => like.user === user.id);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorInfo} onPress={handleAuthorPress}>
          <View style={styles.avatar}>
            {post.author.avatar ? (
              <Image source={{ uri: post.author.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color="#6b7280" />
            )}
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>
              {post.author.anonymousMode ? 'Anonymous' : post.author.username}
            </Text>
            <View style={styles.metaInfo}>
              <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.distance}>{formatDistance(post.coordinates)}</Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleReport} style={styles.reportButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <Text style={styles.text}>{post.text}</Text>

      {post.mediaUrl && (
        <View style={styles.mediaContainer}>
          <TouchableOpacity onPress={() => setShowImageModal(true)} activeOpacity={0.8}>
            <Image 
              source={{ uri: getThumbnailUrlFromFullUrl(post.mediaUrl) }} 
              style={styles.mediaImage} 
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, isLiking && styles.actionButtonDisabled]} 
          onPress={handleLike}
          disabled={isLiking}
        >
          {isLiking ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? WINNIPEG_COLORS.jetsBlue : WINNIPEG_COLORS.gray[500]} 
            />
          )}
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {post.likeCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => {
          console.log('🔍 PostCard - Comment button pressed');
          onCommentPress && onCommentPress(post);
        }}>
          <Ionicons name="chatbubble-outline" size={20} color={WINNIPEG_COLORS.jetsGold} />
          <Text style={styles.actionText}>{post.commentCount || 0}</Text>
        </TouchableOpacity>

        {/* Save button - only show for image posts */}
        {post.mediaType === 'image' && post.mediaUrl && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleSaveImage}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsGold} />
            ) : (
              <Ionicons name="download-outline" size={20} color={WINNIPEG_COLORS.jetsGold} />
            )}
            <Text style={styles.actionText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={WINNIPEG_COLORS.gray[500]} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        post={post}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={showImageModal}
        imageUrl={post.mediaUrl}
        onClose={() => setShowImageModal(false)}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderRadius: WINNIPEG_RADIUS.lg,
    padding: WINNIPEG_SPACING.lg,
    marginBottom: WINNIPEG_SPACING.md,
    ...WINNIPEG_SHADOWS.md,
    borderLeftWidth: 4,
    borderLeftColor: WINNIPEG_COLORS.jetsBlue,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: 2,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
  },
  separator: {
    fontSize: 12,
    color: '#9ca3af',
    marginHorizontal: 4,
  },
  distance: {
    fontSize: 12,
    color: '#6b7280',
  },
  reportButton: {
    padding: 4,
  },
  text: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  videoContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
  },
  likedText: {
    color: WINNIPEG_COLORS.jetsBlue,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
});

export default PostCard;
