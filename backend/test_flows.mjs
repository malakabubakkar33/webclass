import http from 'http';
import handler from '../api/index.js';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING END-TO-END FLOW VERIFICATION TESTS');
  console.log('====================================================');

  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const BASE = `http://127.0.0.1:${port}/api`;

  const results = {
    signup: false,
    duplicateCheck: false,
    studentLoginUsername: false,
    studentLoginRoll: false,
    studentLoginEmail: false,
    teacherLogin: false,
    studentMe: false,
    studentDashboard: false,
    studentCourses: false,
    studentAttendance: false,
    teacherStats: false,
    teacherStudentsList: false,
    newStudentVisibleToTeacher: false,
    teacherCourseCreate: false,
    attendanceSave: false,
  };

  const testStudent = {
    fullName: 'Hamza Tariq',
    username: 'hamzatariq_' + Date.now().toString().slice(-4),
    rollNumber: 'WD-2026-' + Math.floor(100 + Math.random() * 900),
    mobileNumber: '+92 312 9876543',
    email: `hamza_${Date.now().toString().slice(-4)}@student.webcraft.edu`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
  };

  console.log('\n--- 1. Testing Student Signup Flow ---');
  console.log(`Registering: ${testStudent.fullName} (${testStudent.rollNumber})...`);

  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent),
  }).then(r => r.json());

  console.log('Signup Response Success:', signupRes.success);
  if (signupRes.success && signupRes.data?.token && signupRes.data?.user?.id) {
    results.signup = true;
    console.log(`✅ Signup verified: ID=${signupRes.data.user.id}, Token issued.`);
  } else {
    console.error('❌ Signup failed:', signupRes);
  }

  console.log('\n--- 2. Testing Duplicate Prevention ---');
  const dupRes = await fetch(`${BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent),
  }).then(r => r.json());

  if (!dupRes.success && dupRes.message && dupRes.message.includes('already taken')) {
    results.duplicateCheck = true;
    console.log(`✅ Duplicate correctly rejected: "${dupRes.message}"`);
  } else {
    console.error('❌ Duplicate not rejected:', dupRes);
  }

  console.log('\n--- 3. Testing Student Login Variations ---');
  // 3a. Username
  const loginUserRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testStudent.username, password: testStudent.password }),
  }).then(r => r.json());
  if (loginUserRes.success && loginUserRes.data?.user?.role === 'student') {
    results.studentLoginUsername = true;
    console.log('✅ Student Login by Username: SUCCESS');
  }

  // 3b. Roll Number
  const loginRollRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testStudent.rollNumber, password: testStudent.password }),
  }).then(r => r.json());
  if (loginRollRes.success && loginRollRes.data?.user?.rollNumber === testStudent.rollNumber) {
    results.studentLoginRoll = true;
    console.log('✅ Student Login by Roll Number: SUCCESS');
  }

  // 3c. Email
  const loginEmailRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: testStudent.email, password: testStudent.password }),
  }).then(r => r.json());
  if (loginEmailRes.success) {
    results.studentLoginEmail = true;
    console.log('✅ Student Login by Email: SUCCESS');
  }

  const studentToken = loginUserRes.data?.token;

  console.log('\n--- 4. Testing Teacher Login ---');
  const teacherLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'teacher', password: 'Password123!' }),
  }).then(r => r.json());
  if (teacherLoginRes.success && teacherLoginRes.data?.user?.role === 'teacher') {
    results.teacherLogin = true;
    console.log(`✅ Teacher Login: SUCCESS (${teacherLoginRes.data.user.fullName})`);
  } else {
    console.error('❌ Teacher Login Failed:', teacherLoginRes);
  }

  const teacherToken = teacherLoginRes.data?.token;

  console.log('\n--- 5. Testing Student Portal Endpoints ---');
  // /auth/me
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${studentToken}` },
  }).then(r => r.json());
  if (meRes.success && meRes.data?.username === testStudent.username) {
    results.studentMe = true;
    console.log('✅ GET /api/auth/me (Student): SUCCESS');
  }

  // /students/dashboard
  const dashRes = await fetch(`${BASE}/students/dashboard`, {
    headers: { 'Authorization': `Bearer ${studentToken}` },
  }).then(r => r.json());
  if (dashRes.success && dashRes.data) {
    results.studentDashboard = true;
    console.log(`✅ GET /api/students/dashboard: SUCCESS (Enrolled Courses: ${dashRes.data.enrolledCourses?.length || 0})`);
  }

  // /courses
  const coursesRes = await fetch(`${BASE}/courses`, {
    headers: { 'Authorization': `Bearer ${studentToken}` },
  }).then(r => r.json());
  if (coursesRes.success && Array.isArray(coursesRes.data)) {
    results.studentCourses = true;
    console.log(`✅ GET /api/courses: SUCCESS (Initial courses: ${coursesRes.data.length})`);
  }

  // /attendance/student/summary
  const attRes = await fetch(`${BASE}/attendance/student/summary`, {
    headers: { 'Authorization': `Bearer ${studentToken}` },
  }).then(r => r.json());
  if (attRes.success) {
    results.studentAttendance = true;
    console.log(`✅ GET /api/attendance/student/summary: SUCCESS (Rate: ${attRes.data.attendancePercent}%)`);
  }

  console.log('\n--- 6. Testing Teacher Portal Endpoints ---');
  // /teacher/dashboard-stats
  const statsRes = await fetch(`${BASE}/teacher/dashboard-stats`, {
    headers: { 'Authorization': `Bearer ${teacherToken}` },
  }).then(r => r.json());
  if (statsRes.success) {
    results.teacherStats = true;
    console.log(`✅ GET /api/teacher/dashboard-stats: SUCCESS (Students: ${statsRes.data.totalStudents}, Courses: ${statsRes.data.totalCourses})`);
  }

  // /students
  const studentsRes = await fetch(`${BASE}/students`, {
    headers: { 'Authorization': `Bearer ${teacherToken}` },
  }).then(r => r.json());
  if (studentsRes.success && studentsRes.data?.length > 0) {
    results.teacherStudentsList = true;
    const foundNewStudent = studentsRes.data.find(s => s.username === testStudent.username);
    if (foundNewStudent) {
      results.newStudentVisibleToTeacher = true;
      console.log(`✅ GET /api/students: SUCCESS (New student ${testStudent.fullName} appears on Teacher roster!)`);
    } else {
      console.warn('⚠️ New student not yet in roster list');
    }
  }

  // /attendance/save
  const saveAttRes = await fetch(`${BASE}/attendance/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      date: '2026-10-05',
      records: [{ studentId: signupRes.data?.user?.id || 'std-1', status: 'present' }],
    }),
  }).then(r => r.json());
  if (saveAttRes.success) {
    results.attendanceSave = true;
    console.log('✅ POST /api/attendance/save: SUCCESS');
  }

  // /courses create
  const testCourse = {
    title: 'Advanced Next.js App Router Masterclass',
    description: 'Master server components, server actions, parallel routes, and metadata.',
    level: 'Advanced',
  };
  const createCourseRes = await fetch(`${BASE}/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`,
    },
    body: JSON.stringify(testCourse),
  }).then(r => r.json());
  if (createCourseRes.success && createCourseRes.data?.id) {
    results.teacherCourseCreate = true;
    console.log(`✅ POST /api/courses: SUCCESS (Created ID: ${createCourseRes.data.id})`);
  }

  server.close();

  console.log('\n====================================================');
  console.log('📊 FINAL TEST RESULTS SUMMARY:');
  console.log('====================================================');
  let passed = 0;
  let total = Object.keys(results).length;
  for (const [key, val] of Object.entries(results)) {
    console.log(`${val ? '✅' : '❌'} ${key}: ${val ? 'PASSED' : 'FAILED'}`);
    if (val) passed++;
  }
  console.log(`\nScore: ${passed} / ${total} tests passed (${Math.round((passed/total)*100)}%)`);
  console.log('====================================================\n');
}

runTests().catch(console.error);
