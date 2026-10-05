import fs from 'fs';
import path from 'path';

const defaultCourses = [
  {
    id: 'course-html5-css3',
    title: 'HTML5 & Modern CSS3 Architecture',
    slug: 'html5-modern-css3-architecture',
    description: 'Master semantic HTML5, Flexbox, CSS Grid, custom properties, animations, and responsive web design best practices.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    level: 'Beginner',
    created_by: 'b48f07b1-1234-4567-89ab-cdef01234567',
    is_published: true,
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'course-javascript-es6',
    title: 'Modern JavaScript (ES6+) Fundamentals',
    slug: 'modern-javascript-es6-fundamentals',
    description: 'Deep dive into modern JS: lexical scope, closures, promises, async/await, DOM APIs, and functional paradigms.',
    thumbnail_url: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=800',
    level: 'Beginner',
    created_by: 'b48f07b1-1234-4567-89ab-cdef01234567',
    is_published: true,
    created_at: '2026-01-20T08:00:00.000Z',
    updated_at: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'course-typescript',
    title: 'TypeScript for Production Web Apps',
    slug: 'typescript-production-web-apps',
    description: 'Static typing, generics, interfaces, strict mode, union types, and error-free codebases.',
    thumbnail_url: 'https://images.unsplash.com/photo-1516116211227-bbc042c1619a?auto=format&fit=crop&q=80&w=800',
    level: 'Intermediate',
    created_by: 'b48f07b1-1234-4567-89ab-cdef01234567',
    is_published: true,
    created_at: '2026-02-01T08:00:00.000Z',
    updated_at: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'course-react',
    title: 'React 18 & Enterprise Component Architecture',
    slug: 'react-18-enterprise-architecture',
    description: 'Component lifecycles, hooks, context API, state machines, and real-world dashboards.',
    thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800',
    level: 'Intermediate',
    created_by: 'b48f07b1-1234-4567-89ab-cdef01234567',
    is_published: true,
    created_at: '2026-02-10T08:00:00.000Z',
    updated_at: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'course-firebase',
    title: 'Firebase Cloud Mastery & Push Notifications',
    slug: 'firebase-cloud-mastery',
    description: 'Realtime database, Cloud Firestore, Firebase Auth, FCM web notifications, and storage buckets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800',
    level: 'Advanced',
    created_by: 'b48f07b1-1234-4567-89ab-cdef01234567',
    is_published: true,
    created_at: '2026-02-18T08:00:00.000Z',
    updated_at: '2026-02-18T08:00:00.000Z',
  },
  {
    id: 'course-supabase',
    title: 'Supabase & PostgreSQL Full-Stack Architecture',
    slug: 'supabase-postgresql-architecture',
    description: 'Relational data modeling, Row-Level Security (RLS), realtime subscriptions, and Edge Functions.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=800',
    level: 'Advanced',
    created_by: 'b48f07b1-1234-4567-89ab-cdef01234567',
    is_published: true,
    created_at: '2026-02-25T08:00:00.000Z',
    updated_at: '2026-02-25T08:00:00.000Z',
  },
];

const defaultTopics = [
  {
    id: 'topic-html-1',
    course_id: 'course-html5-css3',
    title: 'Semantic HTML5 & Accessibility (a11y)',
    description: 'Proper tag hierarchies, ARIA tags, and SEO structure.',
    order_index: 1,
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'topic-html-2',
    course_id: 'course-html5-css3',
    title: 'Modern Flexbox & CSS Grid Systems',
    description: 'Multi-directional layout models, auto-fit, and minmax grids.',
    order_index: 2,
    created_at: '2026-01-15T08:00:00.000Z',
    updated_at: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'topic-js-1',
    course_id: 'course-javascript-es6',
    title: 'Variables, Scope & Execution Contexts',
    description: 'Hoisting, let vs const, and closures.',
    order_index: 1,
    created_at: '2026-01-20T08:00:00.000Z',
    updated_at: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'topic-js-2',
    course_id: 'course-javascript-es6',
    title: 'Asynchronous JavaScript & Event Loop',
    description: 'Promises, Async/Await, and Fetch API microtasks.',
    order_index: 2,
    created_at: '2026-01-20T08:00:00.000Z',
    updated_at: '2026-01-20T08:00:00.000Z',
  },
  {
    id: 'topic-react-1',
    course_id: 'course-react',
    title: 'Component Architecture & Props/State',
    description: 'Functional components, unidirectional data flow, and virtual DOM.',
    order_index: 1,
    created_at: '2026-02-10T08:00:00.000Z',
    updated_at: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'topic-react-2',
    course_id: 'course-react',
    title: 'React Hooks Mastery',
    description: 'useState, useEffect, useMemo, useCallback, and custom hooks.',
    order_index: 2,
    created_at: '2026-02-10T08:00:00.000Z',
    updated_at: '2026-02-10T08:00:00.000Z',
  },
];

const paths = [
  path.resolve('backend/data/database.json'),
  path.resolve('data/database.json'),
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.courses || data.courses.length === 0) {
      data.courses = defaultCourses;
      data.topics = defaultTopics;
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Seeded courses into ${p}`);
    } else {
      console.log(`Courses already populated in ${p}`);
    }
  }
}
