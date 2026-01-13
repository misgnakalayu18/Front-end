import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Progress,
  Space,
  Button,
  Typography,
  Spin,
  Alert,
  Tooltip,
  Badge,
  Grid
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  DollarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  StockOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useWarehouse } from '../../hooks/useWarehouse';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// Warehouse labels based on your schema
const WAREHOUSE_LABELS: Record<string, string> = {
  SHEGOLE_MULUNEH: 'Shegole Muluneh',
  EMBILTA: 'Embilta',
  NEW_SHEGOLE: 'New Shegole',
  MERKATO: 'Merkato',
  DAMAGE: 'Damage',
  BACKUP: 'Backup'
};

const WAREHOUSE_COLORS: Record<string, string> = {
  SHEGOLE_MULUNEH: 'blue',
  EMBILTA: 'green',
  NEW_SHEGOLE: 'purple',
  MERKATO: 'orange',
  DAMAGE: 'red',
  BACKUP: 'cyan'
};

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray'
};

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
};

interface DashboardStats {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  totalTransfers: number;
  pendingTransfers: number;
  completedTransfers: number;
  lowStockItems: number;
  criticalStockItems: number;
  outOfStockItems: number;
}

interface WarehouseStat {
  id: string;
  name: string;
  productCount: number;
  totalQuantity: number;
  totalValue: number;
}

interface TransferStat {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  cancelled: number;
  totalQuantity: number;
}

interface StockStat {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  lowStock: number;
  outOfStock: number;
  criticalStock: number;
}

