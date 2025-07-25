const axios = require('axios');
require('dotenv').config();

async function testExpenseCreditDifference() {
  try {
    console.log('Testing expense-credit difference feature...');
    
    // First, get a token by logging in
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@construction.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');

    // Test the petty cash balances endpoint
    console.log('\nTesting petty cash balances with expense-credit difference...');
    const balancesResponse = await axios.get('http://localhost:3000/api/petty-cash/balances', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Balances response status:', balancesResponse.status);
    console.log('Number of employees with balances:', balancesResponse.data.length);

    // Display detailed analysis for each employee
    balancesResponse.data.forEach(balance => {
      console.log(`\n📊 Employee: ${balance.employee.name}`);
      console.log(`   Current Credit: ${balance.currentBalance} AED`);
      console.log(`   Total Expenses: ${balance.totalExpenses} AED`);
      console.log(`   Difference: ${balance.expenseCreditDifference} AED`);
      
      // Analyze the difference
      if (balance.expenseCreditDifference > 0) {
        console.log(`   ⚠️  STATUS: Employee owes ${balance.expenseCreditDifference} AED`);
        console.log(`   💡 Employee has spent ${balance.expenseCreditDifference} AED more than their credit`);
      } else if (balance.expenseCreditDifference < 0) {
        console.log(`   ✅ STATUS: Employee has ${Math.abs(balance.expenseCreditDifference)} AED surplus`);
        console.log(`   💡 Employee has ${Math.abs(balance.expenseCreditDifference)} AED remaining credit`);
      } else {
        console.log(`   ⚖️  STATUS: Perfectly balanced`);
        console.log(`   💡 Employee's expenses exactly match their credit`);
      }
    });

    // Calculate summary statistics
    const totalCredit = balancesResponse.data.reduce((sum, b) => sum + b.currentBalance, 0);
    const totalExpenses = balancesResponse.data.reduce((sum, b) => sum + b.totalExpenses, 0);
    const totalDifference = balancesResponse.data.reduce((sum, b) => sum + b.expenseCreditDifference, 0);
    
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`   Total Credit Allocated: ${totalCredit} AED`);
    console.log(`   Total Expenses: ${totalExpenses} AED`);
    console.log(`   Net Difference: ${totalDifference} AED`);
    
    if (totalDifference > 0) {
      console.log(`   ⚠️  Overall: Company owes ${totalDifference} AED to employees`);
    } else if (totalDifference < 0) {
      console.log(`   ✅ Overall: Employees have ${Math.abs(totalDifference)} AED surplus`);
    } else {
      console.log(`   ⚖️  Overall: Perfectly balanced system`);
    }

    // Find employees with the highest differences
    const sortedByDifference = balancesResponse.data
      .sort((a, b) => Math.abs(b.expenseCreditDifference) - Math.abs(a.expenseCreditDifference));
    
    console.log('\n🏆 TOP DIFFERENCES:');
    sortedByDifference.slice(0, 3).forEach((balance, index) => {
      console.log(`   ${index + 1}. ${balance.employee.name}: ${balance.expenseCreditDifference} AED`);
    });

    console.log('\n✅ Expense-credit difference feature test completed!');

  } catch (error) {
    console.error('Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testExpenseCreditDifference(); 