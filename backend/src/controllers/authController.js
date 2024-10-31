const User = require('../models/User.Model');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const validator = require('validator');
const crypto = require('crypto');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const apiInstance = require('../config/brevoConfig');
const { generateVerificationEmailHTML, generatePasswordResetEmailHTML } = require('../utils/emailTemplates');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '60m'  // 60 minutes
  });
};

const signRefreshToken = id => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d'  // 30 days
  });
};

const generateVerificationCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Update the email normalization in register, login, and forgotPassword functions
const normalizeEmail = (email) => {
  email = email.toLowerCase().trim();
  if (email.endsWith('@gmail.com')) {
    // Only remove dots before the @gmail.com, not in @gmail.com itself
    const [localPart] = email.split('@');
    return `${localPart.replace(/\./g, '')}@gmail.com`;
  }
  return email;
};

// Add this configuration before your routes
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Add this function at the top with your other utility functions
const generateUniqueUsername = async (baseName) => {
  // Remove spaces and special characters, convert to lowercase
  let username = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  let isUnique = false;
  let counter = 0;
  let finalUsername = username;

  // Keep trying until we find a unique username
  while (!isUnique) {
    // If this isn't our first try, add a number to the end
    if (counter > 0) {
      finalUsername = `${username}${counter}`;
    }

    // Check if this username exists
    const existingUser = await User.findOne({ username: finalUsername });
    
    if (!existingUser) {
      isUnique = true;
    } else {
      counter++;
    }

    // Prevent infinite loops
    if (counter > 1000) {
      throw new Error('Unable to generate unique username');
    }
  }

  return finalUsername;
};

// Update the Google Strategy configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    try {
      // Check if user exists
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Generate a unique username from their Google display name
        const username = await generateUniqueUsername(profile.displayName);
        
        // Create new user
        user = await User.create({
          username: username,
          email: profile.emails[0].value,
          password: crypto.randomBytes(16).toString('hex'),
          isVerified: true,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || null
        });
      } else if (!user.googleId) {
        // If user exists but hasn't linked Google
        user.googleId = profile.id;
        if (!user.avatar && profile.photos?.[0]?.value) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('Google auth error:', error);
      return done(error);
    }
  }
));

// Add this helper function at the top of your file with other utility functions
const createSendToken = (user, statusCode, res) => {
  // Create tokens
  const accessToken = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };

  // Set cookies
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 1000 // 1 hour
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Remove password from output
  user.password = undefined;

  // Send response
  res.status(statusCode).json({
    status: 'success',
    data: {
      user
    }
  });
};

exports.register = catchAsync(async (req, res, next) => {
  let { username, email, password } = req.body;

  // Use the updated normalizeEmail function
  email = normalizeEmail(email);

  // Sanitize inputs
  username = validator.trim(username);

  if (!username || !email || !password) {
    return next(new AppError('Please provide username, email and password', 400));
  }

  // Validate inputs
  if (!validator.isAlphanumeric(username)) {
    return next(new AppError('Username must contain only letters and numbers', 400));
  }

  if (!validator.isEmail(email)) {
    return next(new AppError('Invalid email address', 400));
  }

  if (!validator.isLength(password, { min: 8 })) {
    return next(new AppError('Password must be at least 8 characters long', 400));
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(new AppError('User with this email or username already exists', 400));
    }

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const newUser = await User.create({
      username,
      email,
      password,
      verificationCode,
      verificationCodeExpires,
      isVerified: false
    });

    const emailSent = await sendVerificationEmail(newUser);
    if (!emailSent) {
      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully, but there was an issue sending the verification email. Please use the resend option.',
        data: { user: newUser, requiresVerification: true, emailSendingFailed: true }
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully. Please check your email for the verification code.',
      data: { user: newUser, requiresVerification: true }
    });
  } catch (error) {
    return next(new AppError('Error during registration', 500));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Find user with password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(404).json({
      status: 'error',
      message: 'Invalid email or password',
      attemptsLeft: req.rateLimit?.remaining || 5
    });
  }

  // 2. Check password
  const isCorrect = await user.correctPassword(password, user.password);
  
  if (!isCorrect) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid password',
      attemptsLeft: req.rateLimit?.remaining || 5
    });
  }

  // 3. Check if email is verified
  if (!user.isVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'Please verify your email before logging in',
      requiresVerification: true
    });
  }

  // 4. If everything ok, create and send token
  createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res) => {
  res.cookie('accessToken', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.cookie('refreshToken', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ status: 'success' });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  try {
    let { email } = req.body;

    // Use the updated normalizeEmail function
    email = normalizeEmail(email);

    console.log('Searching for email:', email);

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email address.'
      });
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Create reset URL
      const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      // Send email
      await sendPasswordResetEmail(user, resetURL);

      res.status(200).json({
        status: 'success',
        message: 'Password reset instructions sent to your email.'
      });
    } catch (err) {
      // If email fails, clean up the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Error sending reset email:', err);

      return res.status(500).json({
        status: 'error',
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    return next(new AppError('Error during password reset request', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  try {
    // Add debug logs
    console.log('Reset password request body:', req.body);
    console.log('Reset password token:', req.params.token);

    // Validate password from request body
    const { password, confirmPassword } = req.body; // Also get confirmPassword if you're using it
    
    console.log('Password received:', password);
    console.log('Confirm password received:', confirmPassword);

    if (!password) {
      return next(new AppError('Please provide a new password', 400));
    }

    if (!validator.isLength(password, { min: 8 })) {
      return next(new AppError('Password must be at least 8 characters long', 400));
    }

    // Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Save with validation
    await user.save();

    // Log the user in
    const accessToken = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return next(new AppError('Error resetting password', 500));
  }
});

exports.verifyEmail = async (req, res) => {
  const { code } = req.body;
  console.log(`[verifyEmail] Attempting to verify email with code: ${code}`);

  try {
    const user = await User.findOne({
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log(`[verifyEmail] No user found with valid verification code: ${code}`);
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired verification code'
      });
    }

    console.log(`[verifyEmail] User found: ${user.email}`);

    if (user.isVerified) {
      console.log(`[verifyEmail] User ${user.email} is already verified`);
      return res.status(200).json({
        status: 'success',
        message: 'Email is already verified',
        alreadyVerified: true
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    console.log(`[verifyEmail] User ${user.email} has been successfully verified`);

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error(`[verifyEmail] Error during email verification:`, error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during email verification'
    });
  }
};

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return next(new AppError('New password and confirm password do not match', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully'
  });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  console.log('📥 Refresh token request received')
  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    console.log('❌ No refresh token in cookies')
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return next(new AppError('No refresh token provided', 401))
  }

  try {
    console.log('🔍 Verifying refresh token')
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    
    console.log('🔍 Finding user:', decoded.id)
    const user = await User.findById(decoded.id)

    if (!user) {
      console.log('❌ User not found')
      res.clearCookie('accessToken')
      res.clearCookie('refreshToken')
      return next(new AppError('User not found', 401))
    }

    console.log('✅ Generating new tokens')
    const newAccessToken = signToken(user._id)
    const newRefreshToken = signRefreshToken(user._id)

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 1000  // 30 seconds for testing
    })

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    console.log('✅ Tokens set in cookies')
    res.status(200).json({
      status: 'success'
    })
  } catch (error) {
    console.log('❌ Error in refresh token:', error.message)
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return next(new AppError('Invalid refresh token', 401))
  }
})

