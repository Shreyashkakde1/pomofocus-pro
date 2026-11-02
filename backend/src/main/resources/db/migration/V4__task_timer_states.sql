-- ==============================================================================
-- Pomofocus Pro - V4 Database Schema: Per-Target Timer State (Cross-Device Sync)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS task_timer_states (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    remaining_seconds INT NOT NULL CHECK (remaining_seconds > 0),
    duration_seconds INT NOT NULL CHECK (duration_seconds > 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, task_id)
);
