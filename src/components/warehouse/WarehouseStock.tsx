// import React, { useState, useEffect } from 'react';
// import {
//   Table,
//   Card,
//   Row,
//   Col,
//   Statistic,
//   Tag,
//   Button,
//   Input,
//   Select,
//   Space,
//   Tooltip,
//   Modal,
//   Form,
//   InputNumber,
//   message,
//   Spin,
//   Typography,
//   Badge,
//   Alert,
// } from 'antd';
// import {
//   SearchOutlined,
//   SyncOutlined,
//   StockOutlined,
//   WarningOutlined,
//   DashboardOutlined,
//   AppstoreOutlined,
//   SwapOutlined,
//   ExportOutlined,
//   FileTextOutlined,
// } from '@ant-design/icons';
// import { useWarehouse } from '../../hooks/useWarehouse';
// import StockAdjustmentModal from './StockAdjustmentModal';
// import TransferModal from './TransferModal';

// const { Title, Text } = Typography;
// const { Option } = Select;

// // Warehouse definitions based on your Prisma schema
// const WAREHOUSES = [
//   'SHEGOLE_MULUNEH',
//   'EMBILTA', 
//   'NEW_SHEGOLE',
//   'MERKATO',
//   'DAMAGE',
//   'BACKUP'
// ] as const;

// // Map warehouse enum values to readable labels
// const WAREHOUSE_LABELS = {
//   SHEGOLE_MULUNEH: 'Shegole Muluneh',
//   EMBILTA: 'Embilta',
//   NEW_SHEGOLE: 'New Shegole',
//   MERKATO: 'Merkato',
//   DAMAGE: 'Damage',
//   BACKUP: 'Backup'
// };

// // Unit labels
// const UNIT_LABELS = {
//   PC: 'Piece',
//   DOZ: 'Dozen',
//   SET: 'Set'
// };

// const STOCK_LEVEL_COLORS = {
//   CRITICAL: 'red',        // Below min stock level
//   LOW: 'orange',         // Below reorder point
//   NORMAL: 'green',       // Above reorder point
//   OUT_OF_STOCK: 'gray',  // Zero stock
//   OVERSTOCK: 'purple',   // Significantly above normal
// };

// const getStockLevel = (quantity: number, minStockLevel: number, reorderPoint: number) => {
//   if (quantity === 0) return 'OUT_OF_STOCK';
//   if (quantity < minStockLevel) return 'CRITICAL';
//   if (quantity < reorderPoint) return 'LOW';
//   if (quantity > (reorderPoint * 3)) return 'OVERSTOCK';
//   return 'NORMAL';
// };

// const getStockLevelDescription = (level: string) => {
//   const descriptions = {
//     CRITICAL: 'Below minimum stock',
//     LOW: 'Below reorder point',
//     NORMAL: 'Healthy stock',
//     OUT_OF_STOCK: 'Out of stock',
//     OVERSTOCK: 'Overstocked'
//   };
//   return descriptions[level] || level;
// };

// const WarehouseStock = () => {
//   const {
//     warehouseStock,
//     warehouseStockLoading,
//     getWarehouseStock,
//     isAdmin,
//     productStockLoading,
//   } = useWarehouse();
  
//   const [searchText, setSearchText] = useState('');
//   const [selectedWarehouse, setSelectedWarehouse] = useState('');
//   const [selectedProduct, setSelectedProduct] = useState(null);
//   const [isAdjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
//   const [isTransferModalVisible, setTransferModalVisible] = useState(false);
//   const [viewMode, setViewMode] = useState('detailed'); // 'detailed' or 'summary'
//   const [form] = Form.useForm();

//   useEffect(() => {
//     getWarehouseStock();
//   }, []);

//   const handleSearch = () => {
//     getWarehouseStock();
//   };

//   const handleAdjustStock = (product: any) => {
//     setSelectedProduct(product);
//     setAdjustmentModalVisible(true);
//   };

//   const handleTransferStock = (product: any) => {
//     setSelectedProduct(product);
//     setTransferModalVisible(true);
//   };

//   const handleAdjustmentSuccess = () => {
//     getWarehouseStock();
//     setAdjustmentModalVisible(false);
//     setSelectedProduct(null);
//     message.success('Stock adjusted successfully');
//   };

