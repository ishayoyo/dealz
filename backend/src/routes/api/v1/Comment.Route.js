const express = require('express');
const router = express.Router();
const commentController = require('../../../controllers/commentController');
const auth = require('../../../middleware/auth');

router.post('/:dealId/comments', auth, commentController.createComment);
router.get('/:id', commentController.getComment);
router.put('/:id', auth, commentController.updateComment);
router.delete('/:id', auth, commentController.deleteComment);
router.get('/deal/:dealId', commentController.getComments);
router.post('/:commentId/reply', auth, commentController.createReply);

module.exports = router;