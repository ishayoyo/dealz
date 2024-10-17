const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  profilePicture: String,
  bio: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  verificationCodeExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showActivity: { type: Boolean, default: true }
    }
  },
  socialProfiles: {
    facebook: String,
    twitter: String,
    instagram: String
  },
  reputation: { type: Number, default: 0 },
  badges: [String],
  favoriteCategories: [String],
  favoriteStores: [String],
  location: {
    country: String,
    city: String
  },
  boughtDeals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }],
  followedDeals: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Deal'
  }],
  savedDeals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }],
  postedDeals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deal' }],
  collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
  favoritePriceRanges: [String],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  avatarSeed: {
    type: String,
    default: () => Math.random().toString(36).substring(2, 15) // Generate a random seed by default
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add this index for efficient user search
userSchema.index({ username: 'text', email: 'text' });

// Remove the Follow model references and add methods to get counts
userSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

userSchema.virtual('dealsCount', {
  ref: 'Deal',
  localField: '_id',
  foreignField: 'user',
  count: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add methods to check if a user is following another user
userSchema.methods.isFollowing = function(userId) {
  return this.following ? this.following.includes(userId) : false;
};

userSchema.methods.isFollowedBy = function(userId) {
  return this.followers ? this.followers.includes(userId) : false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
