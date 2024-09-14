const User = require('../models/User.Model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

// Helper function to create JWT token
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password
    });

    // Generate token
    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering new user', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    // If everything ok, send token to client
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

exports.logout = (req, res) => {
  // In a stateless JWT setup, logout is typically handled client-side
  // by removing the token. Here we just send a success response.
  res.status(200).json({ status: 'success' });
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching current user', error: error.message });
  }
};

exports.updateCurrentUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: { user: updatedUser }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Implement other controller methods (getUser, getUserDeals, getUserFollowers, getUserFollowing, followUser, unfollowUser, forgotPassword, resetPassword, verifyEmail) here...

exports.getUser = async (req, res) => {
  try {
    // TODO: Implement getUser logic
    res.status(501).json({ message: 'getUser not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.getUserDeals = async (req, res) => {
  try {
    // TODO: Implement getUserDeals logic
    res.status(501).json({ message: 'getUserDeals not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user deals', error: error.message });
  }
};

exports.getUserFollowers = async (req, res) => {
  try {
    // TODO: Implement getUserFollowers logic
    res.status(501).json({ message: 'getUserFollowers not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user followers', error: error.message });
  }
};

exports.getUserFollowing = async (req, res) => {
  try {
    // TODO: Implement getUserFollowing logic
    res.status(501).json({ message: 'getUserFollowing not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user following', error: error.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    // TODO: Implement followUser logic
    res.status(501).json({ message: 'followUser not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error following user', error: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    // TODO: Implement unfollowUser logic
    res.status(501).json({ message: 'unfollowUser not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error unfollowing user', error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    // TODO: Implement forgotPassword logic
    res.status(501).json({ message: 'forgotPassword not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing forgot password request', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // TODO: Implement resetPassword logic
    res.status(501).json({ message: 'resetPassword not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    // TODO: Implement verifyEmail logic
    res.status(501).json({ message: 'verifyEmail not implemented yet' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error: error.message });
  }
};