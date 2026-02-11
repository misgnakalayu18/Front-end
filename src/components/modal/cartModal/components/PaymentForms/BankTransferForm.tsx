import React from "react";
import { Card, Row, Col, Form, Select, Input } from "antd";
import { ethiopianBanks } from "../../types";

interface BankTransferFormProps {
  paymentDetails: any;
  onPaymentDetailChange: (field: string, value: any) => void;
}

const BankTransferForm: React.FC<BankTransferFormProps> = ({
  paymentDetails,
  onPaymentDetailChange,
}) => {
  const filterBankOption = (input: string, option?: any) => {
    return (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  };

  const handleSelectChange = (field: string) => (value: string) => {
    onPaymentDetailChange(field, value);
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onPaymentDetailChange(field, e.target.value);
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Bank Name">
            <Select
              placeholder="Select bank"
              value={paymentDetails.bankName}
              onChange={handleSelectChange("bankName")}
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
          <Form.Item label="Sender Name">
            <Input
              placeholder="Sender name"
              value={paymentDetails.senderName || ""}
              onChange={handleInputChange("senderName")}
              allowClear
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default BankTransferForm;