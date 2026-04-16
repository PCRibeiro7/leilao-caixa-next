-- Pipeline state table with atomic locking support.
-- Run this in the Supabase SQL Editor.

CREATE TABLE pipeline_state (
    id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- single-row table
    current_step text NOT NULL DEFAULT 'idle',
    updated_at timestamptz NOT NULL DEFAULT now(),
    locked_until timestamptz
);

-- Seed the single row
INSERT INTO pipeline_state (id, current_step) VALUES (1, 'idle');

-- RPC function: atomically try to acquire the lock.
-- Returns the row if lock was acquired, empty if already locked.
CREATE OR REPLACE FUNCTION acquire_pipeline_lock(lock_duration_ms int DEFAULT 300000)
RETURNS SETOF pipeline_state
LANGUAGE sql
AS $$
    UPDATE pipeline_state
    SET locked_until = now() + (lock_duration_ms || ' milliseconds')::interval
    WHERE id = 1
      AND (locked_until IS NULL OR locked_until < now())
    RETURNING *;
$$;

-- RPC function: release the lock and update the step atomically.
CREATE OR REPLACE FUNCTION release_pipeline_lock(new_step text, update_time timestamptz DEFAULT now())
RETURNS void
LANGUAGE sql
AS $$
    UPDATE pipeline_state
    SET current_step = new_step,
        updated_at = update_time,
        locked_until = NULL
    WHERE id = 1;
$$;
