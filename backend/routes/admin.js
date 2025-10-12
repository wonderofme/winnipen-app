const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Admin middleware (you would implement proper admin role checking)
const isAdmin = async (req, res, next) => {
  try {
    // For now, we'll check if user email contains 'admin'
    // In production, you'd have a proper role system
    if (!req.user.email.includes('admin')) {
      return next(new AppError('Access denied. Admin privileges required.', 403));
    }
    next();
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/stats - Get admin dashboard stats
router.get('/stats', auth, isAdmin, async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      reportedPosts,
      reportedComments,
      activeUsers
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Post.countDocuments({ isActive: true }),
      Comment.countDocuments({ isActive: true }),
      Post.countDocuments({ 'reports.0': { $exists: true } }),
      Comment.countDocuments({ 'reports.0': { $exists: true } }),
      User.countDocuments({ 
        isActive: true, 
        lastSeen: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      })
    ]);

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers
      },
      posts: {
        total: totalPosts,
        reported: reportedPosts
      },
      comments: {
        total: totalComments,
        reported: reportedComments
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reports - Get all reported content
router.get('/reports', auth, isAdmin, async (req, res, next) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (type === 'posts') {
      query = { 'reports.0': { $exists: true } };
    } else if (type === 'comments') {
      query = { 'reports.0': { $exists: true } };
    }

    const [posts, comments] = await Promise.all([
      Post.find({ 'reports.0': { $exists: true } })
        .populate('author', 'username email')
        .populate('reports.reporter', 'username email')
        .sort({ 'reports.timestamp': -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Comment.find({ 'reports.0': { $exists: true } })
        .populate('author', 'username email')
        .populate('reports.reporter', 'username email')
        .sort({ 'reports.timestamp': -1 })
        .skip(skip)
        .limit(parseInt(limit))
    ]);

    res.json({
      posts: posts.map(post => ({
        id: post._id,
        type: 'post',
        content: post.text,
        author: post.author,
        reports: post.reports,
        createdAt: post.createdAt
      })),
      comments: comments.map(comment => ({
        id: comment._id,
        type: 'comment',
        content: comment.text,
        author: comment.author,
        reports: comment.reports,
        createdAt: comment.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/posts/:id - Delete a post (admin only)
router.delete('/posts/:id', auth, isAdmin, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return next(new AppError('Post not found', 404));
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    logger.info(`Admin ${req.user.email} deleted post ${req.params.id}`);

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('post:deleted', post._id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/comments/:id - Delete a comment (admin only)
router.delete('/comments/:id', auth, isAdmin, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return next(new AppError('Comment not found', 404));
    }

    // Soft delete
    comment.isActive = false;
    await comment.save();

    logger.info(`Admin ${req.user.email} deleted comment ${req.params.id}`);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/ban - Ban a user (admin only)
router.put('/users/:id/ban', auth, isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.isActive = false;
    await user.save();

    logger.info(`Admin ${req.user.email} banned user ${req.params.id}`);

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/unban - Unban a user (admin only)
router.put('/users/:id/unban', auth, isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.isActive = true;
    await user.save();

    logger.info(`Admin ${req.user.email} unbanned user ${req.params.id}`);

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - Get all users (admin only)
router.get('/users', auth, isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-firebaseUid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + users.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;





