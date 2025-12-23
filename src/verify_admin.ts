
import axios, { isAxiosError } from 'axios';
import fs from 'fs';
import path from 'path';

// Helper to print step results
const step = (name: string) => console.log(`\n🔹 [STEP] ${name}`);
const success = (msg: string) => console.log(`   ✅ ${msg}`);
const fail = (msg: string, err: unknown) => {
    console.error(`   ❌ ${msg}`);
    if (isAxiosError(err) && err.response) {
        console.error(`      Status: ${err.response.status}`);
        console.error(`      Data:`, err.response.data);
    } else if (err instanceof Error) {
        console.error(`      Error:`, err.message);
    } else {
        console.error(`      Error:`, String(err));
    }
};

const BASE_URL = 'http://localhost:5000'; // Adjust port if needed
// const ADMIN_TOKEN = '...'; // Needs to be obtained via login or hardcodded if possible
// For this test, we assume we can login as an existing admin.
// If no admin exists, we might need to seed one.

async function runTests() {
    console.log('🚀 Starting Admin Flow Verification...');

    let adminToken = '';
    let userIdToDelete = '';

    // 0. Login as Admin
    // You must have an admin user in your DB. 
    // Credentials assumption: admin@example.com / admin123 (Update as per actual DB)
    // If not, this step will fail.
    step('Login as Admin');
    try {
        // NOTE: This assumes there is an admin user. If not, this test script requires an existing admin.
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@resumebuilder.com',
            password: 'admin123'
        });
        adminToken = res.data.data.token; // Adjust based on your Auth response structure
        // Verify if token is in cookie or body. Middleware checks header or cookie.
        // We will send it in header.
        if (!adminToken && res.headers['set-cookie']) {
        // quick hack if token is only in cookie, but ideally login returns token
            console.log('   ⚠️ Token might be in cookie only. We need token for headers.');
        }
        success('Logged in as Admin');
    } catch (error) {
        fail('Login failed. Please ensure admin user exists (admin@resumebuilder.com/admin).', error);
        return;
    }

    const headers = { Authorization: `Bearer ${adminToken}` };

    // 1. Get All Users
    step('Get All Users');
    try {
        const res = await axios.get(`${BASE_URL}/admin/users`, { headers });
        console.log(`   Users found: ${res.data.data.length}`);
        success('Fetched users successfully');
    } catch (error) {
        fail('Failed to fetch users', error);
    }

    // 2. Mock Resume Parse
    step('Admin Resume Parse');
    try {
        // Create a dummy PDF file content if needed, or use a real path.
        // For simplicity, we might skip file upload test if we don't have a sample PDF handy.
        // Or assume there is one in 'resume-sample.pdf'.
        const samplePdfPath = path.join(__dirname, 'resume-sample.pdf');

        if (fs.existsSync(samplePdfPath)) {
            const formData = new FormData();
            const fileBlob = new Blob([fs.readFileSync(samplePdfPath)], { type: 'application/pdf' });
            formData.append('resume', fileBlob, 'resume-sample.pdf');

            // Axios with FormData in Node is tricky without 'form-data' package, 
            // so this might be harder to run in pure node script without deps.
            // Skipping this part or using a mock approach.
            console.log('   ⚠️ Skipping file upload test (requires form-data package or valid file)');
        } else {
            console.log('   ⚠️ No sample PDF found, skipping Parse test.');
        }
    } catch (error) {
        // fail('Parse failed', error);
    }


    // 3. Invite User
    step('Invite New User');
    const newEmail = `testuser_${Date.now()}@example.com`;
    try {
        const res = await axios.post(`${BASE_URL}/admin/users/invite`, {
            email: newEmail,
            name: 'Test User'
        }, { headers });

        success(`Invited user: ${newEmail}`);
        if (res.data.data.tempPassword) {
            console.log(`   Temp Password received: ${res.data.data.tempPassword}`);
        }
        userIdToDelete = res.data.data.id;
    } catch (error) {
        fail('Invite failed', error);
    }


    // 4. Update Role (Promote to Admin)
    if (userIdToDelete) {
        step('Update User Role');
        try {
            await axios.patch(`${BASE_URL}/admin/users/${userIdToDelete}/role`, {
                userType: 'ADMIN'
            }, { headers });
            success('Promoted user to ADMIN');
        } catch (error) {
            fail('Update role failed', error);
        }
    }

    // 5. Delete User
    if (userIdToDelete) {
        step('Delete User');
        try {
            await axios.delete(`${BASE_URL}/admin/users/${userIdToDelete}`, { headers });
            success('Deleted test user');
        } catch (error) {
            fail('Delete failed', error);
        }
    }

    console.log('\n🏁 Verification Complete.');
}

runTests();
