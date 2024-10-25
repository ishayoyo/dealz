const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User.Model');

const PERFORMANCE_BENCHMARKS = {
  BULK_USER_CREATION: 3000,    // 3 seconds for 1000 users
  FOLLOW_OPERATIONS: 5000,     // 5 seconds for 100 follows
  FOLLOWER_LIST_RETRIEVAL: 100, // 100ms for 100 followers
  UNFOLLOW_OPERATIONS: 4000,   // 4 seconds for 100 unfollows
  DB_POOL_QUERIES: 500        // 500ms for 100 queries
};

describe('Social Controller Performance Tests', () => {
  let mongoServer;
  let mainUser;
  let users = [];
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Create main test user
    mainUser = await User.create({
      username: 'mainuser',
      email: 'main@test.com',
      password: 'password123',
      avatarSeed: 'seed1',
      isVerified: true,
      following: [],
      followers: []
    });

    authToken = jwt.sign(
      { id: mainUser._id },
      process.env.JWT_SECRET || 'test-jwt-secret'
    );

    // Mock socket.io
    const ioMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
    app.set('io', ioMock);
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Large Scale Following Operations', () => {
    it('should handle creating 1000 users', async () => {
      const startTime = Date.now();
      
      // Create users in smaller batches to prevent timeout
      for (let i = 0; i < 10; i++) {
        const batch = [];
        for (let j = 0; j < 100; j++) {
          const index = i * 100 + j;
          batch.push({
            username: `testuser${index}`,
            email: `test${index}@test.com`,
            password: 'password123',
            avatarSeed: `seed${index}`,
            isVerified: true,
            following: [],
            followers: []
          });
        }
        const userBatch = await User.insertMany(batch);
        users.push(...userBatch);
        
        // Log progress
        console.log(`Created batch ${i + 1}/10 (${users.length} users total)`);
      }

      const duration = Date.now() - startTime;
      console.log(`Created 1000 users in ${duration}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.BULK_USER_CREATION);
      expect(users.length).toBe(1000);
    }, 120000); // 2 minute timeout

    it('should handle following 100 users quickly', async () => {
      const startTime = Date.now();
      const testUsers = users.slice(0, 100);
      const followPromises = testUsers.map(user => 
        request(app)
          .post(`/api/v1/users/${user._id}/follow`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(followPromises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      const duration = Date.now() - startTime;
      console.log(`Followed 100 users in ${duration}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.FOLLOW_OPERATIONS);
      
      // Verify following count
      const updatedMainUser = await User.findById(mainUser._id);
      expect(updatedMainUser.following.length).toBe(100);
    }, 60000);

    it('should quickly retrieve followers list with 100 followers', async () => {
      // First, make 100 users follow the main user
      const testUsers = users.slice(100, 200);
      
      // Update followers in bulk
      await User.findByIdAndUpdate(mainUser._id, {
        $addToSet: { followers: { $each: testUsers.map(u => u._id) } }
      });

      await User.updateMany(
        { _id: { $in: testUsers.map(u => u._id) } },
        { $addToSet: { following: mainUser._id } }
      );

      const startTime = Date.now();
      const response = await request(app)
        .get(`/api/v1/users/${mainUser._id}/followers`)
        .set('Authorization', `Bearer ${authToken}`);

      const duration = Date.now() - startTime;
      console.log(`Retrieved 100 followers in ${duration}ms`);

      expect(response.status).toBe(200);
      expect(response.body.data.followers.length).toBe(100);
    }, 30000);

    it('should handle unfollowing 100 users efficiently', async () => {
      const startTime = Date.now();
      const testUsers = users.slice(0, 100);
      
      // First ensure the users are followed
      await User.findByIdAndUpdate(mainUser._id, {
        $addToSet: { following: { $each: testUsers.map(u => u._id) } }
      });

      await User.updateMany(
        { _id: { $in: testUsers.map(u => u._id) } },
        { $addToSet: { followers: mainUser._id } }
      );

      // Verify initial following state
      const initialUser = await User.findById(mainUser._id);
      console.log('Initial following count:', initialUser.following.length);

      // Now attempt to unfollow
      const unfollowPromises = testUsers.map(async user => {
        try {
          const response = await request(app)
            .delete(`/api/v1/users/${user._id}/follow`)
            .set('Authorization', `Bearer ${authToken}`);
          
          if (response.status !== 200) {
            console.log('Unfollow failed for user:', user._id, 'Status:', response.status);
            console.log('Response body:', response.body);
          }
          
          return response;
        } catch (error) {
          console.error('Error unfollowing user:', user._id, error);
          throw error;
        }
      });

      const responses = await Promise.all(unfollowPromises);
      
      // Log the first failed response if any
      const failedResponse = responses.find(r => r.status !== 200);
      if (failedResponse) {
        console.log('Failed response details:', {
          status: failedResponse.status,
          body: failedResponse.body
        });
      }

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
      });

      const duration = Date.now() - startTime;
      console.log(`Unfollowed 100 users in ${duration}ms`);

      // Verify final following count
      const updatedMainUser = await User.findById(mainUser._id);
      console.log('Final following count:', updatedMainUser.following.length);
      expect(updatedMainUser.following.length).toBe(0);
    }, 60000);

    // Performance metrics
    it('should log memory usage', () => {
      const used = process.memoryUsage();
      console.log('Memory Usage:');
      for (let key in used) {
        console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }
    });

    it('should handle database connection pool efficiently', async () => {
      const startTime = Date.now();
      const promises = Array(100).fill(null).map(() => 
        User.findById(mainUser._id).select('_id username')
      );
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      console.log(`Processed 100 concurrent DB queries in ${duration}ms`);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.DB_POOL_QUERIES);
    }, 30000);
  });
});
