import React from "react";
import { Card, Form, Input, Row, Col } from "antd";
import { MobileOutlined, TransactionOutlined } from "@ant-design/icons";

interface TelebirrFormProps {
  paymentDetails: any;
  onPaymentDetailChange: (field: string, value: any) => void;
}

const TelebirrForm: React.FC<TelebirrFormProps> = ({
  paymentDetails,
  onPaymentDetailChange,
}) => {
  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onPaymentDetailChange(field, e.target.value);
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Phone Number">
            <Input
              placeholder="Phone number"
              value={paymentDetails.telebirrPhone || ""}
              onChange={handleInputChange("telebirrPhone")}
              prefix={<MobileOutlined />}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Transaction ID">
            <Input
              placeholder="Transaction ID"
              value={paymentDetails.telebirrTransactionId || ""}
              onChange={handleInputChange("telebirrTransactionId")}
              prefix={<TransactionOutlined />}
              allowClear
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default TelebirrForm;