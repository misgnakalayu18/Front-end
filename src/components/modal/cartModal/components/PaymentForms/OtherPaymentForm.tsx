import React from "react";
import { Card, Form, Input } from "antd";

interface OtherPaymentFormProps {
  paymentDetails: any;
  onPaymentDetailChange: (field: string, value: any) => void;
}

const OtherPaymentForm: React.FC<OtherPaymentFormProps> = ({
  paymentDetails,
  onPaymentDetailChange,
}) => {
  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onPaymentDetailChange(field, e.target.value);
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form.Item label="Other Method Details">
        <Input.TextArea
          placeholder="Describe other payment method"
          value={paymentDetails.otherMethod || ""}
          onChange={handleInputChange("otherMethod")}
          rows={2}
        />
      </Form.Item>
      <Form.Item label="Reference">
        <Input
          placeholder="Reference/Transaction ID"
          value={paymentDetails.otherReference || ""}
          onChange={handleInputChange("otherReference")}
        />
      </Form.Item>
    </Card>
  );
};

export default OtherPaymentForm;