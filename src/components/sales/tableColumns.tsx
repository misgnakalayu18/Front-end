import React from 'react';
import { 
  BankOutlined, 
  ShareAltOutlined, 
  EyeOutlined 
} from '@ant-design/icons';
import { 
  Tag, 
  Button, 
  Tooltip, 
  Space, 
  Typography, 
  Flex,
  
} from 'antd';
import type { TableColumnsType } from 'antd';
import { SaleRecord } from '../../types/sale.type';
import RepaymentModal from '../modal/RepaymentModal';

const { Text: AntText } = Typography;

interface ColumnsProps {
  onViewSplitPayment: (record: SaleRecord) => void;
  onRefetch: () => void;
  onPaymentMethodFilter?: (value: string) => void;
  onPaymentStatusFilter?: (value: string) => void;
}

export const getMobileColumns = ({ onViewSplitPayment, onRefetch }: ColumnsProps): TableColumnsType<SaleRecord> => {
  return [
    {
      title: 'Transaction',
      key: 'transaction',
      render: (record: SaleRecord) => (
        <div style={{ padding: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: 4 }}>
                {record.code} - {record.productName}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                Buyer: {record.buyerName}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                Seller: {record.sellerName}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Date: {record.date}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '16px' }}>
                ETB {record.totalPrice.toLocaleString()}
              </div>
              <Tag 
                color={record.paymentStatus === 'FULL' ? 'success' : 
                       record.paymentStatus === 'PARTIAL' ? 'warning' : 'error'}
                style={{ fontSize: '10px', marginTop: 4 }}
              >
                {record.paymentStatus}
              </Tag>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: 8, 
            marginBottom: 12,
            fontSize: '12px'
          }}>
            <div style={{ textAlign: 'center', background: '#f5f5f5', padding: '6px', borderRadius: '4px' }}>
              <div>Qty</div>
              <div style={{ fontWeight: 'bold' }}>{record.quantity}</div>
            </div>
            <div style={{ textAlign: 'center', background: '#e6f7ff', padding: '6px', borderRadius: '4px' }}>
              <div>Paid</div>
              <div style={{ fontWeight: 'bold', color: '#52c41a' }}>ETB {record.paidAmount.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'center', background: '#fff2f0', padding: '6px', borderRadius: '4px' }}>
              <div>Remaining</div>
              <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>ETB {record.remainingAmount.toLocaleString()}</div>
            </div>
          </div>
          
          <Flex gap="small" wrap="wrap">
            <AntText style={{ fontSize: '11px', color: '#666' }}>
              Method: 
              <Tag 
                color="blue" 
                style={{ 
                  marginLeft: '4px', 
                  fontSize: '10px',
                  padding: '2px 8px'
                }}
              >
                {record.paymentMethod}
              </Tag>
            </AntText>
            {record.isSplitPayment && (
              <Tag 
                color="cyan" 
                style={{ 
                  fontSize: '10px',
                  padding: '2px 8px'
                }}
                icon={<ShareAltOutlined />}
              >
                Split
              </Tag>
            )}
          </Flex>
          
          <div style={{ marginTop: '12px' }}>
            <Flex gap="small" wrap="wrap">
              {record.remainingAmount > 0 && record.paymentStatus !== 'FULL' && (
                <RepaymentModal 
                  transaction={record} 
                  onSuccess={onRefetch} 
                  size="small"
                />
              )}
              {record.isSplitPayment && (
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onViewSplitPayment(record)}
                  style={{ fontSize: '11px', padding: 0 }}
                >
                  View Splits ({record.paymentSplits?.length || 0})
                </Button>
              )}
            </Flex>
          </div>
        </div>
      ),
    }
  ];
};

