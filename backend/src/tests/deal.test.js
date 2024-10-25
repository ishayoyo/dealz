const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Deal = require('../models/Deal.Model');
const User = require('../models/User.Model');
const ImageUpload = require('../models/ImageUpload.Model');
const jwt = require('jsonwebtoken');

describe('Deal Controller Tests', () => {
  let mongoServer;
  let testUser;
  let adminUser;
  let userToken;
  let adminToken;
  let testDeal;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Create test users
    testUser = await User.create({
      username: 'dealuser',
      email: 'deal@test.com',
      password: 'password123',
      isVerified: true
    });

    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    // Generate tokens
    userToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test-jwt-secret',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: adminUser._id },
      process.env.JWT_SECRET || 'test-jwt-secret',
      { expiresIn: '1h' }
    );

    // Create initial image upload
    const initialImage = await ImageUpload.create({
      imageUrl: '/images/test.jpg',
      user: testUser._id,
      filename: 'test.jpg',
      uploadedAt: new Date(),
      used: true
    });

    // Create a test deal
    testDeal = await Deal.create({
      title: 'Test Deal',
      description: 'Test Description',
      price: 99.99,
      listPrice: 199.99,
      category: 'Electronics',
      shipping: 'FREE',
      imageUrl: initialImage.imageUrl,
      url: 'http://test.com',
      user: testUser._id,
      status: 'approved'
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Get Deals', () => {
    it('should get all approved deals', async () => {
      const response = await request(app)
        .get('/api/v1/deals')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.deals)).toBe(true);
    });

    it('should filter deals by category', async () => {
      const response = await request(app)
        .get('/api/v1/deals?category=Electronics')
        .expect(200);

      expect(response.body.data.deals.every(deal => deal.category === 'Electronics')).toBe(true);
    });
  });

  describe('Create Deal', () => {
    it('should create a new deal with valid data', async () => {
      const newDeal = {
        title: 'New Deal',
        description: 'New Description',
        price: 49.99,
        listPrice: 99.99,
        category: 'Electronics',
        shipping: 'FREE',
        imageUrl: '/images/new.jpg',
        url: 'http://newdeal.com'
      };

      const response = await request(app)
        .post('/api/v1/deals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newDeal)
        .expect(201);

      expect(response.body.data.deal).toHaveProperty('title', newDeal.title);
    });

    it('should not create deal without required fields', async () => {
      const invalidDeal = {
        title: 'Invalid Deal'
        // Missing required fields
      };

      await request(app)
        .post('/api/v1/deals')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidDeal)
        .expect(400);
    });
  });

  describe('Get Single Deal', () => {
    it('should get deal by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/deals/${testDeal._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.deal._id).toBe(testDeal._id.toString());
    });

    it('should return 404 for non-existent deal', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/deals/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('Update Deal', () => {
    it('should update deal if user is owner', async () => {
      // Create new image upload for update
      const newImage = await ImageUpload.create({
        imageUrl: '/images/updated.jpg',
        user: testUser._id,
        filename: 'updated.jpg',
        uploadedAt: new Date(),
        used: false
      });

      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
        price: 79.99,
        listPrice: 99.99,
        category: 'Electronics',
        shipping: 'FREE',
        url: 'http://test.com',
        imageUrl: newImage.imageUrl
      };

      const response = await request(app)
        .patch(`/api/v1/deals/${testDeal._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.deal.title).toBe(updates.title);

      // Verify image status updates
      const updatedNewImage = await ImageUpload.findOne({ imageUrl: newImage.imageUrl });
      expect(updatedNewImage.used).toBe(true);
    });

    it('should not allow non-owner to update deal', async () => {
      const anotherUser = await User.create({
        username: 'another',
        email: 'another@test.com',
        password: 'password123',
        isVerified: true
      });

      const anotherToken = jwt.sign(
        { id: anotherUser._id },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1h' }
      );

      const updates = {
        title: 'Unauthorized Update',
        description: 'This should fail',
        price: 79.99,
        listPrice: 99.99,
        category: 'Electronics',
        shipping: 'FREE',
        url: 'http://test.com',
        imageUrl: testDeal.imageUrl
      };

      await request(app)
        .patch(`/api/v1/deals/${testDeal._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send(updates)
        .expect(403);
    });

    it('should handle missing required fields', async () => {
      const incompleteUpdates = {
        title: 'Only Title Update'
      };

      await request(app)
        .patch(`/api/v1/deals/${testDeal._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(incompleteUpdates)
        .expect(400);
    });
  });

  describe('Delete Deal', () => {
    it('should delete deal if user is owner', async () => {
      const dealToDelete = await Deal.create({
        title: 'Delete Me',
        description: 'To be deleted',
        price: 29.99,
        listPrice: 59.99,
        category: 'Electronics',
        shipping: 'FREE',
        imageUrl: '/images/delete.jpg',
        url: 'http://delete.com',
        user: testUser._id,
        status: 'approved'
      });

      await request(app)
        .delete(`/api/v1/deals/${dealToDelete._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });
  });

  describe('Deal Moderation', () => {
    it('should allow admin to approve deal', async () => {
      const pendingDeal = await Deal.create({
        title: 'Pending Deal',
        description: 'Waiting for approval',
        price: 39.99,
        listPrice: 79.99,
        category: 'Electronics',
        shipping: 'FREE',
        imageUrl: '/images/pending.jpg',
        url: 'http://pending.com',
        user: testUser._id,
        status: 'pending'
      });

      const response = await request(app)
        .patch(`/api/v1/deals/${pendingDeal._id}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.data.deal.status).toBe('approved');
    });
  });
});
