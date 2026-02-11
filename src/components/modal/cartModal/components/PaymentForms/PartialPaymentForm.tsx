import React from "react";
import {
  Card,
  Row,
  Col,
  Form,
  InputNumber,
  Select,
  Input,
  Alert,
} from "antd";
import { MobileOutlined, TransactionOutlined } from "@ant-design/icons";
import PaymentDistribution from "../PaymentDistribution";
import { ethiopianBanks } from "../../types";
import { calculateProportionalPayment } from "../../utils/calculations";

const { Option } = Select;

interface PartialPaymentFormProps {
  paymentDetails: any;
  onPaymentDetailChange: (field: string, value: any) => void;
  calculateCartTotal: () => number;
  cart: any[];
  partialMethod?: string;
  onPartialMethodChange?: (value: string) => void;
}

const PartialPaymentForm: React.FC<PartialPaymentFormProps> = ({
  paymentDetails,
  onPaymentDetailChange,
  calculateCartTotal,
  cart,
  partialMethod,
  onPartialMethodChange,
}) => {
  const filterBankOption = (input: string, option?: any) => {
    return (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  };

  const proportionalPayment = calculateProportionalPayment(
    cart,
    "PARTIAL",
    paymentDetails.paidAmount,
    calculateCartTotal
  );

  return (
    <>
      {proportionalPayment && (
        <PaymentDistribution proportionalPayment={proportionalPayment} />
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Paid Amount" required>
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Paid amount"
                value={paymentDetails.paidAmount}
                onChange={(value) =>
                  onPaymentDetailChange("paidAmount", value)
                }
                min={1}
                max={calculateCartTotal() - 1}
                formatter={(value) =>
                  `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
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
                  onPartialMethodChange?.(value);
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
                  value={paymentDetails.firstPaymentBank}
                  onChange={(value) =>
                    onPaymentDetailChange("firstPaymentBank", value)
                  }
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
                  value={paymentDetails.firstPaymentReference || ""}
                  onChange={(e) =>
                    onPaymentDetailChange(
                      "firstPaymentReference",
                      e.target.value
                    )
                  }
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        {partialMethod === "TELEBIRR" && (
          <Form.Item label="Phone Number">
            <Input
              placeholder="Phone number"
              value={paymentDetails.firstPaymentPhone || ""}
              onChange={(e) =>
                onPaymentDetailChange("firstPaymentPhone", e.target.value)
              }
              prefix={<MobileOutlined />}
            />
          </Form.Item>
        )}

        {partialMethod === "OTHER" && (
          <Form.Item label="Payment Details">
            <Input.TextArea
              placeholder="Enter payment details"
              value={paymentDetails.firstPaymentDetails || ""}
              onChange={(e) =>
                onPaymentDetailChange("firstPaymentDetails", e.target.value)
              }
              rows={2}
            />
          </Form.Item>
        )}

        {/* Payment notes */}
        <Form.Item label="Payment Notes">
          <Input.TextArea
            placeholder="Add payment agreement notes"
            value={paymentDetails.paymentNotes || ""}
            onChange={(e) =>
              onPaymentDetailChange("paymentNotes", e.target.value)
            }
            rows={2}
          />
        </Form.Item>
      </Card>
    </>
  );
};

export default PartialPaymentForm;