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
    // Add new product fields if needed
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
    page: number;
    pages: number;
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

// Update your component to use the snake_case interface