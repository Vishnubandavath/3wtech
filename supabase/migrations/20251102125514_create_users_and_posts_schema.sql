/*
  # Create Mini Social Post Application Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique user identifier
      - `username` (text) - Display name of the user
      - `email` (text, unique) - User email for login
      - `password` (text) - Hashed password
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `posts`
      - `id` (uuid, primary key) - Unique post identifier
      - `user_id` (uuid, foreign key) - Reference to users table
      - `text` (text, optional) - Post text content
      - `image_url` (text, optional) - URL of uploaded image
      - `created_at` (timestamptz) - Post creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `likes`
      - `id` (uuid, primary key) - Unique like identifier
      - `post_id` (uuid, foreign key) - Reference to posts table
      - `user_id` (uuid, foreign key) - Reference to users table
      - `created_at` (timestamptz) - Like timestamp
      - Unique constraint on (post_id, user_id) to prevent duplicate likes

    - `comments`
      - `id` (uuid, primary key) - Unique comment identifier
      - `post_id` (uuid, foreign key) - Reference to posts table
      - `user_id` (uuid, foreign key) - Reference to users table
      - `comment` (text) - Comment text
      - `created_at` (timestamptz) - Comment timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read all posts, likes, and comments
      - Create their own posts, likes, and comments
      - Update their own posts and comments
      - Delete their own posts, likes, and comments
      - Read user profiles

  3. Important Notes
    - Posts must have either text or image_url (at least one required)
    - Users can only like a post once (enforced by unique constraint)
    - Cascade delete: When a post is deleted, all associated likes and comments are deleted
    - Cascade delete: When a user is deleted, all associated posts, likes, and comments are deleted
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT text_or_image_required CHECK (text IS NOT NULL OR image_url IS NOT NULL)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policies for posts table
CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for likes table
CREATE POLICY "Anyone can read likes"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for comments table
CREATE POLICY "Anyone can read comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
