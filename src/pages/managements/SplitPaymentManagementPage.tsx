// SplitPaymentManagement.tsx - UPDATED VERSION
import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Button,
  Input,
  DatePicker,
  Select,
  Space,
  Modal,
  Form,
  Alert,
  Badge,
  Progress,
  Divider,
  Descriptions,
  Collapse,
  Empty,
  message,
  Tooltip
} from 'antd';
import {
  DollarOutlined,
  PercentageOutlined,
  BankOutlined,
  UserOutlined,
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DownloadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { useGetSplitPaymentsQuery } from '../../redux/features/management/saleApi';
import dayjs from 'dayjs';
import type { SplitPaymentApiResponse, SplitPaymentSale, SplitPaymentItemSnake, DetailedSplitPaymentSale } from '../../types/sale.type';
import formatDate from '../../utils/formatDate';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface FilterParams {
  startDate?: string;
  endDate?: string;
  seller?: string;
  paymentMethod?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const SplitPaymentManagementPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterParams>({
    startDate: '',
    endDate: '',
    seller: '',
    paymentMethod: '',
    search: '',
    page: 1,
    limit: 100
  });
  
  const [selectedSale, setSelectedSale] = useState<DetailedSplitPaymentSale | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // ✅ CORRECT: Use the dedicated split payments endpoint
  const { 
  data: apiResponse, 
  isLoading, 
  refetch 
} = useGetSplitPaymentsQuery(filters);

  // Debug log
  useEffect(() => {
    console.log('🔍 Split Payment API Response:', apiResponse);
  }, [apiResponse]);

  // Extract data with proper typing
const splitData = apiResponse as any; // Temporary - adjust your types
const splitPayments = useMemo(() => splitData?.data?.sales || [], [splitData]);
const statistics = useMemo(() => splitData?.data?.statistics || {
  summary: { total_split_sales: 0, total_split_amount: 0, average_split_amount: 0 },
  method_breakdown: [],
  user_breakdown: []
}, [splitData]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle date range change
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
        page: 1
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        startDate: '',
        endDate: '',
        page: 1
      }));
    }
  };

  // View split payment details
  const handleViewDetails = (payment: SplitPaymentSale) => {
    setSelectedSale(payment);
    setDetailModalVisible(true);
  };

  // Export to Excel
