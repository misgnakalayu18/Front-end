// sale.type.ts - Updated to match actual API response
export interface ISale {
  product: string;
  qty: number;
  totalPrice: number;
  paymentMethod: string;
  ctn: number;
  unit: string;
  code: string;
  buyerName: string;
  date: string;
  price: number;
}

export interface ITableSale {
  originalDate: string;
  key: string;
  id: string;
  code: string;
  ctn: number;
  unit: string;
  productName: string;
  productPrice: number;
  sellPrice:number;
  buyerName: string;
  quantity: number;
  totalPrice: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  paymentMethod: string;
  bankName?: string;
  paymentStatus: string;
  casherName: string;
  recieverName?: string;
  sellerName: string;
  originalTransaction: any;
  
  // Add new fields for flexible pricing
  useCustomPrice?: boolean;
  discountPercentage?: number | null;
  salePriceType?: string;
  isNegativeStockSale?: boolean;
  negativeStockPieces?: number;
  bulkDiscountApplied?: boolean;
  totalDiscountAmount?: number;
  defaultProductPrice?: number;
  customPricePerPiece?: number | null;
  paymentSplits?: Array<{
    id: number;
    method: string;
    amount: number;
    percentage: number;
    bankName?: string;
    senderName?: string;
    receiverName?: string;
    telebirrPhone?: string;
    telebirrTransactionId?: string;
    reference?: string;
    createdAt: string;
  }>;
  isSplitPayment?: boolean;
  
}

// API Response type - UPDATED TO MATCH ACTUAL RESPONSE
export interface ISaleApiResponse {
  id: number;
  user_id: number;
  product_id: number;
  code: string;
  buyer_name: string;
  product_name: string;
  quantity: number;
  ctn: number;
  qty: number;
  total_price: number;
  product_price: number;
  warehouse: string;
  date: string;
  created_at: string;
  updated_at: string;
  payment_method: string;
  payment_status: string;
  paid_amount: number;
  remaining_amount: number;
  casher_name: string;
  receiver_name: string | null;
  is_credit_settled: boolean;
  credit_settled_date: string | null;
  due_date: string | null;
  notes: string | null;
  payment_notes: string | null;
  bank_name: string | null;
  transaction_id: string | null;
  sender_name: string | null;
  telebirr_phone: string | null;
  telebirr_transaction_id: string | null;
  other_method: string | null;
  other_reference: string | null;
  first_payment_method: string | null;
  first_payment_bank: string | null;
  first_payment_reference: string | null;
  first_payment_phone: string | null;
  first_payment_details: string | null;
  
  // New flexible pricing fields
  default_product_price: number;
  use_custom_price: boolean;
  custom_price_per_piece: number | null;
  price_override_reason: string | null;
  discount_percentage: number | null;
  allow_negative_stock: boolean;
  is_negative_stock_sale: boolean;
  negative_stock_pieces: number;
  original_available_stock: number;
  final_available_stock: number;
  total_discount_amount: number;
  sale_price_type: string;
  bulk_discount_applied: boolean;
  minimum_order_for_discount: number | null;
  
  // ✅ ADD THESE MISSING PROPERTIES
  payments?: Array<{
    id: number;
    sale_id: number;
    payment_method: string;
    paid_amount: number;
    payment_date: string;
    reference_number: string | null;
    notes: string | null;
    created_by: number;
    created_at: string;
    details?: Array<{
      id?: number;
      payment_id?: number;
      detail_key: string;
      detail_value: string | null;
    }>;
  }>;
  
  payment_splits: Array<{
    id: number;
    sale_id: number;
    payment_method: string;
    amount: number;
    percentage: number;
    bank_name: string | null;
    sender_name: string | null;
    receiver_name: string | null;
    telebirr_phone: string | null;
    telebirr_transaction_id: string | null;
    reference: string | null;
    other_details: string | null;
    created_at: string;
    updated_at: string;
  }>;
  
  pricing?: {
    id: number;
    sale_id: number;
    default_product_price: number;
    use_custom_price: boolean;
    custom_price_per_piece: number | null;
    price_override_reason: string | null;
    discount_percentage: number | null;
    total_discount_amount: number;
    sale_price_type: string;
    bulk_discount_applied: boolean;
    minimum_order_for_discount: number | null;
  } | null;
  
  stock_info?: {
    id: number;
    sale_id: number;
    allow_negative_stock: boolean;
    is_negative_stock_sale: boolean;
    negative_stock_pieces: number;
    original_available_stock: number;
    final_available_stock: number;
  } | null;
  
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  
  product: {
    id: number;
    user_id: number;
    code: string;
    name: string;
    price: number;
    qty: number;
    unit: string;
    ctn: number;
    total_price: number;
    warehouse: string;
    created_at: string;
    updated_at: string;
    default_price?: number;
    min_sale_price?: number | null;
    max_sale_price?: number | null;
  };
}

