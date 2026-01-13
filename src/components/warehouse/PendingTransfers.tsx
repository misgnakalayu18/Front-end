// components/warehouse/PendingTransfers.tsx
import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  Button,
  Typography,
  Popconfirm,
  Tooltip,
  Divider,
  Modal,
  message,
  Badge,
  Spin,
  Row,
  Col
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowUpOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { 
  useGetTransfersQuery, 
  useCompleteTransferMutation, 
  useCancelTransferMutation 
} from '../../redux/features/warehouseApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;
const { Search } = Input;

interface PendingTransfersProps {
  isMobile: boolean;
  onShowTransferDetails: (transfer: any) => void;
}

const PendingTransfers: React.FC<PendingTransfersProps> = ({ isMobile, onShowTransferDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [params, setParams] = useState({
    status: 'PENDING',
    page: 1,
    limit: 10,
    sortBy: 'requested_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const { 
    data: transfersData, 
    isLoading, 
    refetch 
  } = useGetTransfersQuery(params);
  
  const [completeTransfer] = useCompleteTransferMutation();
  const [cancelTransfer] = useCancelTransferMutation();

  const pendingTransfers = transfersData?.transfers || [];
  const pendingCount = transfersData?.pagination?.total || 0;

  const handleCompleteTransfer = async (transferId: number) => {
    try {
      await completeTransfer({ 
        id: transferId,
        notes: 'Completed via warehouse management dashboard',
        completedBy: 1
      }).unwrap();
      
      message.success('Transfer completed successfully');
      refetch();
    } catch (error: any) {
      message.error(error.data?.message || 'Failed to complete transfer');
    }
  };

  const handleCancelTransfer = async (transferId: number, reason: string) => {
    try {
      await cancelTransfer({ 
        id: transferId,
        reason 
      }).unwrap();
      
      message.success('Transfer cancelled successfully');
      refetch();
    } catch (error: any) {
      message.error(error.data?.message || 'Failed to cancel transfer');
    }
  };

  const handleBulkComplete = async () => {
    const promises = pendingTransfers.map(t => 
      completeTransfer({ 
        id: t.id,
        notes: 'Bulk completed',
        completedBy: 1
      })
    );
    
    try {
      await Promise.all(promises);
      refetch();
      message.success('All transfers completed successfully');
    } catch (error) {
      message.error('Some transfers failed to complete');
    }
  };

  const handleBulkCancel = async () => {
    const promises = pendingTransfers.map(t => 
      cancelTransfer({ 
        id: t.id,
        reason: 'Bulk cancelled'
      })
    );
    
    try {
      await Promise.all(promises);
      refetch();
      message.success('All transfers cancelled');
    } catch (error) {
      message.error('Some transfers failed to cancel');
    }
  };

  const columns = [
    {
      title: 'Transfer #',
      dataIndex: 'transfer_number',
      key: 'transfer_number',
      render: (text: string) => <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{text}</Text>,
      responsive: ['sm' as const]
    },
    {
      title: 'Product',
      key: 'product',
      render: (record: any) => (
        <div>
          <div style={{ 
            fontWeight: '500', 
            fontSize: isMobile ? '12px' : '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {record.product?.name || 'N/A'}
          </div>
          <div style={{ 
            fontSize: isMobile ? '10px' : '12px', 
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Code: {record.product?.code || 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'From → To',
      key: 'warehouses',
      render: (record: any) => (
        <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
          <Tag color="blue" style={{ margin: 0 }}>
            {record.from_warehouse?.replace('_', ' ') || 'N/A'}
          </Tag>
          {!isMobile && <ArrowRightOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />}
          <Tag color="green" style={{ margin: 0 }}>
            {record.to_warehouse?.replace('_', ' ') || 'N/A'}
          </Tag>
        </Space>
      ),
      responsive: ['sm' as const]
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (record: any) => (
        <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>
            {record.cartons} cartons
          </div>
          <div style={{ 
            fontSize: isMobile ? '10px' : '12px', 
            color: '#666' 
          }}>
            ({record.quantity || 0} pieces)
          </div>
        </div>
      )
    },
    {
      title: 'Requested',
      dataIndex: 'requested_at',
      key: 'requested_at',
      render: (date: string) => date ? (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
            {dayjs(date).fromNow()}
          </Text>
        </Tooltip>
      ) : null,
      responsive: ['md' as const]
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onShowTransferDetails(record)}
              size="small"
            />
          </Tooltip>
          
          <Popconfirm
            title="Complete Transfer"
            description="Are you sure you want to complete this transfer?"
            onConfirm={() => handleCompleteTransfer(record.id)}
            okText="Yes, Complete"
            cancelText="Cancel"
          >
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
            >
              {isMobile ? '' : 'Complete'}
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Cancel Transfer"
            description={
              <div>
                <p>Are you sure you want to cancel this transfer?</p>
                <Input.TextArea 
                  placeholder="Enter cancellation reason"
                  id={`cancel-reason-${record.id}`}
                  rows={3}
                />
              </div>
            }
            onConfirm={() => {
              const reasonInput = document.getElementById(`cancel-reason-${record.id}`) as HTMLTextAreaElement;
              if (reasonInput?.value.trim()) {
                handleCancelTransfer(record.id, reasonInput.value);
              } else {
                message.warning('Please enter a cancellation reason');
              }
            }}
            okText="Cancel Transfer"
            cancelText="Keep"
          >
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
            >
              {isMobile ? '' : 'Cancel'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin tip="Loading pending transfers..." />
      </div>
    );
  }

  if (pendingTransfers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <CheckCircleOutlined style={{ 
          fontSize: isMobile ? '32px' : '48px', 
          color: '#52c41a', 
          marginBottom: '16px' 
        }} />
        <Text strong style={{ fontSize: isMobile ? '16px' : '20px' }}>No Pending Transfers</Text>
        <br />
        <Text type="secondary">All transfers have been processed</Text>
      </div>
    );
  }

  return (
    <Card bodyStyle={{ padding: isMobile ? '8px' : '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <Row gutter={[8, 8]} align="middle">
          <Col xs={24} sm={16} md={12}>
            <Search
              placeholder="Search transfers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
              allowClear
              size={isMobile ? "small" : "middle"}
              onSearch={() => {
                setParams(prev => ({
                  ...prev,
                  search: searchTerm,
                  page: 1
                }));
              }}
            />
          </Col>
        </Row>
      </div>

      <Table
        columns={columns}
        dataSource={pendingTransfers}
        rowKey="id"
        scroll={isMobile ? { x: true } : undefined}
        size={isMobile ? 'small' : 'middle'}
        pagination={{
          current: params.page,
          pageSize: params.limit,
          total: pendingCount,
          showSizeChanger: !isMobile,
          showQuickJumper: !isMobile,
          showTotal: (total: number, range: number[]) => 
            isMobile ? `${range[0]}-${range[1]}` : `${range[0]}-${range[1]} of ${total} transfers`,
          onChange: (page, pageSize) => {
            setParams(prev => ({
              ...prev,
              page,
              limit: pageSize
            }));
          }
        }}
      />
      
      {!isMobile && pendingTransfers.length > 0 && (
        <>
          <Divider />
          <Space style={{ float: 'right' }}>
            <Popconfirm
              title="Complete All Transfers"
              description="Are you sure you want to complete all pending transfers?"
              onConfirm={handleBulkComplete}
            >
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
              >
                Complete All
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Cancel All Transfers"
              description="This will cancel all pending transfers. This action cannot be undone."
              onConfirm={handleBulkCancel}
            >
              <Button 
                danger
                icon={<CloseCircleOutlined />}
              >
                Cancel All
              </Button>
            </Popconfirm>
          </Space>
        </>
      )}
    </Card>
  );
};

export default PendingTransfers;