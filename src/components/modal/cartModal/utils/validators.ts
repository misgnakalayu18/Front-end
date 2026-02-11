import toastMessage from "../../../../lib/toastMessage";
import { CartItem } from "../types";
import { getStockStatus } from "./calculations";
import { Dayjs } from "dayjs";

export const validateBulkSale = (
  cart: CartItem[],
  currentBuyer: string,
  casherName: string,
  paymentMethod: string,
  selectedDate: Dayjs,
  partialMethod?: string,
  paidAmount?: number,
  totalCartAmount?: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!currentBuyer) errors.push("Buyer name is required");
  if (!casherName) errors.push("Casher name is required");
  if (!paymentMethod) errors.push("Payment method is required");

  // Validate date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate.isAfter(today, "day")) {
    errors.push("Sale date cannot be in the future");
  }

  // Validate stock
  for (const item of cart) {
    const status = getStockStatus(item);
    if (!item.allowNegativeStock && status.isNegativeStock) {
      errors.push(
        `${item.name}: Requested ${status.requestedCartons} cartons but only ${status.availableCartons} available. Enable "Allow Negative Stock" to proceed.`
      );
    }
  }

  // Validate partial payment
  if (paymentMethod === "PARTIAL") {
    if (!paidAmount || paidAmount <= 0) {
      errors.push("Paid amount must be greater than 0 for partial payment");
    } else if (totalCartAmount && paidAmount >= totalCartAmount) {
      errors.push(
        "Paid amount must be less than total amount for partial payment"
      );
    }
    if (!partialMethod) {
      errors.push("Please select first payment method for partial payment");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const showValidationErrors = (errors: string[]) => {
  if (errors.length > 0) {
    toastMessage({
      title: "Validation Error",
      text: errors.join("\n"),
      icon: "warning",
    });
  }
};