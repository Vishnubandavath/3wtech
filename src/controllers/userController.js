const supabase = require('../config/supabase');

const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        users (id, username, email),
        likes (id, user_id),
        comments (id)
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user posts error:', error);
      return res.status(500).json({ error: 'Failed to fetch user posts' });
    }

    const postsWithCounts = posts.map(post => ({
      ...post,
      like_count: post.likes?.length || 0,
      comment_count: post.comments?.length || 0,
      is_liked_by_user: post.likes?.some(like => like.user_id === req.user.id) || false,
    }));

    res.status(200).json({ posts: postsWithCounts, count: posts.length });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getCurrentUser,
  getUserById,
  getUserPosts,
};
