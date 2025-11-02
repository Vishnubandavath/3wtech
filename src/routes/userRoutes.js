const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getCurrentUser, getUserById, getUserPosts } = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', getCurrentUser);
router.get('/:id', getUserById);
router.get('/:id/posts', getUserPosts);

module.exports = router;
