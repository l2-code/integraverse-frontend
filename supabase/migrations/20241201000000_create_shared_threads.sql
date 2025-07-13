-- Create shared_threads table
CREATE TABLE IF NOT EXISTS shared_threads (
  id BIGSERIAL PRIMARY KEY,
  share_id UUID UNIQUE NOT NULL,
  thread_id TEXT NOT NULL,
  thread_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index on share_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_shared_threads_share_id ON shared_threads(share_id);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_shared_threads_expires_at ON shared_threads(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE shared_threads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is for public sharing)
CREATE POLICY "Allow all operations on shared_threads" ON shared_threads
  FOR ALL USING (true);

-- Create a function to clean up expired shares (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS void AS $$
BEGIN
  DELETE FROM shared_threads WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql; 