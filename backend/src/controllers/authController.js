const User = require('../models/User.Model');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const validator = require('validator');
const crypto = require('crypto');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const apiInstance = require('../config/brevoConfig');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'  // Access token expires in 15 minutes
  });
};

const signRefreshToken = id => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'  // Refresh token expires in 7 days
  });
};

const generateVerificationCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

exports.register = catchAsync(async (req, res, next) => {
  let { username, email, password } = req.body;

  // Sanitize inputs
  username = validator.trim(username);
  email = validator.normalizeEmail(email);

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
  let { email, password } = req.body;

  email = validator.normalizeEmail(email);

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  if (!validator.isEmail(email)) {
    return next(new AppError('Invalid email address', 400));
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return next(new AppError('Incorrect email or password', 401));
    }

    if (user.isVerified === false) {
      await sendVerificationEmail(user);
      return res.status(403).json({
        status: 'fail',
        message: 'Please verify your email to log in. A new verification code has been sent.',
        requiresVerification: true
      });
    }

    const accessToken = signToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    user.password = undefined;

    res.status(200).json({ 
      status: 'success', 
      data: { user }
    });
  } catch (error) {
    return next(new AppError('Error during login', 500));
  }
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
  // Implement password reset logic here
  res.status(200).json({ status: 'success', message: 'Password reset email sent' });
});

exports.verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired verification code'
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });
  } catch (error) {
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
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return next(new AppError('No refresh token found', 401));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = signToken(decoded.id);

    res.cookie('accessToken', newAccessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return next(new AppError('Invalid refresh token', 401));
  }
});

exports.checkAuth = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
  });
});

const sendVerificationEmail = async (user) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: user.email, name: user.username }];
  sendSmtpEmail.subject = "Verify Your Email";
  sendSmtpEmail.htmlContent = generateVerificationEmailHTML(user.username, user.verificationCode);
  sendSmtpEmail.sender = { name: "Verify Your SaverSonic Account", email: "saversonic.com@gmail.com" };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Verification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

function generateVerificationEmailHTML(username, verificationCode) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your SaverSonic Account</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(to bottom right, #eef2ff, #f5f3ff);
        }
        .container {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        h1 {
          font-family: 'Poppins', sans-serif;
          color: #312e81;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo img {
          max-width: 200px;
        }
        .verification-code {
          font-size: 32px;
          font-weight: bold;
          color: #ffffff;
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          padding: 10px 20px;
          border-radius: 9999px;
          display: inline-block;
          margin: 20px 0;
        }
        .btn {
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 9999px;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          color: #ffffff;
        }
        .btn-primary:hover {
          background: linear-gradient(to right, #4f46e5, #7c3aed);
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="https://saversonic.com/images/logo.png" alt="SaverSonic Logo">
        </div>
        <h1>Welcome to SaverSonic, ${username}!</h1>
        <p>Thank you for joining our social shopping community. We're excited to have you on board!</p>
        <p>To complete your registration and start discovering amazing deals, please use the following verification code:</p>
        <p class="verification-code">${verificationCode}</p>
        <p>This code will expire in 15 minutes.</p>
        <p>For your convenience, you can click the button below to go to our verification page. There, you'll be able to enter this code to verify your email:</p>
        <p style="text-align: center;">
          <a href="https://saversonic.com/verify-email" class="btn btn-primary">Go to Verification Page</a>
        </p>
        <p>On the verification page, simply enter the code shown above to complete your account setup.</p>
        <p>At SaverSonic, you'll be able to:</p>
        <ul>
          <li>Discover and share the best deals</li>
          <li>Connect with fellow savvy shoppers</li>
          <li>Build your own collections of favorite finds</li>
          <li>Stay updated on the latest trends and discounts</li>
        </ul>
        <p>We can't wait to see you in action!</p>
        <p>Happy saving,<br>The SaverSonic Team</p>
        <div class="footer">
          <p>If you have any questions, please contact us at support@saversonic.com</p>
          <p>&copy; 2023 SaverSonic. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = exports;
