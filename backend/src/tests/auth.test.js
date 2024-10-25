const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User.Model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Mock the email service
jest.mock('sib-api-v3-sdk', () => ({
  SendSmtpEmail: jest.fn()
}));

jest.mock('../config/brevoConfig', () => ({
  sendTransacEmail: jest.fn().mockResolvedValue(true)
}));

describe('Auth Controller Tests', () => {
  let mongoServer;
  let testUser;
  let verifiedUser;
  let authToken;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Mock JWT secrets if not in environment
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret';

    // Create test users
    testUser = await User.create({
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      avatarSeed: 'seed1',
      isVerified: false,
      verificationCode: '123456',
      verificationCodeExpires: new Date(Date.now() + 3600000)
    });

    verifiedUser = await User.create({
      username: 'verifieduser',
      email: 'verified@test.com',
      password: 'password123',
      avatarSeed: 'seed2',
      isVerified: true
    });

    // Mock rate limiter middleware
    app.use((req, res, next) => {
      req.rateLimit = {
        current: 0,
        resetKey: jest.fn()
      };
      next();
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Registration', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          username: 'newuser',
          email: 'new@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should not allow duplicate email/username', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          username: 'testuser',
          email: 'test@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('Login', () => {
    it('should successfully login verified users', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'verified@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      
      // Save the token for later tests
      authToken = response.body.data.token;
    });

    it('should not allow login with incorrect credentials', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'verified@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('fail');
    });

    it('should not allow unverified users to login', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.requiresVerification).toBe(true);
    });
  });

  describe('Email Verification', () => {
    it('should verify email with valid code', async () => {
      const response = await request(app)
        .post('/api/v1/users/verify-email')
        .send({
          code: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should reject invalid verification codes', async () => {
      const response = await request(app)
        .post('/api/v1/users/verify-email')
        .send({
          code: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
    });
  });

  describe('Password Reset', () => {
    it('should send reset password email', async () => {
      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send({
          email: 'verified@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should reset password with valid token', async () => {
      // 1. Request password reset
      await request(app)
        .post('/api/v1/users/forgot-password')
        .send({
          email: 'verified@test.com'
        });

      // 2. Get user and manually set reset token
      const user = await User.findOne({ email: 'verified@test.com' });
      const plainToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save({ validateBeforeSave: false });

      // 3. Reset password
      const response = await request(app)
        .patch(`/api/v1/users/reset-password/${plainToken}`)
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // 4. Verify new password works
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'verified@test.com',
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(200);
    });
  });

  describe('Logout', () => {
    beforeEach(async () => {
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'verified@test.com',
          password: 'newpassword123'
        });

      authToken = loginResponse.body.data.token;
      
      if (!authToken && loginResponse.headers['set-cookie']) {
        const accessTokenCookie = loginResponse.headers['set-cookie']
          .find(cookie => cookie.includes('accessToken'));
        if (accessTokenCookie) {
          authToken = accessTokenCookie.split(';')[0].split('=')[1];
        }
      }
    });

    it('should successfully logout user', async () => {
      // First verify we have a valid token
      expect(authToken).toBeDefined();

      const response = await request(app)
        .post('/api/v1/users/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
});
