const supabase = require('../config/supabase');

const toggleLike = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user.id;

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { data: existingLike, error: likeCheckError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (likeCheckError) {
      console.error('Like check error:', likeCheckError);
      return res.status(500).json({ error: 'Failed to check like status' });
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Unlike error:', deleteError);
        return res.status(500).json({ error: 'Failed to unlike post' });
      }

      return res.status(200).json({ message: 'Post unliked successfully', liked: false });
    } else {
      const { error: insertError } = await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: userId }]);

      if (insertError) {
        console.error('Like error:', insertError);
        return res.status(500).json({ error: 'Failed to like post' });
      }

      return res.status(201).json({ message: 'Post liked successfully', liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPostLikes = async (req, res) => {
  try {
    const { id: postId } = req.params;

    const { data: likes, error } = await supabase
      .from('likes')
      .select(`
        id,
        created_at,
        users (id, username, email)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get likes error:', error);
      return res.status(500).json({ error: 'Failed to fetch likes' });
    }

    res.status(200).json({ likes, count: likes.length });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  toggleLike,
  getPostLikes,
};
