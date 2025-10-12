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
  Modal,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { updateUserProfile, getUserPosts, getFollowers, getFollowing } from '../utils/api';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const ProfileScreen = ({ navigation }) => {
  const { user, signOut, updateUser } = useAuth();
  const { onEvent, offEvent } = useSocket();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anonymousMode, setAnonymousMode] = useState(user?.anonymousMode || false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');
  const [editingAvatar, setEditingAvatar] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUserPosts();
      loadFollowCounts();
      setAnonymousMode(user.anonymousMode);
    }
  }, [user]);

  // Refresh follow counts when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        loadFollowCounts();
      }
    });

    return unsubscribe;
  }, [navigation, user]);


  // Socket.IO listeners for real-time follow updates
  useEffect(() => {
    const handleFollowEvent = (data) => {
      // If someone followed the current user, increase follower count
      if (data.targetUserId === user?.id) {
        setFollowerCount(prev => prev + 1);
      }
      // If current user followed someone, increase following count
      if (data.followerId === user?.id) {
        setFollowingCount(prev => prev + 1);
      }
    };

    const handleUnfollowEvent = (data) => {
      // If someone unfollowed the current user, decrease follower count
      if (data.targetUserId === user?.id) {
        setFollowerCount(prev => Math.max(0, prev - 1));
      }
      // If current user unfollowed someone, decrease following count
      if (data.followerId === user?.id) {
        setFollowingCount(prev => Math.max(0, prev - 1));
      }
    };

    onEvent('follow', handleFollowEvent);
    onEvent('unfollow', handleUnfollowEvent);

    return () => {
      offEvent('follow', handleFollowEvent);
      offEvent('unfollow', handleUnfollowEvent);
    };
  }, [onEvent, offEvent, user?.id]);

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const response = await getUserPosts(user.id, { limit: 10 });
      
      if (response.success) {
        setUserPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Load user posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAnonymous = async () => {
    try {
      const newAnonymousMode = !anonymousMode;
      const response = await updateUserProfile({ anonymousMode: newAnonymousMode });
      
      if (response.success) {
        setAnonymousMode(newAnonymousMode);
        updateUser(response.data);
        Alert.alert(
          'Settings Updated',
          `You are now posting ${newAnonymousMode ? 'anonymously' : 'with your username'}.`
        );
      } else {
        Alert.alert('Error', response.error);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
  };


  const loadFollowCounts = async () => {
    try {
      const [followersResult, followingResult] = await Promise.all([
        getFollowers(user.id, 1, 1), // Just get count, not actual data
        getFollowing(user.id, 1, 1)  // Just get count, not actual data
      ]);

      if (followersResult.success) {
        setFollowerCount(followersResult.data.pagination.total);
      }
      if (followingResult.success) {
        setFollowingCount(followingResult.data.pagination.total);
      }
    } catch (error) {
      console.error('Load follow counts error:', error);
    }
  };

  const handleEditProfile = () => {
    setEditingUsername(user.username || '');
    setEditingAvatar(user.avatar);
    setShowEditModal(true);
  };

  const handleSelectImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditingAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editingUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }

    if (editingUsername.trim() === user.username && editingAvatar === user.avatar) {
      setShowEditModal(false);
      return;
    }

    try {
      setUpdatingProfile(true);

      const updateData = {
        username: editingUsername.trim(),
      };

      // Upload avatar to Cloudinary if it's different from current and is a local file
      if (editingAvatar !== user.avatar && editingAvatar) {
        // Check if it's a local file path (starts with file://)
        if (editingAvatar.startsWith('file://')) {
          console.log('📤 Uploading profile picture to Cloudinary...');
          const uploadResult = await uploadImageToCloudinary(editingAvatar, 'profile');
          
          if (uploadResult.success) {
            updateData.avatar = uploadResult.url;
            console.log('✅ Profile picture uploaded successfully:', uploadResult.url);
          } else {
            Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
            return;
          }
        } else {
          // It's already a URL (Cloudinary or other), use it directly
          updateData.avatar = editingAvatar;
        }
      }

      const result = await updateUserProfile(updateData);

      if (result.success) {
        // Update the user context with new data
        updateUser({
          ...user,
          username: editingUsername.trim(),
          avatar: updateData.avatar || user.avatar
        });

        Alert.alert('Success', 'Profile updated successfully!');
        setShowEditModal(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setUpdatingProfile(false);
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

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color="#9ca3af" />
        <Text style={styles.errorText}>User not found</Text>
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
        
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        
        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Ionicons name="create-outline" size={16} color={WINNIPEG_COLORS.jetsWhite} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        
        <View style={styles.stats}>
          <TouchableOpacity 
            style={[styles.stat, styles.clickableStat]} 
            onPress={() => navigation.navigate('Followers', { userId: user.id, username: user.username })}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.stat, styles.clickableStat]} 
            onPress={() => navigation.navigate('Following', { userId: user.id, username: user.username })}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.stat, styles.clickableStat]} 
            onPress={() => navigation.navigate('UserPosts', { userId: user.id, username: user.username })}
            activeOpacity={0.7}
          >
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleToggleAnonymous}>
          <View style={styles.settingInfo}>
            <Ionicons name="eye-off" size={24} color={WINNIPEG_COLORS.jetsGold} />
            <View style={styles.settingDetails}>
              <Text style={styles.settingTitle}>Anonymous Mode</Text>
              <Text style={styles.settingDescription}>
                {anonymousMode ? 'Your posts will show as "Anonymous"' : 'Your posts will show your username'}
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, anonymousMode && styles.toggleActive]}>
            <View style={[styles.toggleThumb, anonymousMode && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color="#6b7280" />
            <View style={styles.settingDetails}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>Manage your notification preferences</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

      </View>

      {/* Recent Posts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Recent Posts</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : userPosts.length > 0 ? (
          userPosts.map((post) => (
            <TouchableOpacity
              key={post._id}
              style={styles.postItem}
              onPress={() => navigation.navigate('PostDetail', { postId: post._id })}
            >
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
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyPosts}>
            <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyPostsText}>No posts yet</Text>
            <Text style={styles.emptyPostsSubtext}>Start sharing on the map!</Text>
          </View>
        )}
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out" size={24} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Winnipen v1.0.0</Text>
        <Text style={styles.footerText}>Made with ❤️ for Winnipeg</Text>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={WINNIPEG_COLORS.gray[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity 
              onPress={handleSaveProfile} 
              style={[styles.modalSaveButton, updatingProfile && styles.modalSaveButtonDisabled]}
              disabled={updatingProfile}
            >
              {updatingProfile ? (
                <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsWhite} />
              ) : (
                <Text style={styles.modalSaveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Profile Picture Section */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Profile Picture</Text>
              <TouchableOpacity style={styles.avatarEditContainer} onPress={handleSelectImage}>
                {editingAvatar ? (
                  <Image source={{ uri: editingAvatar }} style={styles.editingAvatar} />
                ) : (
                  <View style={styles.editingDefaultAvatar}>
                    <Ionicons name="person" size={40} color="#6b7280" />
                  </View>
                )}
                <View style={styles.avatarEditOverlay}>
                  <Ionicons name="camera" size={20} color={WINNIPEG_COLORS.jetsWhite} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarEditText}>Tap to change profile picture</Text>
            </View>

            {/* Username Section */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Username</Text>
              <TextInput
                style={styles.usernameInput}
                value={editingUsername}
                onChangeText={setEditingUsername}
                placeholder="Enter your username"
                placeholderTextColor={WINNIPEG_COLORS.gray[400]}
                maxLength={30}
              />
              <Text style={styles.inputHelperText}>
                {editingUsername.length}/30 characters
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WINNIPEG_COLORS.prairieBeige,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: WINNIPEG_COLORS.prairieBeige,
  },
  errorText: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    color: WINNIPEG_COLORS.gray[500],
    marginTop: WINNIPEG_SPACING.lg,
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
    marginBottom: 4,
  },
  email: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[300],
    marginBottom: WINNIPEG_SPACING.xl,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: WINNIPEG_SPACING.xl,
    marginTop: WINNIPEG_SPACING.lg,
  },
  stat: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: WINNIPEG_SPACING.lg,
    paddingHorizontal: WINNIPEG_SPACING.sm,
    borderRadius: WINNIPEG_RADIUS.lg,
    minHeight: 80,
  },
  clickableStat: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: WINNIPEG_SPACING.xs,
  },
  statNumber: {
    fontSize: WINNIPEG_TYPOGRAPHY['2xl'],
    fontWeight: WINNIPEG_TYPOGRAPHY.bold,
    color: WINNIPEG_COLORS.jetsWhite,
    marginBottom: WINNIPEG_SPACING.xs,
  },
  statLabel: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[200],
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingDetails: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  postItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    paddingVertical: 40,
  },
  emptyPostsText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyPostsSubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
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
  // Edit Profile Button
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    paddingHorizontal: WINNIPEG_SPACING.lg,
    paddingVertical: WINNIPEG_SPACING.md,
    borderRadius: WINNIPEG_RADIUS.lg,
    marginTop: WINNIPEG_SPACING.lg,
    ...WINNIPEG_SHADOWS.md,
  },
  editButtonText: {
    color: WINNIPEG_COLORS.jetsWhite,
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
    marginLeft: WINNIPEG_SPACING.sm,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: WINNIPEG_COLORS.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: WINNIPEG_SPACING.lg,
    paddingVertical: WINNIPEG_SPACING.lg,
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderBottomWidth: 1,
    borderBottomColor: WINNIPEG_COLORS.gray[200],
  },
  modalCloseButton: {
    padding: WINNIPEG_SPACING.sm,
  },
  modalTitle: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
  },
  modalSaveButton: {
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    paddingHorizontal: WINNIPEG_SPACING.lg,
    paddingVertical: WINNIPEG_SPACING.sm,
    borderRadius: WINNIPEG_RADIUS.md,
  },
  modalSaveButtonDisabled: {
    backgroundColor: WINNIPEG_COLORS.gray[300],
  },
  modalSaveButtonText: {
    color: WINNIPEG_COLORS.jetsWhite,
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    fontWeight: WINNIPEG_TYPOGRAPHY.medium,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: WINNIPEG_SPACING.lg,
  },
  editSection: {
    marginTop: WINNIPEG_SPACING.xl,
  },
  editSectionTitle: {
    fontSize: WINNIPEG_TYPOGRAPHY.lg,
    fontWeight: WINNIPEG_TYPOGRAPHY.semibold,
    color: WINNIPEG_COLORS.jetsNavy,
    marginBottom: WINNIPEG_SPACING.lg,
  },
  // Avatar Edit Styles
  avatarEditContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: WINNIPEG_SPACING.md,
  },
  editingAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editingDefaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: WINNIPEG_COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: WINNIPEG_COLORS.jetsWhite,
  },
  avatarEditText: {
    textAlign: 'center',
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[600],
  },
  // Username Input Styles
  usernameInput: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    borderWidth: 1,
    borderColor: WINNIPEG_COLORS.gray[300],
    borderRadius: WINNIPEG_RADIUS.lg,
    padding: WINNIPEG_SPACING.lg,
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[700],
    ...WINNIPEG_SHADOWS.sm,
  },
  inputHelperText: {
    fontSize: WINNIPEG_TYPOGRAPHY.xs,
    color: WINNIPEG_COLORS.gray[500],
    textAlign: 'right',
    marginTop: WINNIPEG_SPACING.sm,
  },
});

export default ProfileScreen;



