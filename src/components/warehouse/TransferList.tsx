// import React, { useState, useEffect } from 'react';
// import {
//   Table,
//   Card,
//   Space,
//   Button,
//   Tag,
//   Input,
//   Select,
//   DatePicker,
//   Row,
//   Col,
//   Statistic,
//   Modal,
//   message,
//   Dropdown,
//   MenuProps,
//   Typography,
//   Badge,
//   Avatar,
//   Tooltip,
//   Progress,
//   Popconfirm
// } from 'antd';
// import {
//   SearchOutlined,
//   ReloadOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   EyeOutlined,
//   MoreOutlined,
//   FilterOutlined,
//   SwapOutlined,
//   UserOutlined,
//   ClockCircleOutlined,
//   CheckOutlined,
//   StopOutlined,
//   LoadingOutlined
// } from '@ant-design/icons';
// import { useWarehouse } from '../../hooks/useWarehouse';
// import TransferModal from './TransferModal';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import { TransferStatus } from '../../types/warehouse.types';

// const { RangePicker } = DatePicker;
// const { Option } = Select;
// const { Text } = Typography;

// // Add relative time plugin
// dayjs.extend(relativeTime);

// // Warehouse labels based on your schema
// const WAREHOUSE_LABELS = {
//   SHEGOLE_MULUNEH: 'Shegole Muluneh',
//   EMBILTA: 'Embilta',
//   NEW_SHEGOLE: 'New Shegole',
//   MERKATO: 'Merkato',
//   DAMAGE: 'Damage',
//   BACKUP: 'Backup'
// };

// // Warehouse colors for visual distinction
// const WAREHOUSE_COLORS = {
//   SHEGOLE_MULUNEH: 'blue',
//   EMBILTA: 'green',
//   NEW_SHEGOLE: 'purple',
//   MERKATO: 'orange',
//   DAMAGE: 'red',
//   BACKUP: 'cyan'
// };

// // Transfer statuses based on your schema
// const TRANSFER_STATUS = {
//   PENDING: 'PENDING',
//   APPROVED: 'APPROVED',
//   COMPLETED: 'COMPLETED',
//   REJECTED: 'REJECTED',
//   CANCELLED: 'CANCELLED'
// } as const;

// // Transfer types based on your schema
// const TRANSFER_TYPES = {
//   WAREHOUSE_TO_WAREHOUSE: 'WAREHOUSE_TO_WAREHOUSE',
//   RESTOCK: 'RESTOCK',
//   RETURN: 'RETURN',
//   DAMAGE: 'DAMAGE',
//   ADJUSTMENT: 'ADJUSTMENT'
// } as const;

// // Status labels and colors
// const TRANSFER_STATUS_LABELS = {
//   [TRANSFER_STATUS.PENDING]: 'Pending',
//   [TRANSFER_STATUS.APPROVED]: 'Approved',
//   [TRANSFER_STATUS.COMPLETED]: 'Completed',
//   [TRANSFER_STATUS.REJECTED]: 'Rejected',
//   [TRANSFER_STATUS.CANCELLED]: 'Cancelled'
// };

// const TRANSFER_STATUS_COLORS = {
//   [TRANSFER_STATUS.PENDING]: 'orange',
//   [TRANSFER_STATUS.APPROVED]: 'blue',
//   [TRANSFER_STATUS.COMPLETED]: 'green',
//   [TRANSFER_STATUS.REJECTED]: 'red',
//   [TRANSFER_STATUS.CANCELLED]: 'gray'
// };

// // Transfer type labels
// const TRANSFER_TYPE_LABELS = {
//   [TRANSFER_TYPES.WAREHOUSE_TO_WAREHOUSE]: 'Warehouse Transfer',
//   [TRANSFER_TYPES.RESTOCK]: 'Restock',
//   [TRANSFER_TYPES.RETURN]: 'Return',
//   [TRANSFER_TYPES.DAMAGE]: 'Damage Transfer',
//   [TRANSFER_TYPES.ADJUSTMENT]: 'Adjustment'
// };

