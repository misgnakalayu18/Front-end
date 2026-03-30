import React from 'react';
import { 
  Drawer, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  InputNumber, 
  Button, 
  Space, 
  Flex, 
  Badge, 
  Typography,
  Tooltip
} from 'antd';
import { RangePickerProps } from 'antd/es/date-picker';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

interface FilterValues {
  search: string;
  paymentStatus: string[];
  paymentMethod: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  amountRange: [number, number] | null;
}

interface SalesFiltersProps {
  visible: boolean;
  onClose: () => void;
  form: any;
  activeFilters: number;
  onApplyFilters: (values: FilterValues) => void;
  onClearAllFilters: () => void;
  isMobile?: boolean;
}

const SalesFilters: React.FC<SalesFiltersProps> = ({
  visible,
  onClose,
  form,
  activeFilters,
  onApplyFilters,
  onClearAllFilters,
  isMobile = false
}) => {
  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current > dayjs().endOf('day');
  };

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center">
          <Text strong>Filters</Text>
          <Badge count={activeFilters} size="small" />
        </Flex>
      }
      placement={isMobile ? "bottom" : "right"}
      onClose={onClose}
      open={visible}
      width={isMobile ? '100%' : 400}
      height={isMobile ? '80%' : '100%'}
      style={{ 
        borderTopLeftRadius: isMobile ? '12px' : 0,
        borderTopRightRadius: isMobile ? '12px' : 0 
      }}
      extra={
        <Button 
          type="link" 
          onClick={onClearAllFilters}
          size="small"
        >
          Clear All
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onApplyFilters}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Form.Item
            label={
              <Space>
                <span>Search</span>
                <Tooltip title="Search by buyer name, casher name, or product code">
                  <InfoCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            name="search"
          >
            <Input.Search
              placeholder="Search by buyer, casher, or product code..."
              allowClear
              size={isMobile ? "large" : "middle"}
              enterButton
            />
          </Form.Item>

          {/* Rest of your form items remain the same */}
          <Form.Item
            label="Payment Status"
            name="paymentStatus"
          >
            <Select
              mode="multiple"
              placeholder="Select payment status"
              allowClear
              maxTagCount="responsive"
              size={isMobile ? "large" : "middle"}
            >
              <Option value="FULL">Paid</Option>
              <Option value="PARTIAL">Partial</Option>
              <Option value="PENDING">Pending</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethod"
          >
            <Select
              mode="multiple"
              placeholder="Select payment method"
              allowClear
              maxTagCount="responsive"
              size={isMobile ? "large" : "middle"}
            >
              <Option value="CASH">Cash</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="TELEBIRR">Telebirr</Option>
              <Option value="SPLIT">Split</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Date Range"
            name="dateRange"
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
              size={isMobile ? "large" : "middle"}
              disabledDate={disabledDate}
            />
          </Form.Item>

          <Form.Item
            label="Amount Range (ETB)"
            name="amountRange"
          >
            <Input.Group compact>
              <Form.Item
                name={['amountRange', 0]}
                noStyle
              >
                <InputNumber<number>
                  style={{ width: '50%' }}
                  placeholder="Min"
                  min={0}
                  formatter={(value) => `ETB ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value ? Number(value.replace(/ETB\s?|(,*)/g, '')) : 0}
                  size={isMobile ? "large" : "middle"}
                />
              </Form.Item>
              <Form.Item
                name={['amountRange', 1]}
                noStyle
              >
                <InputNumber<number>
                  style={{ width: '50%' }}
                  placeholder="Max"
                  min={0}
                  formatter={(value) => `ETB ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value ? Number(value.replace(/ETB\s?|(,*)/g, '')) : 0}
                  size={isMobile ? "large" : "middle"}
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Space style={{ width: '100%' }}>
            <Button
              onClick={onClose}
              style={{ width: '50%' }}
              size={isMobile ? "large" : "middle"}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: '50%' }}
              size={isMobile ? "large" : "middle"}
            >
              Apply Filters
            </Button>
          </Space>
        </div>
      </Form>
    </Drawer>
  );
};

export default SalesFilters;