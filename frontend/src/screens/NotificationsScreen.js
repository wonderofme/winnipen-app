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
import { getNotifications, markNotificationRead, deleteNotification, markAllNotificationsRead } from '../utils/api';
import { WINNIPEG_COLORS, WINNIPEG_TYPOGRAPHY, WINNIPEG_SPACING, WINNIPEG_RADIUS, WINNIPEG_SHADOWS } from '../utils/theme';

const NotificationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  // Mark all notifications as read when user navigates back
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', async () => {
      // Mark all notifications as read when leaving the screen
      try {
        await markAllNotificationsRead();
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);

  const loadNotifications = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const result = await getNotifications(pageNum, 20);
      
      if (result.success) {
        const newNotifications = result.data.notifications || [];
        
        if (pageNum === 1 || refresh) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setHasMore(newNotifications.length === 20);
        setPage(pageNum);
      } else {
        Alert.alert('Error', result.error || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Load notifications error:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadNotifications(1, true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(page + 1);
    }
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification._id);
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('Mark notification read error:', error);
      }
    }

    // Navigate based on notification type
    if (notification.type === 'new_post' && notification.post) {
      navigation.navigate('PostDetail', { postId: notification.post._id });
    } else if (notification.type === 'new_follower') {
      navigation.navigate('UserProfile', { 
        userId: notification.sender._id, 
        username: notification.sender.username 
      });
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const result = await deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
      } else {
        Alert.alert('Error', result.error || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_post':
        return 'chatbubble-outline';
      case 'new_follower':
        return 'person-add-outline';
      case 'like':
        return 'heart-outline';
      case 'comment':
        return 'chatbubble-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_post':
        return WINNIPEG_COLORS.jetsBlue;
      case 'new_follower':
        return WINNIPEG_COLORS.prairieGreen;
      case 'like':
        return '#ef4444';
      case 'comment':
        return WINNIPEG_COLORS.jetsGold;
      default:
        return WINNIPEG_COLORS.gray[500];
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderNotification = ({ item: notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: getNotificationColor(notification.type) + '20' }
        ]}>
          <Ionicons
            name={getNotificationIcon(notification.type)}
            size={24}
            color={getNotificationColor(notification.type)}
          />
        </View>
        
        <View style={styles.notificationText}>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTime(notification.createdAt)}
          </Text>
        </View>

        {notification.sender && (
          <View style={styles.senderAvatar}>
            {notification.sender.avatar ? (
              <Image 
                source={{ uri: notification.sender.avatar }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={16} color={WINNIPEG_COLORS.gray[500]} />
              </View>
            )}
          </View>
        )}
      </View>

      {!notification.isRead && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color={WINNIPEG_COLORS.gray[400]} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        When people follow you or interact with your posts, you'll see notifications here.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || notifications.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={WINNIPEG_COLORS.jetsBlue} />
      </View>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={WINNIPEG_COLORS.jetsBlue} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
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
  notificationItem: {
    backgroundColor: WINNIPEG_COLORS.jetsWhite,
    marginHorizontal: WINNIPEG_SPACING.lg,
    marginVertical: WINNIPEG_SPACING.xs,
    borderRadius: WINNIPEG_RADIUS.lg,
    ...WINNIPEG_SHADOWS.sm,
    position: 'relative',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: WINNIPEG_COLORS.jetsBlue,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: WINNIPEG_SPACING.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: WINNIPEG_SPACING.md,
  },
  notificationText: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: WINNIPEG_TYPOGRAPHY.base,
    color: WINNIPEG_COLORS.gray[800],
    lineHeight: 20,
    marginBottom: WINNIPEG_SPACING.xs,
  },
  notificationTime: {
    fontSize: WINNIPEG_TYPOGRAPHY.sm,
    color: WINNIPEG_COLORS.gray[500],
  },
  senderAvatar: {
    marginLeft: WINNIPEG_SPACING.md,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WINNIPEG_COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: WINNIPEG_SPACING.md,
    right: WINNIPEG_SPACING.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: WINNIPEG_COLORS.jetsBlue,
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

export default NotificationsScreen;


