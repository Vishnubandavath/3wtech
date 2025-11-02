const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createComment, getPostComments, deleteComment } = require('../controllers/commentController');

const router = express.Router();

router.use(authMiddleware);

router.post('/:id/comment', createComment);
router.get('/:id/comments', getPostComments);
router.delete('/comments/:commentId', deleteComment);

module.exports = router;
