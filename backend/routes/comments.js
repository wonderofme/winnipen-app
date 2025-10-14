const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const pushNotificationService = require('../services/pushNotificationService');
const auth = require('../middleware/auth');

// GET /api/comments/:postId - Get comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const comments = await Comment.getCommentsWithReplies(postId)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({ 
      post: postId, 
      parentComment: null,
      isActive: true 
    });

    // Create response objects with explicit counts
    const commentsWithCounts = comments.map(comment => ({
      _id: comment._id,
      text: comment.text,
      post: comment.post,
      author: comment.author,
      parentComment: comment.parentComment,
      replies: comment.replies,
      likes: comment.likes,
      isActive: comment.isActive,
      reports: comment.reports,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likeCount: comment.likes.length,
      replyCount: comment.replies.length
    }));

    res.json({
      comments: commentsWithCounts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + comments.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/comments - Create new comment
router.post('/', auth, async (req, res) => {
  try {
    const { text, postId, parentCommentId } = req.body;

    if (!text || !postId) {
      return res.status(400).json({ 
        error: 'Text and postId are required' 
      });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = new Comment({
      text,
      post: postId,
      author: req.user.id,
      parentComment: parentCommentId || null
    });

    await comment.save();
    await comment.populate('author', 'username avatar anonymousMode');

    // If this is a reply, add it to parent comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        await parentComment.addReply(comment._id);
      }
    }

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // Create notifications
    try {
      if (parentCommentId) {
        // This is a reply to a comment
        const parentComment = await Comment.findById(parentCommentId).populate('author');
        if (parentComment && parentComment.author._id.toString() !== req.user.id) {
          // Create in-app notification
          await Notification.create({
            recipient: parentComment.author._id,
            sender: req.user.id,
            type: 'comment',
            post: postId,
            comment: comment._id,
            message: `${req.user.username} replied to your comment`
          });
          
          // Send push notification
          if (parentComment.author.pushTokens && parentComment.author.pushTokens.length > 0) {
            await pushNotificationService.sendCommentReplyNotification(
              parentComment.author.pushTokens,
              req.user.username,
              comment._id
            );
          }
        }
      } else {
        // This is a comment on a post
        if (post.author.toString() !== req.user.id) {
          const postAuthor = await User.findById(post.author);
          
          // Create in-app notification
          await Notification.create({
            recipient: post.author,
            sender: req.user.id,
            type: 'comment',
            post: postId,
            comment: comment._id,
            message: `${req.user.username} commented on your post`
          });
          
          // Send push notification
          if (postAuthor.pushTokens && postAuthor.pushTokens.length > 0) {
            await pushNotificationService.sendNewCommentNotification(
              postAuthor.pushTokens,
              req.user.username,
              postId
            );
          }
        }
      }
    } catch (notificationError) {
      // Don't fail comment creation if notification fails
      console.error('Error creating notification:', notificationError);
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('comment:new', comment);

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// PUT /api/comments/:id/like - Like/unlike a comment
router.put('/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment || !comment.isActive) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const existingLike = comment.likes.find(
      like => like.user.toString() === req.user.id
    );

    if (existingLike) {
      await comment.removeLike(req.user.id);
    } else {
      await comment.addLike(req.user.id);
    }

    await comment.populate('author', 'username avatar anonymousMode');
    
    // Create response object with explicit likeCount
    const commentData = {
      _id: comment._id,
      text: comment.text,
      post: comment.post,
      author: comment.author,
      parentComment: comment.parentComment,
      replies: comment.replies,
      likes: comment.likes,
      isActive: comment.isActive,
      reports: comment.reports,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likeCount: comment.likes.length,
      replyCount: comment.replies.length
    };
    
    console.log('📊 Comment like response - likeCount:', commentData.likeCount, 'likes array length:', comment.likes.length);
    
    // Emit real-time update for comment like count changes
    const io = req.app.get('io');
    io.emit('comment:liked', commentData);
    
    res.json(commentData);
  } catch (error) {
    console.error('Error toggling comment like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /api/comments/:id/report - Report a comment
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Report reason is required' });
    }

    const comment = await Comment.findById(req.params.id);
    
    if (!comment || !comment.isActive) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user already reported this comment
    const existingReport = comment.reports.find(
      report => report.reporter.toString() === req.user.id
    );

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this comment' });
    }

    await comment.addReport(req.user.id, reason, description);
    res.json({ message: 'Comment reported successfully' });
  } catch (error) {
    console.error('Error reporting comment:', error);
    res.status(500).json({ error: 'Failed to report comment' });
  }
});

// DELETE /api/comments/:id - Delete own comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Soft delete
    comment.isActive = false;
    await comment.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;