// API Paginated Response
export interface ISaleApiPaginatedResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    sales: ISaleApiResponse[];
    total: number;
    limit: number;
    page: number;
    pages: number;
  };

  
}

export interface NormalizedSaleResponse {
  success: boolean;
  data: {
    sales: ISaleApiResponse[];
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
    meta?: {                      // ✅ ADD THIS OPTIONAL META PROPERTY
      userRole?: string;
      hasFullAccess?: boolean;
      filteredByUser?: boolean;
      filteredUserId?: number;
      currentUserId?: number;
    };
  };
}

// Add this interface for snake_case API response
export interface ISaleApiSnakeResponse {
  id: number;
  user_id: number;
  product_id: number;
  code: string;
  buyer_name: string;
  product_name: string;
  quantity: number;
  ctn: number;
  qty: number;
  total_price: number;
  product_price: number;
  warehouse: string;
  date: string;
  created_at: string;
  updated_at: string;
  payment_method: string;
  payment_status: string;
  paid_amount: number;
  remaining_amount: number;
  casher_name: string;
  is_credit_settled: boolean;
  credit_settled_date: string | null;
  due_date: string | null;
  notes: string | null;
  payment_notes: string | null;
  bank_name: string | null;
  transaction_id: string | null;
  sender_name: string | null;
  receiver_name: string | null;
  telebirr_phone: string | null;
  telebirr_transaction_id: string | null;
  other_method: string | null;
  other_reference: string | null;
  first_payment_method: string | null;
  first_payment_bank: string | null;
  first_payment_reference: string | null;
  first_payment_phone: string | null;
  first_payment_details: string | null;
  
  // New fields for flexible pricing
  default_product_price: number;
  use_custom_price: boolean;
  custom_price_per_piece: number | null;
  price_override_reason: string | null;
  discount_percentage: number | null;
  allow_negative_stock: boolean;
  is_negative_stock_sale: boolean;
  negative_stock_pieces: number;
  original_available_stock: number;
  final_available_stock: number;
  total_discount_amount: number;
  sale_price_type: string;
  bulk_discount_applied: boolean;
  minimum_order_for_discount: number | null;
  
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  
  product: {
    id: number;
    user_id: number;
    code: string;
    name: string;
    price: number;
    qty: number;
    unit: string;
    ctn: number;
    total_price: number;
    warehouse: string;
    created_at: string;
    updated_at: string;
  };
}
export interface DailyBreakdownItem {
  sale_date: string;
  day: number;
  transaction_count: string;
  total_revenue: number;
  total_quantity: number;
  total_cartons: number;
  payment_methods: string;
  split_methods: string;
  primary_payment_method: string;
  average_transaction_value: number;
}

export interface MonthlyResponse {
  success: boolean;
  message: string;
  data: {
    month: string;
    year: number;
    monthIndex: number;
    summary: {
      total_revenue: number;
      total_quantity: number;
      total_cartons: number;
      total_transactions: number;
    };
    daily_breakdown: DailyBreakdownItem[];
    payment_methods: string[];
  };
}

export interface SplitPaymentItem {
  id: number;
  method: string;  // Changed from payment_method to method
  amount: number;
  percentage: number;
  bankName?: string;  // Changed from bank_name
  senderName?: string;  // Changed from sender_name
  receiverName?: string;  // Changed from receiver_name
  telebirrPhone?: string;  // Changed from telebirr_phone
  telebirrTransactionId?: string;  // Changed from telebirr_transaction_id
  reference?: string;
  createdAt: string;  // Changed from created_at
}

export interface SplitPaymentItemSnake {
  id: number;
  payment_method: string;
  amount: number;
  percentage: number;
  bank_name?: string;
  sender_name?: string;
  receiver_name?: string;
  telebirr_phone?: string;
  telebirr_transaction_id?: string;
  reference?: string;
  created_at: string;
}

export interface SplitPaymentSale {
  // Sale basic info
  id: number;
  sale_id: number;
  user_id: number;
  product_id: number;
  code: string;
  buyer_name: string;
  product_name: string;
  quantity: number;
  ctn: number;
  qty: number;
  total_price: number;
  product_price: number;
  warehouse: string;
  date: string;
  created_at: string;
  updated_at: string;
  payment_method: string;
  payment_status: string;
  paid_amount: number;
  remaining_amount: number;
  casher_name: string;
  receiver_name: string | null;
  notes: string | null;
  payment_notes: string | null;
  bank_name: string | null;
  transaction_id: string | null;
  sender_name: string | null;
  telebirr_phone: string | null;
  telebirr_transaction_id: string | null;
  other_method: string | null;
  other_reference: string | null;
  
