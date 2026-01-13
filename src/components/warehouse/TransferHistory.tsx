// components/warehouse/TransferHistory.tsx
import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  Button,
  Select,
  DatePicker,
  Modal,
  Descriptions,
  Typography,
  Tooltip,
  Spin,
  message,
  Popover
} from 'antd';
import {
  EyeOutlined,
  ReloadOutlined,
  ExportOutlined,
  SearchOutlined,
  DownloadOutlined,
  FilterOutlined,
  ClearOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  HistoryOutlined,
  ArrowRightOutlined,
  DownOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import { useGetTransfersQuery } from '../../redux/features/warehouseApi';
import { Warehouse, TransferStatus } from '../../types/warehouse.types';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface TransferHistoryProps {
  isMobile: boolean;
}

// Define the actual API response structure
interface ApiTransfer {
  id: number;
  transfer_number: string;
  from_warehouse: Warehouse;
  to_warehouse: Warehouse;
  product_id: number;
  quantity: number;
  unit: string;
  status: string;
  transfer_type: string;
  requested_by: number;
  approved_by: number | null;
  completed_by: number | null;
  reason: string;
  notes: string;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  cartons: number;
  piecesPerCarton: number;
  totalPieces: number;
  product: {
    id: number;
    code: string;
    name: string;
    unit: string;
    price: number;
    qty: number;
  };
  requester: {
    id: number;
    name: string;
    email: string;
  } | null;
  approver: any;
  completer: any;
}

const TransferHistory: React.FC<TransferHistoryProps> = ({ isMobile }) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    sortBy: 'requested_at',
    sortOrder: 'desc' as 'asc' | 'desc',
    from_warehouse: '' as Warehouse | '',
    to_warehouse: '' as Warehouse | '',
    status: '' as TransferStatus | '',
    startDate: '',
    endDate: '',
    search: '',
    productCode: ''
  });

  // First, get all data from API without filters
  const { 
    data: transfersData, 
    isLoading, 
    refetch 
  } = useGetTransfersQuery({
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder
    // Note: We're not sending filter params to API, we'll filter client-side
  });

  const allTransfersFromApi: ApiTransfer[] = transfersData?.transfers || [];
  const historyTotal = transfersData?.pagination?.total || 0;

  // Client-side filtering function
  const filteredTransfers = useMemo(() => {
    let filtered = [...allTransfersFromApi];

    // Filter by from_warehouse
    if (params.from_warehouse) {
      filtered = filtered.filter(transfer => 
        transfer.from_warehouse === params.from_warehouse
      );
    }

    // Filter by to_warehouse
    if (params.to_warehouse) {
      filtered = filtered.filter(transfer => 
        transfer.to_warehouse === params.to_warehouse
      );
    }

    // Filter by status
    if (params.status) {
      filtered = filtered.filter(transfer => 
        transfer.status === params.status
      );
    }

    // Filter by product code
    if (params.productCode) {
      filtered = filtered.filter(transfer => 
        transfer.product?.code?.toLowerCase() === params.productCode.toLowerCase()
      );
    }

    // Filter by date range
    if (params.startDate || params.endDate) {
      filtered = filtered.filter(transfer => {
        const transferDate = dayjs(transfer.requested_at);
        let pass = true;
        
        if (params.startDate) {
          pass = pass && transferDate.isAfter(dayjs(params.startDate).subtract(1, 'day'));
        }
        
        if (params.endDate) {
          pass = pass && transferDate.isBefore(dayjs(params.endDate).add(1, 'day'));
        }
        
        return pass;
      });
    }

    // Filter by search term
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter(transfer => 
        transfer.transfer_number?.toLowerCase().includes(searchLower) ||
        transfer.product?.name?.toLowerCase().includes(searchLower) ||
        transfer.product?.code?.toLowerCase().includes(searchLower) ||
        transfer.from_warehouse?.toLowerCase().includes(searchLower) ||
        transfer.to_warehouse?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allTransfersFromApi, params]);

  const allTransfers = filteredTransfers;
  const filteredTotal = allTransfers.length;

  // Warehouse options from enum
  const warehouseOptions = Object.values(Warehouse).map(wh => ({
    id: wh,
    name: wh.replace('_', ' ')
  }));

  // Status options from enum
  const statusOptions = Object.values(TransferStatus).map(status => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase()
  }));

  // Extract unique product codes for filter dropdown
  const uniqueProductCodes = useMemo(() => 
    Array.from(new Set(allTransfersFromApi
      .map(transfer => transfer.product?.code)
      .filter(code => code && code.trim() !== ''))).sort(),
    [allTransfersFromApi]
  );

  const handleFilterChange = (key: string, value: any) => {
    setParams(prev => {
      const newParams = { ...prev, [key]: value };
      
      if (key === 'dateRange' && value) {
        newParams.startDate = value[0]?.format('YYYY-MM-DD') || '';
        newParams.endDate = value[1]?.format('YYYY-MM-DD') || '';
      }
      
      return newParams;
    });
  };

  const resetFilters = () => {
    setParams(prev => ({
      ...prev,
      from_warehouse: '',
      to_warehouse: '',
      status: '',
      startDate: '',
      endDate: '',
      search: '',
      productCode: ''
    }));
  };

  // Safe string formatting for warehouse names
  const formatWarehouseName = (warehouse: Warehouse | string | undefined): string => {
    if (!warehouse) return 'N/A';
    return warehouse.replace(/_/g, ' ');
  };

  // Safe string formatting for transfer type
  const formatTransferType = (type: string | undefined): string => {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ');
  };

  // Get product name safely
  const getProductName = (transfer: ApiTransfer): string => {
    return transfer.product?.name || 'N/A';
  };

  // Get product code safely
  const getProductCode = (transfer: ApiTransfer): string => {
    return transfer.product?.code || 'N/A';
  };

  // Get requester name safely
  const getRequesterName = (transfer: ApiTransfer): string => {
    return transfer.requester?.name || 'N/A';
  };

  // Get completer name safely
  const getCompleterName = (transfer: ApiTransfer): string => {
    return transfer.completer?.name || 'N/A';
  };

  // Export to Excel function - exports filtered data
  const handleExportToExcel = (exportAll: boolean = false) => {
    let dataToExport = allTransfers;
    
    if (dataToExport.length === 0) {
      message.warning('No data to export');
      return;
    }

    try {
      // Prepare data for export with safe access to properties
      const exportData = dataToExport.map(transfer => ({
        'Transfer Number': transfer.transfer_number || 'N/A',
        'Product Code': getProductCode(transfer),
        'Product Name': getProductName(transfer),
        'From Warehouse': formatWarehouseName(transfer.from_warehouse),
        'To Warehouse': formatWarehouseName(transfer.to_warehouse),
        'Cartons': transfer.cartons || 0,
        'Pieces Per Carton': transfer.piecesPerCarton || 0,
        'Total Pieces': transfer.quantity || 0,
        'Unit': transfer.unit || 'N/A',
        'Product Price': transfer.product?.price || 0,
        'Status': transfer.status || 'N/A',
        'Transfer Type': formatTransferType(transfer.transfer_type),
        'Requested By': getRequesterName(transfer),
        'Completed By': getCompleterName(transfer),
        'Reason': transfer.reason || '',
        'Notes': transfer.notes || '',
        'Requested Date': transfer.requested_at ? dayjs(transfer.requested_at).format('YYYY-MM-DD HH:mm:ss') : '',
        'Completed Date': transfer.completed_at ? dayjs(transfer.completed_at).format('YYYY-MM-DD HH:mm:ss') : '',
        
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add column widths
      const wscols = [
        { wch: 20 }, // Transfer Number
        { wch: 15 }, // Product Code
        { wch: 30 }, // Product Name
        { wch: 20 }, // From Warehouse
        { wch: 20 }, // To Warehouse
        { wch: 10 }, // Cartons
        { wch: 15 }, // Pieces Per Carton
        { wch: 12 }, // Quantity
        { wch: 10 }, // Unit
        { wch: 12 }, // Product Price
        { wch: 12 }, // Status
        { wch: 20 }, // Transfer Type
        { wch: 20 }, // Requested By
        { wch: 20 }, // Completed By
        { wch: 30 }, // Reason
        { wch: 30 }, // Notes
        { wch: 20 }, // Requested Date
        { wch: 20 }, // Completed Date
        
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, 'Transfer History');

      // Generate filename with timestamp and filter info
      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm');
      
      // Add filter info to filename
      let filterInfo = '';
      if (params.from_warehouse) filterInfo += `_from${params.from_warehouse}`;
      if (params.to_warehouse) filterInfo += `_to${params.to_warehouse}`;
      if (params.status) filterInfo += `_${params.status}`;
      if (params.productCode) filterInfo += `_${params.productCode}`;
      if (params.search) filterInfo += `_search${params.search.substring(0, 10)}`;
      
      const filename = `transfer_history${filterInfo}_${timestamp}.xlsx`;

      // Write to file and trigger download
      XLSX.writeFile(wb, filename);
      
      message.success(`Exported ${exportData.length} filtered transfers to Excel`);
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
          icon={<FileExcelOutlined />}
          onClick={() => handleExportToExcel(false)}
          block
          style={{ textAlign: 'left' }}
        >
          Export Filtered Data ({allTransfers.length} transfers)
        </Button>
        <div style={{ fontSize: '12px', color: '#666', padding: '4px 0' }}>
          Exports only the currently filtered transfers
        </div>
      </Space>
    </div>
  );

  const showTransferDetails = (record: ApiTransfer) => {
    Modal.info({
      title: 'Transfer Details',
      width: isMobile ? '90%' : 600,
      content: (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Transfer Number">
            <Text strong>{record.transfer_number || 'N/A'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Product">
            {getProductName(record)} ({getProductCode(record)})
          </Descriptions.Item>
          <Descriptions.Item label="From Warehouse">
            <Tag color="blue">{formatWarehouseName(record.from_warehouse)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="To Warehouse">
            <Tag color="green">{formatWarehouseName(record.to_warehouse)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Quantity">
            {record.cartons || 0} cartons ({record.totalPieces || record.quantity || 0} pieces)
          </Descriptions.Item>
          <Descriptions.Item label="Unit">
            {record.unit || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Transfer Type">
            {formatTransferType(record.transfer_type)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={
              record.status === TransferStatus.COMPLETED ? 'green' : 
              record.status === TransferStatus.CANCELLED ? 'red' : 'orange'
            }>
              {record.status ? formatTransferType(record.status) : 'Unknown'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Requested At">
            {record.requested_at ? dayjs(record.requested_at).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
          </Descriptions.Item>
          {record.completed_at && (
            <Descriptions.Item label="Completed At">
              {dayjs(record.completed_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Requested By">
            {getRequesterName(record)}
          </Descriptions.Item>
          {record.completer && (
            <Descriptions.Item label="Completed By">
              {getCompleterName(record)}
            </Descriptions.Item>
          )}
          {record.reason && (
            <Descriptions.Item label="Reason">
              {record.reason}
            </Descriptions.Item>
          )}
          {record.notes && (
            <Descriptions.Item label="Notes">
              {record.notes}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Product Price">
            ${record.product?.price || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Pieces Per Carton">
            {record.piecesPerCarton || record.product?.qty || 0}
          </Descriptions.Item>
        </Descriptions>
      )
    });
  };

  const columns = [
    {
      title: 'Transfer #',
      dataIndex: 'transfer_number',
      key: 'transfer_number',
      render: (text: string) => <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{text || 'N/A'}</Text>,
      responsive: ['sm' as const]
    },
    {
      title: 'Product',
      key: 'product',
      render: (_: any, record: ApiTransfer) => (
        <div>
          <div style={{ 
            fontWeight: '500', 
            fontSize: isMobile ? '12px' : '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {getProductName(record)}
          </div>
          <div style={{ 
            fontSize: isMobile ? '10px' : '12px', 
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Code: {getProductCode(record)}
          </div>
          <div style={{ 
            fontSize: isMobile ? '10px' : '11px', 
            color: '#888'
          }}>
            Unit: {record.unit || 'N/A'} • ${record.product?.price || 0}
          </div>
        </div>
      )
    },
    {
      title: 'From → To',
      key: 'warehouses',
      render: (_: any, record: ApiTransfer) => (
        <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
          <Tag color="blue" style={{ margin: 0 }}>
            {formatWarehouseName(record.from_warehouse)}
          </Tag>
          {!isMobile && <ArrowRightOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />}
          <Tag color="green" style={{ margin: 0 }}>
            {formatWarehouseName(record.to_warehouse)}
          </Tag>
        </Space>
      ),
      responsive: ['sm' as const]
    },
    {
      title: 'Quantity',
      key: 'quantity',
      render: (_: any, record: ApiTransfer) => (
        <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>
            {record.cartons || 0} cartons
          </div>
          <div style={{ 
            fontSize: isMobile ? '10px' : '12px', 
            color: '#666' 
          }}>
            ({record.totalPieces || record.quantity || 0} pieces)
          </div>
          <div style={{ 
            fontSize: isMobile ? '9px' : '11px', 
            color: '#888',
            fontStyle: 'italic'
          }}>
            {record.piecesPerCarton || record.product?.qty || 1} pcs/carton
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ApiTransfer) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          [TransferStatus.COMPLETED]: { color: '#52c41a', icon: <CheckCircleFilled />, text: 'Completed' },
          [TransferStatus.CANCELLED]: { color: '#ff4d4f', icon: <CloseCircleFilled />, text: 'Cancelled' },
          [TransferStatus.PENDING]: { color: '#fa8c16', icon: <ClockCircleOutlined />, text: 'Pending' },
        };
        
        const config = statusConfig[status] || { color: '#666', icon: null, text: status ? formatTransferType(status) : 'Unknown' };
        
        let tooltipText = `Status: ${config.text}`;
        if (record.completed_at) {
          tooltipText += `\nCompleted: ${dayjs(record.completed_at).format('YYYY-MM-DD HH:mm')}`;
        } else if (record.approved_at) {
          tooltipText += `\nApproved: ${dayjs(record.approved_at).format('YYYY-MM-DD HH:mm')}`;
        }
        
        return (
          <Tooltip title={tooltipText}>
            <Tag 
              color={config.color} 
              icon={config.icon}
              style={{ margin: 0 }}
            >
              {config.text}
            </Tag>
          </Tooltip>
        );
      }
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
      ) : 'N/A',
      responsive: ['md' as const]
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ApiTransfer) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showTransferDetails(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin tip="Loading transfer history..." />
      </div>
    );
  }

  if (allTransfers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <HistoryOutlined style={{ 
          fontSize: isMobile ? '32px' : '48px', 
          color: '#666', 
          marginBottom: '16px' 
        }} />
        <Text strong style={{ fontSize: isMobile ? '16px' : '20px' }}>No Transfer History</Text>
        <br />
        <Text type="secondary">
          {allTransfersFromApi.length === 0 
            ? 'No transfer history found' 
            : 'No transfers match your filters'}
        </Text>
      </div>
    );
  }

  return (
    <Card bodyStyle={{ padding: isMobile ? '8px' : '16px' }}>
      {/* Filters Section */}
      <div style={{ marginBottom: '16px' }}>
        {/* Search and Export Row */}
        <Space wrap style={{ width: '100%', marginBottom: '12px', justifyContent: 'space-between' }}>
          <Search
            placeholder="Search by transfer number, product name, product code..."
            style={{ width: isMobile ? '100%' : 300 }}
            allowClear
            size={isMobile ? "small" : "middle"}
            value={params.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            prefix={<SearchOutlined />}
          />
          
          <Space>
            <Tooltip title="Refresh Data">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>
            
            <Popover 
              content={exportDropdownContent} 
              title="Export Options" 
              trigger="click"
              placement="bottomRight"
            >
              <Button
                type="primary"
                icon={<ExportOutlined />}
                size={isMobile ? "small" : "middle"}
              >
                {!isMobile && 'Export'} {!isMobile && <DownOutlined />}
              </Button>
            </Popover>
          </Space>
        </Space>

        {/* Filter Controls Row */}
        <Space wrap style={{ marginTop: '12px', width: '100%' }}>
          <Select
            placeholder="From Warehouse"
            style={{ width: isMobile ? '100%' : 180 }}
            value={params.from_warehouse || undefined}
            onChange={(value) => handleFilterChange('from_warehouse', value)}
            allowClear
            size={isMobile ? "small" : "middle"}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="">All Warehouses</Option>
            {warehouseOptions.map(wh => (
              <Option key={wh.id} value={wh.id}>
                {wh.name}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="To Warehouse"
            style={{ width: isMobile ? '100%' : 180 }}
            value={params.to_warehouse || undefined}
            onChange={(value) => handleFilterChange('to_warehouse', value)}
            allowClear
            size={isMobile ? "small" : "middle"}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="">All Warehouses</Option>
            {warehouseOptions.map(wh => (
              <Option key={wh.id} value={wh.id}>
                {wh.name}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="Status"
            style={{ width: isMobile ? '100%' : 130 }}
            value={params.status || undefined}
            onChange={(value) => handleFilterChange('status', value)}
            allowClear
            size={isMobile ? "small" : "middle"}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="">All Status</Option>
            {statusOptions.map(status => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="Product Code"
            style={{ width: isMobile ? '100%' : 150 }}
            value={params.productCode || undefined}
            onChange={(value) => handleFilterChange('productCode', value)}
            allowClear
            showSearch
            filterOption={(input: string, option: any) =>
              (option?.children as string)?.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
            size={isMobile ? "small" : "middle"}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="">All Product Codes</Option>
            {uniqueProductCodes.map(code => (
              <Option key={code} value={code}>
                {code}
              </Option>
            ))}
          </Select>
          
          <RangePicker
            style={{ width: isMobile ? '100%' : 250 }}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            size={isMobile ? "small" : "middle"}
            allowClear
          />
          
          <Tooltip title="Reset All Filters">
            <Button
              icon={<ClearOutlined />}
              onClick={resetFilters}
              size={isMobile ? "small" : "middle"}
              danger
            >
              {!isMobile && 'Reset'}
            </Button>
          </Tooltip>
        </Space>
        
        {/* Active Filters Display */}
        {(params.from_warehouse || params.to_warehouse || params.status || params.productCode || params.search || params.startDate) && (
          <div style={{ marginTop: '12px', padding: '8px', background: '#f6ffed', borderRadius: '4px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Active filters: 
              {params.from_warehouse && <Tag color="blue" style={{ marginLeft: '8px' }}>From: {formatWarehouseName(params.from_warehouse)}</Tag>}
              {params.to_warehouse && <Tag color="green" style={{ marginLeft: '8px' }}>To: {formatWarehouseName(params.to_warehouse)}</Tag>}
              {params.status && <Tag color="orange" style={{ marginLeft: '8px' }}>Status: {formatTransferType(params.status)}</Tag>}
              {params.productCode && <Tag color="purple" style={{ marginLeft: '8px' }}>Product Code: {params.productCode}</Tag>}
              {params.search && <Tag color="cyan" style={{ marginLeft: '8px' }}>Search: {params.search}</Tag>}
              {(params.startDate || params.endDate) && (
                <Tag color="geekblue" style={{ marginLeft: '8px' }}>
                  Date: {params.startDate} to {params.endDate}
                </Tag>
              )}
            </Text>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Showing {allTransfers.length} of {allTransfersFromApi.length} transfers
              {allTransfers.length < allTransfersFromApi.length && ` (filtered from ${allTransfersFromApi.length} total)`}
            </div>
          </div>
        )}
      </div>

      {/* Table Section */}
      <Table
        columns={columns}
        dataSource={allTransfers}
        rowKey="id"
        scroll={isMobile ? { x: true } : undefined}
        size={isMobile ? 'small' : 'middle'}
        pagination={{
          current: params.page,
          pageSize: params.limit,
          total: filteredTotal,
          showSizeChanger: !isMobile,
          showQuickJumper: !isMobile,
          showTotal: (total: number, range: number[]) => 
            isMobile 
              ? `${range[0]}-${range[1]}` 
              : `Showing ${range[0]}-${range[1]} of ${total} transfers`,
          onChange: (page, pageSize) => {
            setParams(prev => ({
              ...prev,
              page,
              limit: pageSize
            }));
          }
        }}
      />
      
      {/* Export Section at Bottom */}
      {!isMobile && (
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Space>
            <Popover 
              content={exportDropdownContent} 
              title="Export Options" 
              trigger="click"
              placement="topRight"
            >
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
              >
                Export Options <DownOutlined />
              </Button>
            </Popover>
            
            <div style={{ fontSize: '12px', color: '#666' }}>
              Current filter: {allTransfers.length} transfers
              {allTransfersFromApi.length > allTransfers.length && ` (filtered from ${allTransfersFromApi.length} total)`}
            </div>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default TransferHistory;