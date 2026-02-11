import React, { useState } from 'react';
import { 
  DollarOutlined, 
  CheckCircleOutlined 
} from '@ant-design/icons';
import { 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Button, 
  Row, 
  Col, 
  Flex,
  message 
} from 'antd';
import { useRecordRepaymentMutation } from '../../redux/features/management/saleApi';
import { Grid  } from 'antd';
import toastMessage from '../../lib/toastMessage';

const { Option } = Select;
const { useBreakpoint } = Grid;

interface RepaymentModalProps {
  transaction: any;
  onSuccess: () => void;
  size?: "small" | "middle" | "large";
  visible?: boolean;
  onClose?: () => void;
}

const RepaymentModal: React.FC<RepaymentModalProps> = ({ 
  transaction, 
  onSuccess, 
  size = "middle",
  visible: externalVisible,
  onClose: externalOnClose
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [addPayment, { isLoading }] = useRecordRepaymentMutation();
  const screens = useBreakpoint();
  
  const maxAmount = transaction.remainingAmount || 0;
  const originalTotal = transaction.totalPrice || 0;
  const alreadyPaid = transaction.paidAmount || 0;
  const saleId = transaction.id;

  const showModal = () => {
    setIsModalOpen(true);
    form.setFieldsValue({
      amount: maxAmount > 0 ? maxAmount : 0,
      paymentMethod: 'CASH'
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    if (externalOnClose) externalOnClose();
  };

  const handleSubmit = async (values: any) => {
    try {
      const paymentAmount = parseFloat(values.amount);
      
      if (paymentAmount <= 0) {
        toastMessage({ 
          icon: 'error', 
          text: 'Payment amount must be greater than 0' 
        });
        return;
      }

      if (paymentAmount > maxAmount) {
        toastMessage({ 
          icon: 'error', 
          text: `Payment amount (ETB ${paymentAmount.toLocaleString()}) cannot exceed remaining amount (ETB ${maxAmount.toLocaleString()})` 
        });
        return;
      }

      if (!saleId) {
        toastMessage({ 
          icon: 'error', 
          text: 'Invalid transaction ID' 
        });
        return;
      }

      const paymentData = {
        amount: paymentAmount,
        paymentMethod: values.paymentMethod,
        notes: values.notes || '',
        bankName: values.bankName,
        transactionId: values.transactionId,
        senderName: values.senderName,
        telebirrPhone: values.telebirrPhone,
        telebirrTransactionId: values.telebirrTransactionId,
        otherMethod: values.otherMethod,
        otherReference: values.otherReference
      };

      const res = await addPayment({ 
        saleId: saleId, 
        ...paymentData 
      }).unwrap();

      if (res.success) {
        toastMessage({ 
          icon: 'success', 
          text: `Payment of ETB ${paymentAmount.toLocaleString()} recorded successfully!` 
        });
        onSuccess();
        handleCancel();
      } else {
        toastMessage({ 
          icon: 'error', 
          text: res.message || 'Failed to record payment' 
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toastMessage({ 
        icon: 'error', 
        text: error.data?.message || error.message || 'Failed to record payment' 
      });
    }
  };

  const isOpen = externalVisible !== undefined ? externalVisible : isModalOpen;

  return (
    <>
      {externalVisible === undefined && (
        <Button
          type="primary"
          icon={<DollarOutlined />}
          onClick={showModal}
          size={size}
          style={{ backgroundColor: '#52c41a' }}
          disabled={maxAmount <= 0}
        >
          {screens.md ? 'Repay' : ''}
        </Button>
      )}
      
      <Modal
        title="Record Payment"
        open={isOpen}
        onCancel={handleCancel}
        footer={null}
        width={screens.md ? 500 : '90%'}
        style={{ 
          top: screens.md ? undefined : 20,
          maxHeight: screens.md ? undefined : '90vh',
          overflow: 'auto'
        }}
      >
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            <strong>Transaction Details:</strong>
          </div>
          <Row gutter={[16, 8]}>
            <Col span={screens.md ? 12 : 24}>
              <div style={{ fontSize: '12px' }}>Buyer:</div>
              <div style={{ fontWeight: 'bold' }}>{transaction.buyerName || 'N/A'}</div>
            </Col>
            <Col span={screens.md ? 12 : 24}>
              <div style={{ fontSize: '12px' }}>Product:</div>
              <div style={{ fontWeight: 'bold' }}>{transaction.productName || 'N/A'}</div>
            </Col>
            <Col span={screens.md ? 8 : 12}>
              <div style={{ fontSize: '12px' }}>Total:</div>
              <div style={{ fontWeight: 'bold' }}>ETB {originalTotal.toLocaleString()}</div>
            </Col>
            <Col span={screens.md ? 8 : 12}>
              <div style={{ fontSize: '12px' }}>Paid:</div>
              <div style={{ fontWeight: 'bold', color: '#52c41a' }}>ETB {alreadyPaid.toLocaleString()}</div>
            </Col>
            <Col span={screens.md ? 8 : 24}>
              <div style={{ fontSize: '12px' }}>Remaining:</div>
              <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>ETB {maxAmount.toLocaleString()}</div>
            </Col>
          </Row>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Payment Amount (ETB)"
            name="amount"
            rules={[
              { required: true, message: 'Please enter payment amount' },
              { 
                type: 'number',
                min: 0.01,
                max: maxAmount,
                message: `Amount must be between ETB 0.01 and ETB ${maxAmount.toLocaleString()}`
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              max={maxAmount}
              step={0.01}
              precision={2}
              placeholder={`Enter amount up to ETB ${maxAmount.toLocaleString()}`}
              formatter={(value) => `ETB ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/ETB\s?|(,*)/g, '')}
              size={screens.md ? "middle" : "large"}
              disabled={maxAmount <= 0}
            />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select 
              placeholder="Select payment method"
              size={screens.md ? "middle" : "large"}
            >
              <Option value="CASH">Cash</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="TELEBIRR">Telebirr</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.paymentMethod !== currentValues.paymentMethod}
          >
            {({ getFieldValue }) => {
              const paymentMethod = getFieldValue('paymentMethod');
              
              if (paymentMethod === 'BANK_TRANSFER') {
                return (
                  <>
                    <Form.Item
                      label="Bank Name"
                      name="bankName"
                      rules={[{ required: true, message: 'Bank name is required for bank transfers' }]}
                    >
                      <Input placeholder="Enter bank name" />
                    </Form.Item>
                    <Form.Item
                      label="Transaction ID"
                      name="transactionId"
                      rules={[{ required: true, message: 'Transaction ID is required' }]}
                    >
                      <Input placeholder="Enter transaction ID" />
                    </Form.Item>
                    <Form.Item
                      label="Sender Name"
                      name="senderName"
                    >
                      <Input placeholder="Enter sender name" />
                    </Form.Item>
                  </>
                );
              }
              
              if (paymentMethod === 'TELEBIRR') {
                return (
                  <>
                    <Form.Item
                      label="Telebirr Phone"
                      name="telebirrPhone"
                      rules={[{ required: true, message: 'Phone number is required for Telebirr' }]}
                    >
                      <Input placeholder="Enter phone number" />
                    </Form.Item>
                    <Form.Item
                      label="Transaction ID"
                      name="telebirrTransactionId"
                      rules={[{ required: true, message: 'Transaction ID is required' }]}
                    >
                      <Input placeholder="Enter transaction ID" />
                    </Form.Item>
                  </>
                );
              }
              
              return null;
            }}
          </Form.Item>

          <Form.Item
            label="Notes (Optional)"
            name="notes"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Add any notes about this payment..." 
              size={screens.md ? "middle" : "large"}
            />
          </Form.Item>

          <Flex justify="space-between" style={{ marginTop: '24px' }}>
            <Button 
              onClick={handleCancel} 
              disabled={isLoading}
              size={screens.md ? "middle" : "large"}
              style={{ width: '48%' }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              icon={<CheckCircleOutlined />}
              size={screens.md ? "middle" : "large"}
              style={{ width: '48%' }}
              disabled={maxAmount <= 0}
            >
              Record Payment
            </Button>
          </Flex>
        </Form>
      </Modal>
    </>
  );
};

export default RepaymentModal;