  // Flexible pricing fields
  default_product_price: number;
  use_custom_price: boolean;
  custom_price_per_piece: number | null;
  price_override_reason: string | null;
  discount_percentage: number | null;
  allow_negative_stock: boolean;
  is_negative_stock_sale: boolean;
  negative_stock_pieces: number;
  original_available_stock: number;
  final_available_stock: number;
  total_discount_amount: number;
  sale_price_type: string;
  bulk_discount_applied: boolean;
  minimum_order_for_discount: number | null;
  
  // Related data
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  
  product?: {
    id: number;
    name: string;
    code: string;
    price: number;
    default_price?: number;
    ctn?: number;
  };
  
  calculation_details?: {
    formula: string;
  };
  
  stock_details?: {
    available_before: number;
    available_after: number;
    warning: string | null;
  };
  
  // Split payment specific
  payment_splits: SplitPaymentItemSnake[];
  seller_name: string;
  
  // Backward compatibility
  total_amount?: number;
}

export interface SplitPaymentStatistics {
  summary: {
    total_split_sales: number;
    total_split_amount: number;
    average_split_amount: number;
  };
  method_breakdown: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  user_breakdown: Array<{
    user: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export interface SaleRecord extends ITableSale {
  // This inherits all properties from ITableSale
  // paymentSplits is already defined in ITableSale
}

export interface SplitPaymentApiResponse {
  success: boolean;
  data: {
    sales: SplitPaymentSale[];
    statistics: SplitPaymentStatistics;
    total?: number;
    page?: number;
    pages?: number;
    limit?: number;
  };
}

export const convertSplitPaymentItem = (item: SplitPaymentItemSnake): SplitPaymentItem => {
  return {
    id: item.id,
    method: item.payment_method,
    amount: item.amount,
    percentage: item.percentage,
    bankName: item.bank_name,
    senderName: item.sender_name,
    receiverName: item.receiver_name,
    telebirrPhone: item.telebirr_phone,
    telebirrTransactionId: item.telebirr_transaction_id,
    reference: item.reference,
    createdAt: item.created_at,
  };
};

// Helper to convert entire split payment sale
export const convertSplitPaymentSale = (sale: SplitPaymentSale): any => {
  return {
    id: sale.id.toString(),
    saleId: sale.sale_id,
    buyerName: sale.buyer_name,
    productName: sale.product_name,
    date: sale.date,
    totalAmount: sale.total_amount,
    paymentSplits: sale.payment_splits.map(convertSplitPaymentItem),
    sellerName: sale.seller_name,
  };
};

export interface DetailedSplitPaymentSale extends SplitPaymentSale {
  // Add all the missing fields from your API response
  user_id: number;
  product_id: number;
  code: string;
  quantity: number;
  ctn: number;
  qty: number;
  total_price: number;
  product_price: number;
  warehouse: string;
  created_at: string;
  updated_at: string;
  payment_method: string;
  payment_status: string;
  paid_amount: number;
  remaining_amount: number;
  casher_name: string;
  receiver_name: string | null;
  notes: string | null;
  bank_name: string | null;
  transaction_id: string | null;
  sender_name: string | null;
  telebirr_phone: string | null;
  telebirr_transaction_id: string | null;
  
  // New flexible pricing fields
  default_product_price: number;
  use_custom_price: boolean;
  custom_price_per_piece: number | null;
  discount_percentage: number | null;
  allow_negative_stock: boolean;
  is_negative_stock_sale: boolean;
  negative_stock_pieces: number;
  original_available_stock: number;
  final_available_stock: number;
  total_discount_amount: number;
  sale_price_type: string;
  bulk_discount_applied: boolean;
  
  product?: {
    id: number;
    name: string;
    code: string;
    price: number;
    default_price?: number;
    ctn?: number;
  };
  
  calculation_details?: {
    formula: string;
  };
}

export interface SalesStats {
  totalRevenue: number;
  totalPaid: number;
  totalRemaining: number;
  paymentRatio: number;
  transactionCount: number;
  paymentMethodStats: Record<string, number>;
  outstandingDebts: number;
  partialPaymentsCount: number;
  splitPaymentsCount: number;
  totalSplitAmount: number;
  averageSplitAmount: number;
  totalSales: number;
  averageSale: number;
  totalCredit: number;
}