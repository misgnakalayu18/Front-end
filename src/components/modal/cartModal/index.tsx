import React, { useState, useMemo, useEffect } from "react";
import { Modal, Button, Badge, Alert, Form } from "antd";
import {
  ShoppingCartOutlined,
  CreditCardOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import toastMessage from "../../../lib/toastMessage";

// Import components
import CartTable from "./components/CartTable";
import PaymentSummary from "./components/PaymentSummary";
import PaymentFormsRouter from "./components/PaymentForms";
import StockSummary from "./components/StockSummary";
import ValidationAlerts from "./components/ValidationAlerts";

// Import types and utilities
import { CartModalProps, BulkSalePayload, PaymentSplit, PAYMENT_METHODS, PaymentMethodType } from "./types";
import { calculateCartSummary } from "./utils/calculations";
import { validateBulkSale, showValidationErrors } from "./utils/validators";

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
  const [partialMethod, setPartialMethod] = useState("");
  const [casherName, setCasherName] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Initialize date when modal opens
  useEffect(() => {
    if (visible) {
      const savedDate = paymentDetails.dateOfSelling;
      if (savedDate) {
        setSelectedDate(dayjs(savedDate));
      } else {
        setSelectedDate(dayjs());
        onPaymentDetailChange("dateOfSelling", dayjs().format("YYYY-MM-DD"));
      }
    }
  }, [visible]);

  const handleCasherNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCasherName(e.target.value);
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      onPaymentDetailChange("dateOfSelling", date.format("YYYY-MM-DD"));
    }
  };

  const handlePaymentMethodChange = (value: string) => {
  // Validate that the value is a valid PaymentMethodType
  const validPaymentMethods = Object.values(PAYMENT_METHODS);
  if (validPaymentMethods.includes(value as PaymentMethodType)) {
    onPaymentMethodChange(value as PaymentMethodType);
  } else {
    // Handle invalid value - you could throw an error or use a default
    console.warn(`Invalid payment method: ${value}`);
    // Optionally, fall back to a default method
    onPaymentMethodChange(PAYMENT_METHODS.CASH);
  }
  
  // Clear payment details when method changes
  Object.keys(paymentDetails).forEach((key) => {
    if (key !== "dateOfSelling" && key !== "receiverName") {
      onPaymentDetailChange(key as keyof typeof paymentDetails, "");
    }
  });
  // Reset partial method when payment method changes
  if (value !== "PARTIAL") {
    setPartialMethod("");
  }
};

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

    // Validate date
    const saleDate = selectedDate;
    const today = dayjs();
    if (saleDate.isAfter(today, "day")) {
      throw new Error("Sale date cannot be in the future");
    }

    // Validate each item
    const stockSummary = calculateCartSummary(cart);
    for (const item of cart) {
      if (!item.allowNegativeStock && stockSummary.itemsNeedingAttention > 0) {
        throw new Error(
          `${item.name}: Insufficient stock. Enable "Allow Negative Stock" to proceed.`
        );
      }
    }// Additional validation for split payments
  if (paymentMethod === "SPLIT") {
    const splits = paymentDetails.paymentSplits as PaymentSplit[] || [];
    
    if (splits.length === 0) {
      throw new Error("Payment splits are required for split payment method");
    }

    // Calculate total from splits
    const totalFromSplits = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
    const cartTotal = calculateCartTotal();
    
    // Validate total matches
    const tolerance = 0.01;
    if (Math.abs(totalFromSplits - cartTotal) > tolerance) {
      throw new Error(
        `Split payment total ($${totalFromSplits.toFixed(2)}) doesn't match cart total ($${cartTotal.toFixed(2)})`
      );
    }

    // Validate percentages sum to 100%
    const totalPercentage = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > tolerance) {
      throw new Error(
        `Split payment percentages must sum to 100% (current: ${totalPercentage.toFixed(2)}%)`
      );
    }
  }
const cartTotal = calculateCartTotal();

