const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createPost, getAllPosts, getPostById, deletePost } = require('../controllers/postController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createPost);
router.get('/', getAllPosts);
router.get('/:id', getPostById);
router.delete('/:id', deletePost);

module.exports = router;
