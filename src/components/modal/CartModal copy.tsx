// components/CartModal.tsx - Cleaned version with duplicate receiver name removed
import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  Button,
  Table,
  InputNumber,
  Switch,
  Tag,
  Alert,
  Badge,
  Tooltip,
  DatePicker,
} from "antd";
import type { SelectProps } from "antd";
import {
  ShoppingCartOutlined,
  CreditCardOutlined,
  UserOutlined,
  ReloadOutlined,
  DeleteOutlined,
  MobileOutlined,
  TransactionOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  InboxOutlined,
  CalendarOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import toastMessage from "../../lib/toastMessage";

const { Option } = Select;

// Ethiopian Banks List
const ethiopianBanks = [
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

export type CartItem = {
  id: number;
  code: string;
  name: string;
  price: number;
  qtyPerCarton: number;
  availableStock: number; // in pieces
  availableCartons: number;
  quantity: number; // cartons to sell
  useCustomPrice: boolean;
  customPrice: number | null;
  allowNegativeStock: boolean;
  unit: string;
};

export type PaymentDetails = {
  [key: string]: string | number | undefined | null | PaymentSplit[];
  paidAmount?: number;
  remainingAmount?: number;
  paymentSplits?: PaymentSplit[]; // Array of split payments
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
};

export type PaymentSplit = {
  id: string;
  method: string;
  amount: number;
  percentage: number;
  bankName?: string;
  senderName?: string;
  receiverName?: string;
  telebirrPhone?: string;
  telebirrTransactionId?: string;
  reference?: string;
  otherMethod?: string;
  otherDetails?: string;
};

const paymentMethods = [
  { value: "CASH", label: "Cash (Full Payment)" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "TELEBIRR", label: "Telebirr" },
  { value: "PARTIAL", label: "Partial Payment" },
  { value: "SPLIT", label: "Split Payment" }, // NEW: For multiple payment methods
  { value: "OTHER", label: "Other Payment Method" }
];

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  onClearCart: () => void;
  onBulkSale: (
    salesData: BulkSalePayload[]
  ) => Promise<{ successCount: number; failedCount: number }>;
  currentBuyer: string;
  onBuyerChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  paymentDetails: PaymentDetails;
  onPaymentDetailChange: (
    field: keyof PaymentDetails,
    value: string | number | null
  ) => void;
  isProcessing: boolean;
  calculateCartTotal: () => number;
  updateCartItem: (productId: number, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: number) => void;
  calculateTotalCartItems: () => number;
}

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
  date: Date | string; // This will now be changeable
  paymentMethod: string;
  paidAmount: number;
  remainingAmount: number;
  bankName?: string;
  senderName?: string;
  receiverName?: string; // Fixed spelling from "reciverName"
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
};

