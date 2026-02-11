// SplitPaymentModal.tsx - UPDATED with redirect to SplitPaymentManagement
import React from 'react';
import { 
  Modal, 
  Descriptions, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Typography, 
  Space, 
  Empty,
  Button,
  Tooltip 
} from 'antd';
import { 
  ShareAltOutlined, 
  BankOutlined, 
  CheckCircleOutlined,
  EyeOutlined,
  BarChartOutlined,
  ExportOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Text, Title } = Typography;

interface SplitPaymentDetail {
  id: number;
  method: string;
  amount: number;
  percentage: number;
  bankName?: string;
  senderName?: string;
  receiverName?: string;
  createdAt: string;
}

interface SplitPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  sale: {
    id: string | number;
    buyerName: string;
    productName: string;
    totalPrice: number;
    date: string;
    paymentSplits?: SplitPaymentDetail[];
    saleId?: string | number; // Original sale ID from database
    productCode?: string;
    quantity?: number;
    sellerName?: string;
    paymentStatus?: string;
    warehouse?: string;
  } | null;
}

const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  visible,
  onClose,
  sale
}) => {
  const navigate = useNavigate();

  if (!sale) return null;

  // Handle redirect to SplitPaymentManagement page
  const handleGoToSplitPaymentManagement = () => {
    onClose(); // Close the modal first
    
    // Navigate to SplitPaymentManagement page
    // You can pass the saleId as a query parameter if needed
    navigate('/management/sales/split-payments', {
      state: {
        selectedSaleId: sale.saleId || sale.id,
        fromModal: true
      }
    });
  };

  // Handle export split payment details
  const handleExportSplitDetails = () => {
    if (!sale.paymentSplits || sale.paymentSplits.length === 0) return;
    
    // Prepare data for export
    const exportData = [
      ['Split Payment Details - Sale #' + sale.id],
      ['Buyer: ' + sale.buyerName],
      ['Product: ' + sale.productName],
      ['Total Amount: ETB ' + sale.totalPrice.toLocaleString()],
      ['Date: ' + dayjs(sale.date).format('DD/MM/YYYY HH:mm')],
      [''],
      ['Split Payment Breakdown'],
      ['No.', 'Payment Method', 'Amount (ETB)', 'Percentage', 'Bank', 'Sender', 'Receiver', 'Date']
    ];

    sale.paymentSplits.forEach((split, index) => {
      exportData.push([
        (index + 1).toString(),
        split.method.replace('_', ' '),
        split.amount.toLocaleString(),
        split.percentage + '%',
        split.bankName || '-',
        split.senderName || '-',
        split.receiverName || '-',
        dayjs(split.createdAt).format('DD/MM/YYYY HH:mm')
      ]);
    });

    // Create and download CSV
    const csvContent = exportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `split_payment_${sale.id}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      title={
        <Space>
          <ShareAltOutlined />
          <span>Split Payment Details - Sale #{sale.id}</span>
          <Tag color="cyan">SPLIT PAYMENT</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      {/* Action Buttons Header */}
      <Card size="small" style={{ marginBottom: '16px', background: '#f6ffed' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Tooltip title="View detailed split payment analysis">
                <Button
                  type="primary"
                  icon={<BarChartOutlined />}
                  onClick={handleGoToSplitPaymentManagement}
                  size="small"
                >
                  View Split Payment Analysis
                </Button>
              </Tooltip>
            </Space>
          </Col>
          <Col>
            <Space>
              <Tooltip title="Export split payment details">
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleExportSplitDetails}
                  disabled={!sale.paymentSplits || sale.paymentSplits.length === 0}
                  size="small"
                >
                  Export
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Sale Information */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Sale ID">
            <Text strong>#{sale.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Date">
            {dayjs(sale.date).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Buyer">
            <Text strong>{sale.buyerName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Product">
            {sale.productName}
            {sale.productCode && (
              <Text type="secondary" style={{ marginLeft: '8px' }}>
                ({sale.productCode})
              </Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount">
            <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
              ETB {(sale.totalPrice || 0).toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Payment Status">
            <Tag color={sale.paymentStatus === 'FULL' ? 'success' : 'warning'}>
              {sale.paymentStatus || 'PAID'}
            </Tag>
          </Descriptions.Item>
          {sale.sellerName && (
            <Descriptions.Item label="Seller">
              <Tag color="purple">{sale.sellerName}</Tag>
            </Descriptions.Item>
          )}
          {sale.warehouse && (
            <Descriptions.Item label="Warehouse">
              <Tag color="blue">{sale.warehouse}</Tag>
            </Descriptions.Item>
          )}
          {sale.quantity && (
            <Descriptions.Item label="Quantity">
              {sale.quantity} pcs
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Title level={5} style={{ marginBottom: '16px' }}>
        <ShareAltOutlined /> Payment Splits ({sale.paymentSplits?.length || 0})
      </Title>

      {sale.paymentSplits && sale.paymentSplits.length > 0 ? (
        <div>
          {/* Split Payment Progress Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              {sale.paymentSplits.map((split, index) => {
                const color = 
                  split.method === 'CASH' ? '#52c41a' :
                  split.method === 'BANK_TRANSFER' ? '#1890ff' :
                  split.method === 'TELEBIRR' ? '#13c2c2' : '#722ed1';
                
                return (
                  <div
                    key={index}
                    style={{
                      width: `${split.percentage}%`,
                      backgroundColor: color,
                      height: '100%'
                    }}
                    title={`${split.method}: ${split.percentage}%`}
                  />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {sale.paymentSplits.map((split, index) => (
                <Text key={index} style={{ fontSize: '11px', color: '#666' }}>
                  {split.method.replace('_', ' ')}: {split.percentage}%
                </Text>
              ))}
            </div>
          </div>

          {/* Individual Split Cards */}
          {sale.paymentSplits.map((split, index) => (
            <Card
              key={split.id || index}
              size="small"
              style={{ 
                marginBottom: '12px', 
                borderLeft: `4px solid ${
                  split.method === 'CASH' ? '#52c41a' :
                  split.method === 'BANK_TRANSFER' ? '#1890ff' :
                  split.method === 'TELEBIRR' ? '#13c2c2' : '#722ed1'
                }`,
                background: `${split.method === 'CASH' ? '#f6ffed' :
                            split.method === 'BANK_TRANSFER' ? '#f0f8ff' :
                            split.method === 'TELEBIRR' ? '#e6fffb' : '#f9f0ff'}20`
              }}
            >
              <Row justify="space-between" align="middle">
                <Col>
                  <Space direction="vertical" size={0}>
                    <Space>
                      <BankOutlined style={{ 
                        color: split.method === 'CASH' ? '#52c41a' :
                               split.method === 'BANK_TRANSFER' ? '#1890ff' :
                               split.method === 'TELEBIRR' ? '#13c2c2' : '#722ed1'
                      }} />
                      <Text strong>{split.method.replace('_', ' ')}</Text>
                      <Tag color="purple" style={{ fontSize: '11px' }}>
                        Split #{index + 1}
                      </Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                      {split.bankName && `Bank: ${split.bankName} • `}
                      {split.senderName && `Sender: ${split.senderName} • `}
                      {split.receiverName && `Receiver: ${split.receiverName} • `}
                      {dayjs(split.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </Space>
                </Col>
                <Col>
                  <Space direction="vertical" align="end" size={0}>
                    <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                      ETB {(split.amount || 0).toLocaleString()}
                    </Text>
                    <Tag color={
                      split.method === 'CASH' ? 'green' :
                      split.method === 'BANK_TRANSFER' ? 'blue' :
                      split.method === 'TELEBIRR' ? 'cyan' : 'purple'
                    } style={{ fontSize: '11px' }}>
                      {split.percentage}% of total
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
          
          {/* Verification Summary */}
          <Card size="small" style={{ marginTop: '16px', background: '#f6ffed' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text strong>Verification Summary</Text>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Text>Total Splits: {sale.paymentSplits.length}</Text>
                  <Text type="secondary">|</Text>
                  <Text>Total Amount: ETB {sale.totalPrice.toLocaleString()}</Text>
                  <Text type="secondary">|</Text>
                  <Text>Sum Verified: 100%</Text>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Additional Action Button */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button
                  type="primary"
                  icon={<BarChartOutlined />}
                  onClick={() => {
                    onClose();
                    navigate('/management/sales/split-payments');
                  }}
                  style={{ marginTop: '16px' }}
                  block
                >
                  Go to Split Payment Management Dashboard
                </Button>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Click to open the dedicated Split Payment Management dashboard
            </div>
          </div>
        </div>
      ) : (
        <Empty description="No split payment details available" />
      )}
    </Modal>
  );
};

export default SplitPaymentModal;