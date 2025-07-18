-- PostgreSQL initialization script for LangGraph
-- This script will be executed when the container starts for the first time

-- Create database for LangGraph checkpoints if it doesn't exist
CREATE DATABASE langgraph_checkpoints;

-- Create a user for LangGraph if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'langgraph_user') THEN
        CREATE USER langgraph_user WITH PASSWORD 'langgraph_password';
    END IF;
END
$$;

-- Grant privileges to the LangGraph user
GRANT ALL PRIVILEGES ON DATABASE langgraph_checkpoints TO langgraph_user;
GRANT ALL PRIVILEGES ON DATABASE relate_db TO langgraph_user;

-- Enable UUID extension for better primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto extension for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic tables for LangGraph checkpoints
\c langgraph_checkpoints;

-- LangGraph checkpoint table
CREATE TABLE IF NOT EXISTS checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id VARCHAR(255) NOT NULL,
    checkpoint_ns VARCHAR(255) NOT NULL DEFAULT '',
    checkpoint_id VARCHAR(255) NOT NULL,
    parent_checkpoint_id VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    checkpoint JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checkpoints_thread_id ON checkpoints(thread_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_checkpoint_id ON checkpoints(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_parent_id ON checkpoints(parent_checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_created_at ON checkpoints(created_at);

-- Create unique constraint for thread_id + checkpoint_ns + checkpoint_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkpoints_unique 
ON checkpoints(thread_id, checkpoint_ns, checkpoint_id);

-- Grant permissions to langgraph_user
GRANT ALL PRIVILEGES ON TABLE checkpoints TO langgraph_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO langgraph_user;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_checkpoints_updated_at 
    BEFORE UPDATE ON checkpoints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create basic application tables in the main database
\c relate_db;

-- Example: User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    thread_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_thread_id ON user_sessions(thread_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE user_sessions TO langgraph_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO langgraph_user;