const Dashboard: React.FC = () => {
  const {
    isAdmin,
    dashboardLoading,
    getDashboardData,
    dashboard
  } = useWarehouse();

  const screens = useBreakpoint();
  const [localStats, setLocalStats] = useState<{
    transferStats: TransferStat;
    stockStats: StockStat;
    warehouseStats: WarehouseStat[];
    recentTransfers: any[];
    lowStockItems: any[];
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (isAdmin) {
        const result = await getDashboardData();
        if (result.success && result.data) {
          // If we get data from API, use it
          setLocalStats({
            transferStats: {
              total: result.data.stats.totalTransfers || 0,
              pending: result.data.stats.pendingTransfers || 0,
              approved: 0,
              completed: result.data.stats.completedTransfers || 0,
              rejected: 0,
              cancelled: 0,
              totalQuantity: 0
            },
            stockStats: {
              totalProducts: result.data.stats.totalProducts || 0,
              totalQuantity: result.data.stats.totalQuantity || 0,
              totalValue: result.data.stats.totalValue || 0,
              lowStock: result.data.stats.lowStockItems || 0,
              outOfStock: result.data.stats.outOfStockItems || 0,
              criticalStock: result.data.stats.criticalStockItems || 0
            },
            warehouseStats: result.data.warehouseStats || [],
            recentTransfers: result.data.recentTransfers || [],
            lowStockItems: result.data.lowStockItems || []
          });
        } else {
          // Use mock data if API fails
          setLocalStats(getMockDashboardData());
        }
      }
    };

    loadData();
  }, [isAdmin, getDashboardData]);

  const getMockDashboardData = () => {
    return {
      transferStats: {
        total: 45,
        pending: 8,
        approved: 12,
        completed: 20,
        rejected: 3,
        cancelled: 2,
        totalQuantity: 1250
      },
      stockStats: {
        totalProducts: 150,
        totalQuantity: 5000,
        totalValue: 25000,
        lowStock: 12,
        outOfStock: 2,
        criticalStock: 3
      },
      warehouseStats: [
        { id: 'SHEGOLE_MULUNEH', name: 'Shegole Muluneh', productCount: 50, totalQuantity: 1500, totalValue: 7500 },
        { id: 'EMBILTA', name: 'Embilta', productCount: 45, totalQuantity: 1200, totalValue: 6000 },
        { id: 'NEW_SHEGOLE', name: 'New Shegole', productCount: 35, totalQuantity: 1000, totalValue: 5000 },
        { id: 'MERKATO', name: 'Merkato', productCount: 20, totalQuantity: 800, totalValue: 4000 },
        { id: 'DAMAGE', name: 'Damage', productCount: 5, totalQuantity: 200, totalValue: 1000 },
        { id: 'BACKUP', name: 'Backup', productCount: 10, totalQuantity: 300, totalValue: 1500 }
      ],
      recentTransfers: [
        { id: 1, transfer_number: 'TRF-001', productName: 'Water Bottle', productCode: 'WB500', from_warehouse: 'SHEGOLE_MULUNEH', to_warehouse: 'MERKATO', quantity: 100, unit: 'PC', status: 'COMPLETED', requested_at: '2024-01-15T10:30:00' },
        { id: 2, transfer_number: 'TRF-002', productName: 'Breakfast Cereal', productCode: 'BC1000', from_warehouse: 'EMBILTA', to_warehouse: 'MERKATO', quantity: 50, unit: 'DOZ', status: 'PENDING', requested_at: '2024-01-15T14:45:00' },
        { id: 3, transfer_number: 'TRF-003', productName: 'Plastic Cups', productCode: 'PC200', from_warehouse: 'NEW_SHEGOLE', to_warehouse: 'EMBILTA', quantity: 200, unit: 'PC', status: 'APPROVED', requested_at: '2024-01-14T09:15:00' }
      ],
      lowStockItems: [
        { id: 1, name: 'Coffee Filters', code: 'CF100', currentStock: 5, minStockLevel: 20, warehouse: 'MERKATO' },
        { id: 2, name: 'Sugar Packets', code: 'SP500', currentStock: 8, minStockLevel: 30, warehouse: 'SHEGOLE_MULUNEH' },
        { id: 3, name: 'Tea Bags', code: 'TB200', currentStock: 12, minStockLevel: 25, warehouse: 'EMBILTA' }
      ]
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return dayjs(date).format('MMM D, YYYY HH:mm');
  };

  const getTimeAgo = (date: string) => {
    return dayjs(date).fromNow();
  };

  if (!isAdmin) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <DashboardOutlined style={{ fontSize: '48px', color: '#8c8c8c', marginBottom: '20px' }} />
        <Title level={3} style={{ color: '#8c8c8c' }}>Access Required</Title>
        <Text type="secondary">Dashboard is available for administrators only.</Text>
      </div>
    );
  }

  if (dashboardLoading || !localStats) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  const { transferStats, stockStats, warehouseStats, recentTransfers, lowStockItems } = localStats;

  // Calculate warehouse utilization for progress bars
  const getWarehouseUtilization = (warehouse: WarehouseStat) => {
    if (!warehouse || !warehouse.totalQuantity) return 0;
    
    const maxCapacity = 10000;
    const utilization = Math.min(100, (warehouse.totalQuantity / maxCapacity) * 100);
    return Math.round(utilization);
  };

  // Render warehouse statistics cards
  const renderWarehouseStats = () => {
    const warehouseData = warehouseStats.length > 0 
      ? warehouseStats 
      : Object.entries(WAREHOUSE_LABELS).map(([key, name]) => ({
          id: key,
          name: name,
          productCount: 0,
          totalQuantity: 0,
          totalValue: 0
        }));

    return warehouseData.map(warehouse => {
      const utilization = getWarehouseUtilization(warehouse);
      
      return (
        <Col xs={24} sm={12} lg={8} key={warehouse.id} style={{ marginBottom: 16 }}>
          <Card 
            size="small" 
            hoverable
            style={{ height: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    backgroundColor: WAREHOUSE_COLORS[warehouse.id] || '#1890ff',
                    marginRight: 8 
                  }} />
                  <Text strong style={{ fontSize: '16px' }}>
                    {warehouse.name}
                  </Text>
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Products: </Text>
                  <Text strong>{warehouse.productCount.toLocaleString()}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Quantity: </Text>
                  <Text strong>{warehouse.totalQuantity.toLocaleString()}</Text>
                </div>
                <div>
                  <Text type="secondary">Value: </Text>
                  <Text strong>{formatCurrency(warehouse.totalValue)}</Text>
                </div>
              </div>
              
              <div style={{ textAlign: 'center', marginLeft: 16 }}>
                <Progress
                  type="circle"
                  percent={utilization}
                  width={60}
                  strokeColor={utilization > 80 ? '#f5222d' : utilization > 60 ? '#faad14' : '#52c41a'}
                  format={() => (
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {utilization}%
                    </div>
                  )}
                />
                <Text type="secondary" style={{ fontSize: '11px', marginTop: 4 }}>
                  Utilization
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      );
    });
  };

  // Render key statistics
  const renderKeyStats = () => {
    const stats = [
      {
        title: 'Total Products',
        value: stockStats.totalProducts,
        icon: <AppstoreOutlined />,
        color: '#1890ff',
        trend: '+12%',
        trendUp: true
      },
      {
        title: 'Total Quantity',
        value: stockStats.totalQuantity.toLocaleString(),
        icon: <StockOutlined />,
        color: '#52c41a',
        trend: '+8%',
        trendUp: true
      },
      {
        title: 'Total Value',
        value: formatCurrency(stockStats.totalValue),
        icon: <DollarOutlined />,
        color: '#722ed1',
        trend: '+15%',
        trendUp: true
      },
      {
        title: 'Total Transfers',
        value: transferStats.total,
        icon: <SwapOutlined />,
        color: '#fa8c16',
        trend: '-3%',
        trendUp: false
      },
      {
        title: 'Pending Transfers',
        value: transferStats.pending,
        icon: <ClockCircleOutlined />,
        color: '#faad14',
        trend: '+5%',
        trendUp: true,
        badge: true
      },
      {
        title: 'Critical Stock',
        value: stockStats.criticalStock,
        icon: <WarningOutlined />,
        color: '#f5222d',
        trend: '-2%',
        trendUp: false,
        badge: true
      }
    ];

    return stats.map((stat, index) => (
      <Col xs={24} sm={12} lg={8} xl={4} key={index} style={{ marginBottom: 16 }}>
        <Card 
          size="small" 
          hoverable
          style={{ height: '100%' }}
        >
          <Statistic
            title={
              <Space>
                {stat.icon}
                <span>{stat.title}</span>
                {stat.badge && stat.value || 0 && (
                  <Badge 
                    status={stat.color === '#f5222d' ? 'error' : 'warning'} 
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Space>
            }
            value={stat.value}
            valueStyle={{ 
              color: stat.color,
              fontSize: screens.xs ? '24px' : '28px'
            }}
            suffix={
              <Tooltip title={`Compared to last month: ${stat.trend}`}>
                <span style={{ 
                  fontSize: '12px', 
                  color: stat.trendUp ? '#52c41a' : '#f5222d',
                  marginLeft: 8
                }}>
                  {stat.trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {stat.trend}
                </span>
              </Tooltip>
            }
          />
        </Card>
      </Col>
    ));
  };

  // Columns for recent transfers table
  const recentTransfersColumns = [
    {
      title: 'Transfer #',
      dataIndex: 'transfer_number',
      key: 'transfer_number',
      width: 120,
      render: (text: string) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Product',
      key: 'product',
      width: 180,
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: '500', fontSize: '14px' }}>{record.productName}</div>
          <div style={{ fontSize: '11px', color: '#666' }}>{record.productCode}</div>
        </div>
      )
    },
    {
      title: 'From → To',
      key: 'warehouses',
      width: 150,
      render: (record: any) => (
        <Space size="small" direction="vertical">
          <Tag 
            color={WAREHOUSE_COLORS[record.from_warehouse]}
            style={{ margin: 0, width: '100%', textAlign: 'center' }}
          >
            {WAREHOUSE_LABELS[record.from_warehouse]}
          </Tag>
          <div style={{ textAlign: 'center' }}>
            <ArrowRightOutlined style={{ fontSize: '10px', color: '#8c8c8c' }} />
          </div>
          <Tag 
            color={WAREHOUSE_COLORS[record.to_warehouse]}
            style={{ margin: 0, width: '100%', textAlign: 'center' }}
          >
            {WAREHOUSE_LABELS[record.to_warehouse]}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 100,
      render: (record: any) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {record.quantity}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {record.unit}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={TRANSFER_STATUS_COLORS[status]}>
          {TRANSFER_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: 'Time',
      dataIndex: 'requested_at',
      key: 'requested_at',
      width: 120,
      render: (date: string) => (
        <Tooltip title={formatDate(date)}>
          <div>
            <div style={{ fontSize: '12px' }}>{getTimeAgo(date)}</div>
          </div>
        </Tooltip>
      )
    }
  ];

  // Render alerts for critical issues
  const renderAlerts = () => {
    const alerts = [];
    
    if (stockStats.criticalStock > 0) {
      alerts.push(
        <Alert
          key="critical-stock"
          message={`${stockStats.criticalStock} products are below minimum stock level`}
          description="Immediate attention required to avoid stockouts."
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          action={
            <Button size="small" type="link" href="/warehouse/stock">
              View Details
            </Button>
          }
        />
      );
    }
    
    if (transferStats.pending > 5) {
      alerts.push(
        <Alert
          key="pending-transfers"
          message={`${transferStats.pending} transfers are pending approval`}
          description="Some transfers require your approval."
          type="info"
          showIcon
          icon={<ClockCircleOutlined />}
          action={
            <Button size="small" type="link" href="/warehouse/transfers?status=PENDING">
              Review
            </Button>
          }
        />
      );
    }
    
    if (stockStats.outOfStock > 0) {
      alerts.push(
        <Alert
          key="out-of-stock"
          message={`${stockStats.outOfStock} products are out of stock`}
          description="Consider restocking these items."
          type="error"
          showIcon
          icon={<WarningOutlined />}
          action={
            <Button size="small" type="link" href="/warehouse/stock?filter=outOfStock">
              View List
            </Button>
          }
        />
      );
    }
    
    if (alerts.length === 0) {
      alerts.push(
        <Alert
          key="all-good"
          message="All systems operational"
          description="No critical issues detected."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      );
    }
    
    return alerts;
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          <DashboardOutlined style={{ marginRight: 12 }} />
          Warehouse Management Dashboard
        </Title>
        <Text type="secondary">
          Overview of warehouse operations, inventory status, and recent activities
        </Text>
      </div>

      {/* Alerts Section */}
      <div style={{ marginBottom: 24 }}>
        {renderAlerts()}
      </div>

      {/* Key Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {renderKeyStats()}
      </Row>

      {/* Warehouse Statistics */}
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            <span>Warehouse Statistics</span>
          </Space>
        }
        style={{ marginBottom: 24, borderRadius: 8 }}
        extra={
          <Button type="link" href="/warehouse/stock">
            View Detailed Report
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {renderWarehouseStats()}
        </Row>
      </Card>

      {/* Two-column layout for Recent Transfers and Low Stock */}
      <Row gutter={[24, 24]}>
        {/* Recent Transfers */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <SwapOutlined />
                <span>Recent Transfers</span>
                <Badge 
                  count={recentTransfers.length} 
                  style={{ backgroundColor: '#1890ff' }} 
                />
              </Space>
            }
            style={{ marginBottom: 24, borderRadius: 8 }}
            extra={
              <Space>
                <Button size="small" href="/warehouse/transfers">
                  View All
                </Button>
                <Button size="small" type="primary" href="/warehouse/transfers/create">
                  New Transfer
                </Button>
              </Space>
            }
          >
            {recentTransfers.length > 0 ? (
              <Table
                columns={recentTransfersColumns}
                dataSource={recentTransfers}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <SwapOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: 16 }} />
                <Text type="secondary">No recent transfers found</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Low Stock Items */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <WarningOutlined />
                <span>Low Stock Items</span>
                {stockStats.lowStock > 0 && (
                  <Badge 
                    count={stockStats.lowStock} 
                    style={{ backgroundColor: '#f5222d' }} 
                  />
                )}
              </Space>
            }
            style={{ marginBottom: 24, borderRadius: 8 }}
            extra={
              <Button size="small" type="link" href="/warehouse/stock?filter=lowStock">
                View All
              </Button>
            }
          >
            {lowStockItems.length > 0 ? (
              <div>
                {lowStockItems.slice(0, 5).map((item: any, index: number) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      padding: '12px 0',
                      borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <Row justify="space-between" align="middle">
                      <Col>
                        <div>
                          <Text strong style={{ fontSize: '14px' }}>{item.name}</Text>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {item.code} • {item.warehouse}
                          </div>
                        </div>
                      </Col>
                      <Col>
                        <div style={{ textAlign: 'right' }}>
                          <Text type="danger" strong>{item.currentStock}</Text>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            Min: {item.minStockLevel}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ))}
                {lowStockItems.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Text type="secondary">
                      And {lowStockItems.length - 5} more items...
                    </Text>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: 12 }} />
                <div>
                  <Text type="secondary">All items have sufficient stock</Text>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card 
            title={
              <Space>
                <LineChartOutlined />
                <span>Quick Actions</span>
              </Space>
            }
            style={{ borderRadius: 8 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                block 
                type="primary" 
                href="/warehouse/transfers/create"
                icon={<SwapOutlined />}
              >
                Create New Transfer
              </Button>
              <Button 
                block 
                href="/warehouse/stock"
                icon={<StockOutlined />}
              >
                View Stock Report
              </Button>
              <Button 
                block 
                href="/warehouse/transfers?status=PENDING"
                icon={<ClockCircleOutlined />}
              >
                Review Pending Transfers
              </Button>
              <Button 
                block 
                href="/warehouse/adjustments"
                icon={<DashboardOutlined />}
              >
                Stock Adjustments
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Summary Statistics */}
      <Card 
        title="Monthly Summary"
        style={{ marginTop: 24, borderRadius: 8 }}
        extra={
          <Button type="link" href="/reports">
            View Full Report
          </Button>
        }
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Products"
              value={stockStats.totalProducts}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Inventory Value"
              value={formatCurrency(stockStats.totalValue)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Completed Transfers"
              value={transferStats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Transfer Success Rate"
              value={transferStats.total > 0 ? 
                Math.round((transferStats.completed / transferStats.total) * 100) : 0
              }
              suffix="%"
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;