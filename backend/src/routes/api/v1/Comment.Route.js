const express = require('express');
const router = express.Router();
const commentController = require('../../../controllers/commentController');
const auth = require('../../../middleware/auth');
const rateLimitMiddleware = require('../../../middleware/rateLimit');

router.post('/:dealId/comments', auth, rateLimitMiddleware.comment, commentController.createComment);
router.get('/:id', commentController.getComment);
router.put('/:id', auth, commentController.updateComment);
router.delete('/:id', auth, commentController.deleteComment);
router.get('/deal/:dealId', commentController.getComments);

// Remove the reply route

module.exports = router;