const supabase = require('../config/supabase');

const createPost = async (req, res) => {
  try {
    const { text, image_url } = req.body;
    const userId = req.user.id;

    if (!text && !image_url) {
      return res.status(400).json({ error: 'Post must contain either text or image' });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert([{ user_id: userId, text, image_url }])
      .select(`
        *,
        users (id, username, email)
      `)
      .single();

    if (error) {
      console.error('Create post error:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }

    res.status(201).json({
      message: 'Post created successfully',
      post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { data: posts, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        users (id, username, email),
        likes (id, user_id),
        comments (id, user_id, comment, created_at, users (username))
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get posts error:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    const postsWithCounts = posts.map(post => ({
      ...post,
      like_count: post.likes?.length || 0,
      comment_count: post.comments?.length || 0,
      is_liked_by_user: post.likes?.some(like => like.user_id === req.user.id) || false,
    }));

    res.status(200).json({
      posts: postsWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (id, username, email),
        likes (id, user_id, users (username)),
        comments (id, user_id, comment, created_at, users (username))
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Get post error:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postWithCounts = {
      ...post,
      like_count: post.likes?.length || 0,
      comment_count: post.comments?.length || 0,
      is_liked_by_user: post.likes?.some(like => like.user_id === req.user.id) || false,
    };

    res.status(200).json({ post: postWithCounts });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch post error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this post' });
    }

    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete post error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
};
