// components/warehouse/TransferModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Form,
  Select,
  InputNumber,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  message,
  Alert,
  Spin,
  Input,
  Badge,
  Tooltip,
  Progress
} from 'antd';
import {
  SwapOutlined,
  ShoppingCartOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useGetProductsQuery, useCreateTransferMutation } from '../../redux/features/warehouseApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Warehouse options
const WAREHOUSES = [
  { value: 'MERKATO', label: 'Merkato', color: 'blue' },
  { value: 'SHEGOLE_MULUNEH', label: 'Shegole Muluneh', color: 'green' },
  { value: 'EMBILTA', label: 'Embilta', color: 'orange' },
  { value: 'NEW_SHEGOLE', label: 'New Shegole', color: 'purple' },
  { value: 'BACKUP', label: 'Backup', color: 'cyan' },
  { value: 'DAMAGE', label: 'Damage', color: 'red' }
];

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  product?: any;
}

interface TransferResult {
  productId: number;
  productName: string;
  cartons: number;
  status: 'success' | 'error';
  message: string;
  timestamp: number;
}

const TransferModal: React.FC<TransferModalProps> = ({ open, onClose, product }) => {
  const [form] = Form.useForm();

  // RTK Query hooks
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
    error: productsError
  } = useGetProductsQuery({});

  const [createTransfer, { isLoading: transferring }] = useCreateTransferMutation();

  // Local state
  const [from_warehouse, setFromWarehouse] = useState<string>('');
  const [to_warehouse, setToWarehouse] = useState<string>('MERKATO');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [transferQuantities, setTransferQuantities] = useState<Record<number, number>>({});
  const [transferResults, setTransferResults] = useState<TransferResult[]>([]);
  const [isProcessingTransfer, setIsProcessingTransfer] = useState<number | null>(null);

  // Calculate available cartons for a product in a warehouse
  const calculateAvailableCartons = (product: any, warehouse: string): number => {
    const fieldMap: Record<string, string> = {
      'MERKATO': 'merkato_qty',
      'SHEGOLE_MULUNEH': 'shegole_muluneh_qty',
      'EMBILTA': 'embilta_qty',
      'NEW_SHEGOLE': 'new_shegole_qty',
      'BACKUP': 'backup_qty',
      'DAMAGE': 'damage_qty'
    };

    const field = fieldMap[warehouse];
    if (!field) {
      return 0;
    }

    const pieces = product[field] || 0;
    const piecesPerCarton = product.qty || 1;
    return Math.floor(pieces / piecesPerCarton);
  };

  // Get total pieces in a warehouse
  const getWarehousePieces = (product: any, warehouse: string): number => {
    const fieldMap: Record<string, string> = {
      'MERKATO': 'merkato_qty',
      'SHEGOLE_MULUNEH': 'shegole_muluneh_qty',
      'EMBILTA': 'embilta_qty',
      'NEW_SHEGOLE': 'new_shegole_qty',
      'BACKUP': 'backup_qty',
      'DAMAGE': 'damage_qty'
    };
    const field = fieldMap[warehouse];
    return field ? (product[field] || 0) : 0;
  };

  // Format warehouse name
  const formatWarehouse = (warehouse: string) => {
    const found = WAREHOUSES.find(w => w.value === warehouse);
    return found ? found.label : warehouse;
  };

  // Extract products from API response
  const products = React.useMemo(() => {
    if (!productsData) {
      console.log('No productsData received');
      return [];
    }

    // Your API returns: { statusCode, success, message, data: array }
    if (productsData.data && Array.isArray(productsData.data)) {
      return productsData.data;
    }

    // Fallback patterns
    if (Array.isArray(productsData)) {
      return productsData;
    }

    console.error('Unexpected products response structure:', productsData);
    return [];
  }, [productsData]);

  // Initialize with passed product if provided
  useEffect(() => {
    if (product && open) {
      console.log('Initializing with product:', product);
      setFromWarehouse(product.warehouse || '');
    } else if (open) {
      // Reset when modal opens without product
      setFromWarehouse('');
      setToWarehouse('MERKATO');
      // setNotes('');
      setSearchTerm('');
      setTransferQuantities({});
      setTransferResults([]);
    }
  }, [product, open]);

  // Update available products when from_warehouse changes
  const availableProducts = React.useMemo(() => {
    if (!from_warehouse || products.length === 0) {
      return [];
    }

    return products.filter(product => {
      const cartons = calculateAvailableCartons(product, from_warehouse);
      return cartons > 0;
    });
  }, [from_warehouse, products]);

  // Filter products based on search term
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return availableProducts;
    }

    const searchLower = searchTerm.toLowerCase();
    return availableProducts.filter(product => 
      product.name?.toLowerCase().includes(searchLower) ||
      product.code?.toLowerCase().includes(searchLower)
    );
  }, [availableProducts, searchTerm]);

  // Handle quantity input change
  const handleQuantityChange = (productId: number, value: number | null) => {
    if (value !== null && value > 0) {
      setTransferQuantities(prev => ({
        ...prev,
        [productId]: value
      }));
    } else {
      const newQuantities = { ...transferQuantities };
      delete newQuantities[productId];
      setTransferQuantities(newQuantities);
    }
  };

  // Transfer single product
  const handleTransferProduct = async (product: any) => {
    if (!from_warehouse || !to_warehouse) {
      message.error('Please select source and destination warehouses');
      return;
    }

    if (from_warehouse === to_warehouse) {
      message.error('Source and destination warehouses cannot be the same');
      return;
    }

    const cartons = transferQuantities[product.id];
    if (!cartons || cartons <= 0) {
      message.warning('Please enter a valid number of cartons');
      return;
    }

    const availableCartons = calculateAvailableCartons(product, from_warehouse);
    if (cartons > availableCartons) {
      message.warning(`Only ${availableCartons} cartons available in ${formatWarehouse(from_warehouse)}`);
      return;
    }

    setIsProcessingTransfer(product.id);

    try {
      const createdBy = 1; // TODO: Replace with actual user ID from auth
      const piecesPerCarton = product.qty || 1;
      const totalPieces = piecesPerCarton * cartons;

      const transferData = {
        product_id: Number(product.id),
        from_warehouse: from_warehouse,
        to_warehouse: to_warehouse,
        cartons: Number(cartons),
        reason: notes || `Transfer from ${formatWarehouse(from_warehouse)} to ${formatWarehouse(to_warehouse)}`,
        notes: '',
        createdBy: createdBy
      };

      console.log('Creating transfer with data:', transferData);

      const result = await createTransfer(transferData).unwrap();
      
      // Add successful result
      const newResult: TransferResult = {
        productId: product.id,
        productName: product.name,
        cartons: cartons,
        status: 'success',
        message: `Successfully transferred ${cartons} cartons (${totalPieces} pieces)`,
        timestamp: Date.now()
      };

      setTransferResults(prev => [newResult, ...prev.slice(0, 9)]);
      
      // Clear the quantity input
      const newQuantities = { ...transferQuantities };
      delete newQuantities[product.id];
      setTransferQuantities(newQuantities);

      // Refresh products data
      refetchProducts();

      message.success(`${product.name} transfer created successfully`);

    } catch (error: any) {
      console.error(`Failed to transfer ${product.name}:`, error);
      
      // Add error result
      const newResult: TransferResult = {
        productId: product.id,
        productName: product.name,
        cartons: cartons,
        status: 'error',
        message: error.data?.message || error.message || 'Transfer failed',
        timestamp: Date.now()
      };

      setTransferResults(prev => [newResult, ...prev.slice(0, 9)]);
      
      message.error(`${product.name}: ${error.data?.message || 'Transfer failed'}`);
    } finally {
      setIsProcessingTransfer(null);
    }
  };

  // Reset form
  const handleReset = () => {
    setFromWarehouse('');
    setToWarehouse('MERKATO');
    // setNotes('');
    setSearchTerm('');
    setTransferQuantities({});
    setTransferResults([]);
    form.resetFields();
  };

  // Columns for available products table
  const availableProductsColumns = [
    {
      title: 'Product Details',
      key: 'product',
      width: '35%',
      render: (record: any) => {
        const availableCartons = calculateAvailableCartons(record, from_warehouse);
        const isProcessing = isProcessingTransfer === record.id;
        
        return (
          <div>
            <div style={{ fontWeight: '500' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Code: {record.code} • Unit: {record.unit}
            </div>
            <div style={{ fontSize: '11px', color: '#888' }}>
              Price: ${record.price?.toFixed(2) || '0.00'} • {record.qty || 1} pcs/carton
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Available: <Text strong>{availableCartons} cartons</Text>
            </div>
            {isProcessing && (
              <div style={{ marginTop: '4px' }}>
                <Progress percent={100} status="active" size="small" showInfo={false} />
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Warehouse Transfer',
      key: 'warehouse',
      width: '25%',
      render: (record: any) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag color="blue" style={{ margin: 0 }}>
              {formatWarehouse(from_warehouse)}
            </Tag>
            <ArrowRightOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
            <Tag color="green" style={{ margin: 0 }}>
              {formatWarehouse(to_warehouse)}
            </Tag>
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Total pieces: {getWarehousePieces(record, from_warehouse)}
          </div>
        </Space>
      )
    },
    {
      title: 'Transfer Action',
      key: 'transfer',
      width: '40%',
      render: (record: any) => {
        const availableCartons = calculateAvailableCartons(record, from_warehouse);
        const inputValue = transferQuantities[record.id] || 0;
        const isProcessing = isProcessingTransfer === record.id;
        const isDisabled = !inputValue || inputValue <= 0 || inputValue > availableCartons || isProcessing;
        
        return (
          <Space size="small" style={{ width: '100%' }}>
            <InputNumber
              min={1}
              max={availableCartons}
              value={inputValue}
              placeholder="Cartons"
              onChange={(value) => handleQuantityChange(record.id, value)}
              disabled={isProcessing}
              style={{ width: '120px' }}
              size="small"
            />
            <Button
              type="primary"
              size="small"
              onClick={() => handleTransferProduct(record)}
              disabled={isDisabled}
              loading={isProcessing}
              icon={<SwapOutlined />}
              style={{ minWidth: '100px' }}
            >
              {isProcessing ? 'Transferring...' : 'Transfer'}
            </Button>
            <Tooltip title="Maximum available cartons">
              <Button
                size="small"
                onClick={() => handleQuantityChange(record.id, availableCartons)}
                disabled={availableCartons <= 0 || isProcessing}
              >
                Max
              </Button>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  // Handle API error
  if (productsError) {
    console.error('Products API error:', productsError);
    return (
      <Modal
        title="Transfer Products"
        open={open}
        onCancel={onClose}
        width={800}
        footer={null}
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Alert
            type="error"
            message="Failed to Load Products"
            description="Please check your connection and try again."
            action={
              <Button type="primary" onClick={() => refetchProducts()}>
                Retry
              </Button>
            }
          />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <Space>
          <SwapOutlined style={{ color: '#722ed1' }} />
          <span>Transfer Products Between Warehouses</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      footer={null}
      closable
      maskClosable={false}
      style={{ top: 20 }}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
        {/* Transfer Form */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Source Warehouse" required>
                <Select
                  placeholder="Select source warehouse"
                  value={from_warehouse}
                  onChange={(value) => {
                    setFromWarehouse(value);
                    setSearchTerm('');
                    setTransferQuantities({});
                  }}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {WAREHOUSES.map(wh => (
                    <Option key={wh.value} value={wh.value}>
                      <Tag color={wh.color}>{wh.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item label="Destination Warehouse" required>
                <Select
                  placeholder="Select destination warehouse"
                  value={to_warehouse}
                  onChange={setToWarehouse}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {WAREHOUSES.map(wh => (
                    <Option key={wh.value} value={wh.value}>
                      <Tag color={wh.color}>{wh.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
{/* 
            <Col xs={24}>
              <Form.Item label="Notes (Optional)">
                <TextArea
                  placeholder="Add any notes about this transfer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </Form.Item>
            </Col> */}
          </Row>

          {from_warehouse && to_warehouse && from_warehouse === to_warehouse && (
            <Alert
              message="Warning"
              description="Source and destination warehouses are the same. Please select different warehouses."
              type="warning"
              showIcon
              style={{ marginBottom: '8px' }}
            />
          )}
        </Card>

        {/* Recent Transfers History */}
        {transferResults.length > 0 && (
          <Card size="small" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Space>
                <SwapOutlined />
                <Text strong>Recent Transfers</Text>
              </Space>
              <Button
                size="small"
                onClick={() => setTransferResults([])}
                icon={<DeleteOutlined />}
              >
                Clear History
              </Button>
            </div>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {transferResults.map((result, index) => (
                <Alert
                  key={index}
                  type={result.status === 'success' ? 'success' : 'error'}
                  message={
                    <Space>
                      {result.status === 'success' ? (
                        <CheckCircleOutlined />
                      ) : (
                        <CloseCircleOutlined />
                      )}
                      <span>{result.productName}</span>
                      <Tag color={result.status === 'success' ? 'green' : 'red'} style={{fontSize:'12px'}}>
                        {result.cartons} cartons
                      </Tag>
                    </Space>
                  }
                  description={result.message}
                  showIcon={false}
                  style={{ marginBottom: '8px', padding: '8px 12px' }}
                  closable
                  onClose={() => {
                    setTransferResults(prev => prev.filter((_, i) => i !== index));
                  }}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Product Selection */}
        {from_warehouse && (
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Space>
                <ShoppingCartOutlined />
                <Text strong>Available Products in {formatWarehouse(from_warehouse)}</Text>
                <Tag color="blue">{filteredProducts.length} products with stock</Tag>
              </Space>
              <Space>
                <Input
                  placeholder="Search products by name or code..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250 }}
                  size="small"
                  allowClear
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    refetchProducts();
                    setTransferQuantities({});
                  }}
                  loading={productsLoading}
                  size="small"
                >
                  Refresh
                </Button>
              </Space>
            </div>

            {productsLoading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin tip="Loading products..." />
              </div>
            ) : filteredProducts.length === 0 ? (
              <Alert
                message="No products found"
                description={
                  searchTerm ? 
                    `No products matching "${searchTerm}" found in ${formatWarehouse(from_warehouse)}` :
                    `No products available in ${formatWarehouse(from_warehouse)}`
                }
                type="info"
                showIcon
                action={
                  <Button size="small" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                }
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table
                  columns={availableProductsColumns}
                  dataSource={filteredProducts}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} products`
                  }}
                  size="small"
                  scroll={{ x: 900 }}
                />
              </div>
            )}
          </Card>
        )}

        {/* Empty State */}
        {!from_warehouse && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <InfoCircleOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={4}>Select Source Warehouse</Title>
            <Text type="secondary">
              Please select a source warehouse to see available products for transfer
            </Text>
          </div>
        )}

        {/* Transfer Instructions */}
        {from_warehouse && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>How to transfer:</Text>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#666' }}>
                <li>Select source and destination warehouses</li>
                <li>Enter the number of cartons to transfer in the input box</li>
                <li>Click the "Transfer" button next to the product</li>
                <li>The transfer will be processed immediately</li>
              </ol>
            </Space>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Space>
            <Button onClick={handleReset} size="middle">
              Reset All
            </Button>
            <Button onClick={onClose} size="middle">
              Close
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default TransferModal;