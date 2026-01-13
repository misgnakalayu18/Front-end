// components/warehouse/LowStockAlert.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  message,
  Card,
  Spin
} from 'antd';
import {
  WarningOutlined,
  ArrowRightOutlined,
  SyncOutlined,
  StockOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface LowStockAlertProps {
  onTransferClick: (product_id: number) => void;
  warehouse?: string;
  refreshTrigger?: number;
  maxItems?: number;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ 
  onTransferClick, 
  warehouse = 'MERKATO',
  refreshTrigger,
  maxItems = 5
}) => {
  const [loading, setLoading] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);

  const fetchLowStockItems = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch low stock items for all warehouses or specific warehouse
      let url = '/api/warehouse/low-stock';
      if (warehouse && warehouse !== 'ALL') {
        url = `/api/warehouse/low-stock/${warehouse}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        const items = data.data || [];
        setLowStockItems(items.slice(0, maxItems));
        setHasData(items.length > 0);
      } else {
        setHasData(false);
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      message.error('Failed to fetch low stock items');
      setHasData(false);
    } finally {
      setLoading(false);
    }
  }, [warehouse, maxItems]);

  useEffect(() => {
    fetchLowStockItems();
  }, [fetchLowStockItems]);

  useEffect(() => {
    if (refreshTrigger) {
      fetchLowStockItems();
    }
  }, [refreshTrigger, fetchLowStockItems]);

  const handleAutoReplenish = async (product_id: number, requiredQuantity: number) => {
    try {
      setLoading(true);
      const response = await fetch('/api/warehouse/auto-replenish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          product_id, 
          requiredQuantity,
          targetWarehouse: warehouse 
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        message.success('Auto-replenishment request created');
        fetchLowStockItems();
      } else {
        message.error(data.error || 'Failed to initiate auto-replenishment');
      }
    } catch (error) {
      console.error('Auto-replenish error:', error);
      message.error('Failed to auto-replenish');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stock percentage for progress bar
  const calculateStockPercentage = (current: number, min: number) => {
    if (min <= 0) return 100;
    const percentage = (current / min) * 100;
    return Math.min(percentage, 100);
  };

  // Determine stock status
  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { status: 'OUT_OF_STOCK', color: 'red', label: 'Out of Stock' };
    if (current < min * 0.3) return { status: 'CRITICAL', color: 'red', label: 'Critical' };
    if (current < min * 0.6) return { status: 'LOW', color: 'orange', label: 'Low' };
    if (current < min) return { status: 'WARNING', color: 'orange', label: 'Below Min' };
    return { status: 'NORMAL', color: 'green', label: 'Normal' };
  };

  // Format warehouse name
  const formatWarehouseName = (warehouse: string) => {
    const warehouseMap: Record<string, string> = {
      SHEGOLE_MULUNEH: 'Shegole Muluneh',
      EMBILTA: 'Embilta',
      NEW_SHEGOLE: 'New Shegole',
      MERKATO: 'Merkato',
      DAMAGE: 'Damage',
      BACKUP: 'Backup'
    };
    return warehouseMap[warehouse] || warehouse;
  };

  const productColumns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '14px' }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.productCode}
          </Text>
          {record.warehouse && (
            <Tag color="blue" style={{ fontSize: '10px', marginTop: 2 }}>
              {formatWarehouseName(record.warehouse)}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Stock Level',
      key: 'stockLevel',
      width: 150,
      render: (_: any, record: any) => {
        const percentage = calculateStockPercentage(record.currentStock, record.minStockLevel);
        const status = getStockStatus(record.currentStock, record.minStockLevel);
        
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text strong style={{ 
                color: status.color,
                fontSize: '16px'
              }}>
                {record.currentStock}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                /{record.minStockLevel}
              </Text>
            </div>
            <Progress
              percent={Math.round(percentage)}
              size="small"
              strokeColor={status.color}
              showInfo={false}
              style={{ marginBottom: 4 }}
            />
            <Tag 
              color={status.color} 
              style={{ fontSize: '10px', margin: 0 }}
            >
              {status.label}
            </Tag>
          </div>
        );
      }
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (unit: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {unit === 'PC' ? 'Piece' : unit === 'DOZ' ? 'Dozen' : 'Set'}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: any) => {
        const requiredQty = Math.max(record.minStockLevel - record.currentStock, 1);
        
        return (
          <Space size="small" direction="vertical" style={{ width: '100%' }}>
            <Button
              size="small"
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={() => onTransferClick(record.product_id)}
              block
            >
              Manual Transfer
            </Button>
            <Button
              size="small"
              type="default"
              danger={record.currentStock === 0}
              onClick={() => handleAutoReplenish(record.product_id, requiredQty)}
              block
              loading={loading}
            >
              Auto Replenish ({requiredQty})
            </Button>
          </Space>
        );
      }
    }
  ];

  // Show loading state
  if (loading && lowStockItems.length === 0) {
    return (
      <Card 
        size="small" 
        style={{ marginBottom: 16, borderLeft: '4px solid #faad14' }}
      >
        <Spin size="small" />
        <Text type="secondary" style={{ marginLeft: 8 }}>
          Loading low stock items...
        </Text>
      </Card>
    );
  }

  // Show empty state
  if (!loading && !hasData) {
    return null; // Don't show anything if no low stock items
  }

  // Main render with data
  return (
    <Alert
      type="warning"
      message={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ExclamationCircleOutlined />
            <div>
              <Text strong>Low Stock Alerts</Text>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {lowStockItems.length} items require attention
                {warehouse && warehouse !== 'ALL' && ` in ${formatWarehouseName(warehouse)}`}
              </div>
            </div>
          </Space>
          <Space>
            <Button
              size="small"
              icon={<SyncOutlined />}
              onClick={fetchLowStockItems}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              size="small"
              type="link"
              icon={<StockOutlined />}
              href="/warehouse/stock?filter=lowStock"
            >
              View All
            </Button>
          </Space>
        </div>
      }
      description={
        <div style={{ marginTop: 16 }}>
          <Table
            columns={productColumns}
            dataSource={lowStockItems}
            loading={loading}
            rowKey={(record) => `${record.product_id}-${record.warehouse || 'default'}`}
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
            rowClassName={() => 'low-stock-row'}
          />
          
          {/* Summary Stats */}
          <div style={{ 
            marginTop: 12, 
            padding: '8px 16px', 
            backgroundColor: '#fff7e6',
            borderRadius: 4,
            fontSize: '12px'
          }}>
            <Space>
              <Tag color="red">Critical: {lowStockItems.filter(item => 
                getStockStatus(item.currentStock, item.minStockLevel).status === 'CRITICAL' || 
                getStockStatus(item.currentStock, item.minStockLevel).status === 'OUT_OF_STOCK'
              ).length}</Tag>
              <Tag color="orange">Low: {lowStockItems.filter(item => 
                getStockStatus(item.currentStock, item.minStockLevel).status === 'LOW' || 
                getStockStatus(item.currentStock, item.minStockLevel).status === 'WARNING'
              ).length}</Tag>
              <Text type="secondary">
                Total reorder quantity: {lowStockItems.reduce((sum, item) => 
                  sum + Math.max(item.minStockLevel - item.currentStock, 0), 0
                )}
              </Text>
            </Space>
          </div>
        </div>
      }
      showIcon={false}
      style={{ 
        marginBottom: 16,
        borderLeft: '4px solid #faad14',
        backgroundColor: '#fff7e6'
      }}
    />
  );
};

export default LowStockAlert;