// const TRANSFER_TYPE_COLORS = {
//   [TRANSFER_TYPES.WAREHOUSE_TO_WAREHOUSE]: 'blue',
//   [TRANSFER_TYPES.RESTOCK]: 'green',
//   [TRANSFER_TYPES.RETURN]: 'purple',
//   [TRANSFER_TYPES.DAMAGE]: 'red',
//   [TRANSFER_TYPES.ADJUSTMENT]: 'orange'
// };

// interface TransferListProps {
//   showActions?: boolean;
//   compact?: boolean;
//   currentUser?: any;
// }

// const TransferList: React.FC<TransferListProps> = ({ 
//   showActions = true, 
//   compact = false,
//   currentUser
// }) => {
//   const {
//     transfers,
//     transfersLoading,
//     pagination,
//     getTransfers,
//     approveTransfer,
//     completeTransfer,
//     rejectTransfer,
//     cancelTransfer,
//     updateFilters,
//     filters,
//     isAdmin
//   } = useWarehouse();

//   const [searchParams, setSearchParams] = useState({
//     status: '',
//     from_warehouse: '',
//     to_warehouse: '',
//     transferType: '',
//     search: '',
//     startDate: '',
//     endDate: ''
//   });
//   const [showTransferModal, setShowTransferModal] = useState(false);
//   const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
//   const [selectedProductForTransfer, setSelectedProductForTransfer] = useState<any>(null);
//   const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

//   useEffect(() => {
//     fetchTransfers();
//   }, []);

//   const fetchTransfers = (params = {}) => {
//     const filterParams = {
//       ...searchParams,
//       page: 1,
//       limit: compact ? 5 : 10,
//       ...params
//     };
//     updateFilters(filterParams);
//     getTransfers();
//   };

//   const handleSearch = () => {
//   // Convert status string to TransferStatus enum
//   const statusValue = searchParams.status as keyof typeof TransferStatus;
  
//   updateFilters({
//     ...searchParams,
//     page: 1,
//     limit: compact ? 5 : 10,
//     status: TransferStatus[statusValue] || ''
//   } as any); // Use 'as any' temporarily
// };

// const handleReset = () => {
//   const resetParams = {
//     status: '',
//     from_warehouse: '',
//     to_warehouse: '',
//     transferType: '',
//     search: '',
//     startDate: '',
//     endDate: ''
//   };
//   setSearchParams(resetParams);
//   updateFilters({
//     ...resetParams,
//     page: 1,
//     limit: compact ? 5 : 10
//   } as any); // Use 'as any' temporarily
// };

//   const handleApprove = async (transfer: any) => {
//     Modal.confirm({
//       title: 'Approve Transfer',
//       content: (
//         <div>
//           <p>Are you sure you want to approve this transfer?</p>
//           <div style={{ marginTop: 16 }}>
//             <strong>Transfer #{transfer.transfer_number}</strong>
//             <br />
//             {transfer.productName} ({transfer.quantity} {transfer.unit})
//             <br />
//             From: {WAREHOUSE_LABELS[transfer.from_warehouse]}
//             <br />
//             To: {WAREHOUSE_LABELS[transfer.to_warehouse]}
//           </div>
//         </div>
//       ),
//       okText: 'Approve',
//       okType: 'primary',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         const result = await approveTransfer(transfer.id, currentUser?.id);
//         if (result.success) {
//           message.success('Transfer approved successfully');
//           getTransfers();
//         } else {
//           message.error(result.error || 'Failed to approve transfer');
//         }
//       }
//     });
//   };

//   const handleComplete = async (transfer: any) => {
//     Modal.confirm({
//       title: 'Complete Transfer',
//       content: (
//         <div>
//           <p>Are you sure you want to mark this transfer as completed?</p>
//           <div style={{ marginTop: 16 }}>
//             <strong>Transfer #{transfer.transfer_number}</strong>
//             <br />
//             This will update inventory quantities in both warehouses.
//           </div>
//         </div>
//       ),
//       okText: 'Complete',
//       okType: 'primary',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         const result = await completeTransfer(transfer.id, currentUser?.id);
//         if (result.success) {
//           message.success('Transfer completed successfully');
//           getTransfers();
//         } else {
//           message.error(result.error || 'Failed to complete transfer');
//         }
//       }
//     });
//   };

