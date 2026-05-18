-- ============================================================
-- Migration 003: Lawyer profile (one row per user)
-- ============================================================
-- Stores the logged-in lawyer's personal/professional details so they
-- don't have to retype them in every fee agreement or signature block.
-- One row per auth.users (PK = user_id).
--
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.

CREATE TABLE IF NOT EXISTS lawyer_profiles (
  user_id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name        text NOT NULL DEFAULT '',
  gender           text NOT NULL DEFAULT 'female' CHECK (gender IN ('male', 'female')),
  id_number        text NOT NULL DEFAULT '',
  license_number   text NOT NULL DEFAULT '',
  bar_association  text NOT NULL DEFAULT '',
  firm_name        text NOT NULL DEFAULT '',
  address          text NOT NULL DEFAULT '',
  city             text NOT NULL DEFAULT '',
  phone            text NOT NULL DEFAULT '',
  email            text NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users select own lawyer profile"
  ON lawyer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own lawyer profile"
  ON lawyer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own lawyer profile"
  ON lawyer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own lawyer profile"
  ON lawyer_profiles FOR DELETE
  USING (auth.uid() = user_id);
