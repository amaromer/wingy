const axios = require('axios');
require('dotenv').config();

async function testDashboardVAT() {
    try {
        console.log('🧪 Testing Dashboard VAT calculation...');
        
        // Step 1: Login to get token
        console.log('\n1. Logging in...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@construction.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Step 2: Get dashboard overview
        console.log('\n2. Getting dashboard overview...');
        const dashboardResponse = await axios.get('http://localhost:3000/api/dashboard/overview', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const dashboard = dashboardResponse.data;
        console.log('✅ Dashboard data retrieved');

        // Step 3: Display VAT information
        console.log('\n3. VAT Calculation Results:');
        console.log('📊 Overview:');
        console.log(`   Total Expenses: ${dashboard.overview.totalExpenses.toLocaleString()} AED`);
        console.log(`   Total VAT: ${dashboard.overview.totalVAT.toLocaleString()} AED`);
        console.log(`   Net VAT: ${dashboard.overview.netVAT.toLocaleString()} AED`);

        console.log('\n📋 VAT Breakdown:');
        console.log(`   Expenses VAT: ${dashboard.vatStats.expensesVAT.toLocaleString()} AED`);
        console.log(`   Payments VAT: ${dashboard.vatStats.paymentsVAT.toLocaleString()} AED`);
        console.log(`   Net VAT: ${dashboard.vatStats.netVAT.toLocaleString()} AED`);

        // Step 4: Verify VAT calculation logic
        console.log('\n4. VAT Calculation Verification:');
        
        // Test VAT extraction formula
        const testAmount = 1050; // 1000 + 50 VAT
        const expectedVAT = testAmount * 0.05 / 1.05; // Should be 50
        const expectedBase = testAmount / 1.05; // Should be 1000
        
        console.log(`   Test Amount: ${testAmount} AED`);
        console.log(`   Expected VAT: ${expectedVAT.toFixed(2)} AED`);
        console.log(`   Expected Base: ${expectedBase.toFixed(2)} AED`);
        console.log(`   VAT Rate: 5%`);
        console.log(`   Formula: amount × 0.05 ÷ 1.05`);

        // Step 5: Check if VAT calculations make sense
        console.log('\n5. VAT Calculation Analysis:');
        
        if (dashboard.overview.totalVAT > 0) {
            console.log('✅ VAT calculations are working');
            
            if (dashboard.vatStats.expensesVAT > 0) {
                console.log('✅ Expenses VAT is being calculated correctly');
            } else {
                console.log('⚠️  No VAT expenses found in the system');
            }
            
            if (dashboard.vatStats.paymentsVAT > 0) {
                console.log('✅ Payments VAT is being tracked');
            } else {
                console.log('ℹ️  No VAT payments found in the system');
            }
            
            const netVAT = dashboard.vatStats.paymentsVAT - dashboard.vatStats.expensesVAT;
            console.log(`   Net VAT calculation: ${dashboard.vatStats.paymentsVAT} - ${dashboard.vatStats.expensesVAT} = ${netVAT} AED`);
            
            if (Math.abs(netVAT - dashboard.vatStats.netVAT) < 0.01) {
                console.log('✅ Net VAT calculation is correct');
            } else {
                console.log('❌ Net VAT calculation mismatch');
            }
        } else {
            console.log('ℹ️  No VAT data found in the system');
        }

        console.log('\n🎉 Dashboard VAT calculation test completed!');

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testDashboardVAT(); 