//   const handleReject = async (transfer: any) => {
//     Modal.confirm({
//       title: 'Reject Transfer',
//       content: `Are you sure you want to reject transfer ${transfer.transfer_number}?`,
//       okText: 'Reject',
//       okType: 'danger',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         const result = await rejectTransfer(transfer.id, 'Rejected by admin', currentUser?.id);
//         if (result.success) {
//           message.success('Transfer rejected successfully');
//           getTransfers();
//         } else {
//           message.error(result.error || 'Failed to reject transfer');
//         }
//       }
//     });
//   };

//   const handleCancel = async (transfer: any) => {
//     Modal.confirm({
//       title: 'Cancel Transfer',
//       content: `Are you sure you want to cancel transfer ${transfer.transfer_number}?`,
//       okText: 'Cancel Transfer',
//       okType: 'danger',
//       cancelText: 'Go Back',
//       onOk: async () => {
//         const result = await cancelTransfer(transfer.id, 'Cancelled by admin', currentUser?.id);
//         if (result.success) {
//           message.success('Transfer cancelled successfully');
//           getTransfers();
//         } else {
//           message.error(result.error || 'Failed to cancel transfer');
//         }
//       }
//     });
//   };

//   const handleViewDetails = (transfer: any) => {
//     setSelectedTransfer(transfer);
//     Modal.info({
//       title: `Transfer Details - ${transfer.transfer_number}`,
//       width: 600,
//       content: (
//         <div style={{ marginTop: 20 }}>
//           <Row gutter={16}>
//             <Col span={12}>
//               <div style={{ marginBottom: 12 }}>
//                 <Text strong>Product:</Text>
//                 <br />
//                 <Text>{transfer.productCode} - {transfer.productName}</Text>
//               </div>
//               <div style={{ marginBottom: 12 }}>
//                 <Text strong>Quantity:</Text>
//                 <br />
//                 <Tag color="blue">{transfer.quantity} {transfer.unit}</Tag>
//               </div>
//               <div style={{ marginBottom: 12 }}>
//                 <Text strong>Transfer Type:</Text>
//                 <br />
//                 <Tag color={TRANSFER_TYPE_COLORS[transfer.transferType]}>
//                   {TRANSFER_TYPE_LABELS[transfer.transferType]}
//                 </Tag>
//               </div>
//             </Col>
//             <Col span={12}>
//               <div style={{ marginBottom: 12 }}>
//                 <Text strong>From:</Text>
//                 <br />
//                 <Tag color={WAREHOUSE_COLORS[transfer.from_warehouse]}>
//                   {WAREHOUSE_LABELS[transfer.from_warehouse]}
//                 </Tag>
//               </div>
//               <div style={{ marginBottom: 12 }}>
//                 <Text strong>To:</Text>
//                 <br />
//                 <Tag color={WAREHOUSE_COLORS[transfer.to_warehouse]}>
//                   {WAREHOUSE_LABELS[transfer.to_warehouse]}
//                 </Tag>
//               </div>
//               <div style={{ marginBottom: 12 }}>
//                 <Text strong>Status:</Text>
//                 <br />
//                 <Tag color={TRANSFER_STATUS_COLORS[transfer.status]}>
//                   {TRANSFER_STATUS_LABELS[transfer.status]}
//                 </Tag>
//               </div>
//             </Col>
//           </Row>
//           {transfer.reason && (
//             <div style={{ marginTop: 16 }}>
//               <Text strong>Reason:</Text>
//               <br />
//               <Text type="secondary">{transfer.reason}</Text>
//             </div>
//           )}
//           {transfer.notes && (
//             <div style={{ marginTop: 16 }}>
//               <Text strong>Notes:</Text>
//               <br />
//               <Text type="secondary">{transfer.notes}</Text>
//             </div>
//           )}
//           <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
//             <Text strong>Timeline:</Text>
//             <br />
//             <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
//               <div>
//                 <Text type="secondary">Requested: </Text>
//                 <Text>{dayjs(transfer.requested_at).format('YYYY-MM-DD HH:mm')}</Text>
//               </div>
//               {transfer.approved_at && (
//                 <div>
//                   <Text type="secondary">Approved: </Text>
//                   <Text>{dayjs(transfer.approved_at).format('YYYY-MM-DD HH:mm')}</Text>
//                 </div>
//               )}
//               {transfer.completed_at && (
//                 <div>
//                   <Text type="secondary">Completed: </Text>
//                   <Text>{dayjs(transfer.completed_at).format('YYYY-MM-DD HH:mm')}</Text>
//                 </div>
//               )}
//             </Space>
//           </div>
//         </div>
//       )
//     });
//   };

