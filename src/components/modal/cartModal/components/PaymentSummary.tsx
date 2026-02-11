import React from "react";
import { Alert, Card, Row, Col, DatePicker, Form, Input, Select } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ethiopianBanks } from "../types";

const { Option } = Select;

interface PaymentSummaryProps {
  currentBuyer: string;
  onBuyerChange: (value: string) => void;
  casherName: string;
  onCasherNameChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
  selectedDate: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs | null) => void;
  paymentSummary: {
    total: number;
    paid: number;
    remaining: number;
  };
  paymentDetails: any;
  onPaymentDetailChange: (field: string, value: any) => void;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  currentBuyer,
  onBuyerChange,
  casherName,
  onCasherNameChange,
  paymentMethod,
  onPaymentMethodChange,
  selectedDate,
  onDateChange,
  paymentSummary,
  paymentDetails,
  onPaymentDetailChange,
}) => {
  const handleBuyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onBuyerChange(e.target.value);
  };

  const handleCasherNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCasherNameChange(e.target.value);
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    onDateChange(date);
  };

  return (
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
              onChange={onPaymentMethodChange}
            >
              <Option value="">Select Payment Method</Option>
              <Option value="CASH">Cash (Full Payment)</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="TELEBIRR">Telebirr</Option>
              <Option value="PARTIAL">Partial Payment</Option>
              <Option value="SPLIT">Split Payment</Option>
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

      {/* Payment Summary Alert */}
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

      {/* Receiver Name input for non-cash payments */}
      {paymentMethod && paymentMethod !== "CASH" && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Form.Item label="Receiver Name">
            <Input
              placeholder="Receiver name"
              value={paymentDetails.receiverName || ""}
              onChange={(e) =>
                onPaymentDetailChange("receiverName", e.target.value)
              }
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
    </Card>
  );
};

export default PaymentSummary;