// components/warehouse/WarehouseStats.tsx
import React from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import {
  HomeOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  SwapOutlined
} from '@ant-design/icons';

interface WarehouseStatsProps {
  dashboardLoading: boolean;
  isMobile: boolean;
}

const WarehouseStats: React.FC<WarehouseStatsProps> = ({ dashboardLoading, isMobile }) => {
  // Mock data - replace with actual data from API
  const stats = {
    totalWarehouses: 6,
    totalProducts: 392,
    totalValue: 3510000,
    avgCapacity: 45,
    pendingTransfers: 5,
    todayTransfers: 12
  };

  if (dashboardLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin tip="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <Row gutter={[8, 8]} style={{ marginBottom: '24px' }}>
      <Col xs={12} sm={8} md={6} lg={4} xl={4}>
        <Card size="small" bodyStyle={{ padding: isMobile ? '8px' : '16px' }}>
          <Statistic
            title="Total Warehouses"
            value={stats.totalWarehouses}
            prefix={<HomeOutlined />}
            valueStyle={{ 
              color: '#1890ff',
              fontSize: isMobile ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6} lg={4} xl={4}>
        <Card size="small" bodyStyle={{ padding: isMobile ? '8px' : '16px' }}>
          <Statistic
            title="Total Products"
            value={stats.totalProducts}
            prefix={<ShoppingOutlined />}
            valueStyle={{ 
              color: '#52c41a',
              fontSize: isMobile ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6} lg={4} xl={4}>
        <Card size="small" bodyStyle={{ padding: isMobile ? '8px' : '16px' }}>
          <Statistic
            title="Total Value"
            value={stats.totalValue}
            prefix="$"
            valueStyle={{ 
              color: '#fa8c16',
              fontSize: isMobile ? '18px' : '24px'
            }}
            formatter={value => `${(Number(value) / 1000000).toFixed(isMobile ? 1 : 2)}M`}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6} lg={4} xl={4}>
        <Card size="small" bodyStyle={{ padding: isMobile ? '8px' : '16px' }}>
          <Statistic
            title="Avg. Capacity"
            value={stats.avgCapacity}
            suffix="%"
            prefix={<BarChartOutlined />}
            valueStyle={{ 
              color: '#722ed1',
              fontSize: isMobile ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6} lg={4} xl={4}>
        <Card 
          size="small" 
          bodyStyle={{ padding: isMobile ? '8px' : '16px' }}
          style={{ borderColor: stats.pendingTransfers > 0 ? '#fa8c16' : undefined }}
        >
          <Statistic
            title="Pending Transfers"
            value={stats.pendingTransfers}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ 
              color: stats.pendingTransfers > 0 ? '#fa8c16' : '#666',
              fontSize: isMobile ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
      <Col xs={12} sm={8} md={6} lg={4} xl={4}>
        <Card 
          size="small" 
          bodyStyle={{ padding: isMobile ? '8px' : '16px' }}
        >
          <Statistic
            title="Today's Transfers"
            value={stats.todayTransfers}
            prefix={<SwapOutlined />}
            valueStyle={{ 
              color: '#13c2c2',
              fontSize: isMobile ? '18px' : '24px'
            }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default WarehouseStats;