const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User.Model');
const NotificationService = require('../services/NotificationService');

// Mock the NotificationService and socket.io
jest.mock('../services/NotificationService', () => {
  return jest.fn().mockImplementation(() => ({
    createFollowNotification: jest.fn().mockResolvedValue({}),
    getUnreadNotifications: jest.fn().mockResolvedValue([]),
    markAsRead: jest.fn().mockResolvedValue({})
  }));
});

jest.mock('socket.io', () => {
  return function() {
    return {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
  };
});

describe('Social Controller Tests', () => {
  let mongoServer;
  let testUser1;
  let testUser2;
  let authToken;

  // Setup before tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    testUser1 = await User.create({
      username: 'testuser1',
      email: 'test1@test.com',
      password: 'password123',
      avatarSeed: 'seed1',
      isVerified: true,
      following: [],
      followers: []
    });

    testUser2 = await User.create({
      username: 'testuser2',
      email: 'test2@test.com',
      password: 'password123',
      avatarSeed: 'seed2',
      isVerified: true,
      following: [],
      followers: []
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser1._id },
      process.env.JWT_SECRET || 'test-jwt-secret'
    );

    // Mock socket.io
    const ioMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
    app.set('io', ioMock);
  });

  // Cleanup after each test
  afterEach(async () => {
    // Reset users' following/followers arrays
    await User.updateMany({}, { $set: { following: [], followers: [] } });
  });

  // Cleanup after all tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Follow User', () => {
    it('should successfully follow a user', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${testUser2._id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      // Add detailed error logging
      console.log('Follow Response:', {
        status: response.status,
        body: response.body,
        error: response.error?.text || response.error
      });

      // Check users before the operation
      const beforeUser1 = await User.findById(testUser1._id);
      const beforeUser2 = await User.findById(testUser2._id);
      console.log('Before Follow - User1:', {
        id: beforeUser1._id,
        following: beforeUser1.following
      });
      console.log('Before Follow - User2:', {
        id: beforeUser2._id,
        followers: beforeUser2.followers
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.isFollowing).toBe(true);

      // Verify database state
      const afterUser1 = await User.findById(testUser1._id);
      const afterUser2 = await User.findById(testUser2._id);
      console.log('After Follow - User1:', afterUser1);
      console.log('After Follow - User2:', afterUser2);

      expect(afterUser1.following.map(id => id.toString()))
        .toContain(testUser2._id.toString());
      expect(afterUser2.followers.map(id => id.toString()))
        .toContain(testUser1._id.toString());
    });

    it('should not allow following the same user twice', async () => {
      // First follow
      await request(app)
        .post(`/api/v1/users/${testUser2._id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to follow again
      const response = await request(app)
        .post(`/api/v1/users/${testUser2._id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Double Follow Response:', {
        status: response.status,
        body: response.body,
        error: response.error
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You are already following this user');
    });

    it('should not allow following yourself', async () => {
      const response = await request(app)
        .post(`/api/v1/users/${testUser1._id}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You cannot follow yourself');
    });
  });

  describe('Unfollow User', () => {
    it('should successfully unfollow a user', async () => {
      // First follow the user
      const followResponse = await request(app)
        .post(`/api/v1/users/${testUser2._id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Initial Follow Response:', {
        status: followResponse.status,
        body: followResponse.body,
        error: followResponse.error
      });

      // Then unfollow
      const unfollowResponse = await request(app)
        .delete(`/api/v1/users/${testUser2._id}/follow`)
        .set('Authorization', `Bearer ${authToken}`);

      console.log('Unfollow Response:', {
        status: unfollowResponse.status,
        body: unfollowResponse.body,
        error: unfollowResponse.error
      });

      expect(unfollowResponse.status).toBe(200);
      expect(unfollowResponse.body.status).toBe('success');
      expect(unfollowResponse.body.data.isFollowing).toBe(false);

      // Verify database state
      const finalUser1 = await User.findById(testUser1._id);
      const finalUser2 = await User.findById(testUser2._id);
      console.log('Final State - User1:', finalUser1);
      console.log('Final State - User2:', finalUser2);

      expect(finalUser1.following.map(id => id.toString()))
        .not.toContain(testUser2._id.toString());
      expect(finalUser2.followers.map(id => id.toString()))
        .not.toContain(testUser1._id.toString());
    });

    it('should handle unfollowing a user that is not followed', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${testUser2._id}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('You are not following this user');
    });
  });

  describe('Get Followers/Following', () => {
    it('should get user followers', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser2._id}/followers`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.followers)).toBe(true);
    });

    it('should get user following', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser1._id}/following`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.following)).toBe(true);
    });
  });
});