//   const handleTransferSuccess = () => {
//     getWarehouseStock();
//     setTransferModalVisible(false);
//     setSelectedProduct(null);
//     message.success('Transfer created successfully');
//   };

//   // Calculate total value for a product across all warehouses
//   const calculateTotalValue = (product: any) => {
//     if (!product) return 0;
    
//     const totalQty = product.totalQty || 0;
//     const price = product.price || 0;
//     return totalQty * price;
//   };

//   // Calculate total value by warehouse
//   const calculateWarehouseValue = (product: any, warehouse: string) => {
//     if (!product) return 0;
    
//     const warehouseField = {
//       SHEGOLE_MULUNEH: 'shegoleMulunehQty',
//       EMBILTA: 'embiltaQty',
//       NEW_SHEGOLE: 'newShegoleQty',
//       MERKATO: 'merkatoQty',
//       DAMAGE: 'damageQty',
//       BACKUP: 'backupQty'
//     }[warehouse];
    
//     const qty = product[warehouseField] || 0;
//     const price = product.price || 0;
//     return qty * price;
//   };

//   // Get warehouse quantity
//   const getWarehouseQuantity = (product: any, warehouse: string) => {
//     const warehouseField = {
//       SHEGOLE_MULUNEH: 'shegoleMulunehQty',
//       EMBILTA: 'embiltaQty',
//       NEW_SHEGOLE: 'newShegoleQty',
//       MERKATO: 'merkatoQty',
//       DAMAGE: 'damageQty',
//       BACKUP: 'backupQty'
//     }[warehouse];
    
//     return product[warehouseField] || 0;
//   };

//   // Filter products based on search and warehouse selection
//   const filteredProducts = warehouseStock.filter((product: any) => {
//     const matchesSearch = searchText === '' || 
//       product.name?.toLowerCase().includes(searchText.toLowerCase()) ||
//       product.code?.toLowerCase().includes(searchText.toLowerCase());
    
//     const matchesWarehouse = selectedWarehouse === '' || 
//       getWarehouseQuantity(product, selectedWarehouse) > 0;
    
//     return matchesSearch && matchesWarehouse;
//   });

//   // Prepare columns for detailed view
//   const getDetailedColumns = () => {
//     const baseColumns: any[] = [
//       {
//         title: 'Code',
//         dataIndex: 'code',
//         key: 'code',
//         width: 120,
//         fixed: 'left' as const,
//         sorter: (a: any, b: any) => a.code.localeCompare(b.code),
//         render: (text: string, record: any) => (
//           <div>
//             <div style={{ fontWeight: 'bold' }}>{text}</div>
//             <div style={{ fontSize: '11px', color: '#666' }}>ID: {record.id}</div>
//           </div>
//         ),
//       },
//       {
//         title: 'Product Name',
//         dataIndex: 'name',
//         key: 'name',
//         width: 200,
//         fixed: 'left' as const,
//         sorter: (a: any, b: any) => a.name.localeCompare(b.name),
//       },
//       {
//         title: 'Unit',
//         dataIndex: 'unit',
//         key: 'unit',
//         width: 80,
//         render: (unit: string) => (
//           <Tag color="blue">{UNIT_LABELS[unit] || unit}</Tag>
//         ),
//       },
//       {
//         title: 'Price',
//         dataIndex: 'price',
//         key: 'price',
//         width: 100,
//         render: (price: number) => `$${price.toFixed(2)}`,
//         sorter: (a: any, b: any) => a.price - b.price,
//       },
//       {
//         title: 'Min Stock',
//         dataIndex: 'minStockLevel',
//         key: 'minStockLevel',
//         width: 100,
//         render: (min: number) => (
//           <Badge count={min} style={{ backgroundColor: '#faad14' }} />
//         ),
//       },
//       {
//         title: 'Reorder Point',
//         dataIndex: 'reorderPoint',
//         key: 'reorderPoint',
//         width: 100,
//         render: (point: number) => (
//           <Badge count={point} style={{ backgroundColor: '#1890ff' }} />
//         ),
//       },
//     ];

