const axios = require('axios');
require('dotenv').config();

async function testVatCalculation() {
    try {
        console.log('🧪 Testing VAT calculation functionality...');
        
        // Step 1: Login to get token
        console.log('\n1. Logging in...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@construction.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Step 2: Get a project for testing
        console.log('\n2. Getting a project for testing...');
        const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const project = projectsResponse.data.projects[0];
        if (!project) {
            console.log('❌ No projects found for testing');
            return;
        }
        console.log(`✅ Using project: ${project.name}`);

        // Step 3: Test expense creation with VAT
        console.log('\n3. Testing expense creation with VAT...');
        const expenseWithVat = {
            project_id: project._id,
            amount: 1000,
            currency: 'AED',
            date: new Date().toISOString().split('T')[0],
            description: 'Test expense with VAT',
            is_vat: true
        };

        try {
            const vatExpenseResponse = await axios.post('http://localhost:3000/api/expenses', expenseWithVat, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const vatExpense = vatExpenseResponse.data;
            console.log('✅ Expense with VAT created successfully');
            console.log(`   Base amount: ${vatExpense.amount} AED`);
            console.log(`   VAT amount: ${vatExpense.vat_amount} AED`);
            console.log(`   Total with VAT: ${vatExpense.amount + vatExpense.vat_amount} AED`);
            console.log(`   VAT rate: ${((vatExpense.vat_amount / vatExpense.amount) * 100).toFixed(1)}%`);

            // Verify VAT calculation
            const expectedVat = vatExpense.amount * 0.05;
            if (Math.abs(vatExpense.vat_amount - expectedVat) < 0.01) {
                console.log('✅ VAT calculation is correct (5%)');
            } else {
                console.log('❌ VAT calculation is incorrect');
                console.log(`   Expected: ${expectedVat}, Got: ${vatExpense.vat_amount}`);
            }

        } catch (error) {
            console.log('❌ Failed to create expense with VAT:', error.response?.status, error.response?.statusText);
            console.log('Error message:', error.response?.data?.message || error.message);
        }

        // Step 4: Test expense creation without VAT
        console.log('\n4. Testing expense creation without VAT...');
        const expenseWithoutVat = {
            project_id: project._id,
            amount: 1000,
            currency: 'AED',
            date: new Date().toISOString().split('T')[0],
            description: 'Test expense without VAT',
            is_vat: false
        };

        try {
            const noVatExpenseResponse = await axios.post('http://localhost:3000/api/expenses', expenseWithoutVat, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const noVatExpense = noVatExpenseResponse.data;
            console.log('✅ Expense without VAT created successfully');
            console.log(`   Base amount: ${noVatExpense.amount} AED`);
            console.log(`   VAT amount: ${noVatExpense.vat_amount} AED`);
            console.log(`   Is VAT: ${noVatExpense.is_vat}`);

            // Verify no VAT calculation
            if (noVatExpense.vat_amount === 0) {
                console.log('✅ No VAT calculation is correct');
            } else {
                console.log('❌ VAT should be 0 for non-VAT expenses');
            }

        } catch (error) {
            console.log('❌ Failed to create expense without VAT:', error.response?.status, error.response?.statusText);
            console.log('Error message:', error.response?.data?.message || error.message);
        }

        // Step 5: Test different amounts
        console.log('\n5. Testing different amounts with VAT...');
        const testAmounts = [100, 500, 1000, 2500, 10000];
        
        for (const amount of testAmounts) {
            const testExpense = {
                project_id: project._id,
                amount: amount,
                currency: 'AED',
                date: new Date().toISOString().split('T')[0],
                description: `Test expense amount ${amount}`,
                is_vat: true
            };

            try {
                const response = await axios.post('http://localhost:3000/api/expenses', testExpense, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const expense = response.data;
                const expectedVat = amount * 0.05;
                const isCorrect = Math.abs(expense.vat_amount - expectedVat) < 0.01;
                
                console.log(`   Amount: ${amount} AED → VAT: ${expense.vat_amount} AED (${isCorrect ? '✅' : '❌'})`);
                
            } catch (error) {
                console.log(`   ❌ Failed for amount ${amount}:`, error.response?.status);
            }
        }

        console.log('\n🎉 VAT calculation functionality test completed!');

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testVatCalculation(); 