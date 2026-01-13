import { Card, Form, Input, Row, Col } from 'antd';
import { MobileOutlined, TransactionOutlined } from '@ant-design/icons';

const TelebirrForm = ({ onChange, value }) => {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Phone Number" required>
            <Input
              placeholder="Phone number"
              value={value?.telebirrPhone}
              onChange={(e) => onChange({ ...value, telebirrPhone: e.target.value })}
              prefix={<MobileOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Transaction ID" required>
            <Input
              placeholder="Transaction ID"
              value={value?.telebirrTransactionId}
              onChange={(e) => onChange({ ...value, telebirrTransactionId: e.target.value })}
              prefix={<TransactionOutlined />}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default TelebirrForm;