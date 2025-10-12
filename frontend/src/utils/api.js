import axios from 'axios';
import { API_BASE_URL } from './config';
import { getAuthToken } from './storage';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const loginUser = async (firebaseToken) => {
  try {
    const response = await api.post('/api/auth/login', {}, {
      headers: {
        Authorization: `Bearer ${firebaseToken}`
      }
    });
    return {
      success: true,
      user: response.data.user,
      token: response.data.token
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Login failed'
    };
  }
};

export const verifyToken = async () => {
  try {
    const response = await api.post('/api/auth/verify');
    return {
      success: true,
      user: response.data.user
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Token verification failed'
    };
  }
};

// Posts API
export const getPosts = async (params = {}) => {
  try {
    const response = await api.get('/api/posts', { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get posts error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch posts'
    };
  }
};

export const getPost = async (postId) => {
  try {
    const response = await api.get(`/api/posts/${postId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get post error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch post'
    };
  }
};

export const createPost = async (postData) => {
  try {
    const response = await api.post('/api/posts', postData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Create post error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create post'
    };
  }
};

export const likePost = async (postId) => {
  try {
    const response = await api.put(`/api/posts/${postId}/like`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Like post error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to like post'
    };
  }
};

export const reportPost = async (postId, reason, description = '') => {
  try {
    const response = await api.post(`/api/posts/${postId}/report`, {
      reason,
      description
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Report post error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to report post'
    };
  }
};

export const deletePost = async (postId) => {
  try {
    const response = await api.delete(`/api/posts/${postId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Delete post error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete post'
    };
  }
};

// Comments API
export const getComments = async (postId, params = {}) => {
  try {
    const response = await api.get(`/api/comments/${postId}`, { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get comments error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch comments'
    };
  }
};

export const createComment = async (commentData) => {
  try {
    const response = await api.post('/api/comments', commentData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Create comment error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to create comment'
    };
  }
};

export const likeComment = async (commentId) => {
  try {
    const response = await api.put(`/api/comments/${commentId}/like`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Like comment error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to like comment'
    };
  }
};

export const reportComment = async (commentId, reason, description = '') => {
  try {
    const response = await api.post(`/api/comments/${commentId}/report`, {
      reason,
      description
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Report comment error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to report comment'
    };
  }
};

export const deleteComment = async (commentId) => {
  try {
    const response = await api.delete(`/api/comments/${commentId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Delete comment error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete comment'
    };
  }
};

// Users API
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/users/profile');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch user profile'
    };
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/api/users/profile', userData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Update user profile error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update profile'
    };
  }
};

export const getUser = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get user error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch user'
    };
  }
};

export const getUserPosts = async (userId, params = {}) => {
  try {
    const response = await api.get(`/api/users/${userId}/posts`, { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get user posts error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch user posts'
    };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}/profile`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch user profile'
    };
  }
};

export const updateLastSeen = async () => {
  try {
    const response = await api.post('/api/users/update-last-seen');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Update last seen error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update last seen'
    };
  }
};

// Report functions
export const submitReport = async (postId, category, description = '') => {
  try {
    const response = await api.post('/api/reports', {
      postId,
      category,
      description
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Submit report error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to submit report'
    };
  }
};

export const getUserReportedPosts = async () => {
  try {
    const response = await api.get('/api/reports/user-reported');
    return {
      success: true,
      data: response.data.data.reportedPostIds
    };
  } catch (error) {
    console.error('Get user reported posts error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch reported posts'
    };
  }
};

export const getModerationReports = async (status = 'pending', page = 1, limit = 20) => {
  try {
    const response = await api.get(`/api/reports/moderation?status=${status}&page=${page}&limit=${limit}`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get moderation reports error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch moderation reports'
    };
  }
};

export const updateReportStatus = async (reportId, status, moderatorNotes = '') => {
  try {
    const response = await api.put(`/api/reports/${reportId}/status`, {
      status,
      moderatorNotes
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Update report status error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to update report status'
    };
  }
};

// Follow functions
export const followUser = async (userId) => {
  try {
    const response = await api.post(`/api/users/${userId}/follow`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Follow user error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to follow user'
    };
  }
};

export const unfollowUser = async (userId) => {
  try {
    const response = await api.delete(`/api/users/${userId}/follow`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Unfollow user error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to unfollow user'
    };
  }
};

export const checkIsFollowing = async (userId) => {
  try {
    const response = await api.get(`/api/users/${userId}/is-following`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Check following status error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to check following status'
    };
  }
};

export const getFollowers = async (userId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/api/users/${userId}/followers`, {
      params: { page, limit }
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get followers error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch followers'
    };
  }
};

export const getFollowing = async (userId, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/api/users/${userId}/following`, {
      params: { page, limit }
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get following error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch following'
    };
  }
};

// Notification functions
export const getNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
  try {
    const response = await api.get('/api/notifications', {
      params: { page, limit, unreadOnly }
    });
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get notifications error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to fetch notifications'
    };
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Mark notification read error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to mark notification as read'
    };
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await api.put('/api/notifications/read-all');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to mark all notifications as read'
    };
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/api/notifications/unread-count');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Get unread count error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to get unread count'
    };
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Delete notification error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to delete notification'
    };
  }
};

// Push notification functions
export const registerPushToken = async (token, platform, deviceId) => {
  try {
    const response = await api.post('/api/users/push-token', {
      token,
      platform,
      deviceId
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Register push token error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to register push token'
    };
  }
};

export const removePushToken = async (token, platform, deviceId) => {
  try {
    const response = await api.delete('/api/users/push-token', {
      data: { token, platform, deviceId }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Remove push token error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to remove push token'
    };
  }
};

export default api;
