const express = require('express');
const router = express.Router();
const commentController = require('../../../controllers/commentController');
const auth = require('../../../middleware/auth');
const rateLimit = require('../../../middleware/rateLimit');

// Check this line (line 9):
router.post('/', auth, rateLimit.createComment, commentController.createComment);

// Add other routes as needed
router.get('/:id', commentController.getComment);
router.put('/:id', auth, commentController.updateComment);
router.delete('/:id', auth, commentController.deleteComment);

module.exports = router;