const handleExport = async () => {
  try {
    setExportLoading(true);
    
    const exportCandidates = splitPayments.filter(item => item.payment_splits && item.payment_splits.length > 0);
    
    if (exportCandidates.length === 0) {
      message.warning('No split payments found to export');
      return;
    }

    // OPTION 2: One row per split, with sale info on every row (no empty rows)
    const splitPaymentData = splitPayments.flatMap(payment => {
      const splits = payment.payment_splits || [];
      return splits.map((split, index) => ({
        // Sale Info (repeated on each split row)
        'Code': payment.code,
        'Date': dayjs(payment.date).format('YYYY-MM-DD'),
        'Buyer': payment.buyer_name,
        'Product': payment.product_name,
        'Total Sale Amount': payment.total_amount || payment.total_price || 0,
        
        //'Warehouse': payment.warehouse || '',
        'Payment Status': payment.payment_status || '',
        
        // Split Info (unique per row)
        'Split Number': index + 1,
        //'Total Splits': splits.length,
        
        'Split Amount': split.amount || 0,
        //'Percentage': `${split.percentage}%`,
        'Payment Method': split.payment_method,
        'Bank Name': split.bank_name || '',
        'Sender': split.sender_name || '',
        'Receiver': split.receiver_name || '',
        'Telebirr Phone': split.telebirr_phone || '',
        //'Transaction ID': split.telebirr_transaction_id || split.reference || '',
        'Casher Name': payment.casher_name,
        'Created Date': dayjs(split.created_at).format('YYYY-MM-DD HH:mm'),
       // 'Verified': (split.amount || 0) > 0 ? 'Yes' : 'No',
        
        // Combined field
        //'Split Details': `${split.payment_method}: ETB ${(split.amount || 0).toLocaleString()} (${split.percentage}%)${split.bank_name ? ` - ${split.bank_name}` : ''}`,
      }));
    });

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(splitPaymentData);
    
    const colWidths = [
      { wch: 12 },  // Code
      { wch: 12 },  // Date
      { wch: 20 },  // Buyer
      { wch: 25 },  // Product
      { wch: 15 },  // Total Sale Amount
      
      //{ wch: 15 },  // Warehouse
      { wch: 15 },  // Payment Status
      { wch: 10 },  // Split Number
      //{ wch: 10 },  // Total Splits
      
      { wch: 15 },  // Split Amount
      //{ wch: 10 },  // Percentage
      { wch: 15 },  // Payment Method
      { wch: 20 },  // Bank Name
      { wch: 20 },  // Sender
      { wch: 20 },  // Receiver
      { wch: 15 },  // Telebirr Phone
      //{ wch: 25 },  // Transaction ID
      { wch: 20 },  // Casher Name
      { wch: 20 },  // Created Date
      //{ wch: 10 },  // Verified
      //{ wch: 40 },  // Split Details
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Split Payments');
    
    const filename = `split_payments_${dayjs().format('YYYY-MM-DD')}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    message.success(`Exported ${splitPaymentData.length} split payment records!`);
  } catch (error) {
    console.error('Export error:', error);
    message.error('Failed to export split payments');
  } finally {
    setExportLoading(false);
  }
};

  const generateExcel = async (data: any[]) => {
    const XLSX = await import('xlsx');
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Split Payments');
    
    const filename = `split_payments_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // Table columns with snake_case data
  const columns = [
    {
      title: 'Sale ID',
      dataIndex: 'sale_id',
      key: 'sale_id',
      width: 100,
      render: (id: number) => <Text strong>#{id}</Text>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Buyer',
      dataIndex: 'buyer_name',
      key: 'buyer_name',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Product',
      dataIndex: 'product_name',
      key: 'product_name',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>
          ETB {(amount || 0).toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Splits',
      key: 'splits',
      width: 200,
      render: (_: any, record: SplitPaymentSale) => (
        <div>
          <Badge count={record.payment_splits.length} style={{ backgroundColor: '#52c41a' }} />
          <div style={{ marginTop: 4, fontSize: '12px' }}>
            {record.payment_splits.map((split, index) => (
              <Tag key={split.id || index} color="blue" style={{ margin: '2px', fontSize: '11px' }}>
                {split.payment_method}: ETB {(split.amount || 0).toLocaleString()}
              </Tag>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Seller',
      dataIndex: 'seller_name',
      key: 'seller_name',
      width: 150,
      render: (name: string) => (
        <Tag icon={<UserOutlined />} color="purple">
          {name}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: SplitPaymentSale) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
          size="small"
        >
          Details
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <ShareAltOutlined /> Split Payment Management
            </Title>
            <Text type="secondary">
              Manage and analyze split payment transactions
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exportLoading}
                disabled={splitPayments.length === 0}
              >
                Export Data
              </Button>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Split Sales"
              value={statistics.summary.total_split_sales}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Split Amount"
              value={statistics.summary.total_split_amount}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `ETB ${Number(value).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Average Split Amount"
              value={statistics.summary.average_split_amount}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              formatter={(value) => `ETB ${Number(value).toFixed(2)}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Payment Methods"
              value={statistics.method_breakdown.length}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search buyer or product..."
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by payment method"
              allowClear
              value={filters.paymentMethod || null}
              onChange={(value) => handleFilterChange('paymentMethod', value)}
            >
              <Option value="CASH">Cash</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="TELEBIRR">Telebirr</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
              style={{ width: '100%' }}
            >
              Apply Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card title="Payment Method Breakdown" extra={<BarChartOutlined />}>
            {statistics.method_breakdown.length > 0 ? (
              <div style={{ padding: '16px' }}>
                {statistics.method_breakdown.map(item => (
                  <div key={item.method} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text strong>
                        <BankOutlined style={{ marginRight: '8px' }} />
                        {item.method.replace('_', ' ')}
                      </Text>
                      <Text>
                        ETB {(item.amount || 0).toLocaleString()} ({item.count} payments)
                      </Text>
                    </div>
                    <Progress
                      percent={parseFloat(item.percentage.toFixed(1))}
                      strokeColor={
                        item.method === 'CASH' ? '#52c41a' :
                        item.method === 'BANK_TRANSFER' ? '#1890ff' :
                        item.method === 'TELEBIRR' ? '#13c2c2' : '#722ed1'
                      }
                      showInfo={false}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.percentage.toFixed(1)}% of total split payments
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No payment method data available" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Salesperson Performance" extra={<UserOutlined />}>
            {statistics.user_breakdown.length > 0 ? (
              <div style={{ padding: '16px' }}>
                {statistics.user_breakdown.map(item => (
                  <div key={item.user} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text strong>
                        <UserOutlined style={{ marginRight: '8px' }} />
                        {item.user}
                      </Text>
                      <Text>
                        ETB {(item.amount || 0).toLocaleString()} ({item.count} sales)
                      </Text>
                    </div>
                    <Progress
                      percent={parseFloat(item.percentage.toFixed(1))}
                      strokeColor="#1890ff"
                      showInfo={false}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.percentage.toFixed(1)}% of total split amount
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No salesperson data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Split Payments Table */}
      <Card
        title={
          <Space>
            <Text strong>Split Payment Transactions</Text>
            <Badge count={splitPayments.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Text type="secondary">
            Total: ETB {statistics.summary.total_split_amount.toLocaleString()}
          </Text>
        }
      >
        {splitPayments.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={splitPayments}
              loading={isLoading}
              rowKey="sale_id"
              pagination={{
                current: filters.page,
                pageSize: filters.limit,
                total: splitData?.data?.total || splitPayments.length,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, pageSize) => {
                  setFilters(prev => ({ ...prev, page, limit: pageSize }));
                }
              }}
              scroll={{ x: 1200 }}
            />
          </>
        ) : (
          <Empty
            description={
              <div>
                <Title level={4} style={{ marginBottom: '8px' }}>No Split Payments Found</Title>
                <Text type="secondary">
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters' 
                    : 'No split payment transactions available'}
                </Text>
              </div>
            }
          />
        )}
      </Card>

            {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <ShareAltOutlined />
            <span>Split Payment Details - Sale #{selectedSale?.sale_id}</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={1000}
        footer={null}
        style={{ top: 20 }}
      >
        {selectedSale && (
          <div>
            {/* Main Sale Information Card */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: '16px', 
                borderLeft: '4px solid #1890ff',
                background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f7ff 100%)'
              }}
            >
              <Descriptions bordered column={3} size="small">
                <Descriptions.Item label="Sale ID" span={1}>
                  <Text strong style={{ fontSize: '14px' }}>#{selectedSale.sale_id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Date" span={1}>
                  {dayjs(selectedSale.date).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Warehouse" span={1}>
                  <Tag color="blue">{selectedSale.warehouse || 'N/A'}</Tag>
                </Descriptions.Item>
                
                <Descriptions.Item label="Buyer">
                  <Text strong>{selectedSale.buyer_name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Product">
                  <Text strong>{selectedSale.product_name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Product Code">
                  <Text code>{selectedSale.code}</Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="Total Amount">
                  <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    ETB {(selectedSale.total_amount || selectedSale.total_price || 0).toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Status">
                  <Tag color={selectedSale.payment_status === 'FULL' ? 'success' : 'warning'}>
                    {selectedSale.payment_status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Seller/Casher">
                  <Tag icon={<UserOutlined />} color="purple">
                    {selectedSale.seller_name || selectedSale.casher_name}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Product & Quantity Information */}
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} md={8}>
                <Card size="small" title="Quantity Details">
                  <div style={{ textAlign: 'center' }}>
                    <Statistic
                      title="Total Quantity"
                      value={selectedSale.quantity || selectedSale.qty || 0}
                      suffix="pcs"
                      valueStyle={{ color: '#1890ff' }}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary">
                        {selectedSale.ctn || 0} carton × {selectedSale.quantity || 2} pcs/ctn
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card size="small" title="Pricing Details">
                  <div style={{ textAlign: 'center' }}>
                    <Statistic
                      title="Price per Piece"
                      value={(selectedSale.product_price || selectedSale.product?.price || 0)}
                      prefix="ETB"
                      valueStyle={{ color: '#52c41a' }}
                      formatter={(value) => `ETB ${Number(value || 0).toLocaleString()}`}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Default: ETB {(selectedSale.default_product_price || selectedSale.product?.default_price || 0).toLocaleString()}
                      </Text>
                    </div>
                  </div>
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card size="small" title="Stock Information">
                  <div style={{ textAlign: 'center' }}>
                    <Space direction="vertical" size={2}>
                      <Text>
                        <Text strong>Before:</Text> {selectedSale.original_available_stock || 0} pcs
                      </Text>
                      <Text>
                        <Text strong>After:</Text> {selectedSale.final_available_stock || 0} pcs
                      </Text>
                      <Tag color={selectedSale.is_negative_stock_sale ? 'error' : 'success'}>
                        {selectedSale.is_negative_stock_sale ? 'Negative Stock' : 'Normal Stock'}
                      </Tag>
                    </Space>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Split Payment Breakdown - Main Section */}
            <Card 
              title={
                <Space>
                  <ShareAltOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Payment Splits</Text>
                  <Badge 
                    count={selectedSale.payment_splits?.length || 0} 
                    style={{ backgroundColor: '#52c41a' }}
                    showZero
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Total: ETB {(selectedSale.total_amount || 0).toLocaleString()}
                  </Text>
                </Space>
              }
              size="small"
              style={{ marginBottom: '16px' }}
              extra={
                <Space>
                  <Text type="secondary">
                    Paid: ETB {(selectedSale.paid_amount || 0).toLocaleString()}
                  </Text>
                  <Text type="secondary">
                    Remaining: ETB {(selectedSale.remaining_amount || 0).toLocaleString()}
                  </Text>
                </Space>
              }
            >
              {selectedSale.payment_splits && selectedSale.payment_splits.length > 0 ? (
                <div>
                  {/* Progress bar showing split distribution */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      {selectedSale.payment_splits.map((split, index) => {
                        const color = 
                          split.payment_method === 'CASH' ? '#52c41a' :
                          split.payment_method === 'BANK_TRANSFER' ? '#1890ff' :
                          split.payment_method === 'TELEBIRR' ? '#13c2c2' : '#722ed1';
                        
                        return (
                          <div
                            key={index}
                            style={{
                              width: `${split.percentage}%`,
                              backgroundColor: color,
                              height: '100%'
                            }}
                            title={`${split.payment_method}: ${split.percentage}%`}
                          />
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      {selectedSale.payment_splits.map((split, index) => (
                        <Text key={index} style={{ fontSize: '11px', color: '#666' }}>
                          {split.payment_method}: {split.percentage}%
                        </Text>
                      ))}
                    </div>
                  </div>

                  {/* Individual Split Cards */}
                  <Row gutter={[16, 16]}>
                    {selectedSale.payment_splits.map((split, index) => {
                      const color = 
                        split.payment_method === 'CASH' ? '#52c41a' :
                        split.payment_method === 'BANK_TRANSFER' ? '#1890ff' :
                        split.payment_method === 'TELEBIRR' ? '#13c2c2' : '#722ed1';
                      
                      return (
                        <Col xs={24} md={8} key={split.id || index}>
                          <Card
                            size="small"
                            style={{
                              border: `1px solid ${color}20`,
                              borderLeft: `4px solid ${color}`,
                              background: `${color}08`
                            }}
                            bodyStyle={{ padding: '12px' }}
                          >
                            <Row gutter={[8, 8]}>
                              <Col span={24}>
                                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                  <Space>
                                    <BankOutlined style={{ color }} />
                                    <Text strong>{split.payment_method.replace('_', ' ')}</Text>
                                    <Tag 
                                      color={split.payment_method === 'CASH' ? 'green' :
                                             split.payment_method === 'BANK_TRANSFER' ? 'blue' :
                                             split.payment_method === 'TELEBIRR' ? 'cyan' : 'purple'}
                                    >
                                      {split.percentage}%
                                    </Tag>
                                  </Space>
                                  
                                  <div style={{ margin: '8px 0' }}>
                                    <Text strong style={{ color, fontSize: '18px' }}>
                                      ETB {(split.amount || 0).toLocaleString()}
                                    </Text>
                                  </div>
                                  
                                  {/* Payment Details */}
                                  {(split.bank_name || split.sender_name || split.receiver_name) && (
                                    <div style={{ 
                                      padding: '8px', 
                                      background: '#fafafa', 
                                      borderRadius: '4px',
                                      fontSize: '12px' 
                                    }}>
                                      {split.bank_name && (
                                        <div>
                                          <Text type="secondary">Bank:</Text> {split.bank_name}
                                        </div>
                                      )}
                                      {split.sender_name && (
                                        <div>
                                          <Text type="secondary">Sender:</Text> {split.sender_name}
                                        </div>
                                      )}
                                      {split.receiver_name && (
                                        <div>
                                          <Text type="secondary">Receiver:</Text> {split.receiver_name}
                                        </div>
                                      )}
                                      {split.telebirr_phone && (
                                        <div>
                                          <Text type="secondary">Phone:</Text> {split.telebirr_phone}
                                        </div>
                                      )}
                                      {split.telebirr_transaction_id && (
                                        <div>
                                          <Text type="secondary">Txn ID:</Text> 
                                          <Text code style={{ fontSize: '10px' }}>
                                            {split.telebirr_transaction_id}
                                          </Text>
                                        </div>
                                      )}
                                      {split.reference && (
                                        <div>
                                          <Text type="secondary">Reference:</Text> {split.reference}
                                        </div>
                                      )}
                                      {split.created_at && (
                                        <div>
                                          <Text type="secondary">Created:</Text> 
                                          {dayjs(split.created_at).format('DD/MM/YYYY HH:mm')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Space>
                              </Col>
                            </Row>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              ) : (
                <Empty description="No split payment details available" />
              )}
            </Card>

            {/* Summary and Verification */}
            <Card 
              size="small" 
              style={{ 
                marginTop: '16px',
                background: 'linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%)'
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Total Splits"
                    value={selectedSale.payment_splits?.length || 0}
                    prefix={<ShareAltOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Paid Amount"
                    value={selectedSale.paid_amount || selectedSale.total_amount || 0}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                    formatter={(value) => `ETB ${Number(value || 0).toLocaleString()}`}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Remaining"
                    value={selectedSale.remaining_amount || 0}
                    prefix={<PercentageOutlined />}
                    valueStyle={{ 
                      color: selectedSale.remaining_amount === 0 ? '#52c41a' : '#fa8c16' 
                    }}
                    formatter={(value) => `ETB ${Number(value || 0).toLocaleString()}`}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Verification"
                    value={selectedSale.remaining_amount === 0 ? '100%' : 'Partial'}
                    suffix={selectedSale.remaining_amount === 0 ? '✓' : '!'}
                    valueStyle={{ 
                      color: selectedSale.remaining_amount === 0 ? '#52c41a' : '#fa8c16' 
                    }}
                  />
                </Col>
              </Row>
              
              {/* Calculation Formula */}
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontStyle: 'italic' }}>
                  {selectedSale.calculation_details?.formula || 
                    `${selectedSale.product_price || 0} × ${selectedSale.quantity || 0} = ETB ${(selectedSale.total_amount || 0).toLocaleString()}`}
                </Text>
              </div>
            </Card>

            {/* Notes Section */}
            {selectedSale.notes && (
              <Card 
                size="small" 
                style={{ marginTop: '16px' }}
                title={
                  <Space>
                    <FileTextOutlined />
                    <Text strong>Additional Notes</Text>
                  </Space>
                }
              >
                <div style={{ 
                  padding: '8px', 
                  background: '#fafafa', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px'
                }}>
                  {selectedSale.notes}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SplitPaymentManagementPage;