//   const handleCreateTransfer = () => {
//     setSelectedProductForTransfer(null);
//     setShowTransferModal(true);
//   };

//   const handleTransferSuccess = () => {
//     setShowTransferModal(false);
//     setSelectedProductForTransfer(null);
//     getTransfers();
//     message.success('Transfer request created successfully');
//   };

//   const getStatusBadge = (status: string) => {
//     const icons = {
//       [TRANSFER_STATUS.PENDING]: <ClockCircleOutlined />,
//       [TRANSFER_STATUS.APPROVED]: <CheckCircleOutlined />,
//       [TRANSFER_STATUS.COMPLETED]: <CheckOutlined />,
//       [TRANSFER_STATUS.REJECTED]: <StopOutlined />,
//       [TRANSFER_STATUS.CANCELLED]: <CloseCircleOutlined />
//     };
    
//     return (
//       <Badge 
//         count={icons[status]} 
//         style={{ 
//           backgroundColor: TRANSFER_STATUS_COLORS[status],
//           marginRight: 8
//         }} 
//       />
//     );
//   };

//   const getActionMenu = (transfer: any): MenuProps => ({
//     items: [
//       {
//         key: 'view',
//         label: 'View Details',
//         icon: <EyeOutlined />,
//         onClick: () => handleViewDetails(transfer)
//       },
//       ...(transfer.status === TRANSFER_STATUS.PENDING && isAdmin ? [
//         {
//           key: 'approve',
//           label: 'Approve',
//           icon: <CheckCircleOutlined />,
//           onClick: () => handleApprove(transfer)
//         },
//         {
//           key: 'reject',
//           label: 'Reject',
//           icon: <CloseCircleOutlined />,
//           danger: true,
//           onClick: () => handleReject(transfer)
//         }
//       ] : []),
//       ...(transfer.status === TRANSFER_STATUS.APPROVED && isAdmin ? [
//         {
//           key: 'complete',
//           label: 'Mark as Completed',
//           icon: <CheckOutlined />,
//           onClick: () => handleComplete(transfer)
//         },
//         {
//           key: 'cancel',
//           label: 'Cancel',
//           icon: <StopOutlined />,
//           danger: true,
//           onClick: () => handleCancel(transfer)
//         }
//       ] : []),
//       ...(transfer.status === TRANSFER_STATUS.PENDING && !isAdmin ? [
//         {
//           key: 'cancel',
//           label: 'Cancel Request',
//           icon: <StopOutlined />,
//           danger: true,
//           onClick: () => handleCancel(transfer)
//         }
//       ] : [])
//     ]
//   });

