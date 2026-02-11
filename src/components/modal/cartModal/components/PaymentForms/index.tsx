import React from "react";
import { Card } from "antd";
import BankTransferForm from "./BankTransferForm";
import TelebirrForm from "./TelebirrForm";
import PartialPaymentForm from "./PartialPaymentForm";
import SplitPaymentForm from "./SplitPaymentForm";
import OtherPaymentForm from "./OtherPaymentForm";
import { PaymentDetails } from "../../types";

interface PaymentFormsRouterProps {
  paymentMethod: string;
  paymentDetails: PaymentDetails;
  onPaymentDetailChange: (
    field: keyof PaymentDetails,
    value: string | number | null
  ) => void;
  calculateCartTotal: () => number;
  cart: any[];
  partialMethod?: string;
  onPartialMethodChange?: (value: string) => void;
}

const PaymentFormsRouter: React.FC<PaymentFormsRouterProps> = ({
  paymentMethod,
  paymentDetails,
  onPaymentDetailChange,
  calculateCartTotal,
  cart,
  partialMethod,
  onPartialMethodChange,
}) => {
  switch (paymentMethod) {
    case "BANK_TRANSFER":
      return (
        <BankTransferForm
          paymentDetails={paymentDetails}
          onPaymentDetailChange={onPaymentDetailChange}
        />
      );

    case "TELEBIRR":
      return (
        <TelebirrForm
          paymentDetails={paymentDetails}
          onPaymentDetailChange={onPaymentDetailChange}
        />
      );

    case "PARTIAL":
      return (
        <PartialPaymentForm
          paymentDetails={paymentDetails}
          onPaymentDetailChange={onPaymentDetailChange}
          calculateCartTotal={calculateCartTotal}
          cart={cart}
          partialMethod={partialMethod}
          onPartialMethodChange={onPartialMethodChange}
        />
      );

    case "SPLIT":
      return (
        <SplitPaymentForm
          paymentDetails={paymentDetails}
          onPaymentDetailChange={onPaymentDetailChange}
          calculateCartTotal={calculateCartTotal}
        />
      );

    case "OTHER":
      return (
        <OtherPaymentForm
          paymentDetails={paymentDetails}
          onPaymentDetailChange={onPaymentDetailChange}
        />
      );

    default:
      return null;
  }
};

export default PaymentFormsRouter;