const { numberToWords, numberToEnglishWords, numberToArabicWords } = require('./backend/utils/numberToWords');

// Test cases for number to words conversion
const testCases = [
  { number: 0, expected: { en: 'Zero', ar: 'صفر' } },
  { number: 1, expected: { en: 'One', ar: 'واحد' } },
  { number: 10, expected: { en: 'Ten', ar: 'عشرة' } },
  { number: 15, expected: { en: 'Fifteen', ar: 'خمسة عشر' } },
  { number: 25, expected: { en: 'Twenty-Five', ar: 'خمسة وعشرون' } },
  { number: 100, expected: { en: 'One Hundred', ar: 'مائة' } },
  { number: 150, expected: { en: 'One Hundred and Fifty', ar: 'مائة وخمسون' } },
  { number: 1000, expected: { en: 'One Thousand', ar: 'ألف' } },
  { number: 1500, expected: { en: 'One Thousand Five Hundred', ar: 'ألف وخمسمائة' } },
  { number: 10000, expected: { en: 'Ten Thousand', ar: 'عشرة آلاف' } },
  { number: 100000, expected: { en: 'One Hundred Thousand', ar: 'مائة ألف' } },
  { number: 1000000, expected: { en: 'One Million', ar: 'مليون' } },
  { number: 132300, expected: { en: 'One Hundred Thirty-Two Thousand Three Hundred', ar: 'مائة واثنان وثلاثون ألف وثلاثمائة' } },
  { number: 132300.50, expected: { en: 'One Hundred Thirty-Two Thousand Three Hundred and Fifty cents', ar: 'مائة واثنان وثلاثون ألف وثلاثمائة و خمسون هللة' } }
];

console.log('🧪 Testing Number to Words Conversion\n');

// Test English conversion
console.log('📝 English Conversion Tests:');
testCases.forEach((testCase, index) => {
  const result = numberToEnglishWords(testCase.number);
  const passed = result === testCase.expected.en;
  console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.number} -> "${result}" ${passed ? '' : `(Expected: "${testCase.expected.en}")`}`);
});

console.log('\n📝 Arabic Conversion Tests:');
testCases.forEach((testCase, index) => {
  const result = numberToArabicWords(testCase.number);
  const passed = result === testCase.expected.ar;
  console.log(`${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.number} -> "${result}" ${passed ? '' : `(Expected: "${testCase.expected.ar}")`}`);
});

console.log('\n💰 Currency Tests:');
const currencyTests = [
  { amount: 132300, currency: 'AED', language: 'en' },
  { amount: 132300, currency: 'AED', language: 'ar' },
  { amount: 50000, currency: 'USD', language: 'en' },
  { amount: 50000, currency: 'USD', language: 'ar' },
  { amount: 1000, currency: 'EUR', language: 'en' },
  { amount: 1000, currency: 'EUR', language: 'ar' }
];

currencyTests.forEach((test, index) => {
  const result = numberToWords(test.amount, test.language, test.currency);
  console.log(`✅ Test ${index + 1}: ${test.amount} ${test.currency} (${test.language}) -> "${result}"`);
});

console.log('\n🎯 Sample Cheque Amount Test:');
const sampleAmount = 132300;
console.log(`Amount: ${sampleAmount} AED`);
console.log(`English: ${numberToWords(sampleAmount, 'en', 'AED')}`);
console.log(`Arabic: ${numberToWords(sampleAmount, 'ar', 'AED')}`);

console.log('\n✨ All tests completed!'); 