//   const columns: any[] = [
//     {
//       title: 'Transfer #',
//       dataIndex: 'transfer_number',
//       key: 'transfer_number',
//       width: 120,
//       render: (text: string) => (
//         <Text strong style={{ fontFamily: 'monospace' }}>
//           {text}
//         </Text>
//       )
//     },
//     {
//       title: 'Product',
//       key: 'product',
//       width: 200,
//       render: (text: string, record: any) => (
//         <div>
//           <div style={{ fontWeight: '500' }}>{record.productName}</div>
//           <div style={{ fontSize: '12px', color: '#666' }}>{record.productCode}</div>
//         </div>
//       )
//     },
//     {
//       title: 'From → To',
//       key: 'warehouses',
//       width: 180,
//       render: (text: string, record: any) => (
//         <div>
//           <Space direction="vertical" size={2}>
//             <div>
//               <Tag 
//                 color={WAREHOUSE_COLORS[record.from_warehouse]}
//                 style={{ margin: 0, width: '100%', textAlign: 'center' }}
//               >
//                 {WAREHOUSE_LABELS[record.from_warehouse]}
//               </Tag>
//             </div>
//             <div style={{ textAlign: 'center' }}>
//               <SwapOutlined style={{ color: '#8c8c8c' }} />
//             </div>
//             <div>
//               <Tag 
//                 color={WAREHOUSE_COLORS[record.to_warehouse]}
//                 style={{ margin: 0, width: '100%', textAlign: 'center' }}
//               >
//                 {WAREHOUSE_LABELS[record.to_warehouse]}
//               </Tag>
//             </div>
//           </Space>
//         </div>
//       )
//     },
//     {
//       title: 'Quantity',
//       key: 'quantity',
//       width: 100,
//       render: (text: string, record: any) => (
//         <div style={{ textAlign: 'center' }}>
//           <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
//             {record.quantity}
//           </div>
//           <div style={{ fontSize: '12px', color: '#666' }}>
//             {record.unit}
//           </div>
//         </div>
//       )
//     },
//     {
//       title: 'Type',
//       dataIndex: 'transferType',
//       key: 'transferType',
//       width: 120,
//       render: (type: string) => (
//         <Tag color={TRANSFER_TYPE_COLORS[type]}>
//           {TRANSFER_TYPE_LABELS[type]}
//         </Tag>
//       )
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       width: 120,
//       render: (status: string) => (
//         <Space>
//           {getStatusBadge(status)}
//           <Tag color={TRANSFER_STATUS_COLORS[status]}>
//             {TRANSFER_STATUS_LABELS[status]}
//           </Tag>
//         </Space>
//       )
//     },
//     {
//       title: 'Requested',
//       dataIndex: 'requested_at',
//       key: 'requested_at',
//       width: 150,
//       render: (date: string) => (
//         <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
//           <div>
//             <div>{dayjs(date).format('MMM D, YYYY')}</div>
//             <div style={{ fontSize: '11px', color: '#666' }}>
//               {dayjs(date).fromNow()}
//             </div>
//           </div>
//         </Tooltip>
//       )
//     },
//     {
//       title: 'Requested By',
//       key: 'requester',
//       width: 120,
//       render: (text: string, record: any) => (
//         <div style={{ textAlign: 'center' }}>
//           <Avatar size="small" icon={<UserOutlined />} />
//           <div style={{ fontSize: '11px', marginTop: 4 }}>
//             User #{record.requested_by}
//           </div>
//         </div>
//       )
//     }
//   ];