//     // Add warehouse quantity columns
//     WAREHOUSES.forEach(warehouse => {
//       baseColumns.push({
//         title: (
//           <Tooltip title={WAREHOUSE_LABELS[warehouse as keyof typeof WAREHOUSE_LABELS]}>
//             <span>{WAREHOUSE_LABELS[warehouse as keyof typeof WAREHOUSE_LABELS].split(' ')[0]}</span>
//           </Tooltip>
//         ),
//         dataIndex: warehouse,
//         key: warehouse,
//         width: 120,
//         render: (_: any, record: any) => {
//           const quantity = getWarehouseQuantity(record, warehouse);
//           const stockLevel = getStockLevel(
//             quantity,
//             record.minStockLevel || 10,
//             record.reorderPoint || 20
//           );
//           const color = STOCK_LEVEL_COLORS[stockLevel as keyof typeof STOCK_LEVEL_COLORS];
          
//           return (
//             <div style={{ textAlign: 'center' }}>
//               <div style={{ 
//                 fontSize: '16px', 
//                 fontWeight: 'bold', 
//                 marginBottom: '4px',
//                 color: stockLevel === 'CRITICAL' || stockLevel === 'OUT_OF_STOCK' ? '#ff4d4f' : 'inherit'
//               }}>
//                 {quantity}
//               </div>
//               <Tooltip title={getStockLevelDescription(stockLevel)}>
//                 <Tag color={color} style={{ margin: 0, cursor: 'pointer' }}>
//                   {stockLevel === 'CRITICAL' ? <WarningOutlined /> : ''}
//                 </Tag>
//               </Tooltip>
//             </div>
//           );
//         },
//         sorter: (a: any, b: any) => 
//           getWarehouseQuantity(a, warehouse) - getWarehouseQuantity(b, warehouse),
//       });
//     });

//     // Add total quantity column
//     baseColumns.push({
//       title: 'Total Qty',
//       dataIndex: 'totalQty',
//       key: 'totalQty',
//       width: 100,
//       render: (total: number, record: any) => {
//         const stockLevel = getStockLevel(
//           total,
//           record.minStockLevel || 10,
//           record.reorderPoint || 20
//         );
//         const color = STOCK_LEVEL_COLORS[stockLevel as keyof typeof STOCK_LEVEL_COLORS];
        
//         return (
//           <div style={{ textAlign: 'center' }}>
//             <div style={{ 
//               fontSize: '18px', 
//               fontWeight: 'bold',
//               color: stockLevel === 'CRITICAL' || stockLevel === 'OUT_OF_STOCK' ? '#ff4d4f' : '#52c41a'
//             }}>
//               {total}
//             </div>
//             <Tag color={color} style={{ margin: 0 }}>
//               {getStockLevelDescription(stockLevel)}
//             </Tag>
//           </div>
//         );
//       },
//       sorter: (a: any, b: any) => a.totalQty - b.totalQty,
//     });

//     // Add value column
//     baseColumns.push({
//       title: 'Total Value',
//       dataIndex: [],
//       key: 'value',
//       width: 120,
//       render: (_: any, record: any) => {
//         const value = calculateTotalValue(record);
//         return (
//           <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#1890ff' }}>
//             ${value.toFixed(2)}
//           </div>
//         );
//       },
//       sorter: (a: any, b: any) => 
//         calculateTotalValue(a) - calculateTotalValue(b),
//     });

//     // Add actions column for admin
//     if (isAdmin) {
//       baseColumns.push({
//         title: 'Actions',
//         dataIndex: [],
//         key: 'actions',
//         width: 180,
//         fixed: 'right' as const,
//         render: (_: any, record: any) => (
//           <Space size="small">
//             <Tooltip title="Adjust Stock">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<FileTextOutlined />}
//                 onClick={() => handleAdjustStock(record)}
//               />
//             </Tooltip>
//             <Tooltip title="Transfer Stock">
//               <Button
//                 size="small"
//                 icon={<SwapOutlined />}
//                 onClick={() => handleTransferStock(record)}
//               />
//             </Tooltip>
//           </Space>
//         ),
//       });
//     }

//     return baseColumns;
//   };