export const getDesktopColumns = ({ 
  onViewSplitPayment, 
  onRefetch, 
  onPaymentMethodFilter, 
  onPaymentStatusFilter 
}: ColumnsProps): TableColumnsType<SaleRecord> => {
  const columns: TableColumnsType<SaleRecord> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      ellipsis: true,
      width: 120,
      sorter: false,
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      width: 200,
      sorter: false,
    },
    {
      title: 'Buyer',
      dataIndex: 'buyerName',
      key: 'buyerName',
      ellipsis: true,
      width: 150,
      sorter: false,
    },
    {
      title: 'Ctn',
      dataIndex: 'ctn',
      key: 'ctn',
      align: 'center' as const,
      width: 80,
      sorter: false,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
      width: 80,
      sorter: false,
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      align: 'right' as const,
      width: 120,
      render: (price: number) => (
        <AntText strong style={{ color: '#1890ff' }}>
          ETB {price.toLocaleString()}
        </AntText>
      ),
      sorter: false,
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right' as const,
      width: 120,
      render: (amount: number) => (
        <AntText strong style={{ color: '#52c41a' }}>
          ETB {amount.toLocaleString()}
        </AntText>
      ),
      sorter: false,
    },
    {
      title: 'Remaining',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      align: 'right' as const,
      width: 120,
      render: (amount: number) => (
        <Tag color={amount > 0 ? 'red' : 'green'}>
          ETB {amount.toLocaleString()}
        </Tag>
      ),
      sorter: false,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      align: 'center' as const,
      width: 140,
      render: (method: string, record: SaleRecord) => {
        const methodConfig: Record<string, { text: string; color: string; icon?: React.ReactNode }> = {
          BANK_TRANSFER: { text: 'Bank', color: 'blue', icon: <BankOutlined /> },
          TELEBIRR: { text: 'Telebirr', color: 'green' },
          CASH: { text: 'Cash', color: 'orange' },
          PARTIAL: { text: 'Partial', color: 'purple' },
          SPLIT: { text: 'Split', color: 'cyan', icon: <ShareAltOutlined /> },
        };
        
        const config = methodConfig[method] || { text: method, color: 'default' };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
      filters: [
        { text: 'Cash', value: 'CASH' },
        { text: 'Bank', value: 'BANK_TRANSFER' },
        { text: 'Telebirr', value: 'TELEBIRR' },
        { text: 'Split', value: 'SPLIT' },
      ],
      onFilter: (value, record) => {
        onPaymentMethodFilter?.(value as string);
        return true;
      },
    },
    {
      title: 'Split Info',
      key: 'splitInfo',
      align: 'center' as const,
      width: 140,
      render: (_, record: SaleRecord) => {
        if (record.isSplitPayment) {
          return (
            <Tooltip title="Click to view split details">
              <Button
                type="link"
                onClick={() => onViewSplitPayment(record)}
                style={{ padding: 0 }}
              >
                <Space size={4}>
                  <ShareAltOutlined style={{ color: '#13c2c2' }} />
                  <AntText style={{ color: '#13c2c2' }}>
                    {record.paymentSplits?.length || 0} splits
                  </AntText>
                </Space>
              </Button>
            </Tooltip>
          );
        }
        return <AntText type="secondary">-</AntText>;
      },
    },
    {
      title: 'Bank',
      dataIndex: 'bankName',
      key: 'bankName',
      ellipsis: true,
      width: 150,
      render: (bankName: string) => bankName || <AntText type="secondary">-</AntText>,
      sorter: false,
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      align: 'center' as const,
      width: 100,
      render: (status: string, record: SaleRecord) => {
        const statusConfig: Record<string, { color: string; text?: string }> = {
          FULL: { color: 'success', text: 'Paid' },
          PARTIAL: { color: 'warning', text: 'Partial' },
          PENDING: { color: 'error', text: 'Pending' },
        };
        
        const config = statusConfig[status] || { color: 'default', text: status };
        return (
          <Tag color={config.color}>
            {config.text}
            {record.remainingAmount > 0 && ` (ETB ${record.remainingAmount.toLocaleString()})`}
          </Tag>
        );
      },
      filters: [
        { text: 'Paid', value: 'FULL' },
        { text: 'Partial', value: 'PARTIAL' },
        { text: 'Pending', value: 'PENDING' },
      ],
      onFilter: (value, record) => {
        onPaymentStatusFilter?.(value as string);
        return true;
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      align: 'center' as const,
      width: 120,
      sorter: false,
    },
    {
      title: 'Receiver',
      dataIndex: 'recieverName',
      key: 'recieverName',
      ellipsis: true,
      width: 150,
      render: (name: string) => name || <AntText type="secondary">-</AntText>,
      sorter: false,
    },
    {
      title: 'Casher',
      dataIndex: 'casherName',
      key: 'casherName',
      ellipsis: true,
      width: 150,
      sorter: false,
    },
    {
      title: 'Seller',
      dataIndex: 'sellerName',
      key: 'sellerName',
      ellipsis: true,
      width: 150,
      sorter: false,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      width: 150,
      fixed: 'right' as const,
      render: (_, record: SaleRecord) => (
        <Flex gap="small" justify="center">
          {record.remainingAmount > 0 && record.paymentStatus !== 'FULL' && (
            <RepaymentModal 
              transaction={record} 
              onSuccess={onRefetch} 
            />
          )}
          {record.isSplitPayment && (
            <Tooltip title="View split payment details">
              <Button
                type="link"
                icon={<EyeOutlined />}
                onClick={() => onViewSplitPayment(record)}
                size="small"
              >
                Splits
              </Button>
            </Tooltip>
          )}
        </Flex>
      ),
    },
  ];

  return columns;
};