import React from 'react';
import { 
  DollarOutlined, 
  ShoppingOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  PercentageOutlined,
  TransactionOutlined
} from '@ant-design/icons';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Progress, 
  Tag, 
  Typography, 
  Divider,
  Space,
  Flex,
  Tooltip
} from 'antd';
import { SaleRecord } from '../../types/sale.type';

const { Text, Title } = Typography;

interface MobileSummaryProps {
  pageStats: {
    totalRevenue: number;
    totalPaid: number;
    totalRemaining: number;
    paymentRatio: number;
    transactionCount: number;
    paymentMethodStats: Record<string, number>;
    outstandingDebts: number;
    partialPaymentsCount: number;
    splitPaymentsCount: number;
    totalSplitAmount: number;
    averageSplitAmount: number;
    totalSales: number;
    averageSale: number;
    totalCredit: number;
  };
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  isExpanded?: boolean;
}

const MobileSummary: React.FC<MobileSummaryProps> = ({ 
  pageStats, 
  currentPage = 1, 
  totalPages = 1, 
  totalItems = 0,
  isExpanded = false 
}) => {
  const {
    totalRevenue,
    totalPaid,
    totalRemaining,
    paymentRatio,
    transactionCount,
    paymentMethodStats,
    outstandingDebts,
    partialPaymentsCount,
    splitPaymentsCount,
    totalSplitAmount,
    averageSplitAmount,
    totalSales,
    averageSale,
    totalCredit
  } = pageStats;

  // Payment method colors
  const paymentMethodColors: Record<string, string> = {
    'CASH': 'orange',
    'BANK_TRANSFER': 'blue',
    'TELEBIRR': 'green',
    'SPLIT': 'cyan',
    'PARTIAL': 'purple',
    'OTHER': 'gray'
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString('en-ET', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Payment ratio color
  const getPaymentRatioColor = (ratio: number) => {
    if (ratio >= 0.9) return '#52c41a'; // Green
    if (ratio >= 0.7) return '#1890ff'; // Blue
    if (ratio >= 0.5) return '#faad14'; // Yellow
    return '#ff4d4f'; // Red
  };

  if (!isExpanded) {
    // Compact view
    return (
      <div style={{ padding: '12px 0' }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: '12px' }}>
          <div>
            <Text strong style={{ fontSize: '14px' }}>Page {currentPage} Summary</Text>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {transactionCount} transactions • {formatCurrency(totalRevenue)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Progress
              type="circle"
              percent={Math.round(paymentRatio * 100)}
              size={50}
              strokeColor={getPaymentRatioColor(paymentRatio)}
              format={(percent) => `${percent}%`}
            />
          </div>
        </Flex>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 8, 
          marginBottom: 8 
        }}>
          <div style={{ 
            textAlign: 'center', 
            background: '#e6f7ff', 
            padding: '8px 4px', 
            borderRadius: '6px',
            borderLeft: '3px solid #1890ff'
          }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Revenue</div>
            <div style={{ 
              fontWeight: 'bold', 
              color: '#1890ff', 
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            background: '#f6ffed', 
            padding: '8px 4px', 
            borderRadius: '6px',
            borderLeft: '3px solid #52c41a'
          }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Paid</div>
            <div style={{ 
              fontWeight: 'bold', 
              color: '#52c41a', 
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatCurrency(totalPaid)}
            </div>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            background: '#fff2f0', 
            padding: '8px 4px', 
            borderRadius: '6px',
            borderLeft: '3px solid #ff4d4f'
          }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Pending</div>
            <div style={{ 
              fontWeight: 'bold', 
              color: '#ff4d4f', 
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatCurrency(totalRemaining)}
            </div>
          </div>
        </div>

        {partialPaymentsCount > 0 && (
          <div style={{ 
            marginTop: '8px', 
            padding: '6px', 
            background: '#fff7e6', 
            borderRadius: '6px',
            borderLeft: '3px solid #fa8c16'
          }}>
            <Flex justify="space-between" align="center">
              <div>
                <Text style={{ fontSize: '11px', color: '#666' }}>
                  <ClockCircleOutlined /> Partial Payments: 
                </Text>
                <Text strong style={{ marginLeft: '4px', fontSize: '11px', color: '#fa8c16' }}>
                  {partialPaymentsCount}
                </Text>
              </div>
              <Text style={{ fontSize: '11px', color: '#666' }}>
                {formatCurrency(outstandingDebts)}
              </Text>
            </Flex>
          </div>
        )}

        {splitPaymentsCount > 0 && (
          <div style={{ 
            marginTop: '8px', 
            padding: '6px', 
            background: '#e6f7ff', 
            borderRadius: '6px',
            borderLeft: '3px solid #13c2c2'
          }}>
            <Flex justify="space-between" align="center">
              <div>
                <Text style={{ fontSize: '11px', color: '#666' }}>
                  <ShareAltOutlined /> Split Payments: 
                </Text>
                <Text strong style={{ marginLeft: '4px', fontSize: '11px', color: '#13c2c2' }}>
                  {splitPaymentsCount}
                </Text>
              </div>
              <Text style={{ fontSize: '11px', color: '#666' }}>
                {formatCurrency(totalSplitAmount)}
              </Text>
            </Flex>
          </div>
        )}
      </div>
    );
  }

  // Expanded view
  return (
    <div style={{ padding: '16px 0' }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>Sales Summary</Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Page {currentPage} of {totalPages} • {transactionCount} transactions
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Progress
            type="circle"
            percent={Math.round(paymentRatio * 100)}
            size={60}
            strokeColor={getPaymentRatioColor(paymentRatio)}
            format={(percent) => (
              <div>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{percent}%</div>
                <div style={{ fontSize: '10px', color: '#666' }}>Paid Ratio</div>
              </div>
            )}
          />
        </div>
      </Flex>

      {/* Financial Overview */}
      <Card size="small" style={{ marginBottom: '16px', borderLeft: '4px solid #1890ff' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '12px' }}>
          <DollarOutlined /> Financial Overview
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Total Revenue</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              {formatCurrency(totalRevenue)}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Average Sale</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
              {formatCurrency(averageSale)}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Total Paid</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a' }}>
              {formatCurrency(totalPaid)}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Total Credit</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff4d4f' }}>
              {formatCurrency(totalCredit)}
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Status Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 8, 
        marginBottom: '16px' 
      }}>
        <div style={{ 
          textAlign: 'center', 
          background: '#e6f7ff', 
          padding: '12px 8px', 
          borderRadius: '8px',
          borderTop: '3px solid #1890ff'
        }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <CreditCardOutlined /> Revenue
          </div>
          <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '14px' }}>
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          background: '#f6ffed', 
          padding: '12px 8px', 
          borderRadius: '8px',
          borderTop: '3px solid #52c41a'
        }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <CheckCircleOutlined /> Paid
          </div>
          <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: '14px' }}>
            {formatCurrency(totalPaid)}
          </div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          background: '#fff2f0', 
          padding: '12px 8px', 
          borderRadius: '8px',
          borderTop: '3px solid #ff4d4f'
        }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <ClockCircleOutlined /> Outstanding
          </div>
          <div style={{ fontWeight: 'bold', color: '#ff4d4f', fontSize: '14px' }}>
            {formatCurrency(totalRemaining)}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {Object.keys(paymentMethodStats).length > 0 && (
        <Card size="small" style={{ marginBottom: '16px', borderLeft: '4px solid #722ed1' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '12px' }}>
            <TransactionOutlined /> Payment Methods
          </div>
          
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {Object.entries(paymentMethodStats)
              .sort(([, a], [, b]) => b - a)
              .map(([method, amount]) => (
                <Flex key={method} justify="space-between" align="center">
                  <div>
                    <Tag 
                      color={paymentMethodColors[method] || 'default'}
                      style={{ fontSize: '10px', padding: '2px 8px' }}
                    >
                      {method.replace('_', ' ')}
                    </Tag>
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '12px' }}>
                      {formatCurrency(amount)}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '10px', marginLeft: '4px' }}>
                      ({Math.round((amount / totalRevenue) * 100)}%)
                    </Text>
                  </div>
                </Flex>
              ))}
          </Space>
        </Card>
      )}

      {/* Special Payments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '16px' }}>
        <div style={{ 
          textAlign: 'center', 
          background: '#fff7e6', 
          padding: '12px 8px', 
          borderRadius: '8px',
          borderTop: '3px solid #fa8c16'
        }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <PercentageOutlined /> Partial Payments
          </div>
          <div style={{ fontWeight: 'bold', color: '#fa8c16', fontSize: '14px' }}>
            {partialPaymentsCount}
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
            {formatCurrency(outstandingDebts)}
          </div>
        </div>
        
        <div style={{ 
          textAlign: 'center', 
          background: '#e6fffb', 
          padding: '12px 8px', 
          borderRadius: '8px',
          borderTop: '3px solid #13c2c2'
        }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
            <ShareAltOutlined /> Split Payments
          </div>
          <div style={{ fontWeight: 'bold', color: '#13c2c2', fontSize: '14px' }}>
            {splitPaymentsCount}
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
            {formatCurrency(totalSplitAmount)}
          </div>
        </div>
      </div>

      {/* Transaction Stats */}
      <Card size="small" style={{ borderLeft: '4px solid #52c41a' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '12px' }}>
          <ShoppingOutlined /> Transaction Statistics
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Total Transactions</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
              {transactionCount}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Payment Ratio</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: getPaymentRatioColor(paymentRatio) }}>
              {(paymentRatio * 100).toFixed(1)}%
            </div>
          </div>
          
          {splitPaymentsCount > 0 && (
            <>
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Avg Split Amount</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#13c2c2' }}>
                  {formatCurrency(averageSplitAmount)}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Split % of Total</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>
                  {totalRevenue > 0 ? ((totalSplitAmount / totalRevenue) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </>
          )}
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <Flex justify="space-between" style={{ fontSize: '11px', color: '#666' }}>
          <div>Total in System: <Text strong>{totalItems.toLocaleString()}</Text></div>
          <div>Page: <Text strong>{currentPage}</Text> of <Text strong>{totalPages}</Text></div>
        </Flex>
      </Card>
    </div>
  );
};

export default MobileSummary;