const axios = require('axios');
require('dotenv').config();

async function testPettyCashDelete() {
    try {
        console.log('🧪 Testing petty cash delete functionality...');
        
        // Step 1: Login to get token
        console.log('\n1. Logging in...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@construction.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful');

        // Step 2: Get all petty cash transactions
        console.log('\n2. Fetching petty cash transactions...');
        const transactionsResponse = await axios.get('http://localhost:3000/api/petty-cash', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const transactions = transactionsResponse.data.transactions;
        console.log(`✅ Found ${transactions.length} transactions`);

        if (transactions.length === 0) {
            console.log('❌ No transactions found to test delete');
            return;
        }

        // Step 3: Find a transaction to delete (prefer manual transactions)
        const transactionToDelete = transactions.find(t => 
            t.reference_type === 'manual' && 
            (t.type === 'credit' || t.type === 'debit')
        ) || transactions[0];

        console.log('\n3. Selected transaction for deletion:');
        console.log(`   ID: ${transactionToDelete._id}`);
        console.log(`   Type: ${transactionToDelete.type}`);
        console.log(`   Amount: ${transactionToDelete.amount}`);
        console.log(`   Employee: ${transactionToDelete.employee_id?.name || 'N/A'}`);
        console.log(`   Reference Type: ${transactionToDelete.reference_type}`);

        // Step 4: Test delete transaction
        console.log('\n4. Testing delete transaction...');
        try {
            const deleteResponse = await axios.delete(`http://localhost:3000/api/petty-cash/${transactionToDelete._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Transaction deleted successfully');
            console.log('Response:', deleteResponse.data);

            // Step 5: Verify transaction is deleted
            console.log('\n5. Verifying transaction is deleted...');
            try {
                await axios.get(`http://localhost:3000/api/petty-cash/${transactionToDelete._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                console.log('❌ Transaction still exists (should be deleted)');
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log('✅ Transaction successfully deleted (404 Not Found)');
                } else {
                    console.log('❌ Unexpected error:', error.response?.status);
                }
            }

        } catch (error) {
            console.log('❌ Delete failed:', error.response?.status, error.response?.statusText);
            console.log('Error message:', error.response?.data?.message || error.message);
        }

        // Step 6: Test delete non-existent transaction
        console.log('\n6. Testing delete non-existent transaction...');
        try {
            await axios.delete(`http://localhost:3000/api/petty-cash/507f1f77bcf86cd799439011`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('❌ Should have returned 404 for non-existent transaction');
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Correctly returned 404 for non-existent transaction');
            } else {
                console.log('❌ Unexpected error for non-existent transaction:', error.response?.status);
            }
        }

        // Step 7: Test delete without authentication
        console.log('\n7. Testing delete without authentication...');
        try {
            await axios.delete(`http://localhost:3000/api/petty-cash/${transactionToDelete._id}`);
            console.log('❌ Should have returned 401 for unauthorized access');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly returned 401 for unauthorized access');
            } else {
                console.log('❌ Unexpected error for unauthorized access:', error.response?.status);
            }
        }

        console.log('\n🎉 Petty cash delete functionality test completed!');

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testPettyCashDelete(); 