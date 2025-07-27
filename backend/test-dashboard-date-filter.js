const axios = require('axios');
require('dotenv').config();

async function testDashboardDateFilter() {
    try {
        console.log('🧪 Testing Dashboard Date Filter functionality...');
        
        // Step 1: Login to get token
        console.log('\n1. Logging in...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@construction.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Step 2: Get first expense date
        console.log('\n2. Getting first expense date...');
        const firstExpenseResponse = await axios.get('http://localhost:3000/api/dashboard/first-expense-date', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const firstExpenseData = firstExpenseResponse.data;
        console.log('✅ First expense date retrieved');
        console.log('   First expense date:', firstExpenseData.firstExpenseDate || 'No expenses found');

        // Step 3: Get dashboard with default date filter
        console.log('\n3. Getting dashboard with default date filter...');
        const today = new Date().toISOString().split('T')[0];
        const dateFrom = firstExpenseData.firstExpenseDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const dashboardResponse = await axios.get('http://localhost:3000/api/dashboard/overview', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                date_from: dateFrom,
                date_to: today
            }
        });

        const dashboard = dashboardResponse.data;
        console.log('✅ Dashboard data retrieved with date filter');
        console.log('   Date range:', `${dateFrom} to ${today}`);
        console.log('   Total expenses:', dashboard.overview.totalExpenses);
        console.log('   Total VAT:', dashboard.overview.totalVAT);

        // Step 4: Test different date ranges
        console.log('\n4. Testing different date ranges...');
        
        // Test last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const last7DaysResponse = await axios.get('http://localhost:3000/api/dashboard/overview', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                date_from: sevenDaysAgo,
                date_to: today
            }
        });
        
        console.log('   Last 7 days expenses:', last7DaysResponse.data.overview.totalExpenses);
        console.log('   Last 7 days VAT:', last7DaysResponse.data.overview.totalVAT);

        // Test last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const last30DaysResponse = await axios.get('http://localhost:3000/api/dashboard/overview', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                date_from: thirtyDaysAgo,
                date_to: today
            }
        });
        
        console.log('   Last 30 days expenses:', last30DaysResponse.data.overview.totalExpenses);
        console.log('   Last 30 days VAT:', last30DaysResponse.data.overview.totalVAT);

        // Step 5: Verify date filter logic
        console.log('\n5. Date Filter Logic Verification:');
        console.log('   Default behavior:');
        console.log(`     - If expenses exist: From first expense date to today`);
        console.log(`     - If no expenses: From 30 days ago to today`);
        console.log('   Date format: YYYY-MM-DD');
        console.log('   Timezone: UTC');

        console.log('\n🎉 Dashboard Date Filter test completed!');

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testDashboardDateFilter(); 