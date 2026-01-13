// components/warehouse/WarehouseOverview.tsx
import React from 'react';
import { Card, Table, Tag, Space, Typography, Progress, Button } from 'antd';
import { StockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Warehouse {
    id: string;
    name: string;
    code: string;
    totalProducts: number;
    totalValue: number;
    capacity: number;
    color: string;
}

interface WarehouseOverviewProps {
    dashboardLoading?: boolean;
    isMobile: boolean;
    onViewWarehouse: (warehouseId: string) => void;
    onTransferClick: (from_warehouse: string) => void;
}

const WarehouseOverview: React.FC<WarehouseOverviewProps> = ({
    isMobile,
    onViewWarehouse,
    onTransferClick
}) => {
    const warehouses: Warehouse[] = [
        { id: 'MERKATO', name: 'MERKATO', code: 'MKT', totalProducts: 156, totalValue: 1250000, capacity: 80, color: '#1890ff' },
        { id: 'SHEGOLE_MULUNEH', name: 'SHEGOLE_MULUNEH', code: 'SGM', totalProducts: 89, totalValue: 890000, capacity: 65, color: '#52c41a' },
        { id: 'EMBILTA', name: 'EMBILTA', code: 'EMB', totalProducts: 45, totalValue: 450000, capacity: 40, color: '#fa8c16' },
        { id: 'NEW_SHEGOLE', name: 'NEW_SHEGOLE', code: 'NSG', totalProducts: 67, totalValue: 670000, capacity: 55, color: '#722ed1' },
        { id: 'BACKUP', name: 'BACKUP', code: 'BKP', totalProducts: 23, totalValue: 230000, capacity: 20, color: '#13c2c2' },
        { id: 'DAMAGE', name: 'DAMAGE', code: 'DMG', totalProducts: 12, totalValue: 50000, capacity: 10, color: '#ff4d4f' }
    ];

    const columns = [
        {
            title: 'Warehouse',
            key: 'name',
            render: (record: Warehouse) => (
                <Space direction={isMobile ? "vertical" : "horizontal"} align={isMobile ? "start" : "center"}>
                    <div style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: record.color,
                        flexShrink: 0
                    }} />
                    <div style={{ overflow: 'hidden' }}>
                        <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                            {record.name.replace('_', ' ')}
                        </Text>
                        <div>
                            <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                                Code: {record.code}
                            </Text>
                        </div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Products',
            dataIndex: 'totalProducts',
            key: 'totalProducts',
            render: (value: number) => <Text strong>{value}</Text>,
            responsive: ['md' as const]
        },
        {
            title: 'Total Value',
            dataIndex: 'totalValue',
            key: 'totalValue',
            render: (value: number) => (
                <Text strong style={{ color: '#52c41a' }}>
                    ${(value / 1000).toFixed(1)}K
                </Text>
            ),
            responsive: ['md' as const]
        },
        {
            title: 'Capacity',
            key: 'capacity',
            render: (record: Warehouse) => (
                <div style={{ width: isMobile ? 120 : 150 }}>
                    <Progress
                        percent={record.capacity}
                        size="small"
                        strokeColor={record.color}
                        format={percent => `${percent}%`}
                    />
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                        {record.capacity}% utilized
                    </Text>
                </div>
            ),
            responsive: ['sm' as const]
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: Warehouse) => (
                <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
                    <Button
                        size="small"
                        onClick={() => onViewWarehouse(record.id)}
                        block={isMobile}
                    >
                        View Stock
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => onTransferClick(record.id)}
                        block={isMobile}
                    >
                        Transfer
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <>


            <Card size="small">
                <Title level={isMobile ? 5 : 4} style={{ marginBottom: '12px' }}>
                    <StockOutlined /> Warehouse Overview
                </Title>
                <Table<Warehouse>
                    columns={columns}
                    dataSource={warehouses}
                    rowKey="id"
                    pagination={false}
                    scroll={isMobile ? { x: true } : undefined}
                    size={isMobile ? "small" : "middle"}
                    onRow={(record) => ({
                        onClick: () => onViewWarehouse(record.id)
                    })}
                />
            </Card>
        </>
    );
};

export default WarehouseOverview;