const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  mediaUrl: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['image', null],
    default: null
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  reports: [{
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'other'],
      required: true
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
// postSchema.index({ coordinates: '2dsphere' }); // Geospatial index - removed due to coordinate structure
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'likes.user': 1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return (this.likes && Array.isArray(this.likes)) ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return (this.comments && Array.isArray(this.comments)) ? this.comments.length : 0;
});

// Method to add like
postSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to increment view count
postSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to add report
postSchema.methods.addReport = function(reporterId, reason, description = '') {
  this.reports.push({
    reporter: reporterId,
    reason,
    description
  });
  return this.save();
};

// Static method to find posts near coordinates (using bounding box instead of geospatial)
postSchema.statics.findNearby = function(latitude, longitude, maxDistance = 1000) {
  // Convert distance from meters to degrees (rough approximation)
  const latDelta = maxDistance / 111000; // 1 degree ≈ 111km
  const lngDelta = maxDistance / (111000 * Math.cos(latitude * Math.PI / 180));
  
  return this.find({
    'coordinates.latitude': {
      $gte: latitude - latDelta,
      $lte: latitude + latDelta
    },
    'coordinates.longitude': {
      $gte: longitude - lngDelta,
      $lte: longitude + lngDelta
    },
    isActive: true
  }).populate('author', 'username avatar anonymousMode').sort({ createdAt: -1 });
};

module.exports = mongoose.model('Post', postSchema);
