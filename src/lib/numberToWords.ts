export function numberToWordsIndian(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    } else {
      str += a[n];
    }
    return str;
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'Zero Rupees Only';

  let result = '';

  const crores = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;

  const lakhs = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousands = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundreds = Math.floor(rem / 100);
  const tens = rem % 100;

  if (crores > 0) {
    result += (crores > 99 ? inWords(crores) : inWords(crores)) + ' Crore ';
  }
  if (lakhs > 0) {
    result += inWords(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    result += inWords(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    result += inWords(hundreds) + ' Hundred ';
  }
  if (tens > 0) {
    if (result !== '') result += 'and ';
    result += inWords(tens) + ' ';
  }

  result = result.trim() + ' Rupees';

  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart) + ' Paise';
  }

  return result + ' Only';
}
