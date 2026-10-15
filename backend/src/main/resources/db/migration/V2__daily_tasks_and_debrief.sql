-- ==============================================================================
-- Pomofocus Pro - V2 Database Schema: Daily Task Matrix & End-of-Day Review
-- ==============================================================================

-- 1. Daily Tasks Table (Mandatory, Priority, Need to Complete, If Got Time)
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    priority_tier VARCHAR(30) DEFAULT 'NEED_TO_COMPLETE' NOT NULL,
    planned_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_minutes INT DEFAULT 25 NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, planned_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_priority ON daily_tasks(user_id, planned_date, priority_tier);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_target ON daily_tasks(task_id);

-- 2. Daily Debriefs Table (Evening Retrospective & Reflection Journal)
CREATE TABLE IF NOT EXISTS daily_debriefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    debrief_date DATE NOT NULL,
    what_went_well TEXT,
    what_went_wrong TEXT,
    energy_rating INT DEFAULT 3 NOT NULL,
    tomorrow_notes TEXT,
    total_focus_seconds_snapshot INT DEFAULT 0 NOT NULL,
    tasks_completed_count INT DEFAULT 0 NOT NULL,
    tasks_total_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_daily_debriefs_user_date UNIQUE (user_id, debrief_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_debriefs_user_date ON daily_debriefs(user_id, debrief_date DESC);

