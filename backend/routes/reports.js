const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Submit a new report
router.post('/', auth, async (req, res) => {
  try {
    const { postId, category, description } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!postId || !category) {
      return res.status(400).json({
        success: false,
        error: 'Post ID and category are required'
      });
    }

    // Check if post exists
    const post = await Post.findById(postId).populate('author', 'username displayName');
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if user already reported this post
    const existingReport = await Report.findOne({
      reportedPost: postId,
      reporter: reporterId
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this post'
      });
    }

    // Create new report
    const report = new Report({
      reporter: reporterId,
      reportedPost: postId,
      reportedUser: post.author._id,
      category,
      description: description || ''
    });

    await report.save();

    // Populate the report for response
    await report.populate([
      { path: 'reporter', select: 'username displayName' },
      { path: 'reportedPost', select: 'text mediaUrl createdAt' },
      { path: 'reportedUser', select: 'username displayName' }
    ]);

    console.log(`📋 New report submitted: ${category} for post ${postId} by user ${reporterId}`);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });

  } catch (error) {
    console.error('Report submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit report'
    });
  }
});

// Get reports for moderation (admin only)
router.get('/moderation', auth, async (req, res) => {
  try {
    // Check if user is admin (you can implement admin check based on your user model)
    // For now, we'll allow any authenticated user to view reports
    
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    
    const reports = await Report.find({ status })
      .populate('reporter', 'username displayName')
      .populate('reportedPost', 'text mediaUrl createdAt')
      .populate('reportedUser', 'username displayName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments({ status });

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
});

// Update report status (admin only)
router.put('/:reportId/status', auth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, moderatorNotes } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    report.status = status;
    if (moderatorNotes) {
      report.moderatorNotes = moderatorNotes;
    }
    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
    }

    await report.save();

    res.json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });

  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update report status'
    });
  }
});

// Get user's reported posts (to hide them from feed)
router.get('/user-reported', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const reports = await Report.find({ 
      reporter: userId,
      status: { $in: ['pending', 'reviewed'] }
    }).select('reportedPost');

    const reportedPostIds = reports.map(report => report.reportedPost);

    res.json({
      success: true,
      data: {
        reportedPostIds
      }
    });

  } catch (error) {
    console.error('Get user reported posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reported posts'
    });
  }
});

module.exports = router;