//   // Prepare data for summary view
//   const getSummaryColumns = () => {
//     return [
//       {
//         title: 'Warehouse',
//         dataIndex: 'warehouse',
//         key: 'warehouse',
//         width: 150,
//         render: (warehouse: string) => WAREHOUSE_LABELS[warehouse as keyof typeof WAREHOUSE_LABELS],
//       },
//       {
//         title: 'Total Products',
//         dataIndex: 'productCount',
//         key: 'productCount',
//         width: 120,
//         sorter: (a: any, b: any) => a.productCount - b.productCount,
//       },
//       {
//         title: 'Total Quantity',
//         dataIndex: 'totalQuantity',
//         key: 'totalQuantity',
//         width: 120,
//         sorter: (a: any, b: any) => a.totalQuantity - b.totalQuantity,
//       },
//       {
//         title: 'Total Value',
//         dataIndex: 'totalValue',
//         key: 'totalValue',
//         width: 120,
//         render: (value: number) => `$${value.toFixed(2)}`,
//         sorter: (a: any, b: any) => a.totalValue - b.totalValue,
//       },
//       {
//         title: 'Critical Items',
//         dataIndex: 'criticalItems',
//         key: 'criticalItems',
//         width: 120,
//         render: (count: number) => (
//           <Badge 
//             count={count} 
//             style={{ 
//               backgroundColor: count > 0 ? '#ff4d4f' : '#52c41a' 
//             }} 
//           />
//         ),
//       },
//       {
//         title: 'Out of Stock',
//         dataIndex: 'outOfStockItems',
//         key: 'outOfStockItems',
//         width: 120,
//         render: (count: number) => (
//           <Badge count={count} style={{ backgroundColor: '#8c8c8c' }} />
//         ),
//       },
//     ];
//   };

//   // Calculate summary statistics
//   const calculateSummary = () => {
//     const summary = {
//       totalProducts: filteredProducts.length,
//       totalValue: 0,
//       criticalStockItems: 0,
//       lowStockItems: 0,
//       outOfStockItems: 0,
//       totalQuantity: 0,
//     };

//     filteredProducts.forEach((product: any) => {
//       summary.totalValue += calculateTotalValue(product);
//       summary.totalQuantity += product.totalQty || 0;
      
//       const stockLevel = getStockLevel(
//         product.totalQty || 0,
//         product.minStockLevel || 10,
//         product.reorderPoint || 20
//       );
      
//       if (stockLevel === 'CRITICAL') summary.criticalStockItems++;
//       if (stockLevel === 'LOW') summary.lowStockItems++;
//       if (stockLevel === 'OUT_OF_STOCK') summary.outOfStockItems++;
//     });

//     return summary;
//   };

//   // Calculate warehouse-wise summary
//   const calculateWarehouseSummary = () => {
//     const warehouseSummary = WAREHOUSES.map(warehouse => {
//       let productCount = 0;
//       let totalQuantity = 0;
//       let totalValue = 0;
//       let criticalItems = 0;
//       let outOfStockItems = 0;

//       filteredProducts.forEach((product: any) => {
//         const qty = getWarehouseQuantity(product, warehouse);
//         if (qty > 0) {
//           productCount++;
//           totalQuantity += qty;
//           totalValue += calculateWarehouseValue(product, warehouse);
          
//           const stockLevel = getStockLevel(
//             qty,
//             product.minStockLevel || 10,
//             product.reorderPoint || 20
//           );
          
//           if (stockLevel === 'CRITICAL') criticalItems++;
//           if (stockLevel === 'OUT_OF_STOCK') outOfStockItems++;
//         }
//       });

//       return {
//         warehouse,
//         productCount,
//         totalQuantity,
//         totalValue,
//         criticalItems,
//         outOfStockItems,
//       };
//     });

//     return warehouseSummary;
//   };

//   const summary = calculateSummary();
//   const warehouseSummary = calculateWarehouseSummary();

//   if (!isAdmin) {
//     return (
//       <div style={{ 
//         padding: '40px', 
//         textAlign: 'center',
//         minHeight: '400px',
//         display: 'flex',
//         flexDirection: 'column',
//         justifyContent: 'center',
//         alignItems: 'center'
//       }}>
//         <WarningOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '20px' }} />
//         <Title level={3} style={{ color: '#ff4d4f' }}>Access Denied</Title>
//         <Text type="secondary">Warehouse stock management is available for administrators only.</Text>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
//       <Title level={2} style={{ marginBottom: '24px' }}>
//         <DashboardOutlined style={{ marginRight: '12px' }} />
//         Warehouse Stock Management
//       </Title>

