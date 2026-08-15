import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:3000';

async function testLegalEndpoints() {
  console.log('Testing Public Legal Endpoints...');
  let allPassed = true;

  // 1. Test /privacy-policy returns HTTP 200
  try {
    const res = await axios.get(`${BASE_URL}/privacy-policy`);
    console.log(`[PASS] GET /privacy-policy status: ${res.status}`);
    if (!res.data.includes('Fishcatch')) {
      console.warn('Warning: /privacy-policy did not include Fishcatch text in HTML');
    }
  } catch (e: any) {
    console.error(`[FAIL] GET /privacy-policy failed: ${e.message}`);
    allPassed = false;
  }

  // 2. Test /terms returns HTTP 200
  try {
    const res = await axios.get(`${BASE_URL}/terms`);
    console.log(`[PASS] GET /terms status: ${res.status}`);
  } catch (e: any) {
    console.error(`[FAIL] GET /terms failed: ${e.message}`);
    allPassed = false;
  }

  // 3. Test /data-deletion returns HTTP 200
  try {
    const res = await axios.get(`${BASE_URL}/data-deletion`);
    console.log(`[PASS] GET /data-deletion status: ${res.status}`);
  } catch (e: any) {
    console.error(`[FAIL] GET /data-deletion failed: ${e.message}`);
    allPassed = false;
  }

  // 4. Test Meta Data Deletion API POST callback (/api/legal/data-deletion)
  try {
    const res = await axios.post(`${BASE_URL}/api/legal/data-deletion`, {
      userId: '+15559876543',
    });
    console.log(`[PASS] POST /api/legal/data-deletion status: ${res.status}, confirmation_code: ${res.data.confirmation_code}`);
    
    // 5. Test Meta Data Deletion GET status lookup
    const code = res.data.confirmation_code;
    const statusRes = await axios.get(`${BASE_URL}/api/legal/data-deletion/${code}`);
    console.log(`[PASS] GET /api/legal/data-deletion/${code} status: ${statusRes.status}, deletion status: ${statusRes.data.status}`);
  } catch (e: any) {
    console.error(`[FAIL] Meta Data Deletion API test failed: ${e.message}`);
    allPassed = false;
  }

  // 6. Test /data-deletion-callback alias endpoint (for Meta configuration compatibility)
  try {
    const res = await axios.post(`${BASE_URL}/data-deletion-callback`, {
      user_id: 'meta_user_998877',
    });
    console.log(`[PASS] POST /data-deletion-callback status: ${res.status}, confirmation_code: ${res.data.confirmation_code}`);
  } catch (e: any) {
    console.error(`[FAIL] POST /data-deletion-callback failed: ${e.message}`);
    allPassed = false;
  }

  if (allPassed) {
    console.log('\n>>> ALL LEGAL & META DATA DELETION TESTS PASSED! <<<');
  } else {
    console.error('\n>>> SOME TESTS FAILED <<<');
    process.exit(1);
  }
}

testLegalEndpoints();
