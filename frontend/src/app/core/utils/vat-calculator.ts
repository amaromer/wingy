export class VATCalculator {
  private static readonly VAT_RATE = 0.05; // 5% VAT
  private static readonly TAX_CYCLE_START_MONTH = 5; // June (0-indexed)
  private static readonly TAX_CYCLE_DURATION_MONTHS = 3;

  /**
   * Calculate VAT amount based on whether VAT is included in the amount
   */
  static calculateVATAmount(amount: number, isVATIncluded: boolean): number {
    if (isVATIncluded) {
      return amount * this.VAT_RATE / (1 + this.VAT_RATE);
    } else {
      return amount * this.VAT_RATE;
    }
  }

  /**
   * Calculate total amount including VAT
   */
  static calculateTotalAmount(amount: number, vatAmount: number): number {
    return amount + vatAmount;
  }

  /**
   * Get the current tax cycle period
   */
  static getCurrentTaxCycle(): { start: Date; end: Date; period: string } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let cycleStartYear = currentYear;
    let cycleStartMonth = this.TAX_CYCLE_START_MONTH;

    // If current month is before June, use previous year's cycle
    if (currentMonth < this.TAX_CYCLE_START_MONTH) {
      cycleStartYear = currentYear - 1;
    }

    const cycleStart = new Date(cycleStartYear, cycleStartMonth, 1);
    const cycleEnd = new Date(cycleStartYear, cycleStartMonth + this.TAX_CYCLE_DURATION_MONTHS, 0, 23, 59, 59);

    const period = `${cycleStart.getFullYear()}-${(cycleStart.getMonth() + 1).toString().padStart(2, '0')} to ${cycleEnd.getFullYear()}-${(cycleEnd.getMonth() + 1).toString().padStart(2, '0')}`;

    return { start: cycleStart, end: cycleEnd, period };
  }

  /**
   * Check if a date falls within the current tax cycle
   */
  static isInCurrentTaxCycle(date: Date): boolean {
    const cycle = this.getCurrentTaxCycle();
    return date >= cycle.start && date <= cycle.end;
  }

  /**
   * Get all tax cycles for a given year range
   */
  static getTaxCycles(startYear: number, endYear: number): Array<{ start: Date; end: Date; period: string }> {
    const cycles = [];
    
    for (let year = startYear; year <= endYear; year++) {
      const cycleStart = new Date(year, this.TAX_CYCLE_START_MONTH, 1);
      const cycleEnd = new Date(year, this.TAX_CYCLE_START_MONTH + this.TAX_CYCLE_DURATION_MONTHS, 0, 23, 59, 59);
      
      const period = `${cycleStart.getFullYear()}-${(cycleStart.getMonth() + 1).toString().padStart(2, '0')} to ${cycleEnd.getFullYear()}-${(cycleEnd.getMonth() + 1).toString().padStart(2, '0')}`;
      
      cycles.push({ start: cycleStart, end: cycleEnd, period });
    }
    
    return cycles;
  }

  /**
   * Calculate VAT for a main category (0% if no supplier)
   */
  static calculateVATForMainCategory(amount: number, isVATIncluded: boolean, hasSupplier: boolean): number {
    if (!hasSupplier) {
      return 0; // VAT is always 0% when no supplier is required
    }
    return this.calculateVATAmount(amount, isVATIncluded);
  }

  /**
   * Format VAT amount for display
   */
  static formatVATAmount(amount: number, currency: string = 'AED'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get VAT summary for a period
   */
  static getVATSummary(expenses: any[], payments: any[]): {
    totalVAT: number;
    expensesVAT: number;
    paymentsVAT: number;
    netVAT: number;
  } {
    const expensesVAT = expenses.reduce((sum, expense) => {
      if (expense.is_vat) {
        return sum + this.calculateVATAmount(expense.amount, false);
      }
      return sum;
    }, 0);

    const paymentsVAT = payments.reduce((sum, payment) => {
      return sum + payment.vat_amount;
    }, 0);

    const totalVAT = expensesVAT + paymentsVAT;
    const netVAT = paymentsVAT - expensesVAT; // Positive means VAT collected > VAT paid

    return {
      totalVAT,
      expensesVAT,
      paymentsVAT,
      netVAT
    };
  }
} 