//       {/* Alert for critical stock */}
//       {summary.criticalStockItems > 0 && (
//         <Alert
//           message={`${summary.criticalStockItems} products are below minimum stock level`}
//           type="warning"
//           showIcon
//           style={{ marginBottom: '24px' }}
//           action={
//             <Button 
//               size="small" 
//               type="link" 
//               onClick={() => {
//                 // Filter to show only critical items
//                 setSearchText('');
//                 setSelectedWarehouse('');
//                 // You could add logic to filter to critical items only
//               }}
//             >
//               View Critical Items
//             </Button>
//           }
//         />
//       )}

//       {/* Summary Cards */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
//         <Col xs={24} sm={12} lg={6}>
//           <Card hoverable>
//             <Statistic
//               title="Total Products"
//               value={summary.totalProducts}
//               prefix={<AppstoreOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card hoverable>
//             <Statistic
//               title="Total Quantity"
//               value={summary.totalQuantity}
//               prefix={<StockOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card hoverable>
//             <Statistic
//               title="Total Value"
//               value={summary.totalValue}
//               prefix="$"
//               precision={2}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Card>
//         </Col>
//         <Col xs={24} sm={12} lg={6}>
//           <Card hoverable>
//             <Statistic
//               title="Critical Stock"
//               value={summary.criticalStockItems}
//               prefix={<WarningOutlined />}
//               valueStyle={{ 
//                 color: summary.criticalStockItems > 0 ? '#ff4d4f' : '#52c41a' 
//               }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* View Mode Toggle */}
//       <Card style={{ marginBottom: '24px' }}>
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center',
//           marginBottom: '16px'
//         }}>
//           <div>
//             <Text strong style={{ marginRight: '16px' }}>View Mode:</Text>
//             <Button.Group>
//               <Button 
//                 type={viewMode === 'detailed' ? 'primary' : 'default'}
//                 onClick={() => setViewMode('detailed')}
//                 icon={<FileTextOutlined />}
//               >
//                 Detailed View
//               </Button>
//               <Button 
//                 type={viewMode === 'summary' ? 'primary' : 'default'}
//                 onClick={() => setViewMode('summary')}
//                 icon={<DashboardOutlined />}
//               >
//                 Summary View
//               </Button>
//             </Button.Group>
//           </div>
//           <Button
//             type="primary"
//             icon={<ExportOutlined />}
//             onClick={() => {
//               // Export functionality
//               message.info('Export feature coming soon');
//             }}
//           >
//             Export
//           </Button>
//         </div>

//         {/* Filters */}
//         <Row gutter={[16, 16]} align="middle">
//           <Col xs={24} md={8}>
//             <Input
//               placeholder="Search by product name or code..."
//               prefix={<SearchOutlined />}
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               onPressEnter={handleSearch}
//               allowClear
//             />
//           </Col>
//           <Col xs={24} md={8}>
//             <Select
//               placeholder="Filter by warehouse"
//               style={{ width: '100%' }}
//               value={selectedWarehouse}
//               onChange={setSelectedWarehouse}
//               allowClear
//             >
//               {WAREHOUSES.map(warehouse => (
//                 <Option key={warehouse} value={warehouse}>
//                   {WAREHOUSE_LABELS[warehouse as keyof typeof WAREHOUSE_LABELS]}
//                 </Option>
//               ))}
//             </Select>
//           </Col>
//           <Col xs={24} md={8}>
//             <Space>
//               <Button
//                 type="primary"
//                 onClick={handleSearch}
//                 icon={<SearchOutlined />}
//                 loading={warehouseStockLoading}
//               >
//                 Search
//               </Button>
//               <Button
//                 onClick={() => {
//                   setSearchText('');
//                   setSelectedWarehouse('');
//                   getWarehouseStock();
//                 }}
//                 icon={<SyncOutlined />}
//               >
//                 Reset
//               </Button>
//               <Button
//                 onClick={() => getWarehouseStock()}
//                 icon={<SyncOutlined />}
//                 loading={warehouseStockLoading}
//               >
//                 Refresh
//               </Button>
//             </Space>
//           </Col>
//         </Row>
//       </Card>

