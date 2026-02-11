import React from 'react';
import { 
  DollarOutlined, 
  ShoppingOutlined, 
  ShareAltOutlined,
  CreditCardOutlined,
  AlertOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Alert, 
  Button, 
  Flex,
  Tag,
  Typography,
  Progress
} from 'antd';
import { SalesStats as SalesStatsType } from '../../types/sale.type';

const { Text } = Typography;

interface SalesStatsProps {
  pageStats: SalesStatsType;
  currentPage: number;
  totalItems: number;
}

const SalesStats: React.FC<SalesStatsProps> = ({ 
  pageStats, 
  currentPage, 
  totalItems 
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return `ETB ${amount.toLocaleString('en-ET', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Get payment ratio color
  const getPaymentRatioColor = (ratio: number) => {
    if (ratio >= 0.9) return '#52c41a';
    if (ratio >= 0.7) return '#1890ff';
    if (ratio >= 0.5) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <>
      {/* Outstanding Debts Alert */}
      {outstandingDebts > 0 && (
        <Alert
          message={
            <Flex justify="space-between" align="center">
              <div>
                <strong>Outstanding Debts (Page {currentPage}):</strong> {formatCurrency(outstandingDebts)} 
                <span style={{ marginLeft: '16px', color: '#666' }}>
                  ({partialPaymentsCount} partial payments pending)
                </span>
              </div>
              <Button 
                type="primary" 
                size="small"
                onClick={() => {
                  const partialRows = document.querySelectorAll('[data-partial="true"]');
                  if (partialRows.length > 0) {
                    partialRows[0].scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                View Partial Payments
              </Button>
            </Flex>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Main Statistics Cards */}
      <Card size="small" style={{ marginBottom: '20px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title={`Page ${currentPage} Revenue`}
              value={totalRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Total Paid"
              value={totalPaid}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Outstanding"
              value={outstandingDebts}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Payment Ratio"
              value={(paymentRatio * 100).toFixed(1)}
              suffix="%"
              valueStyle={{ 
                color: getPaymentRatioColor(paymentRatio)
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title="Partial Payments"
              value={partialPaymentsCount}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic
              title={`Page ${currentPage} Items`}
              value={transactionCount}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
        
        {/* Additional Summary Info */}
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
          <Row gutter={[16, 8]}>
            <Col xs={12} sm={6}>
              <div>Total System Sales: <strong>{totalItems.toLocaleString()}</strong></div>
            </Col>
            <Col xs={12} sm={6}>
              <div>Remaining: <strong>{formatCurrency(totalRemaining)}</strong></div>
            </Col>
            <Col xs={12} sm={6}>
              <div>Avg Sale: <strong>{formatCurrency(averageSale)}</strong></div>
            </Col>
            <Col xs={12} sm={6}>
              <div>Credit: <strong>{formatCurrency(totalCredit)}</strong></div>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Split Payment Statistics */}
      {splitPaymentsCount > 0 && (
        <Card size="small" style={{ marginBottom: '20px', borderLeft: '4px solid #13c2c2' }}>
          <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#13c2c2' }}>
            <ShareAltOutlined /> Split Payment Statistics
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Split Payments"
                value={splitPaymentsCount}
                prefix={<ShareAltOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Total Split Amount"
                value={totalSplitAmount}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Avg Split Amount"
                value={averageSplitAmount}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#fa8c16' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="% of Total"
                value={totalRevenue > 0 ? (totalSplitAmount / totalRevenue * 100).toFixed(1) : 0}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Payment Method Stats */}
      {Object.keys(paymentMethodStats).length > 0 && (
        <Card size="small" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
            <CreditCardOutlined /> Payment Methods (Page {currentPage})
          </div>
          <Row gutter={[8, 8]}>
            {Object.entries(paymentMethodStats).map(([method, amount]) => (
              <Col key={method} xs={12} sm={6} md={3}>
                <Card size="small" style={{ 
                  textAlign: 'center',
                  borderLeft: method === 'SPLIT' ? '3px solid #13c2c2' : '3px solid #d9d9d9'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {method.replace('_', ' ')}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                    {formatCurrency(amount as number)}
                  </div>
                  <Progress 
                    percent={totalRevenue > 0 ? Math.round((amount as number) / totalRevenue * 100) : 0}
                    size="small"
                    showInfo={false}
                    strokeColor={method === 'SPLIT' ? '#13c2c2' : '#1890ff'}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </>
  );
};

// Define the SalesStatsType if not already in your types
export interface SalesStats {
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
}

export default SalesStats;