// Calculate partial payment amounts if payment method is PARTIAL
  let partialPaidAmount = 0;
  let partialRemainingAmount = 0;
  
  if (paymentMethod === "PARTIAL") {
    // Get the paid amount from paymentDetails (this should come from your UI)
    partialPaidAmount = Number(paymentDetails.paidAmount) || 0;
    partialRemainingAmount = cartTotal - partialPaidAmount;
    
    // Validate partial payment
    if (partialPaidAmount <= 0) {
      throw new Error("Paid amount must be greater than 0 for partial payments");
    }
    
    if (partialPaidAmount >= cartTotal) {
      throw new Error("Paid amount must be less than total amount for partial payments");
    }
  }
  
  // Handle split payment normalization
  let normalizedSplits: PaymentSplit[] | undefined = undefined;
  
  if (paymentMethod === "SPLIT" && Array.isArray(paymentDetails.paymentSplits)) {
    const splits = paymentDetails.paymentSplits as PaymentSplit[];
    
    // Debug log
    console.log("Original splits from form:", splits);
    console.log("Cart total:", cartTotal);
    
    // Normalize splits to match cart total
    const splitTotal = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
    
    console.log("Split total from form:", splitTotal);
    
    if (Math.abs(splitTotal - cartTotal) > 0.01) {
      const ratio = cartTotal / splitTotal;
      normalizedSplits = splits.map(split => ({
        ...split,
        amount: parseFloat((split.amount * ratio).toFixed(2)),
        percentage: parseFloat(((split.amount * ratio / cartTotal) * 100).toFixed(2))
      }));
      
      console.log("Normalized splits:", normalizedSplits);
    } else {
      normalizedSplits = splits;
    }
  }

  return cart.map((item) => {
    const price =
      item.useCustomPrice && item.customPrice ? item.customPrice : item.price;
    const totalPieces = item.quantity * item.qtyPerCarton;
    const itemTotal = price * totalPieces;
    const itemProportion = cartTotal > 0 ? itemTotal / cartTotal : 0;

    console.log(`Item: ${item.name}, Total: ${itemTotal}, Proportion: ${itemProportion}`);

    // Calculate paid and remaining amounts based on payment method
    let paidAmount = 0;
    let remainingAmount = 0;
    
    if (paymentMethod === "PARTIAL") {
      // Distribute the partial payment proportionally across items
      const itemPaidAmount = parseFloat((partialPaidAmount * itemProportion).toFixed(2));
      const itemRemainingAmount = parseFloat((partialRemainingAmount * itemProportion).toFixed(2));
      
      paidAmount = itemPaidAmount;
      remainingAmount = itemRemainingAmount;
      
      // Ensure we don't have rounding issues
      if (Math.abs(paidAmount + remainingAmount - itemTotal) > 0.01) {
        // Adjust to ensure total matches
        remainingAmount = parseFloat((itemTotal - paidAmount).toFixed(2));
      }
    } else {
      // For all other payment methods (CASH, BANK_TRANSFER, TELEBIRR, OTHER, SPLIT)
      paidAmount = itemTotal;
      remainingAmount = 0;
    }

    // For split payments, create proportional splits for this item
    let itemSplits: PaymentSplit[] | undefined = undefined;
    if (paymentMethod === "SPLIT" && normalizedSplits) {
      itemSplits = normalizedSplits.map(split => {
        const splitAmount = parseFloat((split.amount * itemProportion).toFixed(2));
        return {
          ...split,
          amount: splitAmount,
          // Keep the same percentage as the overall split
          percentage: split.percentage,
        };
      });
      
      console.log(`Splits for item ${item.name}:`, itemSplits);
    }

    const payload: BulkSalePayload = {
      productId: item.id,
      code: item.code,
      name: item.name,
      ctn: item.quantity,
      productPrice: price,
      totalAmount: itemTotal,
      useCustomPrice: item.useCustomPrice,
      customPricePerPiece: item.useCustomPrice ? item.customPrice : null,
      allowNegativeStock: item.allowNegativeStock,
      buyerName: currentBuyer,
      casherName,
      receiverName: paymentDetails.receiverName as string || '',
      date: selectedDate.format("YYYY-MM-DD"),
      paymentMethod,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      paymentSplits: itemSplits,
    };

    // Add payment method specific details
    if (paymentMethod === "BANK_TRANSFER") {
      if (paymentDetails.bankName)
        payload.bankName = paymentDetails.bankName as string;
      if (paymentDetails.senderName)
        payload.senderName = paymentDetails.senderName as string;
    }

    if (paymentMethod === "TELEBIRR") {
      if (paymentDetails.telebirrPhone)
        payload.telebirrPhone = paymentDetails.telebirrPhone as string;
      if (paymentDetails.telebirrTransactionId)
        payload.telebirrTransactionId =
          paymentDetails.telebirrTransactionId as string;
    }

    if (paymentMethod === "PARTIAL") {
      // For partial payments, we need to include additional fields
      if (paymentDetails.firstPaymentMethod)
        payload.firstPaymentMethod =
          paymentDetails.firstPaymentMethod as string;
      if (paymentDetails.paymentNotes)
        payload.paymentNotes = paymentDetails.paymentNotes as string;
      
      // Include first payment bank if it exists
      if (paymentDetails.firstPaymentBank)
        payload.firstPaymentBank = paymentDetails.firstPaymentBank as string;
      if (paymentDetails.firstPaymentReference)
        payload.firstPaymentReference = paymentDetails.firstPaymentReference as string;
      if (paymentDetails.firstPaymentPhone)
        payload.firstPaymentPhone = paymentDetails.firstPaymentPhone as string;
      if (paymentDetails.firstPaymentDetails)
        payload.firstPaymentDetails = paymentDetails.firstPaymentDetails as string;
      
    }

    if (paymentMethod === "OTHER") {
      if (paymentDetails.otherMethod)
        payload.otherMethod = paymentDetails.otherMethod as string;
      if (paymentDetails.otherReference)
        payload.otherReference = paymentDetails.otherReference as string;
    }

    return payload;
  });
};

  // Handle bulk sale
  const handleBulkSale = async () => {
    const validation = validateBulkSale(
      cart,
      currentBuyer,
      casherName,
      paymentMethod,
      selectedDate,
      partialMethod,
      paymentDetails.paidAmount as number,
      calculateCartTotal()
    );

    if (!validation.isValid) {
      showValidationErrors(validation.errors);
      return;
    }

    if (paymentMethod === "SPLIT" && cart.length > 1) {
    const splits = paymentDetails.paymentSplits as PaymentSplit[] || [];
    const cartTotal = calculateCartTotal();
    const splitTotal = splits.reduce((sum, split) => sum + (split.amount || 0), 0);
    
    if (Math.abs(splitTotal - cartTotal) > 0.01) {
      toastMessage({
        title: "Split Payment Mismatch",
        text: `Split total ($${splitTotal.toFixed(2)}) doesn't match cart total ($${cartTotal.toFixed(2)})`,
        icon: "error",
      });
      return;
    }
  }

    try {
      const salesData = await prepareBulkSalePayload();
      const result = await onBulkSale(salesData);

      if (result.failedCount === 0) {
        onClearCart();
        onClose();
        setCasherName("");
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

  const cartSummary = useMemo(() => calculateCartSummary(cart), [cart]);

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
            cartSummary.itemsNeedingAttention > 0
          }
          icon={<CreditCardOutlined />}
        >
          Complete Bulk Sale (${calculateCartTotal().toFixed(2)})
        </Button>,
      ]}
    >
      {/* Payment Summary Section */}
      <PaymentSummary
        currentBuyer={currentBuyer}
        onBuyerChange={onBuyerChange}
        casherName={casherName}
        onCasherNameChange={(value) => setCasherName(value)}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        paymentSummary={paymentSummary}
        paymentDetails={paymentDetails}
        onPaymentDetailChange={onPaymentDetailChange}
      />

      {/* Payment Forms */}
      <PaymentFormsRouter
        paymentMethod={paymentMethod}
        paymentDetails={paymentDetails}
        onPaymentDetailChange={onPaymentDetailChange}
        calculateCartTotal={calculateCartTotal}
        cart={cart}
        partialMethod={partialMethod}
        onPartialMethodChange={setPartialMethod}
      />

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
          {/* Validation Alerts */}
          <ValidationAlerts cartSummary={cartSummary} />

          {/* Cart Summary */}
          <Alert
            message={
              <div>
                <strong>Cart Summary:</strong> {cart.length} products,{" "}
                {calculateTotalCartItems()} cartons
                <span style={{ float: "right" }}>
                  <span style={{ marginRight: "16px" }}>
                    Pieces: {cartSummary.totalRequestedPieces}
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

          {/* Cart Table */}
          <CartTable
            cart={cart}
            updateCartItem={updateCartItem}
            removeFromCart={removeFromCart}
          />

          {/* Stock Summary */}
          <StockSummary cart={cart} />
        </>
      )}
    </Modal>
  );
};

export default CartModal;
export { default as CartModal } from "./index";