//   if (showActions && !compact) {
//     columns.push({
//       title: 'Actions',
//       key: 'actions',
//       width: 150,
//       render: (text: string, record: any) => (
//         <Space>
//           <Button
//             size="small"
//             icon={<EyeOutlined />}
//             onClick={() => handleViewDetails(record)}
//           />
//           {record.status === TRANSFER_STATUS.PENDING && isAdmin && (
//             <>
//               <Popconfirm
//                 title="Approve this transfer?"
//                 onConfirm={() => handleApprove(record)}
//                 okText="Yes"
//                 cancelText="No"
//               >
//                 <Button
//                   size="small"
//                   type="primary"
//                   icon={<CheckCircleOutlined />}
//                 />
//               </Popconfirm>
//               <Popconfirm
//                 title="Reject this transfer?"
//                 onConfirm={() => handleReject(record)}
//                 okText="Yes"
//                 cancelText="No"
//                 okType="danger"
//               >
//                 <Button
//                   size="small"
//                   danger
//                   icon={<CloseCircleOutlined />}
//                 />
//               </Popconfirm>
//             </>
//           )}
//           {record.status === TRANSFER_STATUS.APPROVED && isAdmin && (
//             <Popconfirm
//               title="Mark as completed?"
//               onConfirm={() => handleComplete(record)}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<CheckOutlined />}
//               />
//             </Popconfirm>
//           )}
//         </Space>
//       )
//     });
//   } else if (showActions && compact) {
//     columns.push({
//       title: '',
//       key: 'actions',
//       width: 50,
//       render: (text: string, record: any) => (
//         <Dropdown menu={getActionMenu(record)} trigger={['click']}>
//           <Button type="text" icon={<MoreOutlined />} />
//         </Dropdown>
//       )
//     });
//   }

//   // Calculate statistics
//   const stats = {
//     pending: transfers.filter(t => t.status === TRANSFER_STATUS.PENDING).length,
//     approved: transfers.filter(t => t.status === TRANSFER_STATUS.APPROVED).length,
//     completed: transfers.filter(t => t.status === TRANSFER_STATUS.COMPLETED).length,
//     rejected: transfers.filter(t => t.status === TRANSFER_STATUS.REJECTED).length,
//     cancelled: transfers.filter(t => t.status === TRANSFER_STATUS.CANCELLED).length,
//     total: transfers.length,
//     totalQuantity: transfers.reduce((sum, t) => sum + t.quantity, 0)
//   };

//   // Calculate approval rate
//   const approvalRate = stats.total > 0 ? 
//     ((stats.completed + stats.approved) / stats.total) * 100 : 0;

//   if (compact) {
//     return (
//       <Card
//         title={
//           <Space>
//             <SwapOutlined />
//             <span>Recent Transfers</span>
//             <Badge 
//               count={stats.pending} 
//               style={{ 
//                 backgroundColor: stats.pending > 0 ? '#faad14' : '#d9d9d9'
//               }} 
//             />
//           </Space>
//         }
//         extra={
//           <Button 
//             type="link" 
//             onClick={handleCreateTransfer}
//             icon={<SwapOutlined />}
//           >
//             New Transfer
//           </Button>
//         }
//       >
//         <Table
//           columns={columns}
//           dataSource={transfers}
//           rowKey="id"
//           loading={transfersLoading}
//           pagination={false}
//           size="small"
//           scroll={{ x: 800 }}
//         />
//         <TransferModal
//           open={showTransferModal}
//           onCancel={() => setShowTransferModal(false)}
//           onSuccess={handleTransferSuccess}
//           product={selectedProductForTransfer}
//           currentUser={currentUser}
//           initialData={selectedProductForTransfer ? {
//             from_warehouse: 'SHEGOLE_MULUNEH',
//             product_id: selectedProductForTransfer.id,
//             quantity: 1,
//             unit: selectedProductForTransfer.unit || 'PC'
//           } : undefined}
//         />
//       </Card>
//     );
//   }

//   if (!isAdmin) {
//     return (
//       <Card title="Warehouse Transfers" style={{ textAlign: 'center', padding: '40px 0' }}>
//         <SwapOutlined style={{ fontSize: '48px', color: '#8c8c8c', marginBottom: 16 }} />
//         <h3>Access Denied</h3>
//         <p>Warehouse transfer management is for administrators only.</p>
//       </Card>
//     );
//   }

