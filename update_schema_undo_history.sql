-- Create undo_history table to persist manual move / chance undo entries
CREATE TABLE IF NOT EXISTS undo_history (
  id serial PRIMARY KEY,
  game_id uuid NOT NULL,
  player_id text NOT NULL,
  performed_by text NULL,
  description text NULL,
  prev_position integer NOT NULL,
  new_position integer NOT NULL,
  prev_is_jailed boolean NOT NULL DEFAULT false,
  new_is_jailed boolean NOT NULL DEFAULT false,
  pass_go_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  reverted boolean NOT NULL DEFAULT false,
  reverted_at timestamptz NULL,
  reverted_by text NULL
);

-- index for fetching by game
CREATE INDEX IF NOT EXISTS idx_undo_history_game ON undo_history (game_id);
