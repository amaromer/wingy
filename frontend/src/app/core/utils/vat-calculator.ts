export class VatCalculator {
  private static readonly VAT_RATE = 0.05; // 5%

  /**
   * Calculate VAT amount from a VAT-inclusive amount
   * @param totalAmount - The total amount including VAT
   * @param isVat - Whether the expense is subject to VAT
   * @returns The VAT amount (0 if not subject to VAT)
   */
  static calculateVat(totalAmount: number, isVat: boolean): number {
    if (!isVat || totalAmount <= 0) {
      return 0;
    }
    // VAT is included in the amount, so extract it
    return totalAmount * this.VAT_RATE / (1 + this.VAT_RATE);
  }

  /**
   * Calculate base amount (excluding VAT) from total amount
   * @param totalAmount - The total amount including VAT
   * @param isVat - Whether the expense is subject to VAT
   * @returns The base amount excluding VAT
   */
  static calculateBaseAmount(totalAmount: number, isVat: boolean): number {
    if (!isVat || totalAmount <= 0) {
      return totalAmount;
    }
    return totalAmount / (1 + this.VAT_RATE);
  }

  /**
   * Get total amount (same as input since VAT is included)
   * @param totalAmount - The total amount including VAT
   * @param isVat - Whether the expense is subject to VAT
   * @returns The total amount (same as input)
   */
  static calculateTotalWithVat(totalAmount: number, isVat: boolean): number {
    return totalAmount; // VAT is already included
  }

  /**
   * Format VAT amount as currency
   * @param vatAmount - The VAT amount
   * @param currency - The currency code (default: AED)
   * @returns Formatted VAT amount
   */
  static formatVatAmount(vatAmount: number, currency: string = 'AED'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(vatAmount);
  }

  /**
   * Get VAT rate as percentage
   * @returns VAT rate as percentage string
   */
  static getVatRatePercentage(): string {
    return `${(this.VAT_RATE * 100)}%`;
  }

  /**
   * Get VAT rate as decimal
   * @returns VAT rate as decimal number
   */
  static getVatRate(): number {
    return this.VAT_RATE;
  }
} 