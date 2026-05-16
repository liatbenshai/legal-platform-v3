-- ============================================================
-- Migration 002: User-managed dictionary entries
-- ============================================================
-- Allows users to add their own gender inflections that supplement
-- (and override, where keys match) the system dictionary in
-- src/lib/engine/dictionary.ts.
--
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.

CREATE TABLE IF NOT EXISTS user_dictionary_entries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  word          text NOT NULL,
  male          text NOT NULL,
  female        text NOT NULL,
  plural        text NOT NULL,
  plural_female text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, word)
);

CREATE INDEX IF NOT EXISTS user_dictionary_entries_user_id_idx
  ON user_dictionary_entries (user_id);

ALTER TABLE user_dictionary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own dictionary entries"
  ON user_dictionary_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own dictionary entries"
  ON user_dictionary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own dictionary entries"
  ON user_dictionary_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own dictionary entries"
  ON user_dictionary_entries FOR DELETE
  USING (auth.uid() = user_id);
