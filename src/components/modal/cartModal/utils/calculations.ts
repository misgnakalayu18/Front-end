import { CartItem, StockStatus } from "../types";

export const calculateItemTotal = (item: CartItem): number => {
  const price =
    item.useCustomPrice && item.customPrice ? item.customPrice : item.price;
  const totalPieces = item.quantity * item.qtyPerCarton;
  return price * totalPieces;
};

export const getStockStatus = (item: CartItem): StockStatus => {
  const availableCartons = item.availableCartons;
  const requestedCartons = item.quantity;
  const totalRequestedPieces = requestedCartons * item.qtyPerCarton;
  const availablePieces = item.availableStock;

  const isNegativeStock = requestedCartons > availableCartons;
  const shortageCartons = Math.max(0, requestedCartons - availableCartons);
  const shortagePieces = Math.max(0, totalRequestedPieces - availablePieces);
  
  const piecesPerCarton = item.qtyPerCarton;
  const maxAllowedCartons = item.allowNegativeStock ? Infinity : availableCartons;
  
  // Determine status
  let status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "NEGATIVE_ALLOWED";
  
  if (isNegativeStock && item.allowNegativeStock) {
    status = "NEGATIVE_ALLOWED";
  } else if (availableCartons <= 0) {
    status = "OUT_OF_STOCK";
  } else if (availableCartons < requestedCartons) {
    status = "LOW_STOCK";
  } else {
    status = "IN_STOCK";
  }
  
  let message: string | undefined;
  if (isNegativeStock && !item.allowNegativeStock) {
    message = `Insufficient stock. ${shortageCartons} cartons short.`;
  } else if (isNegativeStock && item.allowNegativeStock) {
    message = "Negative stock allowed";
  }

  return {
    availableCartons,
    availablePieces,
    requestedCartons,
    totalRequestedPieces,
    isNegativeStock,
    shortageCartons,
    shortagePieces,
    hasEnoughStock: !isNegativeStock || item.allowNegativeStock,
    piecesPerCarton,
    maxAllowedCartons,
    status,
    message,
  };
};

export const calculateCartSummary = (cart: CartItem[]) => {
  const totalRequestedPieces = cart.reduce(
    (total, item) => total + item.quantity * item.qtyPerCarton,
    0
  );

  const totalAvailablePieces = cart.reduce(
    (total, item) => total + item.availableStock,
    0
  );

  const totalRequestedCartons = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const totalAvailableCartons = cart.reduce(
    (total, item) => total + item.availableCartons,
    0
  );

  const itemsNeedingAttention = cart.filter((item) => {
    const status = getStockStatus(item);
    return status.isNegativeStock && !item.allowNegativeStock;
  }).length;

  return {
    totalRequestedPieces,
    totalAvailablePieces,
    totalRequestedCartons,
    totalAvailableCartons,
    itemsNeedingAttention,
    totalItems: cart.length,
    shortageCartons: Math.max(0, totalRequestedCartons - totalAvailableCartons),
    shortagePieces: Math.max(0, totalRequestedPieces - totalAvailablePieces),
  };
};

export const calculateProportionalPayment = (
  cart: CartItem[],
  paymentMethod: string,
  paidAmount: number | undefined,
  calculateCartTotal: () => number
) => {
  const totalCartAmount = calculateCartTotal();

  if (paymentMethod !== "PARTIAL" || !paidAmount) {
    return null;
  }

  if (paidAmount <= 0 || paidAmount >= totalCartAmount) {
    return null;
  }

  const paidPercentage = paidAmount / totalCartAmount;

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
};