exports.checkAuth = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
  });
});

const sendVerificationEmail = async (user) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  // Add input validation
  if (!user.email || !user.username || !user.verificationCode) {
    console.error('Missing required user data for verification email');
    return false;
  }

  sendSmtpEmail.to = [{ email: user.email, name: user.username }];
  sendSmtpEmail.subject = "Verify Your SaverSonic Account";
  sendSmtpEmail.htmlContent = generateVerificationEmailHTML(user.username, user.verificationCode);
  sendSmtpEmail.sender = { 
    name: "SaverSonic", // Simplified sender name
    email: process.env.SENDER_EMAIL || "ishay@saversonic.com" // Make sender email configurable
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Verification email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', {
      error: error.message,
      responseData: error.response?.data,
      userEmail: user.email
    });
    return false;
  }
};

const sendPasswordResetEmail = async (user, resetURL) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  // Add input validation
  if (!user.email || !user.username || !resetURL) {
    console.error('Missing required data for password reset email');
    return false;
  }

  sendSmtpEmail.to = [{ email: user.email, name: user.username }];
  sendSmtpEmail.subject = "Reset Your SaverSonic Password";
  sendSmtpEmail.htmlContent = generatePasswordResetEmailHTML(user.username, resetURL);
  sendSmtpEmail.sender = { 
    name: "SaverSonic", 
    email: process.env.SENDER_EMAIL || "ishay@saversonic.com"
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Password reset email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', {
      error: error.message,
      responseData: error.response?.data,
      userEmail: user.email
    });
    return false;
  }
};

// Add this new function to the exports object

exports.checkEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return next(new AppError('Please provide a valid email address', 400));
  }

  const user = await User.findOne({ email });

  res.status(200).json({
    status: 'success',
    exists: !!user
  });
});

exports.resendVerificationEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  console.log(`[resendVerificationEmail] Attempt for email: ${email}`);

  if (!email || !validator.isEmail(email)) {
    console.log(`[resendVerificationEmail] Invalid email format: ${email}`);
    return next(new AppError('Please provide a valid email address', 400));
  }

  const user = await User.findOne({ email });

  // Always return a success message, regardless of whether the user exists or is verified
  if (!user || user.isVerified) {
    console.log(`[resendVerificationEmail] No action taken for: ${email}`);
    return res.status(200).json({
      status: 'success',
      message: 'If a verified account exists for this email, no action is needed. Otherwise, please check your email for verification instructions.'
    });
  }

  const verificationCode = generateVerificationCode();
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  await user.save();

  console.log(`[resendVerificationEmail] New verification code generated for ${email}`);

  const emailSent = await sendVerificationEmail(user);

  if (!emailSent) {
    console.error(`[resendVerificationEmail] Failed to send email to ${email}`);
    // Don't disclose that the email exists in the system
    return next(new AppError('An error occurred. Please try again later.', 500));
  }

  console.log(`[resendVerificationEmail] Verification email sent to ${email}`);

  res.status(200).json({
    status: 'success',
    message: 'If your email is registered and not verified, a new verification email has been sent. Please check your inbox.'
  });
});

exports.checkVerificationStatus = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  console.log(`[checkVerificationStatus] Checking verification status for email: ${email}`);

  if (!email || !validator.isEmail(email)) {
    console.log(`[checkVerificationStatus] Invalid email provided: ${email}`);
    return next(new AppError('Please provide a valid email address', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    console.log(`[checkVerificationStatus] No user found for email: ${email}`);
    return next(new AppError('No user found with this email address', 404));
  }

  console.log(`[checkVerificationStatus] User found. Verification status: ${user.isVerified}`);
  res.status(200).json({
    status: 'success',
    isVerified: user.isVerified
  });
});

// Update the googleCallback controller
exports.googleCallback = catchAsync(async (req, res, next) => {
  try {
    const user = req.user; // Passport adds the user to req
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }

    const accessToken = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-site redirects
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-site redirects
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
});

module.exports = exports;
