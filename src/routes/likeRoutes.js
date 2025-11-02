const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { toggleLike, getPostLikes } = require('../controllers/likeController');

const router = express.Router();

router.use(authMiddleware);

router.post('/:id/like', toggleLike);
router.get('/:id/likes', getPostLikes);

module.exports = router;
