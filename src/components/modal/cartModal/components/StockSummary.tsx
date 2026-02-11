import React from "react";
import { Row, Col, Alert } from "antd";
import {
  ShoppingOutlined,
  WarningOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { CartItem } from "../types";
import { calculateCartSummary } from "../utils/calculations";

interface StockSummaryProps {
  cart: CartItem[];
}

const StockSummary: React.FC<StockSummaryProps> = ({ cart }) => {
  const stockSummary = calculateCartSummary(cart);

  return (
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
  );
};

export default StockSummary;