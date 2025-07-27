const fs = require('fs');

try {
    const arabicJson = fs.readFileSync('frontend/src/assets/i18n/ar.json', 'utf8');
    JSON.parse(arabicJson);
    console.log('✅ Arabic JSON file is valid!');
    
    // Check for specific translations
    const data = JSON.parse(arabicJson);
    
    console.log('\n📋 Checking key translations:');
    
    // Check PETTY_CASH section
    if (data.PETTY_CASH) {
        console.log('✅ PETTY_CASH section exists');
        
        if (data.PETTY_CASH.BALANCES) {
            console.log('✅ PETTY_CASH.BALANCES section exists');
            
            const requiredBalances = [
                'EMPLOYEE_BALANCES',
                'RECENT_TRANSACTIONS', 
                'TOTAL_EXPENSES',
                'EXPENSE_CREDIT_DIFFERENCE'
            ];
            
            requiredBalances.forEach(key => {
                if (data.PETTY_CASH.BALANCES[key]) {
                    console.log(`✅ PETTY_CASH.BALANCES.${key}: "${data.PETTY_CASH.BALANCES[key]}"`);
                } else {
                    console.log(`❌ Missing: PETTY_CASH.BALANCES.${key}`);
                }
            });
        } else {
            console.log('❌ Missing PETTY_CASH.BALANCES section');
        }
        
        if (data.PETTY_CASH.SUMMARY) {
            console.log('✅ PETTY_CASH.SUMMARY section exists');
        } else {
            console.log('❌ Missing PETTY_CASH.SUMMARY section');
        }
    } else {
        console.log('❌ Missing PETTY_CASH section');
    }
    
    // Check HR module sections
    const hrSections = ['EMPLOYEE', 'PAYROLL', 'OVERTIME'];
    hrSections.forEach(section => {
        if (data[section]) {
            console.log(`✅ ${section} section exists`);
        } else {
            console.log(`❌ Missing ${section} section`);
        }
    });
    
    console.log('\n🎉 Arabic translation file validation completed!');
    
} catch (error) {
    console.error('❌ Arabic JSON file has errors:');
    console.error(error.message);
    
    // Try to find the line with the error
    const lines = fs.readFileSync('frontend/src/assets/i18n/ar.json', 'utf8').split('\n');
    console.error('\nError details:');
    console.error('Line number might be around:', error.message.match(/position (\d+)/)?.[1] || 'unknown');
} 