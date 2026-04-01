import React from 'react';
import {
  Drawer, Form, Input, Select, DatePicker, InputNumber,
  Button, Space, Flex, Badge, Typography, Tooltip,
} from 'antd';
import { RangePickerProps } from 'antd/es/date-picker';
import { InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Color } from 'antd/es/color-picker';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

export interface FilterValues {
  search?: string;
  paymentStatus?: string[];
  paymentMethod?: string[];
  bankName?: string[];
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  amountRange?: [number | null, number | null] | null;
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

const ETHIOPIAN_BANKS = [
  'Commercial Bank of Ethiopia','Bank of Abyssinia','Awash Bank',
  'Dashen Bank','Wegagen Bank','United Bank','Nib International Bank',
  'Cooperative Bank of Oromia','Lion International Bank','Oromia International Bank',
  'Berhan Bank','Abay Bank','Addis International Bank','Debub Global Bank','Enat Bank',
];

const SalesFilters: React.FC<SalesFiltersProps> = ({
  visible, onClose, form, activeFilters, onApplyFilters, onClearAllFilters, isMobile = false,
}) => {
  const disabledDate: RangePickerProps['disabledDate'] = (current) =>
    current && current > dayjs().endOf('day');

  const paymentMethod: string[] | undefined = Form.useWatch('paymentMethod', form);
  const showBankFilter =
    !paymentMethod || paymentMethod.length === 0 ||
    paymentMethod.includes('BANK_TRANSFER') || paymentMethod.includes('SPLIT');

  const size = isMobile ? 'large' : 'middle';

  return (
    <Drawer
      title={<Flex justify="space-between" align="center"><Text strong>Filters</Text><Badge count={activeFilters} size="small" /></Flex>}
      placement={isMobile ? 'bottom' : 'right'}
      onClose={onClose}
      open={visible}
      width={isMobile ? '100%' : 400}
      height={isMobile ? '80%' : '100%'}
      style={{ borderTopLeftRadius: isMobile ? '12px' : 0, borderTopRightRadius: isMobile ? '12px' : 0 }}
      extra={<Button type="link" onClick={onClearAllFilters} size="small">Clear All</Button>}
    >
      <Form form={form} layout="vertical" onFinish={onApplyFilters}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>

          <Form.Item label={<Space><span>Search</span><Tooltip title="Search by buyer name, casher name, or product code"><InfoCircleOutlined style={{ color: '#999' }} /></Tooltip></Space>} name="search">
            <Input.Search placeholder="Search by buyer, casher, or product code..." allowClear size={size} enterButton />
          </Form.Item>

          <Form.Item label="Payment Status" name="paymentStatus">
            <Select mode="multiple" placeholder="Select payment status" allowClear maxTagCount="responsive" size={size}>
              <Option value="FULL">Paid</Option>
              <Option value="PARTIAL">Partial</Option>
              <Option value="PENDING">Pending</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Payment Method" name="paymentMethod">
            <Select mode="multiple" placeholder="Select payment method" allowClear maxTagCount="responsive" size={size}>
              <Option value="CASH">Cash</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="TELEBIRR">Telebirr</Option>
              <Option value="SPLIT">Split</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>

          {showBankFilter && (
            <Form.Item
              label={<Space><span>Bank Name</span><Tooltip title="Filters sales by bank used in bank transfer or split payments"><InfoCircleOutlined style={{ color: '#999' }} /></Tooltip></Space>}
              name="bankName"
            >
              <Select mode="multiple" placeholder="Select bank(s)" allowClear showSearch maxTagCount="responsive"
                optionFilterProp="children" size={size}
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())}>
                {ETHIOPIAN_BANKS.map((bank) => <Option key={bank} value={bank}>{bank}</Option>)}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Date Range" name="dateRange">
            <RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder={['Start Date', 'End Date']} size={size} disabledDate={disabledDate} />
          </Form.Item>

          <Form.Item label="Amount Range (ETB)" name="amountRange">
            <Input.Group compact>
              <Form.Item name={['amountRange', 0]} noStyle>
                <InputNumber<number> style={{ width: '50%' }} placeholder="Min" min={0}
                  formatter={(v) => `ETB ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => (v ? Number(v.replace(/ETB\s?|(,*)/g, '')) : 0)} size={size} />
              </Form.Item>
              <Form.Item name={['amountRange', 1]} noStyle>
                <InputNumber<number> style={{ width: '50%' }} placeholder="Max" min={0}
                  formatter={(v) => `ETB ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => (v ? Number(v.replace(/ETB\s?|(,*)/g, '')) : 0)} size={size} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
        </div>

        <div style={{ paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Space style={{ width: '100%' }}>
            <Button onClick={onClose} 
            style={{ width: '50px',
            marginLeft: '8px', 
            margin: '8px',
            backgroundColor:'red',
            fontWeight:700 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" 
            style={{ width: '100px',
               fontFamily: 'inherit',
               fontWeight: 'bold',
               marginLeft: '8px',
                margin: '18px',
            color: 'white' }}>Apply Filters</Button>
          </Space>
        </div>
      </Form>
    </Drawer>
  );
};

export default SalesFilters;