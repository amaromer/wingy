export interface ChequeFieldPosition {
  top: string;
  left: string;
  width?: string;
  height?: string;
  fontSize: string;
  textAlign?: 'left' | 'right' | 'center';
  maxWidth?: string;
  lineHeight?: string;
}

export interface ChequePrintConfig {
  container: {
    width: string;
    height: string;
  };
  fields: {
    date: ChequeFieldPosition;
    payee: ChequeFieldPosition;
    amount: ChequeFieldPosition;
    amountWords: ChequeFieldPosition;
  };
  background: {
    imageUrl: string;
    opacity: number;
  };
}

// Standard cheque configuration (216mm x 89mm)
export const STANDARD_CHEQUE_CONFIG: ChequePrintConfig = {
  container: {
    width: '216mm',
    height: '89mm'
  },
  fields: {
    date: {
      top: '40mm',
      left: '20mm',
      width: '80mm',
      fontSize: '24px',
      textAlign: 'right'
    },
    payee: {
      top: '35mm',
      left: '15mm',
      maxWidth: '120mm',
      fontSize: '14px',
      textAlign: 'left'
    },
    amount: {
      top: '35mm',
      left: '150mm',
      width: '60mm',
      fontSize: '16px',
      textAlign: 'right'
    },
    amountWords: {
      top: '50mm',
      left: '15mm',
      maxWidth: '140mm',
      height: '20mm',
      fontSize: '11px',
      lineHeight: '1.2',
      textAlign: 'left'
    }
  },
  background: {
    imageUrl: '/assets/cheaque.jpg',
    opacity: 0.1
  }
};

// A4 cheque configuration (210mm x 297mm)
export const A4_CHEQUE_CONFIG: ChequePrintConfig = {
  container: {
    width: '210mm',
    height: '297mm'
  },
  fields: {
    date: {
      top: '50mm',
      left: '120mm',
      width: '80mm',
      fontSize: '14px',
      textAlign: 'right'
    },
    payee: {
      top: '80mm',
      left: '20mm',
      maxWidth: '180mm',
      fontSize: '16px',
      textAlign: 'left'
    },
    amount: {
      top: '80mm',
      left: '120mm',
      width: '80mm',
      fontSize: '18px',
      textAlign: 'right'
    },
    amountWords: {
      top: '110mm',
      left: '20mm',
      maxWidth: '180mm',
      height: '40mm',
      fontSize: '12px',
      lineHeight: '1.3',
      textAlign: 'left'
    }
  },
  background: {
    imageUrl: '/assets/cheaque.jpg',
    opacity: 0.1
  }
};

// Custom configuration for specific bank cheques
export const ADCB_CHEQUE_CONFIG: ChequePrintConfig = {
  container: {
    width: '216mm',
    height: '110mm'
  },
      fields: {
      date: {
        top: '24mm',
        left: '124mm',
        width: '65mm',
        fontSize: '17px',
        textAlign: 'right'
      },
      payee: {
        top: '40mm',
        left: '134mm',
        maxWidth: '125mm',
        fontSize: '30px',
        textAlign: 'right'
      },
      amount: {
        top: '62mm',
        left: '125mm',
        width: '65mm',
        fontSize: '22px',
        textAlign: 'right'
      },
      amountWords: {
        top: '54mm',
        left: '56mm',
        maxWidth: '145mm',
        height: '25mm',
        fontSize: '23px',
        lineHeight: '1.1',
        textAlign: 'left'
      }
    },
  background: {
    imageUrl: '/assets/cheaque.jpg',
    opacity: 0.15
  }
};

// Default configuration
export const DEFAULT_CHEQUE_CONFIG = ADCB_CHEQUE_CONFIG; 