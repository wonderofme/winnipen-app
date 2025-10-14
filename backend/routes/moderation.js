const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const User = require('../models/User');

// GET /api/moderation/reports - Get all reports (admin only)
router.get('/reports', auth, async (req, res) => {
  try {
    // Check if user is admin (you can implement admin role checking)
    // For now, we'll allow any authenticated user to view reports
    // In production, you should implement proper admin role checking
    
    const reports = await Report.find()
      .populate('reporter', 'username email')
      .populate('reportedPost', 'text mediaUrl author')
      .populate('reportedUser', 'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/moderation/reports/:id/resolve - Resolve a report
router.post('/reports/:id/resolve', auth, async (req, res) => {
  try {
    const { action, notes } = req.body;
    const reportId = req.params.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update report status
    report.status = 'resolved';
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    report.moderatorNotes = notes;

    await report.save();

    // Take action based on the action type
    if (action === 'remove_content') {
      if (report.reportedPost) {
        const post = await Post.findById(report.reportedPost);
        if (post) {
          post.isActive = false;
          await post.save();
        }
      }
    } else if (action === 'warn_user') {
      // You can implement user warning system here
      console.log(`Warning issued to user: ${report.reportedUser}`);
    } else if (action === 'suspend_user') {
      const user = await User.findById(report.reportedUser);
      if (user) {
        user.isSuspended = true;
        user.suspensionReason = notes;
        user.suspendedAt = new Date();
        await user.save();
      }
    }

    res.json({ success: true, message: 'Report resolved successfully' });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

// GET /api/moderation/stats - Get moderation statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    
    const reportsByCategory = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalReports,
        pendingReports,
        resolvedReports,
        reportsByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({ error: 'Failed to fetch moderation statistics' });
  }
});

// POST /api/moderation/content/scan - Scan content for inappropriate material
router.post('/content/scan', auth, async (req, res) => {
  try {
    const { text, type } = req.body; // type: 'post' or 'comment'
    
    // Basic content filtering - you can enhance this with AI/ML services
    const inappropriateWords = [
      'spam', 'scam', 'fake', 'hate', 'violence', 'harassment'
      // Add more inappropriate words/phrases as needed
    ];
    
    const lowerText = text.toLowerCase();
    const flaggedWords = inappropriateWords.filter(word => 
      lowerText.includes(word.toLowerCase())
    );
    
    const isFlagged = flaggedWords.length > 0;
    
    res.json({
      success: true,
      isFlagged,
      flaggedWords,
      confidence: isFlagged ? 0.8 : 0.1 // Basic confidence score
    });
  } catch (error) {
    console.error('Error scanning content:', error);
    res.status(500).json({ error: 'Failed to scan content' });
  }
});

module.exports = router;
