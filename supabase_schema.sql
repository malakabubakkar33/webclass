-- ====================================================================
-- SMIT WEBCRAFT LMS: SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/vejdcilgwgiscaspbfho/sql
-- 2. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter).
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher')),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_dropped BOOLEAN NOT NULL DEFAULT false,
    dropped_reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile_number VARCHAR(30) NOT NULL,
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    avatar_url TEXT DEFAULT '',
    show_on_public_directory BOOLEAN NOT NULL DEFAULT true,
    is_dropped BOOLEAN NOT NULL DEFAULT false,
    dropped_reason TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TEACHER PROFILES TABLE
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    mobile_number VARCHAR(30) DEFAULT '',
    avatar_url TEXT DEFAULT '',
    bio TEXT DEFAULT 'Lead Full-Stack Web Development Architect & Classroom Instructor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    level VARCHAR(30) NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TOPICS TABLE
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    video_url TEXT NOT NULL,
    storage_path TEXT DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
    duration VARCHAR(20) DEFAULT '15:00',
    order_index INTEGER NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    class_day VARCHAR(15) NOT NULL CHECK (class_day IN ('monday', 'thursday', 'tuesday', 'wednesday', 'friday', 'saturday', 'sunday')),
    status VARCHAR(15) NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_date UNIQUE (student_id, date)
);

-- 8. ATTENDANCE SESSIONS TABLE (Real-time live attendance)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    message TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    accepted_students TEXT[] DEFAULT '{}',
    approved_students TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. VIDEO PROGRESS TABLE
CREATE TABLE IF NOT EXISTS video_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched BOOLEAN NOT NULL DEFAULT true,
    completed BOOLEAN NOT NULL DEFAULT false,
    progress_seconds INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_video UNIQUE (student_id, video_id)
);

-- 10. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT DEFAULT '',
    requirements TEXT[] DEFAULT '{}',
    due_at TIMESTAMPTZ NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 100,
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    max_file_size_mb INTEGER DEFAULT 20,
    max_submissions INTEGER DEFAULT 3,
    allow_resubmission BOOLEAN DEFAULT true,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ASSIGNMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_mb NUMERIC(6, 2) DEFAULT 0,
    notes TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
    marks INTEGER,
    feedback TEXT DEFAULT '',
    attempt_number INTEGER DEFAULT 1,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    graded_at TIMESTAMPTZ
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) DEFAULT '',
    reference_id VARCHAR(100) DEFAULT '',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. NOTIFICATION TOKENS TABLE (FCM)
CREATE TABLE IF NOT EXISTS notification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_info TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. PASSWORD RESETS TABLE
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    reference_type VARCHAR(50) DEFAULT '',
    reference_id VARCHAR(100) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. CLASS SETTINGS TABLE
CREATE TABLE IF NOT EXISTS class_settings (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'smit-web-class-settings-01',
    class_name VARCHAR(150) NOT NULL,
    teacher_id VARCHAR(100) NOT NULL,
    class_days TEXT[] DEFAULT ARRAY['monday', 'thursday'],
    class_start_time VARCHAR(10) DEFAULT '18:00',
    class_end_time VARCHAR(10) DEFAULT '20:30',
    timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
    location VARCHAR(150) DEFAULT 'SMIT Main Campus / Live Cohort',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_student_profiles_roll ON student_profiles(roll_number);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_course ON topics(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_topic ON videos(topic_id);
CREATE INDEX IF NOT EXISTS idx_videos_course ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_video_progress_student ON video_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);

-- ====================================================================
-- PERMISSIONS: Grant full API access to service_role, anon, authenticated
-- ====================================================================
GRANT ALL ON SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, service_role, anon, authenticated;

-- Disable RLS on operational tables so backend service_role has seamless direct access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_settings DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- SEED INITIAL DATA: Teacher Account & Initial Courses
-- Password: Password123!
-- ====================================================================
INSERT INTO users (id, role, username, email, password_hash, is_active, created_at, updated_at)
VALUES (
    'b48f07b1-1234-4567-89ab-cdef01234567',
    'teacher',
    'teacher',
    'teacher@webcraft.edu',
    '$2a$10$ax966UUArJf24g2/U5DXu.0mmvGiD7GCgFrtjyVh8eG4mZDlpMhnG',
    true,
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

INSERT INTO teacher_profiles (id, user_id, full_name, username, email, mobile_number, avatar_url, bio, created_at, updated_at)
VALUES (
    'c59f07b1-1234-4567-89ab-cdef01234567',
    'b48f07b1-1234-4567-89ab-cdef01234567',
    'Prof. Alex Vance',
    'teacher',
    'teacher@webcraft.edu',
    '+92 300 1234567',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    'Lead Full-Stack Web Development Architect & Classroom Instructor with 12+ years experience.',
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- Initial Class Settings
INSERT INTO class_settings (id, class_name, teacher_id, class_days, class_start_time, class_end_time, timezone, location)
VALUES (
    'smit-web-class-settings-01',
    'SMIT Web Development Class',
    'b48f07b1-1234-4567-89ab-cdef01234567',
    ARRAY['monday', 'thursday'],
    '18:00',
    '20:30',
    'Asia/Karachi',
    'SMIT Main Campus / Live Cohort'
) ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- Production Note:
-- Courses, topics, videos, assignments, and attendance are created
-- dynamically by the Teacher through the Teacher Portal.
-- ====================================================================

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

