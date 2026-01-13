import { Card, Form, Select, Input, Row, Col } from 'antd';
import { BankOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';

const { Option } = Select;

const BankTransferForm = ({ onChange, value }) => {
  const ethiopianBanks = [
    'Commercial Bank of Ethiopia',
    'Awash Bank',
    'Dashen Bank',
    'Bank of Abyssinia',
    'Wegagen Bank',
    'Nib International Bank',
    'Cooperative Bank of Oromia',
    'Hibret Bank',
    'Abay Bank',
    'Addis International Bank',
    'Zemen Bank',
    'Bunna International Bank',
    'Berhan International Bank',
    'Lion International Bank',
    'Enat Bank',
    'Oromia International Bank',
    'United Bank',
    'Beltel Bank',
    'Hijira Bank',
    'zemzem Bank',
    'OTHER'
  ];

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Bank Name" required>
            <Select
              placeholder="Select bank"
              value={value?.bankName}
              onChange={(bankName) => onChange({ ...value, bankName })}
              suffixIcon={<BankOutlined />}
            >
              {ethiopianBanks.map(bank => (
                <Option key={bank} value={bank}>{bank}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Sender Name">
            <Input
              placeholder="Sender name"
              value={value?.senderName}
              onChange={(e) => onChange({ ...value, senderName: e.target.value })}
              prefix={<UserOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Sender Phone">
            <Input
              placeholder="Sender phone"
              value={value?.senderPhone}
              onChange={(e) => onChange({ ...value, senderPhone: e.target.value })}
              prefix={<PhoneOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Reference">
            <Input
              placeholder="Transaction reference"
              value={value?.reference}
              onChange={(e) => onChange({ ...value, reference: e.target.value })}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default BankTransferForm;