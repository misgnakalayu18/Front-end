import { Card, Form, Select, InputNumber, Input, Row, Col, DatePicker } from 'antd';
import { DollarOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const PartialPaymentForm = ({ onChange, value }) => {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Paid Amount" required>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Paid amount"
              value={value?.paidAmount}
              onChange={(paidAmount) => onChange({ ...value, paidAmount })}
              prefix={<DollarOutlined />}
              min={1}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="First Payment Method" required>
            <Select
              placeholder="Select method"
              value={value?.firstPaymentMethod}
              onChange={(firstPaymentMethod) => onChange({ ...value, firstPaymentMethod })}
            >
              <Option value="CASH">Cash</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="TELEBIRR">Telebirr</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Due Date">
            <DatePicker
              style={{ width: '100%' }}
              value={value?.dueDate ? dayjs(value.dueDate) : null}
              onChange={(date) => onChange({ ...value, dueDate: date ? date.format('YYYY-MM-DD') : null })}
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Payment Notes">
            <Input.TextArea
              placeholder="Payment agreement notes"
              value={value?.paymentNotes}
              onChange={(e) => onChange({ ...value, paymentNotes: e.target.value })}
              rows={2}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default PartialPaymentForm;