//   return (
//     <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
//       <Card 
//         title={
//           <Space>
//             <SwapOutlined />
//             <span>Warehouse Transfers Management</span>
//           </Space>
//         }
//         extra={
//           <Space>
//             <Button
//               type={viewMode === 'list' ? 'primary' : 'default'}
//               onClick={() => setViewMode('list')}
//               icon={<FilterOutlined />}
//             >
//               List View
//             </Button>
//             <Button
//               type="primary"
//               onClick={handleCreateTransfer}
//               icon={<SwapOutlined />}
//             >
//               Create Transfer
//             </Button>
//           </Space>
//         }
//         style={{ borderRadius: 8 }}
//       >
//         {/* Stats Overview */}
//         <Row gutter={16} style={{ marginBottom: 24 }}>
//           <Col xs={24} sm={12} lg={4}>
//             <Card size="small" hoverable>
//               <Statistic
//                 title="Total Transfers"
//                 value={stats.total}
//                 prefix={<SwapOutlined />}
//                 valueStyle={{ color: '#1890ff' }}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={12} lg={4}>
//             <Card size="small" hoverable>
//               <Statistic
//                 title="Pending"
//                 value={stats.pending}
//                 valueStyle={{ color: '#faad14' }}
//                 prefix={<ClockCircleOutlined />}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={12} lg={4}>
//             <Card size="small" hoverable>
//               <Statistic
//                 title="Approved"
//                 value={stats.approved}
//                 valueStyle={{ color: '#1890ff' }}
//                 prefix={<CheckCircleOutlined />}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={12} lg={4}>
//             <Card size="small" hoverable>
//               <Statistic
//                 title="Completed"
//                 value={stats.completed}
//                 valueStyle={{ color: '#52c41a' }}
//                 prefix={<CheckOutlined />}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={12} lg={4}>
//             <Card size="small" hoverable>
//               <Statistic
//                 title="Total Quantity"
//                 value={stats.totalQuantity}
//                 valueStyle={{ color: '#722ed1' }}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={12} lg={4}>
//             <Card size="small" hoverable>
//               <div style={{ textAlign: 'center' }}>
//                 <div style={{ marginBottom: 8 }}>
//                   <Text type="secondary">Approval Rate</Text>
//                 </div>
//                 <Progress 
//                   type="circle" 
//                   percent={Math.round(approvalRate)} 
//                   size={60}
//                   strokeColor={approvalRate > 70 ? '#52c41a' : approvalRate > 40 ? '#faad14' : '#f5222d'}
//                 />
//               </div>
//             </Card>
//           </Col>
//         </Row>