//       {/* Stock Table */}
//       <Card>
//         <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div>
//             <Text strong>
//               Showing {filteredProducts.length} products
//               {selectedWarehouse && ` in ${WAREHOUSE_LABELS[selectedWarehouse as keyof typeof WAREHOUSE_LABELS]}`}
//             </Text>
//           </div>
//           <Space>
//             <Tag color="blue">
//               Normal: Above reorder point
//             </Tag>
//             <Tag color="orange">
//               Low: Below reorder point
//             </Tag>
//             <Tag color="red">
//               Critical: Below minimum stock
//             </Tag>
//             <Tag color="gray">
//               Out of Stock
//             </Tag>
//           </Space>
//         </div>

//         <Spin spinning={warehouseStockLoading || productStockLoading}>
//           {viewMode === 'detailed' ? (
//             <Table
//               columns={getDetailedColumns()}
//               dataSource={filteredProducts}
//               rowKey="id"
//               scroll={{ x: 1500 }}
//               pagination={{
//                 pageSize: 20,
//                 showSizeChanger: true,
//                 showQuickJumper: true,
//                 showTotal: (total, range) => 
//                   `${range[0]}-${range[1]} of ${total} products`,
//                 pageSizeOptions: ['10', '20', '50', '100'],
//               }}
//               rowClassName={(record) => {
//                 const stockLevel = getStockLevel(
//                   record.totalQty || 0,
//                   record.minStockLevel || 10,
//                   record.reorderPoint || 20
//                 );
//                 return stockLevel === 'CRITICAL' ? 'critical-row' : '';
//               }}
//             />
//           ) : (
//             <Table
//               columns={getSummaryColumns()}
//               dataSource={warehouseSummary}
//               rowKey="warehouse"
//               pagination={false}
//               summary={() => (
//                 <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
//                   <Table.Summary.Cell index={0} colSpan={1}>
//                     <Text strong>Total</Text>
//                   </Table.Summary.Cell>
//                   <Table.Summary.Cell index={1}>
//                     <Text strong>{summary.totalProducts}</Text>
//                   </Table.Summary.Cell>
//                   <Table.Summary.Cell index={2}>
//                     <Text strong>{summary.totalQuantity}</Text>
//                   </Table.Summary.Cell>
//                   <Table.Summary.Cell index={3}>
//                     <Text strong>${summary.totalValue.toFixed(2)}</Text>
//                   </Table.Summary.Cell>
//                   <Table.Summary.Cell index={4}>
//                     <Badge 
//                       count={summary.criticalStockItems} 
//                       style={{ backgroundColor: '#ff4d4f' }} 
//                     />
//                   </Table.Summary.Cell>
//                   <Table.Summary.Cell index={5}>
//                     <Badge count={summary.outOfStockItems} style={{ backgroundColor: '#8c8c8c' }} />
//                   </Table.Summary.Cell>
//                 </Table.Summary.Row>
//               )}
//             />
//           )}
//         </Spin>
//       </Card>

//       {/* Add some CSS for critical rows */}
//       <style>{`
//         .critical-row {
//           background-color: #fff2f0;
//         }
//         .critical-row:hover {
//           background-color: #ffe7e4 !important;
//         }
//       `}</style>

//       {/* Modals */}
//       <StockAdjustmentModal
//         open={isAdjustmentModalVisible}
//         onCancel={() => {
//           setAdjustmentModalVisible(false);
//           setSelectedProduct(null);
//         }}
//         onSuccess={handleAdjustmentSuccess}
//         product={selectedProduct}
//       />

//       <TransferModal
//         open={isTransferModalVisible}
//         onCancel={() => {
//           setTransferModalVisible(false);
//           setSelectedProduct(null);
//         }}
//         onSuccess={handleTransferSuccess}
//         product={selectedProduct}
//         initialData={undefined}
//         currentUser={{ id: 1, name: 'Admin' }} // Replace with actual user data
//       />
//     </div>
//   );
// };

// export default WarehouseStock;
<h1>warehouse stock page</h1>