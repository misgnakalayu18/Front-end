// components/warehouse/AddStockModal.tsx
import React from 'react';
import { Modal, Form, Select, InputNumber, Input, message } from 'antd';

const { Option } = Select;
const { TextArea } = Input;

interface AddStockModalProps {
  visible: boolean;
  onCancel: () => void;
  isMobile: boolean;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ visible, onCancel, isMobile }) => {
  const [form] = Form.useForm();

  const handleAddStock = () => {
    form.validateFields().then(values => {
      console.log('Add stock:', values);
      message.success('Stock added successfully');
      onCancel();
      form.resetFields();
    }).catch(error => {
      console.error('Validation failed:', error);
    });
  };

  const warehouses = [
    { id: 'MERKATO', name: 'MERKATO' },
    { id: 'SHEGOLE_MULUNEH', name: 'SHEGOLE MULUNEH' },
    { id: 'EMBILTA', name: 'EMBILTA' },
    { id: 'NEW_SHEGOLE', name: 'NEW SHEGOLE' },
    { id: 'BACKUP', name: 'BACKUP' },
    { id: 'DAMAGE', name: 'DAMAGE' }
  ];

  return (
    <Modal
      title="Add Stock"
      open={visible}
      onOk={handleAddStock}
      onCancel={onCancel}
      okText="Add Stock"
      cancelText="Cancel"
      width={isMobile ? '90%' : 520}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="product"
          label="Product"
          rules={[{ required: true, message: 'Please select product' }]}
        >
          <Select placeholder="Select product" size={isMobile ? "small" : "middle"}>
            {/* Populate with actual products */}
            <Option value="product1">Product 1</Option>
            <Option value="product2">Product 2</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          name="warehouse"
          label="Warehouse"
          rules={[{ required: true, message: 'Please select warehouse' }]}
        >
          <Select placeholder="Select warehouse" size={isMobile ? "small" : "middle"}>
            {warehouses.map(wh => (
              <Option key={wh.id} value={wh.id}>
                {wh.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="cartons"
          label="Number of Cartons"
          rules={[{ required: true, message: 'Please enter number of cartons' }]}
        >
          <InputNumber 
            placeholder="Enter number of cartons" 
            style={{ width: '100%' }}
            min={1}
            size={isMobile ? "small" : "middle"}
          />
        </Form.Item>
        
        <Form.Item
          name="notes"
          label="Notes (Optional)"
        >
          <TextArea 
            placeholder="Add any notes..." 
            rows={3}
            size={isMobile ? "small" : "middle"}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddStockModal;