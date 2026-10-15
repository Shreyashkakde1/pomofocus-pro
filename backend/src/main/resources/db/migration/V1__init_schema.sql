-- ==============================================================================
-- Pomofocus Pro - V1 Database Schema (PostgreSQL 16)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    auth_provider VARCHAR(50) DEFAULT 'LOCAL' NOT NULL,
    provider_id VARCHAR(255),
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Verification Tokens Table (6-digit OTPs)
CREATE TABLE IF NOT EXISTS verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_code VARCHAR(10) NOT NULL,
    attempts_count INT DEFAULT 0 NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON verification_tokens(expires_at);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General' NOT NULL,
    color_hex VARCHAR(20) DEFAULT '#00f3ff' NOT NULL,
    daily_target_minutes INT DEFAULT 60 NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_archived ON tasks(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_sort ON tasks(user_id, sort_order ASC);

-- 4. Focus Sessions Table
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    session_type VARCHAR(50) DEFAULT 'FOCUS' NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INT NOT NULL,
    is_completed BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_time ON focus_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task ON focus_sessions(task_id);

-- 5. Context Checkpoints Table ("Where I Left Off")
CREATE TABLE IF NOT EXISTS context_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    checkpoint_note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_context_checkpoints_task_time ON context_checkpoints(task_id, created_at DESC);

-- Seed Demo User (password: password123)
INSERT INTO users (id, email, username, password_hash, auth_provider, is_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'demo@pomofocus.pro',
    'CyberRunner',
    '$2a$10$78G8pghvE8D4E5sWskG1q.GjH7oN4e4G5rUaJ4q9x3t5e6o7i8n9a', -- BCrypt hash of "password123"
    'LOCAL',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Seed Sample Tasks for Demo User
INSERT INTO tasks (id, user_id, title, category, color_hex, daily_target_minutes, sort_order)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DSA Practice: LeetCode Grind', 'Algorithms', '#00f3ff', 120, 1),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'System Design: Distributed Cache', 'Architecture', '#a855f7', 90, 2),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Pomofocus Pro Frontend HUD', 'Development', '#10b981', 180, 3),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Deep Work: Reading Research Papers', 'Research', '#f59e0b', 60, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed an Initial Checkpoint Bookmark for Task 1
INSERT INTO context_checkpoints (id, user_id, task_id, checkpoint_note)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Solved LeetCode #146 LRU Cache. Next: implement O(1) get/put with Doubly LinkedList and test edge cases.'
) ON CONFLICT (id) DO NOTHING;

