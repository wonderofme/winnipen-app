const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Report = require('../models/Report');
const auth = require('../middleware/auth');

// GET /api/posts - Get all posts (with pagination and filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      latitude, 
      longitude, 
      maxDistance = 1000,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isActive: true };

    // If coordinates provided, find nearby posts using simple distance calculation
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const distance = parseInt(maxDistance);
      
      // Convert distance from meters to degrees (rough approximation)
      const latDelta = distance / 111000; // 1 degree ≈ 111km
      const lngDelta = distance / (111000 * Math.cos(lat * Math.PI / 180));
      
      // Use simple bounding box for now (can be optimized later)
      query['coordinates.latitude'] = {
        $gte: lat - latDelta,
        $lte: lat + latDelta
      };
      query['coordinates.longitude'] = {
        $gte: lng - lngDelta,
        $lte: lng + lngDelta
      };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // If user is authenticated, filter out posts they've reported
    let reportedPostIds = [];
    if (req.user && req.user.id) {
      const userReports = await Report.find({
        reporter: req.user.id,
        status: { $in: ['pending', 'reviewed'] }
      }).select('reportedPost');
      reportedPostIds = userReports.map(report => report.reportedPost);
    }

    // Add reported posts filter to query
    if (reportedPostIds.length > 0) {
      query._id = { $nin: reportedPostIds };
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar anonymousMode')
      .populate('comments')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    // Create response objects with explicit counts
    const postsWithCounts = posts.map(post => ({
      _id: post._id,
      text: post.text,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      coordinates: post.coordinates,
      author: post.author,
      likes: post.likes,
      comments: post.comments,
      isActive: post.isActive,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likeCount: post.likes.length,
      commentCount: post.comments.length
    }));

    res.json({
      posts: postsWithCounts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + posts.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:id - Get single post with comments
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar anonymousMode')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username avatar anonymousMode'
        }
      });

    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    await post.incrementView();

    // Create response object with explicit counts
    const postData = {
      _id: post._id,
      text: post.text,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      coordinates: post.coordinates,
      author: post.author,
      likes: post.likes,
      comments: post.comments,
      isActive: post.isActive,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likeCount: post.likes.length,
      commentCount: post.comments.length
    };

    res.json(postData);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts - Create new post
router.post('/', auth, async (req, res) => {
  try {
    const { text, mediaUrl, mediaType, coordinates } = req.body;

    if (!text || !coordinates) {
      return res.status(400).json({ 
        error: 'Text and coordinates are required' 
      });
    }

    // Validate coordinates are within Winnipeg area (rough bounds)
    const { latitude, longitude } = coordinates;
    if (latitude < 49.7 || latitude > 50.1 || longitude < -97.4 || longitude > -96.8) {
      return res.status(400).json({ 
        error: 'Coordinates must be within Winnipeg area' 
      });
    }

    const post = new Post({
      text,
      mediaUrl,
      mediaType: mediaUrl ? mediaType : null, // Only set mediaType if there's media
      coordinates,
      author: req.user.id
    });

    await post.save();
    await post.populate('author', 'username avatar anonymousMode');

    // Create notifications for followers
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const pushNotificationService = require('../services/pushNotificationService');
    
    const author = await User.findById(req.user.id);
    if (author && author.followers.length > 0) {
      // Get followers with their push tokens
      const followers = await User.find({
        _id: { $in: author.followers }
      }).select('pushTokens');

      // Create notifications for all followers
      const notifications = author.followers.map(followerId => ({
        recipient: followerId,
        sender: req.user.id,
        type: 'new_post',
        post: post._id,
        message: `${author.username} posted something new`
      }));

      await Notification.insertMany(notifications);

      // Send push notifications to followers
      try {
        await pushNotificationService.sendNewPostNotification(
          followers,
          author.username,
          post._id
        );
      } catch (error) {
        console.error('Error sending push notifications:', error);
        // Don't fail the post creation if push notifications fail
      }

      // Emit notification events to followers
      const io = req.app.get('io');
      author.followers.forEach(followerId => {
        io.to(followerId.toString()).emit('new_notification', {
          type: 'new_post',
          message: `${author.username} posted something new`,
          postId: post._id
        });
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('post:new', post);

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id/like - Like/unlike a post
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = post.likes.find(
      like => like.user.toString() === req.user.id
    );

    if (existingLike) {
      await post.removeLike(req.user.id);
    } else {
      await post.addLike(req.user.id);
    }

    await post.populate('author', 'username avatar anonymousMode');
    
    // Create response object with explicit likeCount
    const postData = {
      _id: post._id,
      text: post.text,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      coordinates: post.coordinates,
      author: post.author,
      likes: post.likes,
      comments: post.comments,
      isActive: post.isActive,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likeCount: post.likes.length,
      commentCount: post.comments.length
    };
    
    console.log('📊 Post like response - likeCount:', postData.likeCount, 'likes array length:', post.likes.length);
    
    res.json(postData);
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /api/posts/:id/report - Report a post
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already reported this post
    const existingReport = post.reports.find(
      report => report.reporter.toString() === req.user.id
    );

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this post' });
    }

    await post.addReport(req.user.id, reason, description);
    res.json({ message: 'Post reported successfully' });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
});

// DELETE /api/posts/:id - Delete own post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('post:deleted', post._id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
