const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});

// ... (keep all existing routes) ...

// Add this new route
router.post('/upload-profile-picture', auth, upload.single('image'), userController.uploadProfilePicture);

module.exports = router;