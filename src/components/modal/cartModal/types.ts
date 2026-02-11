import { Dayjs } from "dayjs";

// Ethiopian Banks List with categories
export const ethiopianBanks = [
  "Commercial Bank of Ethiopia",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
  "Wegagen Bank",
  "Nib International Bank",
  "Cooperative Bank of Oromia",
  "Hibret Bank",
  "Abay Bank",
  "Addis International Bank",
  "Zemen Bank",
  "Bunna International Bank",
  "Berhan International Bank",
  "Lion International Bank",
  "Enat Bank",
  "Oromia International Bank",
  "United Bank",
  "Beltel Bank",
  "Hijira Bank",
  "zemzem Bank",
  "OTHER",
];

// Payment method constants
export const PAYMENT_METHODS = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  TELEBIRR: "TELEBIRR",
  PARTIAL: "PARTIAL",
  SPLIT: "SPLIT",
  OTHER: "OTHER",
} as const;

export type PaymentMethodType = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Split payment method constants (subset of payment methods)
export const SPLIT_PAYMENT_METHODS = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  TELEBIRR: "TELEBIRR",
  OTHER: "OTHER",
} as const;



export type SplitPaymentMethodType = typeof SPLIT_PAYMENT_METHODS[keyof typeof SPLIT_PAYMENT_METHODS];

export type CartItem = {
  id: number;
  code: string;
  name: string;
  price: number;
  qtyPerCarton: number;
  availableStock: number;
  availableCartons: number;
  quantity: number;
  useCustomPrice: boolean;
  customPrice: number | null;
  allowNegativeStock: boolean;
  unit: string;
  // Optional calculated fields
  itemTotal?: number;
  stockStatus?: StockStatus;
};

export type PaymentDetails = {
  [key: string]: string | number | undefined | null | PaymentSplit[];
  paidAmount?: number;
  remainingAmount?: number;
  bankName?: string;
  senderName?: string;
  receiverName?: string;
  telebirrPhone?: string;
  telebirrTransactionId?: string;
  firstPaymentMethod?: string;
  paymentNotes?: string;
  dueDate?: string;
  dateOfSelling?: string;
  otherMethod?: string;
  otherReference?: string;
  firstPaymentBank?: string;
  firstPaymentReference?: string;
  firstPaymentPhone?: string;
  firstPaymentDetails?: string;
  paymentSplits?: PaymentSplit[]; // Added to PaymentDetails
};

export type PaymentSplit = {
  id: string;
  method: SplitPaymentMethodType;
  amount: number;
  percentage: number;
  bankName?: string;
  senderName?: string;
  receiverName?: string;
  telebirrPhone?: string;
  telebirrTransactionId?: string;
  reference?: string;
  otherDetails?: string; // Renamed from otherMethod for consistency
  // Validation flags
  isValid?: boolean;
  errorMessage?: string;
};

export type BulkSalePayload = {
  productId: number;
  code: string;
  name: string;
  ctn: number;
  productPrice: number;
  totalAmount: number;
  useCustomPrice: boolean;
  customPricePerPiece: number | null;
  allowNegativeStock: boolean;
  buyerName: string;
  casherName: string;
  date: Date | string;
  paymentMethod: PaymentMethodType;
  paidAmount: number;
  remainingAmount: number;
  bankName?: string;
  senderName?: string;
  receiverName?: string;
  telebirrPhone?: string;
  telebirrTransactionId?: string;
  firstPaymentMethod?: string;
  paymentNotes?: string;
  otherMethod?: string;
  otherReference?: string;
  firstPaymentBank?: string;
  firstPaymentReference?: string;
  firstPaymentPhone?: string;
  firstPaymentDetails?: string;
  paymentDistribution?: {
    totalCartAmount: number;
    paidPercentage: number;
    itemSharePercentage: number;
  };
  partialPaymentDetails?: {
    totalCartAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paidPercentage: number;
    distributionMethod: "PROPORTIONAL";
  };
  paymentSplits?: PaymentSplit[];
  // Additional metadata
  metadata?: {
    cartItemIndex?: number;
    originalCartItem?: CartItem;
    calculatedAt?: string;
  };
};

export interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  onClearCart: () => void;
  onBulkSale: (
    salesData: BulkSalePayload[]
  ) => Promise<{ successCount: number; failedCount: number }>;
  currentBuyer: string;
  onBuyerChange: (value: string) => void;
  paymentMethod: PaymentMethodType;
  onPaymentMethodChange: (value: PaymentMethodType) => void;
  paymentDetails: PaymentDetails;
  onPaymentDetailChange: (
    field: keyof PaymentDetails,
    value: string | number | null | PaymentSplit[]
  ) => void;
  isProcessing: boolean;
  calculateCartTotal: () => number;
  updateCartItem: (productId: number, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: number) => void;
  calculateTotalCartItems: () => number;
  // Optional validation callback
  onValidationError?: (errors: string[]) => void;
}

export interface StockStatus {
  availableCartons: number;
  availablePieces: number;
  requestedCartons: number;
  totalRequestedPieces: number;
  isNegativeStock: boolean;
  shortageCartons: number;
  shortagePieces: number;
  hasEnoughStock: boolean;
  // Additional helpful fields
  piecesPerCarton: number;
  maxAllowedCartons: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "NEGATIVE_ALLOWED";
  message?: string;
}

export interface ProportionalPayment {
  totalCartAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidPercentage: number;
  itemPayments: Array<{
    itemId: number;
    itemName: string;
    itemTotal: number;
    itemPaidAmount: number;
    itemRemainingAmount: number;
    paidPercentage: number;
    // Remove these if you want to keep it simple:
    // proportionalShare: number;
    // isFullyPaid: boolean;
  }>;
}

