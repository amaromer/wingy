// Test VAT calculation fix
const testAmounts = [15, 100, 1000, 50.50, 123.45];

console.log('Testing VAT calculation (VAT-inclusive approach):');
console.log('Total Amount | VAT Amount | Base Amount');
console.log('----------------------------------------');

testAmounts.forEach(amount => {
  const vatAmount = amount * 0.05 / 1.05;
  const baseAmount = amount - vatAmount;
  
  console.log(`${amount.toFixed(2)} AED | ${vatAmount.toFixed(2)} AED | ${baseAmount.toFixed(2)} AED`);
});

console.log('\nExpected results:');
console.log('15.00 AED → VAT: 0.71 AED → Base: 14.29 AED');
console.log('100.00 AED → VAT: 4.76 AED → Base: 95.24 AED');
console.log('1000.00 AED → VAT: 47.62 AED → Base: 952.38 AED'); 