//         {/* Filters */}
//         <Card size="small" style={{ marginBottom: 24, borderRadius: 6 }}>
//           <Row gutter={[16, 16]}>
//             <Col xs={24} md={6}>
//               <Select
//                 placeholder="Status"
//                 style={{ width: '100%' }}
//                 value={searchParams.status || undefined}
//                 onChange={(value) => setSearchParams({ ...searchParams, status: value })}
//                 allowClear
//               >
//                 {Object.entries(TRANSFER_STATUS_LABELS).map(([value, label]) => (
//                   <Option key={value} value={value}>{label}</Option>
//                 ))}
//               </Select>
//             </Col>
//             <Col xs={24} md={6}>
//               <Select
//                 placeholder="From Warehouse"
//                 style={{ width: '100%' }}
//                 value={searchParams.from_warehouse || undefined}
//                 onChange={(value) => setSearchParams({ ...searchParams, from_warehouse: value })}
//                 allowClear
//               >
//                 {Object.entries(WAREHOUSE_LABELS).map(([value, label]) => (
//                   <Option key={value} value={value}>{label}</Option>
//                 ))}
//               </Select>
//             </Col>
//             <Col xs={24} md={6}>
//               <Select
//                 placeholder="To Warehouse"
//                 style={{ width: '100%' }}
//                 value={searchParams.to_warehouse || undefined}
//                 onChange={(value) => setSearchParams({ ...searchParams, to_warehouse: value })}
//                 allowClear
//               >
//                 {Object.entries(WAREHOUSE_LABELS).map(([value, label]) => (
//                   <Option key={value} value={value}>{label}</Option>
//                 ))}
//               </Select>
//             </Col>
//             <Col xs={24} md={6}>
//               <Select
//                 placeholder="Transfer Type"
//                 style={{ width: '100%' }}
//                 value={searchParams.transferType || undefined}
//                 onChange={(value) => setSearchParams({ ...searchParams, transferType: value })}
//                 allowClear
//               >
//                 {Object.entries(TRANSFER_TYPE_LABELS).map(([value, label]) => (
//                   <Option key={value} value={value}>{label}</Option>
//                 ))}
//               </Select>
//             </Col>
//             <Col xs={24} md={12}>
//               <RangePicker
//                 style={{ width: '100%' }}
//                 format="YYYY-MM-DD"
//                 onChange={(dates) => {
//                   if (dates && dates[0] && dates[1]) {
//                     setSearchParams({
//                       ...searchParams,
//                       startDate: dates[0].toISOString(),
//                       endDate: dates[1].toISOString()
//                     });
//                   } else {
//                     setSearchParams({
//                       ...searchParams,
//                       startDate: '',
//                       endDate: ''
//                     });
//                   }
//                 }}
//               />
//             </Col>
//             <Col xs={24} md={12}>
//               <Input
//                 placeholder="Search by transfer number, product code, or product name"
//                 value={searchParams.search}
//                 onChange={(e) => setSearchParams({ ...searchParams, search: e.target.value })}
//                 onPressEnter={handleSearch}
//                 prefix={<SearchOutlined />}
//                 allowClear
//               />
//             </Col>
//           </Row>
//           <Row gutter={16} style={{ marginTop: 16 }}>
//             <Col span={24} style={{ textAlign: 'right' }}>
//               <Space>
//                 <Button 
//                   type="primary" 
//                   icon={<SearchOutlined />} 
//                   onClick={handleSearch}
//                   loading={transfersLoading}
//                 >
//                   Search
//                 </Button>
//                 <Button 
//                   icon={<ReloadOutlined />} 
//                   onClick={handleReset}
//                 >
//                   Reset
//                 </Button>
//               </Space>
//             </Col>
//           </Row>
//         </Card>

//         {/* Transfer Table */}
//         <Table
//           columns={columns}
//           dataSource={transfers}
//           rowKey="id"
//           loading={transfersLoading}
//           pagination={{
//             current: pagination.page,
//             pageSize: pagination.limit,
//             total: pagination.total,
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => 
//               `${range[0]}-${range[1]} of ${total} transfers`,
//             onChange: (page, pageSize) => {
//               updateFilters({
//                 ...filters,
//                 page: page,
//                 limit: pageSize
//               });
//               getTransfers();
//             }
//           }}
//           scroll={{ x: 1300 }}
//           rowClassName={(record) => {
//             if (record.status === TRANSFER_STATUS.PENDING) {
//               return 'pending-transfer-row';
//             }
//             if (record.status === TRANSFER_STATUS.REJECTED || record.status === TRANSFER_STATUS.CANCELLED) {
//               return 'rejected-transfer-row';
//             }
//             return '';
//           }}
//         />
//       </Card>

//       {/* Transfer Modal */}
//       // In TransferList.tsx, around line 343
// <TransferModal
//   open={showTransferModal}
//   onCancel={() => setShowTransferModal(false)}
//   onSuccess={handleTransferSuccess}
//   product={selectedProductForTransfer}
//   initialData={selectedProductForTransfer ? {
//     from_warehouse: 'SHEGOLE_MULUNEH',
//     product_id: selectedProductForTransfer.id,
//     quantity: 1,
//     unit: selectedProductForTransfer.unit || 'PC'
//   } : undefined}
//   currentUser={currentUser} // Add this line
// />

//       {/* Add some CSS for row styling */}
//       <style>{`
//         .pending-transfer-row {
//           background-color: #fff7e6;
//         }
//         .pending-transfer-row:hover {
//           background-color: #ffe7ba !important;
//         }
//         .rejected-transfer-row {
//           background-color: #fff1f0;
//         }
//         .rejected-transfer-row:hover {
//           background-color: #ffccc7 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default TransferList;
<h1>trasfer list page</h1>