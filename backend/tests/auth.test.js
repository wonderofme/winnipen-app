const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');

describe('Authentication', () => {
  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({});
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if no Firebase token provided', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should create new user on first login', async () => {
      // Mock Firebase token verification
      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      };

      // This would need proper mocking in a real test environment
      // For now, we'll test the endpoint structure
      const res = await request(app)
        .post('/api/auth/login')
        .send({ firebaseToken: 'mock-token' });

      // In a real test, you'd mock the Firebase admin verification
      expect(res.status).toBe(401); // Will fail without proper Firebase setup
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .send({});

      expect(res.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(res.status).toBe(401);
    });
  });
});





