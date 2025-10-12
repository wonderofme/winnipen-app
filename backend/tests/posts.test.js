const request = require('supertest');
const { app } = require('../server');
const Post = require('../models/Post');
const User = require('../models/User');

describe('Posts API', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    // Clean up test data
    await Post.deleteMany({});
    await User.deleteMany({});

    // Create test user
    testUser = new User({
      firebaseUid: 'test-uid',
      email: 'test@example.com',
      username: 'testuser'
    });
    await testUser.save();

    // Generate test token (in real tests, you'd use proper JWT)
    authToken = 'test-token';
  });

  describe('GET /api/posts', () => {
    it('should return empty array when no posts exist', async () => {
      const res = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(res.body.posts).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should return posts with pagination', async () => {
      // Create test posts
      const posts = Array.from({ length: 5 }, (_, i) => ({
        text: `Test post ${i + 1}`,
        coordinates: { latitude: 49.9, longitude: -97.1 },
        author: testUser._id
      }));

      await Post.insertMany(posts);

      const res = await request(app)
        .get('/api/posts?limit=3')
        .expect(200);

      expect(res.body.posts).toHaveLength(3);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.hasNext).toBe(true);
    });
  });

  describe('POST /api/posts', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          text: 'Test post',
          coordinates: { latitude: 49.9, longitude: -97.1 }
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid coordinates', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Test post',
          coordinates: { latitude: 40.0, longitude: -100.0 } // Outside Winnipeg
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coordinates: { latitude: 49.9, longitude: -97.1 }
          // Missing text
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .get('/api/posts/507f1f77bcf86cd799439011')
        .expect(404);
    });

    it('should return post details', async () => {
      const post = new Post({
        text: 'Test post',
        coordinates: { latitude: 49.9, longitude: -97.1 },
        author: testUser._id
      });
      await post.save();

      const res = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);

      expect(res.body.text).toBe('Test post');
      expect(res.body.viewCount).toBe(1); // Should increment view count
    });
  });
});