// New: Split Payment Summary
export interface SplitPaymentSummary {
  totalAmount: number;
  splitTotal: number;
  remainingAmount: number;
  percentageTotal: number;
  isBalanced: boolean;
  splits: Array<{
    method: SplitPaymentMethodType;
    amount: number;
    percentage: number;
    count: number;
  }>;
}

// New: Cart Summary
export interface CartSummary {
  totalItems: number;
  totalCartons: number;
  totalPieces: number;
  totalValue: number;
  itemsNeedingAttention: number;
  availableCartons: number;
  availablePieces: number;
  shortageCartons: number;
  shortagePieces: number;
  // Category breakdown
  byStockStatus: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
    negativeAllowed: number;
  };
}

// New: Payment Validation Result
export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    method: PaymentMethodType;
    paidAmount: number;
    totalAmount: number;
    remainingAmount: number;
    isPartial: boolean;
    isSplit: boolean;
    isFull: boolean;
  };
}

// Helper type guards - FIXED: Use the string literal values directly
export const isSplitPayment = (method: PaymentMethodType): method is "SPLIT" => {
  return method === PAYMENT_METHODS.SPLIT;
};

export const isPartialPayment = (method: PaymentMethodType): method is "PARTIAL" => {
  return method === PAYMENT_METHODS.PARTIAL;
};

// FIXED: These functions now properly handle both types
export const isBankTransfer = (method: PaymentMethodType | SplitPaymentMethodType | string): boolean => {
  return method === PAYMENT_METHODS.BANK_TRANSFER || method === SPLIT_PAYMENT_METHODS.BANK_TRANSFER;
};

export const isTelebirr = (method: PaymentMethodType | SplitPaymentMethodType | string): boolean => {
  return method === PAYMENT_METHODS.TELEBIRR || method === SPLIT_PAYMENT_METHODS.TELEBIRR;
};

// FIXED: Added a utility to safely check if method is Telebirr without type issues
export const isTelebirrPayment = (method: string): method is "TELEBIRR" => {
  return method === "TELEBIRR";
};

// Helper function to create payment splits
export const createPaymentSplit = (partial?: Partial<PaymentSplit>): PaymentSplit => {
  return {
    id: `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    method: SPLIT_PAYMENT_METHODS.CASH,
    amount: 0,
    percentage: 0,
    isValid: true,
    ...partial,
  };
};

// Helper function to validate payment split
export const validatePaymentSplit = (split: PaymentSplit): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!split.method) {
    errors.push("Payment method is required");
  }
  
  if (split.amount <= 0) {
    errors.push("Amount must be greater than 0");
  }
  
  if (split.percentage < 0 || split.percentage > 100) {
    errors.push("Percentage must be between 0 and 100");
  }
  
  // Method-specific validations
  switch (split.method) {
    case "BANK_TRANSFER":
      if (!split.bankName) {
        errors.push("Bank name is required for bank transfer");
      }
      break;
    case "TELEBIRR":
      if (!split.telebirrPhone) {
        errors.push("Phone number is required for Telebirr");
      }
      break;
    case "CASH":
    case "OTHER":
      // No specific validations for these methods
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to calculate split totals
export const calculateSplitTotals = (splits: PaymentSplit[]): {
  totalAmount: number;
  totalPercentage: number;
  isBalanced: boolean;
} => {
  const totalAmount = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  
  return {
    totalAmount,
    totalPercentage,
    isBalanced: Math.abs(totalPercentage - 100) < 0.01 // Allow 0.01% tolerance
  };
};

// Helper function to normalize splits
export const normalizeSplits = (
  splits: PaymentSplit[], 
  targetTotal: number
): PaymentSplit[] => {
  const currentTotal = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
  
  if (Math.abs(currentTotal - targetTotal) < 0.01 || currentTotal === 0) {
    return splits;
  }
  
  const ratio = targetTotal / currentTotal;
  
  return splits.map(split => ({
    ...split,
    amount: parseFloat((split.amount * ratio).toFixed(2)),
    percentage: parseFloat(((split.amount * ratio / targetTotal) * 100).toFixed(2))
  }));
};

// Helper function to create ProportionalPayment with all required fields
export const createProportionalPayment = (
  cartItems: CartItem[],
  paidAmount: number
): ProportionalPayment => {
  const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
  const paidPercentage = totalCartAmount > 0 ? (paidAmount / totalCartAmount) * 100 : 0;
  
  const itemPayments = cartItems.map(item => {
    const itemTotal = item.itemTotal || 0;
    const itemPaidAmount = (itemTotal / totalCartAmount) * paidAmount;
    const itemRemainingAmount = itemTotal - itemPaidAmount;
    const itemPaidPercentage = itemTotal > 0 ? (itemPaidAmount / itemTotal) * 100 : 0;
    
    return {
      itemId: item.id,
      itemName: item.name,
      itemTotal,
      itemPaidAmount,
      itemRemainingAmount,
      paidPercentage: itemPaidPercentage,
    };
  });
  
  return {
    totalCartAmount,
    paidAmount,
    remainingAmount: totalCartAmount - paidAmount,
    paidPercentage,
    itemPayments,
  };
};

// Type for bulk sale response
export interface BulkSaleResponse {
  successCount: number;
  failedCount: number;
  results: Array<{
    productId: number;
    productName: string;
    success: boolean;
    message?: string;
    error?: string;
    saleId?: number;
  }>;
  summary: {
    total: number;
    success: number;
    failed: number;
    successRate: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
  };
}

