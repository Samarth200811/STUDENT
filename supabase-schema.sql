-- ============================================================
-- EduTrack — Supabase SQL Schema
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Profiles table
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  name        TEXT,
  roll_number TEXT UNIQUE,
  course      TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  marks       INTEGER DEFAULT 0,
  attendance  INTEGER DEFAULT 0,
  grade       TEXT DEFAULT 'C',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance records
CREATE TABLE attendance_records (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('present','absent')),
  subject     TEXT DEFAULT '',
  UNIQUE(student_id, date, subject)
);

-- 3. Marks records
CREATE TABLE marks_records (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  exam_type   TEXT DEFAULT 'Mid Term',
  score       INTEGER NOT NULL,
  max_score   INTEGER DEFAULT 100,
  date        TEXT DEFAULT '',
  UNIQUE(student_id, subject, exam_type)
);

-- 4. Announcements (with priority)
CREATE TABLE announcements (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  content     TEXT,
  priority    TEXT DEFAULT 'general' CHECK (priority IN ('high','medium','low','general')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Disable RLS (backend uses service role key)
ALTER TABLE profiles           DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE marks_records      DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements      DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- IF TABLES ALREADY EXIST — run only this to add priority col:
-- ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'general';
-- ============================================================
