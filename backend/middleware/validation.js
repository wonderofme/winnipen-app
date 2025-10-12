const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400));
  }
  next();
};

// Post validation rules
const validateCreatePost = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Text must be between 1 and 500 characters'),
  body('coordinates.latitude')
    .isFloat({ min: 49.7, max: 50.1 })
    .withMessage('Latitude must be within Winnipeg bounds (49.7 to 50.1)'),
  body('coordinates.longitude')
    .isFloat({ min: -97.4, max: -96.8 })
    .withMessage('Longitude must be within Winnipeg bounds (-97.4 to -96.8)'),
  body('mediaUrl')
    .optional()
    .isURL()
    .withMessage('Media URL must be a valid URL'),
  body('mediaType')
    .optional()
    .isIn(['image', 'video'])
    .withMessage('Media type must be either image or video'),
  handleValidationErrors
];

const validatePostId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid post ID format'),
  handleValidationErrors
];

// Comment validation rules
const validateCreateComment = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Text must be between 1 and 300 characters'),
  body('postId')
    .isMongoId()
    .withMessage('Invalid post ID format'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID format'),
  handleValidationErrors
];

const validateCommentId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid comment ID format'),
  handleValidationErrors
];

// User validation rules
const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Username must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('anonymousMode')
    .optional()
    .isBoolean()
    .withMessage('Anonymous mode must be a boolean value'),
  handleValidationErrors
];

// Report validation rules
const validateReport = [
  body('reason')
    .isIn(['spam', 'inappropriate', 'harassment', 'other'])
    .withMessage('Report reason must be one of: spam, inappropriate, harassment, other'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  handleValidationErrors
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'likeCount', 'commentCount'])
    .withMessage('Sort by must be one of: createdAt, likeCount, commentCount'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors
];

const validateLocationQuery = [
  query('latitude')
    .optional()
    .isFloat({ min: 49.7, max: 50.1 })
    .withMessage('Latitude must be within Winnipeg bounds'),
  query('longitude')
    .optional()
    .isFloat({ min: -97.4, max: -96.8 })
    .withMessage('Longitude must be within Winnipeg bounds'),
  query('maxDistance')
    .optional()
    .isInt({ min: 100, max: 10000 })
    .withMessage('Max distance must be between 100 and 10000 meters'),
  handleValidationErrors
];

module.exports = {
  validateCreatePost,
  validatePostId,
  validateCreateComment,
  validateCommentId,
  validateUpdateProfile,
  validateReport,
  validatePagination,
  validateLocationQuery,
  handleValidationErrors
};





