# WebCraft LMS - Full-Stack Classroom Learning Platform

A modern, production-quality full-stack classroom learning platform built for a Web Development cohort with **one teacher/admin** and **multiple students**.

---

## 🎨 Design System

* **Theme:** **LIGHT THEME ONLY** (No full dark theme).
* **Primary:** Modern Blue (`#2563EB`)
* **Secondary:** Soft Purple (`#7C3AED`)
* **Supporting Accents:**
  * Clean white cards (`#FFFFFF`) with rounded-3xl corners
  * Soft shadows (`shadow-soft` & `shadow-soft-lg`)
  * Very light blue (`#EFF6FF`) and purple (`#F5F3FF`) backgrounds
  * Thin borders (`#E2E8F0`)
  * Dark navy text (`#0F172A`)
  * Modern typography (Plus Jakarta Sans & Inter)

---

## 🚀 Technology Stack

### Frontend
* **Core:** React 18 with TypeScript & Vite
* **Styling:** Tailwind CSS with custom design tokens
* **Routing:** React Router v6 with role-based route guards
* **Animations:** Framer Motion
* **Icons:** Lucide React
* **State & Caching:** TanStack Query (React Query)
* **Form Validation:** React Hook Form + Zod
* **Notifications:** Custom animated toast system

### Backend
* **Runtime:** Node.js & Express.js with TypeScript
* **Security:** Helmet, CORS, Rate Limiting, bcrypt password hashing, JWT authentication
* **Validation:** Zod schemas
* **Database:** Supabase PostgreSQL with relational schema ([`schema.sql`](file:///d:/projects/app/thirtytwo/backend/src/config/schema.sql)) + local persistent database engine (`data/database.json`)
* **Storage:** Supabase Storage (`course-videos`, `avatars`, `course-thumbnails`) with local disk fallback serving
* **Email System:** Resend API with HTML email templates ([`emailService.ts`](file:///d:/projects/app/thirtytwo/backend/src/services/emailService.ts))
* **Push Notifications:** Firebase Cloud Messaging (FCM) Admin SDK & device token management

---

## 🔑 Default Accounts (Ready to Test)

### 1. Teacher / Admin Account (Only One Teacher)
* **Username:** `teacher`
* **Password:** `Password123!`
* **Role:** Teacher / Admin
* **Features:** Course management, topic folders, video lesson uploads, student roster management, Monday & Thursday attendance controller.

### 2. Pre-Seeded Students
* **Student 1:**
  * **Roll Number:** `WD-2026-001` or **Username:** `sarahc`
  * **Password:** `Password123!`
* **Student 2:**
  * **Roll Number:** `WD-2026-002` or **Username:** `michaelr`
  * **Password:** `Password123!`
* **Student 3:**
  * **Roll Number:** `WD-2026-003` or **Username:** `aaliyahk`
  * **Password:** `Password123!`

*Note: The unified login page auto-detects whether the user is a Teacher or a Student and routes them accordingly.*

---

## 🏃 Running the Application Locally

### 1. Start the Backend API (Port 5000)
```bash
cd backend
npm install
npm run dev
```
*Server runs at:* `http://localhost:5000`

### 2. Start the Frontend Application (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
*Application runs at:* `http://localhost:5173`

---

## 📋 Key Platform Features

1. **Main Public Website (`/`):**
   * Hero section: *"Learn. Practice. Build."*
   * 7 Complete Web Development Courses: HTML5, CSS3, JavaScript, TypeScript, React 18, Firebase Cloud, Supabase & PostgreSQL.
   * Class schedule highlights, instructor spotlight, and call to action.

2. **Unified Login (`/login`):**
   * Single sleek login card with educational branding.
   * Auto-identifies Student (by Username or Roll Number) vs Teacher (by Username).
   * Secure JWT session issuance and persistent login.

3. **Student 3-Step Signup Wizard (`/signup`):**
   * **Step 1:** Full Name, Username, Mobile, Roll Number, Email (uniqueness validated).
   * **Step 2:** Avatar selector with live preview and preset avatar options.
   * **Step 3:** Password creation and confirmation with Zod validation.
   * Auto-redirects directly into Student Dashboard.

4. **Student Portal:**
   * **Dashboard (`/student/dashboard`):** Progress statistics, *"Continue Learning"* active resume card, recent courses, and recent activity.
   * **Courses Catalog (`/student/courses`):** Filter by level (Beginner, Intermediate, Advanced) and search.
   * **Course Details (`/student/courses/:id`):** Overall progress, folder-style topics (`📁 Introduction to HTML`, `📁 Forms & Input Validation`), and lesson checklists.
   * **Video Player (`/student/videos/:id`):** HTML5 video player, instructor card, lesson overview, *"Mark as Completed"* toggle with database progress sync, and sequential *"Course Contents"* syllabus sidebar (`✓`, `▶`, `○`).
   * **Attendance (`/student/attendance`):** Read-only attendance calendar highlighting **Monday** and **Thursday** class days (Present in green, Absent in red, Upcoming).
   * **Profile & Settings (`/student/profile`, `/student/settings`):** Edit profile, change password, toggle email/push alerts, and sync FCM tokens.

5. **Teacher / Admin Portal:**
   * **Dashboard (`/teacher/dashboard`):** Real-time statistics (Total Students, Total Courses, Total Topics, Total Videos), quick actions, and recent activity stream.
   * **Course Management (`/teacher/courses`):** Create courses, edit metadata, delete courses with confirmation dialogs.
   * **Topic & Video Upload (`/teacher/courses/:id`):** Create topic folders, upload video files to storage with progress indicator, and automatically trigger student in-app notifications and Resend emails.
   * **Student Management (`/teacher/students`):** Searchable roster, student attendance rates, lesson completion counters, and Enable/Disable account switches.
   * **Attendance Management (`/teacher/attendance`):** Select Monday or Thursday session date, toggle Present/Absent per student, *"Mark All Present"*, *"Mark All Absent"*, and *"Save Attendance"* with duplicate prevention.
   * **Profile & Settings (`/teacher/profile`, `/teacher/settings`):** Instructor bio, security credentials, and integration settings.

---

## 🔒 Security & Environment Architecture

### Frontend Configuration (`frontend/.env`)
* `VITE_API_URL`: Backend REST endpoint (`http://localhost:5000/api`)
* `VITE_SUPABASE_URL`: Supabase project URL
* `VITE_SUPABASE_ANON_KEY`: Publishable anonymous key
* `VITE_FIREBASE_*`: Public Firebase client keys for push notification subscriptions

### Backend Configuration (`backend/.env`)
* `PORT`: `5000`
* `JWT_SECRET`: Secret signing key
* `DATABASE_URL`: Supabase PostgreSQL connection string (or empty for persistent local JSON DB)
* `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`: Admin key for storage management (Never exposed to frontend)
* `RESEND_API_KEY`: API key for automated lesson emails
* `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`: Admin SDK credentials for FCM push notifications

---

## ⚡ Vercel Single-Deployment (Frontend + Backend Together)

This repository is pre-configured to deploy **both frontend and backend together as a single unified Vercel deployment** with zero CORS or 405/500 routing issues.

### How to Deploy to Vercel:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: unified vercel full-stack deployment"
   git push origin main
   ```

2. **Import into Vercel:**
   * Go to your [Vercel Dashboard](https://vercel.com/dashboard)
   * Click **"Add New..."** ➔ **"Project"**
   * Select your GitHub repository (`thirtytwo`)
   * **Root Directory:** Leave as `./` (do NOT select frontend or backend subfolder)
   * **Framework Preset:** Vite (or Other)
   * Build command and output directory are automatically configured via [`vercel.json`](file:///d:/projects/app/thirtytwo/vercel.json):
     * Build Command: `npm run build`
     * Output Directory: `frontend/dist`

3. **Configure Environment Variables in Vercel:**
   In your Vercel project settings under **Environment Variables**, add the values from [`.env.example`](file:///d:/projects/app/thirtytwo/.env.example):
   * `JWT_SECRET`: `super-secret-jwt-key-change-this-in-production-class-2026`
   * `SUPABASE_URL`: `https://vejdcilgwgiscaspbfho.supabase.co`
   * `SUPABASE_SERVICE_ROLE_KEY`: `your-supabase-service-role-key`
   * `SUPABASE_PUBLISHABLE_KEY`: `your-supabase-publishable-key`
   * `RESEND_API_KEY`: `re_your_resend_api_key_here`
   * `RESEND_FROM_EMAIL`: `SMIT Web Class <onboarding@resend.dev>`
   * `FIREBASE_PROJECT_ID`: `smit-f947b`
   * `FIREBASE_CLIENT_EMAIL`: `firebase-adminsdk-fbsvc@smit-f947b.iam.gserviceaccount.com`
   * `FIREBASE_PRIVATE_KEY`: your Firebase private key string

4. **Click "Deploy":**
   * Vercel will run `npm run build` (compiling backend TS and building frontend Vite assets).
   * Vercel Serverless Functions (`api/index.js` and `api/[...path].js`) will handle all `/api/*` requests.
   * Vite SPA static assets in `frontend/dist` will handle all client page routes.
   * Everything runs under a single live domain without 405 Method Not Allowed or 500 errors!
