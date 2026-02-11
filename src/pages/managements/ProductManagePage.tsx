import { DeleteFilled, EditFilled, SearchOutlined, FilterOutlined, SwapOutlined, PlusOutlined, ExportOutlined, HistoryOutlined } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import {
  Button,
  Flex,
  Modal,
  Pagination,
  Table,
  Tag,
  Input,
  Select,
  Card,
  Row,
  Col,
  Space,
  Alert,
  Tooltip,
  Drawer,
  Badge,
  Typography,
  Popover,
  message
} from 'antd';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  useDeleteProductMutation,
  useGetAllProductsQuery,
} from '../../redux/features/management/productApi';
import { IProduct } from '../../types/product.types';
import toastMessage from '../../lib/toastMessage';
import { useAppDispatch } from '../../redux/hooks';
import { toggleCreateVariantModel, toggleUpdateModel } from '../../redux/services/modal.Slice';
import TransferModal from '../../components/warehouse/TransferModal';
import { useNavigate } from 'react-router-dom';
import AddStockModal from '../../components/modal/AddStock';
import EditModal from '../../components/modal/EditModal';
import { TransferHistory } from '../../components/warehouse';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const ProductManagePage = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Client-side filters
  const [filters, setFilters] = useState({
    search: '',
    warehouse: '',
    code: '',
    name: '',
  });

  // State for transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedProductForTransfer, setSelectedProductForTransfer] = useState<any>(null);
  const [transferHistoryModalOpen, setTransferHistoryModalOpen] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<any>(null);

 const handleEditClick = (product: IProduct) => {
  // Dispatch to Redux to open the modal with the selected product
  dispatch(toggleUpdateModel({ open: true, data: product }));
};

  // Fetch all products once
  const { data: productsData, isFetching, refetch } = useGetAllProductsQuery({
    page: 1,
    limit: 1000,
  });

  const dispatch = useAppDispatch();

  // Extract all products
  const allProducts = useMemo(() => productsData?.data || [], [productsData]);

  // Apply all client-side filters
  const filteredProducts = useMemo(() => {
    if (!allProducts.length) return [];

    let result = [...allProducts];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchLower)) ||
        (product.code && product.code.toLowerCase().includes(searchLower)) ||
        (product.warehouse && product.warehouse.toLowerCase().includes(searchLower))
      );
    }

    if (filters.warehouse) {
      result = result.filter(product =>
        product.warehouse && product.warehouse.toLowerCase() === filters.warehouse.toLowerCase()
      );
    }

    if (filters.code) {
      result = result.filter(product =>
        product.code && product.code.toLowerCase() === filters.code.toLowerCase()
      );
    }

    if (filters.name) {
      result = result.filter(product =>
        product.name && product.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    return result;
  }, [allProducts, filters]);

  // Calculate paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, current, pageSize]);

  const totalFilteredCount = filteredProducts.length;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrent(1);
  }, [filters]);

  const onChange: PaginationProps['onChange'] = (page, newPageSize) => {
    setCurrent(page);
    if (newPageSize) {
      setPageSize(newPageSize);
      setCurrent(1);
    }
    
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setShowFilters(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      warehouse: '',
      code: '',
      name: '',
    });
  };

  // Handle transfer button click from top button
  const handleStockTransferClick = () => {
    setSelectedProductForTransfer(null);
    setTransferModalOpen(true);
  };

  // Handle transfer button click from product row
  const handleProductTransferClick = (product: any) => {
    setSelectedProductForTransfer(product);
    setTransferModalOpen(true);
  };

  // Navigate to transfer history page
  const handleViewTransferHistory = () => {
    setSelectedProductForHistory(null);
    setTransferHistoryModalOpen(true);
  };

  const handleAddStockClick = (product: IProduct) => {
    dispatch(toggleCreateVariantModel({ open: true, data: product }));
  };

  // Extract unique values for filter dropdowns
  const warehouses = useMemo(() => {
    const uniqueWarehouses = [...new Set(allProducts
      .map((p: IProduct) => p.warehouse)
      .filter(Boolean))];
    return uniqueWarehouses.map(w => String(w)).sort();
  }, [allProducts]);

  const productCodes = useMemo(() => {
    const uniqueCodes = [...new Set(allProducts
      .map((p: IProduct) => p.code)
      .filter(Boolean))];
    return uniqueCodes.map(c => String(c)).sort();
  }, [allProducts]);

  const productNames = useMemo(() => {
    const uniqueNames = [...new Set(allProducts
      .map((p: IProduct) => p.name)
      .filter(Boolean))];
    return uniqueNames.map(n => String(n)).sort();
  }, [allProducts]);

  // Helper function to calculate total stock (qty × ctn if available)
  const calculateTotalStock = (product: IProduct): number => {
    const ctn = (product as any).ctn || 1;
    return (product.qty || 0) * ctn;
  };

  // Export filtered products to Excel
  const handleExportToExcel = () => {
    if (filteredProducts.length === 0) {
      message.warning('No data to export');
      return;
    }

    try {
      const exportData = filteredProducts.map((product: IProduct) => {
        const totalStock = calculateTotalStock(product);
        return {
          'Product Code': product.code || 'N/A',
          'Product Name': product.name || 'N/A',
          'Warehouse': product.warehouse || 'N/A',
          'Unit Price': product.price || 0,
          'Quantity per Carton': product.qty || 0,
          'Number of Cartons': (product as any).ctn || 1,
          'Total Units': totalStock,
          'Total Value': (product.price * totalStock).toFixed(2),
          'Unit': product.unit || 'N/A',
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      const wscols = [
        { wch: 15 },
        { wch: 30 },
        { wch: 20 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 10 },
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm');
      const filename = `products_export_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      
      message.success(`Exported ${exportData.length} products to Excel`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export to Excel');
    }
  };

  // Export dropdown content
  const exportDropdownContent = (
    <div style={{ padding: '8px' }}>
      <Space direction="vertical">
        <Button 
          type="text" 
          icon={<ExportOutlined />}
          onClick={handleExportToExcel}
          block
          style={{ textAlign: 'left' }}
        >
          Export Filtered Products ({filteredProducts.length})
        </Button>
        <div style={{ fontSize: '12px', color: '#666', padding: '4px 0' }}>
          Exports only the currently filtered products
        </div>
        <Button 
          type="text" 
          icon={<ExportOutlined />}
          onClick={() => {
            const originalFilters = { ...filters };
            setFilters({ search: '', warehouse: '', code: '', name: '' });
            setTimeout(() => {
              handleExportToExcel();
              setFilters(originalFilters);
            }, 100);
          }}
          block
          style={{ textAlign: 'left' }}
        >
          Export All Products ({allProducts.length})
        </Button>
      </Space>
    </div>
  );

  // Check if mobile
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  // Mobile responsive table columns
  const getTableColumns = (): TableColumnsType<any> => {
    if (isMobile) {
      return [
        {
          title: 'Product',
          key: 'product',
          render: (record: any) => {
            const totalStock = record.totalStock;
            return (
              <div style={{ padding: '8px 0' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {record.code} - {record.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Price: ${record.price.toFixed(2)} • Stock: {totalStock} units
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Warehouse: <Tag
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      lineHeight: '18px'
                    }}
                    color="blue"
                  >
                    {record.warehouse || 'N/A'}
                  </Tag>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Space wrap>
                    <Button
                      onClick={() => handleAddStockClick(record)}
                      type='primary'
                      size="small"
                      style={{ backgroundColor: '#1890ff' }}
                      icon={<PlusOutlined />}
                    >
                      Add Stock
                    </Button>
                    <Button
                      onClick={() => handleEditClick(record)}
                      type='primary'
                      size="small"
                      style={{ backgroundColor: 'green' }}
                      icon={<EditFilled />}
                    >
                      Edit
                    </Button>
                    <DeleteProductModal id={record.key} />
                  </Space>
                </div>
              </div>
            );
          },
        }
      ];
    }

    // Desktop view - full columns
    return [
      {
        title: 'Product Code',
        key: 'code',
        dataIndex: 'code',
        align: 'center',
        width: 120,
        sorter: (a, b) => (a.code || '').localeCompare(b.code || ''),
      },
      {
        title: 'Product Name',
        key: 'name',
        dataIndex: 'name',
        ellipsis: true,
        width: 200,
        sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      },
      {
        title: 'Unit Price',
        key: 'price',
        dataIndex: 'price',
        align: 'center',
        width: 100,
        render: (price: number) => `$${price.toFixed(2)}`,
        sorter: (a, b) => a.price - b.price,
      },
      {
        title: 'Stock',
        key: 'stock',
        align: 'center',
        width: 140,
        render: (record: any) => {
          const totalStock = record.totalStock;
          const qty = record.qty;
          const ctn = record.ctn;

          return (
            <Tooltip
              title={
                <div>
                  <div><strong>Stock Breakdown:</strong></div>
                  <div>• Qty per carton: {qty}</div>
                  <div>• Number of cartons: {ctn}</div>
                  <div>• Total units: {totalStock} (qty × ctn)</div>
                </div>
              }
            >
              <div>
                <Tag color={totalStock > 10 ? 'success' : totalStock > 0 ? 'warning' : 'error'}>
                  {totalStock} units
                </Tag>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                  {qty} × {ctn}
                </div>
              </div>
            </Tooltip>
          );
        },
        sorter: (a, b) => a.totalStock - b.totalStock,
      },
      {
        title: 'TOTAL Value',
        key: 'totalPrice',
        dataIndex: 'totalPrice',
        align: 'center',
        width: 120,
        render: (totalPrice: string) => `$${parseFloat(totalPrice).toFixed(2)}`,
        sorter: (a, b) => parseFloat(a.totalPrice) - parseFloat(b.totalPrice),
      },
      {
        title: 'Warehouse',
        key: 'warehouse',
        dataIndex: 'warehouse',
        align: 'center',
        width: 120,
        render: (warehouse: string) => (
          <Tag color="blue">{warehouse || 'N/A'}</Tag>
        ),
        sorter: (a, b) => (a.warehouse || '').localeCompare(b.warehouse || ''),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center',
        width: 250,
        fixed: 'right',
        render: (item) => {
          return (
            <Space size="small">
              <Tooltip title="Add Stock">
                <Button
                  onClick={() => handleAddStockClick(item)}
                  type='primary'
                  size="small"
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<PlusOutlined />}
                >
                  Add Stock
                </Button>
              </Tooltip>

              <Tooltip title="Edit Product">
                <Button
                  onClick={() => handleEditClick(item)}
                  type='primary'
                  size="small"
                  style={{ backgroundColor: 'green' }}
                  icon={<EditFilled />}
                >
                  Edit
                </Button>
              </Tooltip>
              <DeleteProductModal id={item.key} />
            </Space>
          );
        },
      },
    ];
  };

  const tableData = paginatedProducts.map((product: IProduct) => {
    const totalStock = calculateTotalStock(product);

    return {
      key: product.id,
      id: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      qty: product.qty,
      ctn: (product as any).ctn || 1,
      totalStock: totalStock,
      warehouse: product.warehouse,
      totalPrice: (product.price * totalStock).toFixed(2),
    };
  });

  const hasActiveFilters = filters.search || filters.warehouse || filters.code || filters.name;

  // Filter count badge
  const activeFilterCount = [
    filters.search,
    filters.warehouse,
    filters.code,
    filters.name
  ].filter(Boolean).length;

  // Filter drawer for mobile
  const filterDrawer = (
    <Drawer
      title={
        <Flex align="center" gap={8}>
          <FilterOutlined style={{ color: '#1890ff' }} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge count={activeFilterCount} color='blue' />
          )}
        </Flex>
      }
      placement="right"
      onClose={() => setShowFilters(false)}
      open={showFilters}
      width={300}
      extra={
        hasActiveFilters && (
          <Button
            type="link"
            onClick={handleClearFilters}
            size="small"
          >
            Clear All
          </Button>
        )
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Search</Text>
          <Input.Search
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            allowClear
            onClear={() => handleFilterChange('search', '')}
            enterButton={<SearchOutlined />}
            size="middle"
          />
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Warehouse</Text>
          <Select
            placeholder="Select warehouse"
            style={{ width: '100%' }}
            value={filters.warehouse || undefined}
            onChange={(value) => handleFilterChange('warehouse', value)}
            allowClear
            size="middle"
          >
            {warehouses.map((warehouse: string) => (
              <Option key={warehouse} value={warehouse}>
                {warehouse}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Product Code</Text>
          <Select
            placeholder="Select code"
            style={{ width: '100%' }}
            value={filters.code || undefined}
            onChange={(value) => handleFilterChange('code', value)}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (String(option?.children) ?? '').toLowerCase().includes(input.toLowerCase())
            }
            size="middle"
          >
            {productCodes.map((code: string) => (
              <Option key={code} value={code}>
                {code}
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Product Name</Text>
          <Select
            placeholder="Select name"
            style={{ width: '100%' }}
            value={filters.name || undefined}
            onChange={(value) => handleFilterChange('name', value)}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (String(option?.children) ?? '').toLowerCase().includes(input.toLowerCase())
            }
            size="middle"
          >
            {productNames.map((name: string) => (
              <Option key={name} value={name}>
                {name}
              </Option>
            ))}
          </Select>
        </div>
      </Space>
    </Drawer>
  );

  return (
    <div ref={tableRef}>
      {/* Mobile Header with Filter Button */}
      {isMobile && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Flex justify="space-between" align="center">
            <div>
              <Text strong>Products</Text>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {filteredProducts.length} of {allProducts.length} products
              </div>
            </div>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(true)}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </Flex>
        </Card>
      )}

      {/* Desktop Search and Filter Bar */}
      {!isMobile && (
        <Card
          size="small"
          style={{ marginBottom: 20 }}
          title={
            <Flex align="center" gap={8}>
              <FilterOutlined style={{ color: '#1890ff' }} />
              <span>Filters & Search</span>
            </Flex>
          }
          extra={
            <Space>
              <Button
                onClick={handleStockTransferClick}
                type="primary"
                size="small"
                icon={<SwapOutlined />}
                style={{ backgroundColor: '#722ed1' }}
              >
                Stock Transfer
              </Button>
              <Popover 
                content={exportDropdownContent} 
                title="Export Options" 
                trigger="click"
                placement="bottomRight"
              >
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  size="small"
                >
                  Export
                </Button>
              </Popover>
              {hasActiveFilters && (
                <Button
                  type="link"
                  onClick={handleClearFilters}
                  size="small"
                >
                  Clear All
                </Button>
              )}
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Input.Search
                placeholder="Search by name, code, or warehouse..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                allowClear
                onClear={() => handleFilterChange('search', '')}
                enterButton={<SearchOutlined />}
                size="middle"
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Warehouse"
                style={{ width: '100%' }}
                value={filters.warehouse || undefined}
                onChange={(value) => handleFilterChange('warehouse', value)}
                allowClear
                size="middle"
              >
                {warehouses.map((warehouse: string) => (
                  <Option key={warehouse} value={warehouse}>
                    {warehouse}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Product Code"
                style={{ width: '100%' }}
                value={filters.code || undefined}
                onChange={(value) => handleFilterChange('code', value)}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (String(option?.children) ?? '').toLowerCase().includes(input.toLowerCase())
                }
                size="middle"
              >
                {productCodes.map((code: string) => (
                  <Option key={code} value={code}>
                    {code}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Product Name"
                style={{ width: '100%' }}
                value={filters.name || undefined}
                onChange={(value) => handleFilterChange('name', value)}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (String(option?.children) ?? '').toLowerCase().includes(input.toLowerCase())
                }
                size="middle"
              >
                {productNames.map((name: string) => (
                  <Option key={name} value={name}>
                    {name}
                  </Option>
                ))}
              </Select>
            </Col>

            {hasActiveFilters && (
              <Col xs={24}>
                <Alert
                  message="All filters are applied client-side"
                  description={`Showing ${filteredProducts.length} of ${allProducts.length} products`}
                  type="info"
                  showIcon
                  closable
                />
              </Col>
            )}

            <Col xs={24}>
              <Flex gap={8} wrap>
                {filters.warehouse && (
                  <Tag
                    closable
                    onClose={() => handleFilterChange('warehouse', '')}
                    color="blue"
                  >
                    Warehouse: {filters.warehouse}
                  </Tag>
                )}
                {filters.search && (
                  <Tag
                    closable
                    onClose={() => handleFilterChange('search', '')}
                    color="green"
                  >
                    Search: {filters.search}
                  </Tag>
                )}
                {filters.code && (
                  <Tag
                    closable
                    onClose={() => handleFilterChange('code', '')}
                    color="orange"
                  >
                    Code: {filters.code}
                  </Tag>
                )}
                {filters.name && (
                  <Tag
                    closable
                    onClose={() => handleFilterChange('name', '')}
                    color="purple"
                  >
                    Name: {filters.name}
                  </Tag>
                )}
              </Flex>
            </Col>
          </Row>
        </Card>
      )}

      {/* Summary Cards - Responsive */}
      {allProducts.length > 0 && (
        <Card size="small" style={{ marginBottom: 20 }}>
          <Row gutter={[8, 8]}>
            <Col xs={12} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Total Products
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#1890ff' }}>
                  {allProducts.length}
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Filtered Products
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '20px', color: hasActiveFilters ? '#52c41a' : '#666' }}>
                  {filteredProducts.length}
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Total Units
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#722ed1' }}>
                  {filteredProducts.reduce((sum: number, p: IProduct) => {
                    const ctn = (p as any).ctn || 1;
                    return sum + ((p.qty || 0) * ctn);
                  }, 0).toLocaleString()}
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Total Value
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#fa8c16' }}>
                  ${filteredProducts
                    .reduce((sum: number, p: IProduct) => {
                      const ctn = (p as any).ctn || 1;
                      const totalUnits = (p.qty || 0) * ctn;
                      return sum + (p.price * totalUnits);
                    }, 0)
                    .toFixed(2)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {/* Mobile Actions */}
      {isMobile && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Button
              type="primary"
              style={{ width: '100%', backgroundColor: '#722ed1' }}
              icon={<SwapOutlined />}
              onClick={handleStockTransferClick}
            >
              Stock Transfer
            </Button>
            <Button
              type="primary"
              style={{ width: '100%', backgroundColor: '#52c41a' }}
              icon={<ExportOutlined />}
              onClick={handleExportToExcel}
            >
              Export to Excel
            </Button>
          </Space>
        </Card>
      )}

      {/* Desktop Warehouse Transfer Info Alert */}
      {!isMobile && (
        <Alert
          message="Warehouse Transfer Feature"
          description="Click the 'Stock Transfer' button to open transfer modal and move stock between warehouses."
          type="info"
          showIcon
          icon={<SwapOutlined />}
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* Products Table */}
      <Card size="small">
        <Table
          size={isMobile ? 'middle' : 'small'}
          loading={isFetching}
          columns={getTableColumns()}
          dataSource={tableData}
          pagination={false}
          scroll={!isMobile ? { x: 'max-content' } : undefined}
          locale={{
            emptyText: hasActiveFilters
              ? 'No products found matching your filters'
              : 'No products available'
          }}
          rowClassName={isMobile ? "mobile-table-row" : ""}
        />

        {filteredProducts.length > 0 && (
          <Flex justify='space-between' align='center' style={{ marginTop: '1rem' }} wrap={isMobile ? 'wrap' : 'nowrap'}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: isMobile ? '12px' : 0 }}>
              Page {current} of {Math.ceil(totalFilteredCount / pageSize)} • 
              Showing {(current - 1) * pageSize + 1} to{' '}
              {Math.min(current * pageSize, totalFilteredCount)} of{' '}
              {totalFilteredCount} products
              {hasActiveFilters && ' (filtered)'}
            </div>
            <Pagination
              current={current}
              onChange={onChange}
              pageSize={pageSize}
              total={totalFilteredCount}
              showSizeChanger={!isMobile}
              pageSizeOptions={['10', '20', '50', '100']}
              showQuickJumper={!isMobile}
              showTotal={(total, range) => !isMobile ? `${range[0]}-${range[1]} of ${total} items` : undefined}
              simple={isMobile}
              size={isMobile ? "small" : "default"}
            />
          </Flex>
        )}
      </Card>

      {/* Mobile Quick Actions Guide */}
      {isMobile && filteredProducts.length > 0 && (
        <Card size="small" style={{ marginTop: '16px' }}>
          <Text strong style={{ display: 'block', marginBottom: '12px', fontSize: '14px' }}>
            Quick Actions:
          </Text>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="small"
                type="primary"
                style={{ backgroundColor: '#1890ff', minWidth: '80px', marginRight: '12px' }}
                disabled
              >
                Add Stock
              </Button>
              <span style={{ fontSize: '13px' }}>Increase inventory quantity</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                size="small"
                type="primary"
                style={{ backgroundColor: '#722ed1', minWidth: '80px', marginRight: '12px' }}
                disabled
                icon={<SwapOutlined />}
              >
                Transfer
              </Button>
              <span style={{ fontSize: '13px' }}>Move stock between warehouses</span>
            </div>
          </Space>
        </Card>
      )}

      {/* Add CSS for mobile rows */}
      <style>{`
        .mobile-table-row {
          border-bottom: 1px solid #f0f0f0;
        }
        .mobile-table-row:last-child {
          border-bottom: none;
        }
        @media (max-width: 768px) {
          .ant-table-thead {
            display: none;
          }
          .ant-table-tbody > tr > td {
            border-bottom: none;
            padding: 12px 8px;
          }
        }
      `}</style>

      {/* Render the external modals */}
      <AddStockModal />
      <EditModal />
      <TransferModal
        open={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setSelectedProductForTransfer(null);
        }}
        product={selectedProductForTransfer}
      />
      {filterDrawer}
    </div>
  );
}

/**
 * Delete Product Modal (kept inline since it's simple)
 */
const DeleteProductModal = ({ id }: { id: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteProduct] = useDeleteProductMutation();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteProduct(id).unwrap();
      if (res.statusCode === 200) {
        toastMessage({ icon: 'success', text: res.message });
        handleCancel();
        // Refresh page after deletion
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error: any) {
      handleCancel();
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  return (
    <>
      <Button
        onClick={showModal}
        type='primary'
        size="small"
        style={{ backgroundColor: 'red' }}
      >
        <DeleteFilled />
      </Button>
      <Modal
        title='Delete Product'
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Are you sure you want to delete this product?</h2>
          <h4>You won't be able to revert this action.</h4>
          <div
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}
          >
            <Button
              onClick={handleCancel}
              type='primary'
              style={{ backgroundColor: 'lightseagreen' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(id)}
              type='primary'
              style={{ backgroundColor: 'red' }}
            >
              Yes! Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProductManagePage;