const supabase = require('../config/supabase');

const createComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    if (postError || !post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { data: newComment, error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: userId, comment }])
      .select(`
        *,
        users (id, username, email)
      `)
      .single();

    if (error) {
      console.error('Create comment error:', error);
      return res.status(500).json({ error: 'Failed to create comment' });
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment: newComment,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPostComments = async (req, res) => {
  try {
    const { id: postId } = req.params;

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users (id, username, email)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }

    res.status(200).json({ comments, count: comments.length });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch comment error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch comment' });
    }

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Delete comment error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createComment,
  getPostComments,
  deleteComment,
};
