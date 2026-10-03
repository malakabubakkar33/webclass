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

-- Courses Definition
INSERT INTO courses (id, title, slug, description, thumbnail_url, level, created_by, is_published)
VALUES
('course-html', 'HTML5 Semantic Web Architecture', 'html', 'Master modern semantic markup, accessible forms, audio/video integration, and document layout foundations.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600', 'Beginner', 'b48f07b1-1234-4567-89ab-cdef01234567', true),
('course-css', 'Modern CSS3 & Responsive Design', 'css', 'Deep dive into Flexbox, CSS Grid, custom properties, animations, and Tailwind utility systems.', 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?auto=format&fit=crop&q=80&w=600', 'Beginner', 'b48f07b1-1234-4567-89ab-cdef01234567', true),
('course-javascript', 'JavaScript Deep Dive & DOM Engineering', 'javascript', 'Core language mechanisms, closures, prototypes, asynchronous JavaScript, Promises, and the Event Loop.', 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=600', 'Intermediate', 'b48f07b1-1234-4567-89ab-cdef01234567', true),
('course-typescript', 'TypeScript for Production Web Apps', 'typescript', 'Static typing, interfaces, generics, utility types, unions, and configuring strict type safety.', 'https://images.unsplash.com/photo-1516116211227-bbc15456b3e3?auto=format&fit=crop&q=80&w=600', 'Intermediate', 'b48f07b1-1234-4567-89ab-cdef01234567', true),
('course-react', 'React Enterprise Component Architecture', 'react', 'Hooks, state management, context, TanStack Query caching, custom hooks, and memoization patterns.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600', 'Intermediate', 'b48f07b1-1234-4567-89ab-cdef01234567', true),
('course-firebase', 'Firebase Cloud Mastery & Push Notifications', 'firebase', 'Firebase Cloud Messaging (FCM), Cloud Firestore, Authentication, and real-time client sync.', 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=600', 'Advanced', 'b48f07b1-1234-4567-89ab-cdef01234567', true),
('course-supabase', 'Supabase & PostgreSQL Full-Stack Architecture', 'supabase', 'Relational data modeling, Row-Level Security (RLS) policies, Supabase Storage buckets, and Edge functions.', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600', 'Advanced', 'b48f07b1-1234-4567-89ab-cdef01234567', true)
ON CONFLICT (id) DO NOTHING;

-- Initial Topics
INSERT INTO topics (id, course_id, title, description, order_index)
VALUES
('topic-html-1', 'course-html', 'Introduction to HTML5', 'History, document declaration, viewport configuration, and metadata.', 1),
('topic-html-2', 'course-html', 'HTML Structure & Semantics', 'Header, nav, main, section, article, aside, and footer elements.', 2),
('topic-css-1', 'course-css', 'The CSS Box Model & Selectors', 'Margins, borders, padding, content box vs border box, specificity.', 1),
('topic-css-2', 'course-css', 'Flexbox Layout Essentials', 'Justify-content, align-items, flex direction, grow, shrink, and wrap.', 2),
('topic-js-1', 'course-javascript', 'Modern ES6+ Syntax & Scope', 'Let, const, arrow functions, destructuring, and template literals.', 1),
('topic-ts-1', 'course-typescript', 'TypeScript Fundamentals & Type Annotations', 'Primitives, arrays, tuples, enums, and type inference.', 1),
('topic-react-1', 'course-react', 'React Hooks Core (useState, useEffect)', 'Component lifecycles, effect dependencies, cleanups, and synchronization.', 1),
('topic-firebase-1', 'course-firebase', 'Firebase Push Notifications with FCM', 'Service workers, device token registration, payload construction, and delivery.', 1),
('topic-supabase-1', 'course-supabase', 'PostgreSQL Schema Design & Constraints', 'Foreign keys, indexes, triggers, and cascading constraints.', 1)
ON CONFLICT (id) DO NOTHING;

-- Initial Videos
INSERT INTO videos (id, course_id, topic_id, title, description, video_url, duration, order_index, uploaded_by)
VALUES
('video-html-1-1', 'course-html', 'topic-html-1', 'Welcome to Web Development & HTML5', 'Introduction to web architecture, client-server models, and HTML fundamentals.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '12:45', 1, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-html-1-2', 'course-html', 'topic-html-1', 'Anatomy of an HTML Document', 'Understanding DOCTYPE, html, head, title, meta viewport, and body tags.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', '16:20', 2, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-html-2-1', 'course-html', 'topic-html-2', 'Semantic Tags vs Generic Divs', 'Structuring pages using semantic HTML elements for accessibility and SEO.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '14:10', 1, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-css-1-1', 'course-css', 'topic-css-1', 'Mastering the CSS Box Model', 'Content, padding, border, margin and box-sizing: border-box explained.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', '18:25', 1, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-css-2-1', 'course-css', 'topic-css-2', 'Complete Guide to CSS Flexbox', 'Flex container, flex items, axis alignment, wrapping and responsive flex cards.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4', '24:50', 1, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-js-1-1', 'course-javascript', 'topic-js-1', 'ES6+ Features You Must Know', 'Const, let, arrow functions, destructuring, template literals, and default parameters.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', '21:05', 1, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-ts-1-1', 'course-typescript', 'topic-ts-1', 'Getting Started with Strong Typing', 'Introduction to TypeScript compiler, type annotations, and interface definitions.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '17:40', 1, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-react-1-1', 'course-react', 'topic-react-1', 'useState and useEffect Deep Dive', 'Managing state and side effects in React functional components.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '28:40', 1, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-firebase-1-1', 'course-firebase', 'topic-firebase-1', 'Setting Up Firebase Cloud Messaging', 'Configuring push notifications, service workers, and device token registration.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', '19:50', 1, 'b48f07b1-1234-4567-89ab-cdef01234567'),
('video-supabase-1-1', 'course-supabase', 'topic-supabase-1', 'Relational Modeling in Supabase', 'Creating PostgreSQL tables, setting up foreign keys, and querying data.', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4', '24:10', 1, 'b48f07b1-1234-4567-89ab-cdef01234567')
ON CONFLICT (id) DO NOTHING;

-- Initial Assignments
INSERT INTO assignments (id, course_id, topic_id, teacher_id, title, description, instructions, requirements, due_at, max_marks, allowed_file_types, max_file_size_mb, max_submissions, allow_resubmission, published)
VALUES
(
    'assign-html-portfolio',
    'course-html',
    'topic-html-1',
    'b48f07b1-1234-4567-89ab-cdef01234567',
    'HTML5 Semantic Web Architecture & Portfolio',
    'Design and code a fully accessible, semantic multi-page HTML portfolio following modern HTML5 web standards.',
    'Create an accessible, semantic HTML5 structure including header, nav, main, article, section, aside, and footer tags. Implement structured form controls with validation attributes.',
    ARRAY['Use valid HTML5 doctype and meta tags for responsive viewport', 'Include semantic tags: header, nav, main, article, section, footer', 'Build a comprehensive contact form with required field validation', 'Validate markup using W3C HTML validator without errors'],
    NOW() + INTERVAL '14 days',
    100,
    ARRAY['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    20,
    3,
    true,
    true
),
(
    'assign-css-flexbox',
    'course-css',
    'topic-css-1',
    'b48f07b1-1234-4567-89ab-cdef01234567',
    'Modern CSS Flexbox & Grid Dashboard Layout',
    'Construct a responsive multi-column SaaS analytics dashboard layout using CSS Flexbox and modern CSS Grid techniques.',
    'Implement mobile-first responsive breakpoints. Utilize CSS custom properties for theme consistency. Ensure no horizontal page overflow.',
    ARRAY['Mobile-first responsive design using CSS Flexbox and Grid', 'Use CSS custom properties for colors and typography', 'Smooth hover micro-animations and transition states'],
    NOW() + INTERVAL '21 days',
    100,
    ARRAY['pdf', 'png', 'jpg', 'jpeg', 'webp'],
    25,
    2,
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
