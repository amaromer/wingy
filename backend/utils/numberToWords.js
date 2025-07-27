/**
 * Utility functions for converting numbers to words
 * Supports both English and Arabic languages
 */

// English number to words conversion
const englishOnes = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const englishTens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const englishTeens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

// Arabic number to words conversion
const arabicOnes = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const arabicTens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const arabicTeens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

/**
 * Convert a number to English words
 * @param {number} num - The number to convert
 * @returns {string} - The number in words
 */
function numberToEnglishWords(num) {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Negative ' + numberToEnglishWords(Math.abs(num));

  // Handle decimal part
  const decimalPart = Math.round((num % 1) * 100);
  const integerPart = Math.floor(num);

  let result = convertIntegerToEnglish(integerPart);

  if (decimalPart > 0) {
    result += ' and ' + convertIntegerToEnglish(decimalPart) + ' cents';
  }

  return result;
}

/**
 * Convert integer part to English words
 * @param {number} num - The integer to convert
 * @returns {string} - The integer in words
 */
function convertIntegerToEnglish(num) {
  if (num === 0) return '';

  if (num < 10) {
    return englishOnes[num];
  }

  if (num < 20) {
    return englishTeens[num - 10];
  }

  if (num < 100) {
    const ones = num % 10;
    const tens = Math.floor(num / 10);
    return englishTens[tens] + (ones > 0 ? '-' + englishOnes[ones] : '');
  }

  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    return englishOnes[hundreds] + ' Hundred' + (remainder > 0 ? ' and ' + convertIntegerToEnglish(remainder) : '');
  }

  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertIntegerToEnglish(thousands) + ' Thousand' + (remainder > 0 ? ' ' + convertIntegerToEnglish(remainder) : '');
  }

  if (num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    return convertIntegerToEnglish(millions) + ' Million' + (remainder > 0 ? ' ' + convertIntegerToEnglish(remainder) : '');
  }

  const billions = Math.floor(num / 1000000000);
  const remainder = num % 1000000000;
  return convertIntegerToEnglish(billions) + ' Billion' + (remainder > 0 ? ' ' + convertIntegerToEnglish(remainder) : '');
}

/**
 * Convert a number to Arabic words
 * @param {number} num - The number to convert
 * @returns {string} - The number in Arabic words
 */
function numberToArabicWords(num) {
  if (num === 0) return 'صفر';
  if (num < 0) return 'سالب ' + numberToArabicWords(Math.abs(num));

  // Handle decimal part
  const decimalPart = Math.round((num % 1) * 100);
  const integerPart = Math.floor(num);

  let result = convertIntegerToArabic(integerPart);

  if (decimalPart > 0) {
    result += ' و ' + convertIntegerToArabic(decimalPart) + ' هللة';
  }

  return result;
}

/**
 * Convert integer part to Arabic words
 * @param {number} num - The integer to convert
 * @returns {string} - The integer in Arabic words
 */
function convertIntegerToArabic(num) {
  if (num === 0) return '';

  if (num < 10) {
    return arabicOnes[num];
  }

  if (num < 20) {
    return arabicTeens[num - 10];
  }

  if (num < 100) {
    const ones = num % 10;
    const tens = Math.floor(num / 10);
    
    if (ones === 0) {
      return arabicTens[tens];
    } else if (ones === 1) {
      return 'واحد و' + arabicTens[tens];
    } else if (ones === 2) {
      return 'اثنان و' + arabicTens[tens];
    } else {
      return arabicOnes[ones] + ' و' + arabicTens[tens];
    }
  }

  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    
    let result = '';
    if (hundreds === 1) {
      result = 'مائة';
    } else if (hundreds === 2) {
      result = 'مئتان';
    } else {
      result = arabicOnes[hundreds] + 'مائة';
    }
    
    return result + (remainder > 0 ? ' و' + convertIntegerToArabic(remainder) : '');
  }

  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    
    let result = '';
    if (thousands === 1) {
      result = 'ألف';
    } else if (thousands === 2) {
      result = 'ألفان';
    } else if (thousands < 11) {
      result = arabicOnes[thousands] + ' آلاف';
    } else {
      result = convertIntegerToArabic(thousands) + ' ألف';
    }
    
    return result + (remainder > 0 ? ' و' + convertIntegerToArabic(remainder) : '');
  }

  if (num < 1000000000) {
    const millions = Math.floor(num / 1000000);
    const remainder = num % 1000000;
    
    let result = '';
    if (millions === 1) {
      result = 'مليون';
    } else if (millions === 2) {
      result = 'مليونان';
    } else if (millions < 11) {
      result = arabicOnes[millions] + ' ملايين';
    } else {
      result = convertIntegerToArabic(millions) + ' مليون';
    }
    
    return result + (remainder > 0 ? ' و' + convertIntegerToArabic(remainder) : '');
  }

  const billions = Math.floor(num / 1000000000);
  const remainder = num % 1000000000;
  
  let result = '';
  if (billions === 1) {
    result = 'مليار';
  } else if (billions === 2) {
    result = 'ملياران';
  } else if (billions < 11) {
    result = arabicOnes[billions] + ' مليارات';
  } else {
    result = convertIntegerToArabic(billions) + ' مليار';
  }
  
  return result + (remainder > 0 ? ' و' + convertIntegerToArabic(remainder) : '');
}

/**
 * Convert number to words based on language
 * @param {number} num - The number to convert
 * @param {string} language - The language ('en' or 'ar')
 * @param {string} currency - The currency code
 * @returns {string} - The number in words with currency
 */
function numberToWords(num, language = 'en', currency = 'AED') {
  const currencyNames = {
    'AED': { en: 'Dirhams', ar: 'درهم' },
    'USD': { en: 'Dollars', ar: 'دولار' },
    'EUR': { en: 'Euros', ar: 'يورو' },
    'GBP': { en: 'Pounds', ar: 'جنيه' },
    'SAR': { en: 'Riyals', ar: 'ريال' },
    'QAR': { en: 'Qatar Riyals', ar: 'ريال قطري' },
    'KWD': { en: 'Kuwaiti Dinars', ar: 'دينار كويتي' },
    'BHD': { en: 'Bahraini Dinars', ar: 'دينار بحريني' },
    'OMR': { en: 'Omani Rials', ar: 'ريال عماني' },
    'JOD': { en: 'Jordanian Dinars', ar: 'دينار أردني' }
  };

  const currencyName = currencyNames[currency] || currencyNames['AED'];
  
  if (language === 'ar') {
    return numberToArabicWords(num) + ' ' + currencyName.ar;
  } else {
    return numberToEnglishWords(num) + ' ' + currencyName.en;
  }
}

module.exports = {
  numberToWords,
  numberToEnglishWords,
  numberToArabicWords
}; 