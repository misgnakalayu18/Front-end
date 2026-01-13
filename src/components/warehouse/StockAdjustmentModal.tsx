// components/warehouse/StockAdjustmentModal.tsx
// Replace the entire component with this simplified version
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Alert,
  Row,
  Col,
  Typography,
  Tag,
  Spin,
  message,
  Card
} from 'antd';
import { EditOutlined, ArrowUpOutlined, ArrowDownOutlined, WarningOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Define props interface
interface StockAdjustmentModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  product?: any;
  initialWarehouse?: string;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  open,
  onCancel,
  onSuccess,
  product,
  initialWarehouse
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(0);

  useEffect(() => {
    if (product && initialWarehouse) {
      // Get current quantity based on warehouse
      const warehouseField = getWarehouseField(initialWarehouse);
      const quantity = product[warehouseField] || 0;
      setCurrentQuantity(quantity);
      form.setFieldsValue({ currentQuantity: quantity });
    }
  }, [product, initialWarehouse, form]);

  const getWarehouseField = (warehouse: string) => {
    const fieldMap: Record<string, string> = {
      SHEGOLE_MULUNEH: 'shegoleMulunehQty',
      EMBILTA: 'embiltaQty',
      NEW_SHEGOLE: 'newShegoleQty',
      MERKATO: 'merkatoQty',
      DAMAGE: 'damageQty',
      BACKUP: 'backupQty'
    };
    return fieldMap[warehouse] || '';
  };

  const handleSubmit = async (values: any) => {
    if (!product || !initialWarehouse) return;
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Stock adjustment saved successfully');
      onSuccess();
      onCancel();
    } catch (error) {
      message.error('Failed to save adjustment');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <Modal
        title="Adjust Stock"
        open={open}
        onCancel={onCancel}
        footer={[
          <Button key="close" onClick={onCancel}>
            Close
          </Button>
        ]}
      >
        <Alert
          message="No Product Selected"
          description="Please select a product to adjust stock."
          type="info"
          showIcon
        />
      </Modal>
    );
  }

  return (
    <Modal
      title="Adjust Stock"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            adjustmentType: 'SET',
            adjustmentReason: 'COUNT_CORRECTION'
          }}
        >
          <Form.Item
            name="adjustmentType"
            label="Adjustment Type"
            rules={[{ required: true, message: 'Please select adjustment type' }]}
          >
            <Select>
              <Option value="SET">Set to exact quantity</Option>
              <Option value="ADD">Add quantity</Option>
              <Option value="SUBTRACT">Subtract quantity</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 0, message: 'Quantity must be 0 or higher' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter quantity"
            />
          </Form.Item>

          <Form.Item
            name="adjustmentReason"
            label="Reason"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <Select>
              <Option value="COUNT_CORRECTION">Count Correction</Option>
              <Option value="DAMAGE">Damage</Option>
              <Option value="THEFT_LOSS">Theft/Loss</Option>
              <Option value="RETURN">Customer Return</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save Adjustment
              </Button>
            </Space>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default StockAdjustmentModal;