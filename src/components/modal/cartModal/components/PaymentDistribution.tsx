import React from "react";
import { Card, Row, Col, Tag } from "antd";
import { ProportionalPayment } from "../types";

interface PaymentDistributionProps {
  proportionalPayment: ProportionalPayment;
}

const PaymentDistribution: React.FC<PaymentDistributionProps> = ({
  proportionalPayment,
}) => {
  const {
    totalCartAmount,
    paidAmount,
    remainingAmount,
    paidPercentage,
    itemPayments,
  } = proportionalPayment;

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

export default PaymentDistribution;