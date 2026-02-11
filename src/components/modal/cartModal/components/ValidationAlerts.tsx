import React from "react";
import { Alert } from "antd";
import { WarningOutlined } from "@ant-design/icons";

interface ValidationAlertsProps {
  cartSummary: {
    itemsNeedingAttention: number;
    totalRequestedCartons: number;
    totalAvailableCartons: number;
    totalRequestedPieces: number;
    totalAvailablePieces: number;
    shortageCartons: number;
    shortagePieces: number;
  };
}

const ValidationAlerts: React.FC<ValidationAlertsProps> = ({ cartSummary }) => {
  if (cartSummary.itemsNeedingAttention === 0) {
    return null;
  }

  return (
    <Alert
      message="Attention Required"
      description={
        <div>
          <strong>
            {cartSummary.itemsNeedingAttention} item(s) need your
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
            <br />• Requested: {cartSummary.totalRequestedCartons}{" "}
            cartons ({cartSummary.totalRequestedPieces} pieces)
            <br />• Available: {cartSummary.totalAvailableCartons}{" "}
            cartons ({cartSummary.totalAvailablePieces} pieces)
            <br />• Shortage: {cartSummary.shortageCartons} cartons (
            {cartSummary.shortagePieces} pieces)
          </div>
        </div>
      }
      type="warning"
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};

export default ValidationAlerts;