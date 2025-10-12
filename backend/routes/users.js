const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// GET /api/users/:userId/profile - Get another user's profile
router.get('/:userId/profile', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Backend: Getting user profile for userId:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Backend: User not found for userId:', userId);
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    console.log('✅ Backend: User found:', user.username);

    // Get user's post count
    const postCount = await Post.countDocuments({ 
      author: userId, 
      isActive: true 
    });

    // Return public profile information
    const publicProfile = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      anonymousMode: user.anonymousMode,
      createdAt: user.createdAt,
      postCount
    };

    console.log('📤 Backend: Sending profile response:', publicProfile);
    res.json({
      success: true,
      data: publicProfile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch profile' 
    });
  }
});

// GET /api/users/profile - Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ 
      author: req.user.id, 
      isActive: true 
    });

    res.json({
      ...user.toObject(),
      postCount
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, anonymousMode, preferences, avatar } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update allowed fields
    if (username !== undefined) {
      // Check if username is already taken
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user.id } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    if (anonymousMode !== undefined) {
      user.anonymousMode = anonymousMode;
    }

    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/:id - Get public user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's public posts
    const posts = await Post.find({ 
      author: req.params.id, 
      isActive: true 
    })
    .populate('author', 'username avatar anonymousMode')
    .sort({ createdAt: -1 })
    .limit(10);

    const postCount = await Post.countDocuments({ 
      author: req.params.id, 
      isActive: true 
    });

    res.json({
      id: user._id,
      username: user.username,
      avatar: user.avatar,
      postCount,
      recentPosts: posts,
      joinedAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users/:id/posts - Get user's posts
router.get('/:id/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: req.params.id, 
      isActive: true 
    })
    .populate('author', 'username avatar anonymousMode')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Post.countDocuments({ 
      author: req.params.id, 
      isActive: true 
    });

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + posts.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// POST /api/users/update-last-seen - Update last seen timestamp
router.post('/update-last-seen', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      await user.updateLastSeen();
    }
    res.json({ message: 'Last seen updated' });
  } catch (error) {
    console.error('Error updating last seen:', error);
    res.status(500).json({ error: 'Failed to update last seen' });
  }
});

// POST /api/users/:userId/follow - Follow a user
router.post('/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Can't follow yourself
    if (userId === currentUserId) {
      return res.status(400).json({ 
        success: false,
        error: 'Cannot follow yourself' 
      });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Already following this user' 
      });
    }

    // Add to following/followers arrays
    currentUser.following.push(userId);
    targetUser.followers.push(currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    // Create notification for the followed user
    const Notification = require('../models/Notification');
    const notification = new Notification({
      recipient: userId,
      sender: currentUserId,
      type: 'new_follower',
      message: `${currentUser.username} started following you`
    });
    await notification.save();

    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Emit to the followed user
      io.to(userId.toString()).emit('follow', {
        targetUserId: userId,
        followerId: currentUserId,
        followerUsername: currentUser.username,
        followerCount: targetUser.followerCount
      });
      
      // Emit to the follower
      io.to(currentUserId.toString()).emit('follow', {
        targetUserId: userId,
        followerId: currentUserId,
        followingCount: currentUser.followingCount
      });
    }

    res.json({
      success: true,
      message: 'Successfully followed user',
      data: {
        followerCount: targetUser.followerCount,
        followingCount: currentUser.followingCount
      }
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to follow user' 
    });
  }
});

// DELETE /api/users/:userId/follow - Unfollow a user
router.delete('/:userId/follow', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(userId)
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    // Check if currently following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Not following this user' 
      });
    }

    // Remove from following/followers arrays
    currentUser.following.pull(userId);
    targetUser.followers.pull(currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Emit to the unfollowed user
      io.to(userId.toString()).emit('unfollow', {
        targetUserId: userId,
        followerId: currentUserId,
        followerUsername: currentUser.username,
        followerCount: targetUser.followerCount
      });
      
      // Emit to the unfollower
      io.to(currentUserId.toString()).emit('unfollow', {
        targetUserId: userId,
        followerId: currentUserId,
        followingCount: currentUser.followingCount
      });
    }

    res.json({
      success: true,
      message: 'Successfully unfollowed user',
      data: {
        followerCount: targetUser.followerCount,
        followingCount: currentUser.followingCount
      }
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to unfollow user' 
    });
  }
});

// GET /api/users/:userId/is-following - Check if current user follows target user
router.get('/:userId/is-following', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ 
        success: false,
        error: 'Current user not found' 
      });
    }

    const isFollowing = currentUser.following.includes(userId);

    res.json({
      success: true,
      data: { isFollowing }
    });

  } catch (error) {
    console.error('Check following status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check following status' 
    });
  }
});

// GET /api/users/:userId/followers - Get user's followers
router.get('/:userId/followers', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'followers',
        select: 'username avatar anonymousMode',
        options: { skip, limit: parseInt(limit) }
      });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    const total = await User.findById(userId).then(u => u.followers.length);

    res.json({
      success: true,
      data: {
        followers: user.followers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch followers' 
    });
  }
});

// GET /api/users/:userId/following - Get user's following
router.get('/:userId/following', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username avatar anonymousMode',
        options: { skip, limit: parseInt(limit) }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const total = await User.findById(userId).then(u => u.following.length);

    res.json({
      success: true,
      data: {
        following: user.following,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch following'
    });
  }
});

// POST /api/users/push-token - Register push token
router.post('/push-token', auth, async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body;

    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Token and platform are required'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove existing token for this device/platform combination
    user.pushTokens = user.pushTokens.filter(
      t => !(t.platform === platform && (deviceId ? t.deviceId === deviceId : true))
    );

    // Add new token
    user.pushTokens.push({
      token,
      platform,
      deviceId: deviceId || null
    });

    await user.save();

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });

  } catch (error) {
    console.error('Register push token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register push token'
    });
  }
});

// DELETE /api/users/push-token - Remove push token
router.delete('/push-token', auth, async (req, res) => {
  try {
    const { token, platform, deviceId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Remove token
    if (token) {
      user.pushTokens = user.pushTokens.filter(t => t.token !== token);
    } else if (platform && deviceId) {
      user.pushTokens = user.pushTokens.filter(
        t => !(t.platform === platform && t.deviceId === deviceId)
      );
    } else if (platform) {
      user.pushTokens = user.pushTokens.filter(t => t.platform !== platform);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Push token removed successfully'
    });

  } catch (error) {
    console.error('Remove push token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove push token'
    });
  }
});

module.exports = router;