const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  cart,
  onClearCart,
  onBulkSale,
  currentBuyer,
  onBuyerChange,
  paymentMethod,
  onPaymentMethodChange,
  paymentDetails,
  onPaymentDetailChange,
  isProcessing,
  calculateCartTotal,
  updateCartItem,
  removeFromCart,
  calculateTotalCartItems,
}) => {
  const [form] = Form.useForm();

  // Local state for partial payment method
  const [partialMethod, setPartialMethod] = useState("");
  const [casherName, setCasherName] = useState("");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs()); // Default to today

  // Initialize date when modal opens
  useEffect(() => {
    if (visible) {
      // If there's a saved date in paymentDetails, use it, otherwise use today
      const savedDate = paymentDetails.dateOfSelling;
      if (savedDate) {
        setSelectedDate(dayjs(savedDate));
      } else {
        setSelectedDate(dayjs());
        // Set default date in paymentDetails
        onPaymentDetailChange("dateOfSelling", dayjs().format("YYYY-MM-DD"));
      }
    }
  }, [visible]);

  const handleBuyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onBuyerChange(e.target.value);
  };

  const handleCasherNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCasherName(e.target.value);
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      onPaymentDetailChange("dateOfSelling", date.format("YYYY-MM-DD"));
    }
  };

  const handlePaymentDetailInputChange =
    (field: keyof PaymentDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onPaymentDetailChange(field, e.target.value);
    };

  const handlePaymentDetailSelectChange =
    (field: keyof PaymentDetails) => (value: string) => {
      onPaymentDetailChange(field, value);
    };

  const handlePaymentDetailNumberChange =
    (field: keyof PaymentDetails) => (value: number | null) => {
      onPaymentDetailChange(field, value ?? 0);
    };

  const handlePaymentMethodChange = (value: string) => {
    onPaymentMethodChange(value);
    // Clear payment details when method changes
    Object.keys(paymentDetails).forEach((key) => {
      if (key !== "dateOfSelling" && key !== "receiverName") { // Don't clear the date and receiverName
        onPaymentDetailChange(key as keyof PaymentDetails, "");
      }
    });
    // Reset partial method when payment method changes
    if (value !== "PARTIAL") {
      setPartialMethod("");
    }
  };

  // Calculate item total
  const calculateItemTotal = (item: CartItem): number => {
    const price =
      item.useCustomPrice && item.customPrice ? item.customPrice : item.price;
    const totalPieces = item.quantity * item.qtyPerCarton;
    return price * totalPieces;
  };

  // Calculate stock status for each item
  const getStockStatus = (item: CartItem) => {
    const availableCartons = item.availableCartons;
    const requestedCartons = item.quantity;
    const totalRequestedPieces = requestedCartons * item.qtyPerCarton;
    const availablePieces = item.availableStock;

    const isNegativeStock = requestedCartons > availableCartons;
    const shortageCartons = requestedCartons - availableCartons;
    const shortagePieces = totalRequestedPieces - availablePieces;

    return {
      availableCartons,
      availablePieces,
      requestedCartons,
      totalRequestedPieces,
      isNegativeStock,
      shortageCartons,
      shortagePieces,
      hasEnoughStock: !isNegativeStock || item.allowNegativeStock,
    };
  };

  // Calculate total requested pieces
  const calculateTotalRequestedPieces = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity * item.qtyPerCarton,
      0
    );
  }, [cart]);

  // Calculate total available pieces
  const calculateTotalAvailablePieces = useMemo(() => {
    return cart.reduce((total, item) => total + item.availableStock, 0);
  }, [cart]);

  // Calculate total requested cartons
  const calculateTotalRequestedCartons = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  // Calculate total available cartons
  const calculateTotalAvailableCartons = useMemo(() => {
    return cart.reduce((total, item) => total + item.availableCartons, 0);
  }, [cart]);

  // Calculate items needing attention (negative stock without permission)
  const calculateItemsNeedingAttention = useMemo(() => {
    return cart.filter((item) => {
      const status = getStockStatus(item);
      return status.isNegativeStock && !item.allowNegativeStock;
    }).length;
  }, [cart]);

  // Calculate proportional payment for partial payments
  const calculateProportionalPayment = useMemo(() => {
    const totalCartAmount = calculateCartTotal();

    if (paymentMethod !== "PARTIAL" || !paymentDetails.paidAmount) {
      return null;
    }

    const paidAmount = Number(paymentDetails.paidAmount);

    if (paidAmount <= 0 || paidAmount >= totalCartAmount) {
      return null;
    }

    const paidPercentage = paidAmount / totalCartAmount;

    // Calculate each item's share
    const itemPayments = cart.map((item) => {
      const itemTotal = calculateItemTotal(item);
      const itemPaidAmount = itemTotal * paidPercentage;
      const itemRemainingAmount = itemTotal - itemPaidAmount;

      return {
        itemId: item.id,
        itemName: item.name,
        itemTotal,
        itemPaidAmount,
        itemRemainingAmount,
        paidPercentage: (itemPaidAmount / itemTotal) * 100,
      };
    });

    return {
      totalCartAmount,
      paidAmount,
      remainingAmount: totalCartAmount - paidAmount,
      paidPercentage: paidPercentage * 100,
      itemPayments,
    };
  }, [cart, paymentMethod, paymentDetails.paidAmount, calculateCartTotal]);

  // Prepare bulk sale payload
  const prepareBulkSalePayload = async (): Promise<BulkSalePayload[]> => {
    if (!currentBuyer) {
      throw new Error("Buyer name is required");
    }

    if (!casherName) {
      throw new Error("Casher name is required");
    }

    if (!paymentMethod) {
      throw new Error("Payment method is required");
    }

    // Validate date - it should not be in the future
    const saleDate = selectedDate;
    const today = dayjs();
    if (saleDate.isAfter(today, "day")) {
      throw new Error("Sale date cannot be in the future");
    }

    // Validate each item
    for (const item of cart) {
      const status = getStockStatus(item);
      if (!item.allowNegativeStock && status.isNegativeStock) {
        throw new Error(
          `${item.name}: Requested ${status.requestedCartons} cartons but only ${status.availableCartons} available. ` +
            `Enable "Allow Negative Stock" to proceed.`
        );
      }
    }

    const proportionalPayment = calculateProportionalPayment;

    return cart.map((item) => {
      const price =
        item.useCustomPrice && item.customPrice ? item.customPrice : item.price;
      const totalPieces = item.quantity * item.qtyPerCarton;
      const totalAmount = price * totalPieces;

      // Calculate paid amount based on payment method
      let paidAmount: number;
      let remainingAmount: number;

      if (paymentMethod === "PARTIAL" && proportionalPayment) {
        // Find this item's proportional payment
        const itemPayment = proportionalPayment.itemPayments.find(
          (p) => p.itemId === item.id
        );
        paidAmount = itemPayment ? itemPayment.itemPaidAmount : 0;
        remainingAmount = itemPayment
          ? itemPayment.itemRemainingAmount
          : totalAmount;
      } else {
        // Full payment
        paidAmount = totalAmount;
        remainingAmount = 0;
      }

      const payload: BulkSalePayload = {
        productId: item.id,
        code: item.code,
        name: item.name,
        ctn: item.quantity,
        productPrice: price,
        totalAmount,
        useCustomPrice: item.useCustomPrice,
        customPricePerPiece: item.useCustomPrice ? item.customPrice : null,
        allowNegativeStock: item.allowNegativeStock,
        buyerName: currentBuyer,
        casherName,
        receiverName: paymentDetails.receiverName as string || '', // ALWAYS include receiverName (fixed spelling)
        date: saleDate.format("YYYY-MM-DD"), // Use selected date
        paymentMethod,
        paidAmount,
        remainingAmount,
        // Add payment distribution details
        paymentDistribution:
          paymentMethod === "PARTIAL"
            ? {
                totalCartAmount: proportionalPayment?.totalCartAmount || 0,
                paidPercentage: proportionalPayment?.paidPercentage || 0,
                itemSharePercentage: proportionalPayment
                  ? (paidAmount / proportionalPayment.totalCartAmount) * 100
                  : 0,
              }
            : undefined,
      };

      // Add payment method specific details
      if (paymentMethod === "BANK_TRANSFER") {
        if (paymentDetails.bankName)
          payload.bankName = paymentDetails.bankName as string;
        if (paymentDetails.senderName)
          payload.senderName = paymentDetails.senderName as string;
        // receiverName is already included above for all payment methods
      }

      if (paymentMethod === "TELEBIRR") {
        if (paymentDetails.telebirrPhone)
          payload.telebirrPhone = paymentDetails.telebirrPhone as string;
        if (paymentDetails.telebirrTransactionId)
          payload.telebirrTransactionId =
            paymentDetails.telebirrTransactionId as string;
        // receiverName is already included above for all payment methods
      }

      if (paymentMethod === "PARTIAL") {
        if (paymentDetails.firstPaymentMethod)
          payload.firstPaymentMethod =
            paymentDetails.firstPaymentMethod as string;
        if (paymentDetails.paymentNotes)
          payload.paymentNotes = paymentDetails.paymentNotes as string;
        // receiverName is already included above for all payment methods
      }

      if (paymentMethod === "OTHER") {
        if (paymentDetails.otherMethod)
          payload.otherMethod = paymentDetails.otherMethod as string;
        if (paymentDetails.otherReference)
          payload.otherReference = paymentDetails.otherReference as string;
        // receiverName is already included above for all payment methods
      }

      // First payment method details for partial payment
      if (
        paymentMethod === "PARTIAL" &&
        paymentDetails.firstPaymentMethod === "BANK_TRANSFER"
      ) {
        if (paymentDetails.firstPaymentBank)
          payload.firstPaymentBank = paymentDetails.firstPaymentBank as string;
        if (paymentDetails.firstPaymentReference)
          payload.firstPaymentReference =
            paymentDetails.firstPaymentReference as string;
      }

      if (
        paymentMethod === "PARTIAL" &&
        paymentDetails.firstPaymentMethod === "TELEBIRR"
      ) {
        if (paymentDetails.firstPaymentPhone)
          payload.firstPaymentPhone =
            paymentDetails.firstPaymentPhone as string;
        // receiverName is already included above for all payment methods
      }

      if (
        paymentMethod === "PARTIAL" &&
        paymentDetails.firstPaymentMethod === "OTHER"
      ) {
        if (paymentDetails.firstPaymentDetails)
          payload.firstPaymentDetails =
            paymentDetails.firstPaymentDetails as string;
      }

      return payload;
    });
  };

  // Render payment distribution for partial payments
  const renderPaymentDistribution = () => {
    if (paymentMethod !== "PARTIAL" || !calculateProportionalPayment) {
      return null;
    }

    const {
      totalCartAmount,
      paidAmount,
      remainingAmount,
      paidPercentage,
      itemPayments,
    } = calculateProportionalPayment;

    return (
      <Card
        size="small"
        style={{ marginBottom: 16, backgroundColor: "#fff7e6" }}
      >
        <div style={{ marginBottom: "12px" }}>
          <h4 style={{ color: "#fa8c16", marginBottom: "8px" }}>
            Partial Payment Distribution
          </h4>
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Total Amount
                </div>
                <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                  ${totalCartAmount.toFixed(2)}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#1890ff" }}>
                  Paid Amount ({paidPercentage.toFixed(1)}%)
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#1890ff",
                  }}
                >
                  ${paidAmount.toFixed(2)}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#fa541c" }}>
                  Remaining Amount
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#fa541c",
                  }}
                >
                  ${remainingAmount.toFixed(2)}
                </div>
              </div>
            </Col>
          </Row>
        </div>

        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          <table style={{ width: "100%", fontSize: "12px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "8px", textAlign: "left" }}>Product</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Total</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Paid</th>
                <th style={{ padding: "8px", textAlign: "right" }}>
                  Remaining
                </th>
                <th style={{ padding: "8px", textAlign: "center" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {itemPayments.map((item) => (
                <tr
                  key={item.itemId}
                  style={{ borderBottom: "1px solid #f0f0f0" }}
                >
                  <td style={{ padding: "8px" }}>
                    <div
                      style={{
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.itemName}
                    </div>
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    ${item.itemTotal.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      color: "#1890ff",
                    }}
                  >
                    ${item.itemPaidAmount.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      color: "#fa541c",
                    }}
                  >
                    ${item.itemRemainingAmount.toFixed(2)}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    <Tag style={{ color: "blue", fontSize: "small" }}>
                      {item.paidPercentage.toFixed(1)}%
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: "12px",
            fontSize: "11px",
            color: "#666",
            fontStyle: "italic",
          }}
        >
          Note: Partial payment is distributed proportionally based on each
          item's total amount.
        </div>
      </Card>
    );
  };

  // Filter function for bank search
  const filterBankOption = (
    input: string,
    option?: { label: string; value: string }
  ) => {
    return (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  };

  // Validate partial payment
  const validatePartialPayment = () => {
    if (paymentMethod !== "PARTIAL") return true;

    const totalAmount = calculateCartTotal();
    const paidAmount = Number(paymentDetails.paidAmount) || 0;

    if (!paidAmount || paidAmount <= 0) {
      toastMessage({
        title: "Validation Error",
        text: "Paid amount must be greater than 0 for partial payment",
        icon: "warning",
      });
      return false;
    }

    if (paidAmount >= totalAmount) {
      toastMessage({
        title: "Validation Error",
        text: "Paid amount must be less than total amount for partial payment",
        icon: "warning",
      });
      return false;
    }

    if (!partialMethod) {
      toastMessage({
        title: "Validation Error",
        text: "Please select first payment method for partial payment",
        icon: "warning",
      });
      return false;
    }

    return true;
  };

  // Handle bulk sale
  const handleBulkSale = async () => {
    // Validate date
    const saleDate = selectedDate;
    const today = dayjs();
    if (saleDate.isAfter(today, "day")) {
      toastMessage({
        title: "Validation Error",
        text: "Sale date cannot be in the future",
        icon: "warning",
      });
      return;
    }

    // Validate partial payment
    if (paymentMethod === "PARTIAL" && !validatePartialPayment()) {
      return;
    }

    try {
      const salesData = await prepareBulkSalePayload();
      console.log("Sending payload:", salesData); // Debug log
      const result = await onBulkSale(salesData);

      if (result.successCount > 0) {
        // Success handling can be added here
      }

      if (result.failedCount === 0) {
        onClearCart();
        onClose();
        setCasherName("");
        // Reset date to today for next sale
        setSelectedDate(dayjs());
        onPaymentDetailChange("dateOfSelling", dayjs().format("YYYY-MM-DD"));
      }
    } catch (error: any) {
      console.error("Bulk sale error:", error);
      toastMessage({
        title: "Error",
        text: error.message || "Failed to process bulk sale",
        icon: "error",
      });
    }
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text: string, record: CartItem) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Code: {record.code} • {record.qtyPerCarton} {record.unit}/carton
            {record.useCustomPrice && (
              <div style={{ color: "#1890ff", marginTop: "2px" }}>
                <DollarOutlined /> Custom price: $
                {record.customPrice?.toFixed(2)}/piece
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Cartons to Sell",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (value: number, record: CartItem) => {
        const status = getStockStatus(record);
        const maxCartons = record.allowNegativeStock
          ? 9999
          : status.availableCartons;

        return (
          <div>
            <InputNumber
              min={1}
              max={maxCartons}
              value={value}
              onChange={(val) =>
                updateCartItem(record.id, { quantity: val || 1 })
              }
              style={{ width: "80px" }}
            />
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
              Max: {maxCartons} cartons
            </div>
          </div>
        );
      },
    },
    {
      title: "Price/Unit",
      key: "price",
      width: 150,
      render: (_: any, record: CartItem) => (
        <div>
          {record.useCustomPrice ? (
            <InputNumber
              value={record.customPrice}
              onChange={(val) =>
                updateCartItem(record.id, { customPrice: val })
              }
              formatter={(value) => `$ ${value}`}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
              style={{ width: "100px" }}
              size="small"
            />
          ) : (
            <span>${record.price.toFixed(2)}</span>
          )}
          <div style={{ marginTop: "4px" }}>
            <Switch
              checked={record.useCustomPrice}
              onChange={(checked) =>
                updateCartItem(record.id, {
                  useCustomPrice: checked,
                  customPrice: checked ? record.price : null,
                })
              }
              size="small"
            />
            <span style={{ fontSize: "11px", marginLeft: "4px" }}>
              {record.useCustomPrice ? "Custom" : "Default"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Stock Availability",
      key: "stock",
      width: 180,
      render: (_: any, record: CartItem) => {
        const status = getStockStatus(record);

        return (
          <Tooltip
            title={
              <div>
                <div>
                  <strong>Stock Details:</strong>
                </div>
                <div>
                  • Available: {status.availablePieces} pieces (
                  {status.availableCartons} cartons)
                </div>
                <div>
                  • Requested: {status.totalRequestedPieces} pieces (
                  {status.requestedCartons} cartons)
                </div>
                <div>• Pieces per carton: {record.qtyPerCarton}</div>
                {status.isNegativeStock && (
                  <div style={{ color: "#fa8c16" }}>
                    • Shortage: {status.shortagePieces} pieces (
                    {status.shortageCartons} cartons)
                  </div>
                )}
              </div>
            }
          >
            <div>
              {status.isNegativeStock ? (
                <div>
                  <Tag color="orange" icon={<WarningOutlined />}>
                    {status.availableCartons} / {status.requestedCartons}
                  </Tag>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#fa8c16",
                      marginTop: "4px",
                    }}
                  >
                    Shortage: {status.shortageCartons} ctns
                  </div>
                </div>
              ) : (
                <div>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    {status.availableCartons} / {status.requestedCartons}
                  </Tag>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#52c41a",
                      marginTop: "4px",
                    }}
                  >
                    In stock
                  </div>
                </div>
              )}
              <div style={{ marginTop: "4px" }}>
                <Switch
                  checked={record.allowNegativeStock}
                  onChange={(checked) =>
                    updateCartItem(record.id, { allowNegativeStock: checked })
                  }
                  size="small"
                />
                <span style={{ fontSize: "11px", marginLeft: "4px" }}>
                  {record.allowNegativeStock ? "Neg OK" : "Normal"}
                </span>
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Total",
      key: "total",
      width: 100,
      render: (_: any, record: CartItem) => {
        const total = calculateItemTotal(record);
        return `$${total.toFixed(2)}`;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_: any, record: CartItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.id)}
          size="small"
        />
      ),
    },
  ];

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case "BANK_TRANSFER":
        return (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Bank Name">
                  <Select
                    placeholder="Select bank"
                    value={paymentDetails.bankName as string}
                    onChange={handlePaymentDetailSelectChange("bankName")}
                    allowClear
                    showSearch
                    filterOption={filterBankOption}
                    options={ethiopianBanks.map((bank) => ({
                      label: bank,
                      value: bank,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Sender Name">
                  <Input
                    placeholder="Sender name"
                    value={(paymentDetails.senderName as string) || ""}
                    onChange={handlePaymentDetailInputChange("senderName")}
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        );

      case "TELEBIRR":
        return (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Phone Number">
                  <Input
                    placeholder="Phone number"
                    value={(paymentDetails.telebirrPhone as string) || ""}
                    onChange={handlePaymentDetailInputChange("telebirrPhone")}
                    prefix={<MobileOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Transaction ID">
                  <Input
                    placeholder="Transaction ID"
                    value={
                      (paymentDetails.telebirrTransactionId as string) || ""
                    }
                    onChange={handlePaymentDetailInputChange(
                      "telebirrTransactionId"
                    )}
                    prefix={<TransactionOutlined />}
                    allowClear
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        );

      case "PARTIAL":
        return (
          <>
            {renderPaymentDistribution()}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Paid Amount" required>
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Paid amount"
                      value={paymentDetails.paidAmount as number}
                      onChange={handlePaymentDetailNumberChange("paidAmount")}
                      min={1}
                      max={calculateCartTotal() - 1}
                      formatter={(value) =>
                        `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                      }
                      parser={(value) =>
                        value?.replace(/\$\s?|(,*)/g, "") as any
                      }
                    />
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      Total: ${calculateCartTotal().toFixed(2)}
                    </div>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="First Payment Method" required>
                    <Select
                      placeholder="Select method"
                      value={partialMethod}
                      onChange={(value) => {
                        setPartialMethod(value);
                        onPaymentDetailChange("firstPaymentMethod", value);
                      }}
                    >
                      <Option value="CASH">Cash</Option>
                      <Option value="BANK_TRANSFER">Bank Transfer</Option>
                      <Option value="TELEBIRR">Telebirr</Option>
                      <Option value="OTHER">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* First payment details based on method */}
              {partialMethod === "BANK_TRANSFER" && (
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Bank Name">
                      <Select
                        placeholder="Select bank"
                        value={paymentDetails.firstPaymentBank as string}
                        onChange={handlePaymentDetailSelectChange(
                          "firstPaymentBank"
                        )}
                        allowClear
                        showSearch
                        filterOption={filterBankOption}
                        options={ethiopianBanks.map((bank) => ({
                          label: bank,
                          value: bank,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Reference">
                      <Input
                        placeholder="Reference"
                        value={
                          (paymentDetails.firstPaymentReference as string) || ""
                        }
                        onChange={handlePaymentDetailInputChange(
                          "firstPaymentReference"
                        )}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {partialMethod === "TELEBIRR" && (
                <Form.Item label="Phone Number">
                  <Input
                    placeholder="Phone number"
                    value={(paymentDetails.firstPaymentPhone as string) || ""}
                    onChange={handlePaymentDetailInputChange(
                      "firstPaymentPhone"
                    )}
                    prefix={<MobileOutlined />}
                  />
                </Form.Item>
              )}

              {partialMethod === "OTHER" && (
                <Form.Item label="Payment Details">
                  <Input.TextArea
                    placeholder="Enter payment details"
                    value={(paymentDetails.firstPaymentDetails as string) || ""}
                    onChange={handlePaymentDetailInputChange(
                      "firstPaymentDetails"
                    )}
                    rows={2}
                  />
                </Form.Item>
              )}

              {/* Payment notes */}
              <Form.Item label="Payment Notes">
                <Input.TextArea
                  placeholder="Add payment agreement notes"
                  value={(paymentDetails.paymentNotes as string) || ""}
                  onChange={handlePaymentDetailInputChange("paymentNotes")}
                  rows={2}
                />
              </Form.Item>
            </Card>
          </>
        );

      case "OTHER":
        return (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Other Method Details">
              <Input.TextArea
                placeholder="Describe other payment method"
                value={(paymentDetails.otherMethod as string) || ""}
                onChange={handlePaymentDetailInputChange("otherMethod")}
                rows={2}
              />
            </Form.Item>
            <Form.Item label="Reference">
              <Input
                placeholder="Reference/Transaction ID"
                value={(paymentDetails.otherReference as string) || ""}
                onChange={handlePaymentDetailInputChange("otherReference")}
              />
            </Form.Item>
          </Card>
        );

      default:
        return null;
    }
  };

  // Calculate payment summary
  const paymentSummary = useMemo(() => {
    const total = calculateCartTotal();
    let paid = total;
    let remaining = 0;

    if (paymentMethod === "PARTIAL" && paymentDetails.paidAmount) {
      paid = Number(paymentDetails.paidAmount);
      remaining = total - paid;
    }

    return { total, paid, remaining };
  }, [paymentMethod, paymentDetails.paidAmount, calculateCartTotal]);

  // Calculate stock summary with better labels
  const stockSummary = useMemo(() => {
    const itemsNeedingAttention = cart.filter((item) => {
      const status = getStockStatus(item);
      return status.isNegativeStock && !item.allowNegativeStock;
    });

    return {
      totalItems: cart.length,
      itemsNeedingAttention: itemsNeedingAttention.length,
      totalRequestedCartons: calculateTotalRequestedCartons,
      totalAvailableCartons: calculateTotalAvailableCartons,
      totalRequestedPieces: calculateTotalRequestedPieces,
      totalAvailablePieces: calculateTotalAvailablePieces,
      shortageCartons: Math.max(
        0,
        calculateTotalRequestedCartons - calculateTotalAvailableCartons
      ),
      shortagePieces: Math.max(
        0,
        calculateTotalRequestedPieces - calculateTotalAvailablePieces
      ),
    };
  }, [cart]);

  return (
    <Modal
      title={
        <div>
          <ShoppingCartOutlined /> Bulk Sale Cart
          <Badge count={cart.length} style={{ marginLeft: "8px" }} />
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1100}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="clear"
          onClick={onClearCart}
          disabled={cart.length === 0}
          icon={<ReloadOutlined />}
        >
          Clear Cart
        </Button>,
        <Button
          key="complete"
          type="primary"
          onClick={handleBulkSale}
          loading={isProcessing}
          disabled={
            cart.length === 0 ||
            !currentBuyer ||
            !casherName ||
            !paymentMethod ||
            stockSummary.itemsNeedingAttention > 0
          }
          icon={<CreditCardOutlined />}
        >
          Complete Bulk Sale (${calculateCartTotal().toFixed(2)})
        </Button>,
      ]}
    >
      {/* Customer & Payment Info */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Buyer Name" required>
              <Input
                placeholder="Enter buyer name"
                value={currentBuyer}
                onChange={handleBuyerChange}
                prefix={<UserOutlined />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Casher Name" required>
              <Input
                placeholder="Enter casher name"
                value={casherName}
                onChange={handleCasherNameChange}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Payment Method" required>
              <Select
                placeholder="Select payment method"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <Option value="">Select Payment Method</Option>
                <Option value="CASH">Cash (Full Payment)</Option>
                <Option value="BANK_TRANSFER">Bank Transfer</Option>
                <Option value="TELEBIRR">Telebirr</Option>
                <Option value="PARTIAL">Partial Payment</Option>
                <Option value="OTHER">Other Payment Method</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Sale Date" required>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                allowClear={false}
                style={{ width: "100%" }}
                prefix={<CalendarOutlined />}
                disabledDate={(current) => {
                  // Disable future dates only
                  return current && current > dayjs().endOf("day");
                }}
              />
              <div
                style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}
              >
                Select date for sale (e.g., yesterday's date)
              </div>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Date Display">
              <Input
                value={selectedDate.format("dddd, MMMM D, YYYY")}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Payment Summary */}
        <Alert
          message={
            <div>
              <strong>Payment Summary:</strong>
              <span style={{ float: "right" }}>
                Total: <strong>${paymentSummary.total.toFixed(2)}</strong>
                {paymentMethod === "PARTIAL" && (
                  <>
                    {" • "}Paid:{" "}
                    <strong style={{ color: "#1890ff" }}>
                      ${paymentSummary.paid.toFixed(2)}
                    </strong>
                    {" • "}Remaining:{" "}
                    <strong
                      style={{
                        color:
                          paymentSummary.remaining > 0 ? "#fa541c" : "#52c41a",
                      }}
                    >
                      ${paymentSummary.remaining.toFixed(2)}
                    </strong>
                  </>
                )}
              </span>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        {/* Single Receiver Name input for all payment methods */}
        {paymentMethod && paymentMethod !== "CASH" && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="Receiver Name">
              <Input
                placeholder="Receiver name"
                value={(paymentDetails.receiverName as string) || ""}
                onChange={handlePaymentDetailInputChange("receiverName")}
                prefix={<UserOutlined />}
                allowClear
              />
              <div
                style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}
              >
                Enter the name of the person who received the payment
              </div>
            </Form.Item>
          </Card>
        )}

        {renderPaymentForm()}
      </Card>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <ShoppingCartOutlined
            style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }}
          />
          <h4>Your cart is empty</h4>
          <p style={{ color: "#666" }}>
            Add products from the product list to start a bulk sale
          </p>
        </div>
      ) : (
        <>
          {/* Attention Required Alert */}
          {stockSummary.itemsNeedingAttention > 0 && (
            <Alert
              message="Attention Required"
              description={
                <div>
                  <strong>
                    {stockSummary.itemsNeedingAttention} item(s) need your
                    attention:
                  </strong>
                  <div style={{ marginTop: "8px" }}>
                    • These items have insufficient stock
                    <br />
                    • Enable "Neg OK" for each item to allow negative stock
                    sales
                    <br />• Or reduce quantities to match available stock
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "13px",
                      backgroundColor: "#fff7e6",
                      padding: "8px",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Stock Summary:</strong>
                    <br />• Requested: {stockSummary.totalRequestedCartons}{" "}
                    cartons ({stockSummary.totalRequestedPieces} pieces)
                    <br />• Available: {stockSummary.totalAvailableCartons}{" "}
                    cartons ({stockSummary.totalAvailablePieces} pieces)
                    <br />• Shortage: {stockSummary.shortageCartons} cartons (
                    {stockSummary.shortagePieces} pieces)
                  </div>
                </div>
              }
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Alert
            message={
              <div>
                <strong>Cart Summary:</strong> {cart.length} products,{" "}
                {calculateTotalCartItems()} cartons
                <span style={{ float: "right" }}>
                  <span style={{ marginRight: "16px" }}>
                    Pieces: {calculateTotalRequestedPieces}
                  </span>
                  <span style={{ fontWeight: "bold", color: "#1890ff" }}>
                    Total: ${calculateCartTotal().toFixed(2)}
                  </span>
                </span>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Table
            dataSource={cart}
            columns={columns}
            pagination={false}
            size="small"
            scroll={{ y: 300 }}
            rowKey="id"
          />

          {/* Stock Statistics - Clearer Labels */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#f6ffed",
              borderRadius: "4px",
              border: "1px solid #b7eb8f",
            }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    <ShoppingOutlined /> Products
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {stockSummary.totalItems}
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>in cart</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color:
                        stockSummary.itemsNeedingAttention > 0
                          ? "#fa8c16"
                          : "#666",
                      marginBottom: "4px",
                    }}
                  >
                    <WarningOutlined /> Need Attention
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color:
                        stockSummary.itemsNeedingAttention > 0
                          ? "#fa8c16"
                          : "#52c41a",
                    }}
                  >
                    {stockSummary.itemsNeedingAttention}
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>items</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    <InboxOutlined /> Requested Cartons
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {stockSummary.totalRequestedCartons}
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    ({stockSummary.totalRequestedPieces} pieces)
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      marginBottom: "4px",
                    }}
                  >
                    <InboxOutlined /> Available Cartons
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color:
                        stockSummary.totalRequestedCartons >
                        stockSummary.totalAvailableCartons
                          ? "#fa8c16"
                          : "#52c41a",
                    }}
                  >
                    {stockSummary.totalAvailableCartons}
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    ({stockSummary.totalAvailablePieces} pieces)
                  </div>
                </div>
              </Col>
            </Row>

            {/* Shortage Warning */}
            {stockSummary.shortageCartons > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "8px",
                  backgroundColor:
                    stockSummary.itemsNeedingAttention > 0
                      ? "#fff2e8"
                      : "#f6ffed",
                  borderRadius: "4px",
                  border: `1px solid ${
                    stockSummary.itemsNeedingAttention > 0
                      ? "#ffd8bf"
                      : "#b7eb8f"
                  }`,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    color:
                      stockSummary.itemsNeedingAttention > 0
                        ? "#fa8c16"
                        : "#666",
                    fontSize: "12px",
                  }}
                >
                  {stockSummary.itemsNeedingAttention > 0 ? (
                    <span>
                      <WarningOutlined /> Shortage:{" "}
                      {stockSummary.shortageCartons} cartons (
                      {stockSummary.shortagePieces} pieces)
                      <div style={{ fontSize: "11px", marginTop: "4px" }}>
                        Enable "Neg OK" for items to proceed
                      </div>
                    </span>
                  ) : (
                    <span>
                      Negative stock allowed: {stockSummary.shortageCartons}{" "}
                      cartons shortage
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

export default CartModal;