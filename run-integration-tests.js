const http = require('http');
const https = require('https');

// Test configuration
const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5173';
const TEST_USER = {
  email: 'admin@zschool.com',
  password: 'Admin@123'
};

let accessToken = '';

// Helper function to make HTTP requests
function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 FRONTEND INTEGRATION TEST SUITE');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Backend Health Check
  try {
    const res = await request({ url: BACKEND_URL + '/api/health' });
    if (res.status === 200) {
      console.log('✅ Backend Health Check: PASS');
      passed++;
    } else {
      console.log('❌ Backend Health Check: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Backend Health Check: ERROR -', e.message);
    failed++;
  }
  
  // Test 2: Frontend Accessibility
  try {
    const res = await request({ url: FRONTEND_URL });
    if (res.status === 200 && res.data.includes('<div id="root">')) {
      console.log('✅ Frontend Accessible: PASS');
      passed++;
    } else {
      console.log('❌ Frontend Accessible: FAIL');
      failed++;
    }
  } catch (e) {
    console.log('❌ Frontend Accessible: ERROR -', e.message);
    failed++;
  }
  
  // Test 3: Login API
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/auth/login',
      method: 'POST' 
    }, { emailOrUsername: TEST_USER.email, password: TEST_USER.password });
    
    if (res.status === 200 && res.data.data?.accessToken) {
      accessToken = res.data.data.accessToken;
      console.log('✅ Login API (accessToken returned): PASS');
      passed++;
    } else {
      console.log('❌ Login API: FAIL - ', JSON.stringify(res.data));
      failed++;
    }
  } catch (e) {
    console.log('❌ Login API: ERROR -', e.message);
    failed++;
  }
  
  // Test 4: Dashboard Metrics (Authenticated)
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/dashboard/metrics',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Dashboard Metrics API: PASS');
      passed++;
    } else {
      console.log('❌ Dashboard Metrics API: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Dashboard Metrics API: ERROR -', e.message);
    failed++;
  }
  
  // Test 5: Students List (Authenticated)
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/students',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Students List API: PASS (Count: ' + (res.data.data?.total || res.data.data?.length || 'N/A') + ')');
      passed++;
    } else {
      console.log('❌ Students List API: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Students List API: ERROR -', e.message);
    failed++;
  }
  
  // Test 6: Sponsors List (Authenticated)
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/sponsors',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Sponsors List API: PASS (Count: ' + (res.data.data?.total || res.data.data?.length || 'N/A') + ')');
      passed++;
    } else {
      console.log('❌ Sponsors List API: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Sponsors List API: ERROR -', e.message);
    failed++;
  }
  
  // Test 7: Analytics - School Dashboard
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/analytics/school-dashboard',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Analytics School Dashboard: PASS');
      passed++;
    } else {
      console.log('❌ Analytics School Dashboard: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Analytics School Dashboard: ERROR -', e.message);
    failed++;
  }
  
  // Test 8: Analytics - Student Performance
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/analytics/student-performance',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Analytics Student Performance: PASS');
      passed++;
    } else {
      console.log('❌ Analytics Student Performance: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Analytics Student Performance: ERROR -', e.message);
    failed++;
  }
  
  // Test 9: Marks Pending API
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/marks/pending',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Marks Pending API: PASS (Count: ' + (res.data.data?.total || res.data.data?.length || 'N/A') + ')');
      passed++;
    } else {
      console.log('❌ Marks Pending API: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Marks Pending API: ERROR -', e.message);
    failed++;
  }
  
  // Test 10: Report Cards API
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/report-cards',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Report Cards API: PASS');
      passed++;
    } else {
      console.log('❌ Report Cards API: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Report Cards API: ERROR -', e.message);
    failed++;
  }
  
  // Test 11: Users API (Admin only)
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/users',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Users API (Admin): PASS (Count: ' + (res.data.data?.total || res.data.data?.length || 'N/A') + ')');
      passed++;
    } else {
      console.log('❌ Users API (Admin): FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Users API (Admin): ERROR -', e.message);
    failed++;
  }
  
  // Test 12: Attendance API
  try {
    const res = await request({ 
      url: BACKEND_URL + '/api/attendance',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });
    if (res.status === 200 && res.data.success) {
      console.log('✅ Attendance API: PASS');
      passed++;
    } else {
      console.log('❌ Attendance API: FAIL (' + res.status + ')');
      failed++;
    }
  } catch (e) {
    console.log('❌ Attendance API: ERROR -', e.message);
    failed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log('   Passed: ' + passed);
  console.log('   Failed: ' + failed);
  console.log('   Total:  ' + (passed + failed));
  console.log('   Success Rate: ' + Math.round(passed / (passed + failed) * 100) + '%');
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is ready for production.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.\n');
  }
}

runTests();
