import { DollarOutlined, CheckCircleOutlined, FilterOutlined, ClearOutlined, DownOutlined, UpOutlined, MenuOutlined, ExportOutlined } from '@ant-design/icons';
import type { PaginationProps, TableColumnsType } from 'antd';
import { 
  Button, 
  Flex, 
  Modal, 
  Pagination, 
  Table, 
  Tag, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Input, 
  Form, 
  InputNumber, 
  Select, 
  Alert, 
  DatePicker, 
  Space, 
  Drawer, 
  Badge,
  Typography,
  Grid,
  Collapse,
  Avatar,
  message,
  Dropdown,
  MenuProps
} from 'antd';
import { useState, useEffect, useMemo } from 'react';
import toastMessage from '../../lib/toastMessage';
import { useGetAllSaleQuery, useUpdateSaleMutation ,useRecordRepaymentMutation} from '../../redux/features/management/saleApi';
import { ISaleApiSnakeResponse, ITableSale } from '../../types/sale.type';
import formatDate from '../../utils/formatDate';
import { ShoppingOutlined, CalendarOutlined, SearchOutlined, MoreOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;
const { Text, Title } = Typography;
const { Panel } = Collapse;

interface QueryParams {
  page: number;
  limit: number;
  search: string;
  paymentStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface FilterValues {
  search: string;
  paymentStatus: string[];
  paymentMethod: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  amountRange: [number, number] | null;
}

const SaleManagementPage = () => {
  const screens = useBreakpoint();
  const [query, setQuery] = useState<QueryParams>({
    page: 1,
    limit: 10,
    search: '',
  });

  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [filterForm] = Form.useForm<FilterValues>();
  const [exportLoading, setExportLoading] = useState(false);

  const { data: apiData, isFetching, refetch } = useGetAllSaleQuery({});

// DEBUG: Add this to see the actual structure
useEffect(() => {
  console.log('🎯 DEBUG - apiData structure:', apiData);
  console.log('apiData?.data?.sales:', apiData?.data?.sales);
  console.log('apiData?.data?.:', apiData?.data?.sales);
  console.log('apiData?.success:', apiData?.success);
}, [apiData]);

// SIMPLIFIED data extraction - handles all cases
const allTransactions = useMemo(() => {
  if (!apiData) {
    console.log('⏳ Waiting for API data...');
    return [];
  }
  
  console.log('📊 Processing API data:', {
    success: apiData?.success,
    hasData: !!apiData?.data,
    dataKeys: apiData?.data ? Object.keys(apiData.data) : []
  });

  // Try multiple access patterns
  const transactions = 
    // Normalized response from RTK Query
    (apiData.success && apiData.data?.sales) ||
    // Direct API response
    apiData?.data?.sales ||
    apiData?.data?.transactions ||
    // Fallback
    [];

  console.log(`✅ Extracted ${transactions.length} transactions`);
  return Array.isArray(transactions) ? transactions : [];
}, [apiData]);

// Updated mapping function
const allTableData: ITableSale[] = useMemo(() => {
  console.log(`🔄 Mapping ${allTransactions.length} transactions to table data`);
  
  return allTransactions.map((transaction: any) => {
    // Ensure we have valid data
    if (!transaction) return {
      key: Math.random().toString(),
      id: '',
      code: 'N/A',
      ctn: 0,
      unit: 'PC',
      productName: 'N/A',
      productPrice: 0,
      sellPrice: 0,
      buyerName: 'N/A',
      quantity: 0,
      totalPrice: 0,
      paidAmount: 0,
      remainingAmount: 0,
      date: 'N/A',
      paymentMethod: 'CASH',
      paymentStatus: 'FULL',
      casherName: 'N/A',
      sellerName: 'N/A',
      originalTransaction: {},
      originalDate: '',
    };

    // Calculate payment status
    const remainingAmount = transaction.remaining_amount || transaction.remainingAmount || 0;
    const paymentStatus = transaction.payment_status || 
                         transaction.paymentStatus || 
                         (remainingAmount > 0 ? 'PARTIAL' : 'FULL');

    return {
      key: transaction.id?.toString() || Math.random().toString(),
      id: transaction.id?.toString() || '',
      code: transaction.code || 'N/A',
      ctn: transaction.ctn || 0,
      unit: transaction.product?.unit || 'PC',
      productName: transaction.product_name || transaction.productName || 'N/A',
      productPrice: transaction.product_price || transaction.productPrice || 0,
      sellPrice: transaction.product_price || transaction.productPrice || 0,
      buyerName: transaction.buyer_name || transaction.buyerName || 'N/A',
      quantity: transaction.quantity || 0,
      totalPrice: transaction.total_price || transaction.totalPrice || 0,
      paidAmount: transaction.paid_amount || transaction.paidAmount || 0,
      remainingAmount: remainingAmount,
      date: transaction.date ? formatDate(transaction.date) : 
            transaction.created_at ? formatDate(transaction.created_at) : 'N/A',
      paymentMethod: transaction.payment_method || transaction.paymentMethod || 'CASH',
      bankName: transaction.bank_name || transaction.bankName || null,
      paymentStatus: paymentStatus,
      casherName: transaction.casher_name || transaction.casherName || 'N/A',
      recieverName: transaction.receiver_name || transaction.recieverName || 'N/A',
      sellerName: transaction.user?.name || 'N/A',
      originalTransaction: transaction,
      originalDate: transaction.date || transaction.created_at || '',
      
      // New fields
      useCustomPrice: transaction.use_custom_price || false,
      discountPercentage: transaction.discount_percentage || 0,
      salePriceType: transaction.sale_price_type || 'DEFAULT',
      isNegativeStockSale: transaction.is_negative_stock_sale || false,
      negativeStockPieces: transaction.negative_stock_pieces || 0,
      bulkDiscountApplied: transaction.bulk_discount_applied || false,
      totalDiscountAmount: transaction.total_discount_amount || 0,
      defaultProductPrice: transaction.default_product_price || 0,
      customPricePerPiece: transaction.custom_price_per_piece || 0,
    };
  });
}, [allTransactions]);

  // Filter data based on query
  const filteredData = useMemo(() => {
    return allTableData.filter(item => {
      // Search filter
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        const matchesSearch = 
          item.code.toLowerCase().includes(searchLower) ||
          item.productName.toLowerCase().includes(searchLower) ||
          item.buyerName.toLowerCase().includes(searchLower) ||
          item.casherName.toLowerCase().includes(searchLower)||
          item.recieverName.toLowerCase().includes(searchLower)||
          item.bankName?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Payment status filter
      if (query.paymentStatus) {
        if (item.paymentStatus !== query.paymentStatus) return false;
      }

      // Payment method filter
      if (query.paymentMethod) {
        if (item.paymentMethod !== query.paymentMethod) return false;
      }

      // Date range filter
      if (query.startDate && query.endDate && item.originalDate) {
        const itemDate = new Date(item.originalDate).setHours(0, 0, 0, 0);
        const startDate = new Date(query.startDate).setHours(0, 0, 0, 0);
        const endDate = new Date(query.endDate).setHours(23, 59, 59, 999);
        
        if (itemDate < startDate || itemDate > endDate) return false;
      }

      // Amount range filter
      if (query.minAmount !== undefined && item.totalPrice < query.minAmount) return false;
      if (query.maxAmount !== undefined && item.totalPrice > query.maxAmount) return false;

      return true;
    });
  }, [allTableData, query]);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, query.page, query.limit]);

  // Calculate statistics from filtered data
  const filteredStats = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalPaid = filteredData.reduce((sum, item) => sum + item.paidAmount, 0);
    const totalRemaining = filteredData.reduce((sum, item) => sum + item.remainingAmount, 0);
    const paymentRatio = totalRevenue > 0 ? totalPaid / totalRevenue : 0;
    
    const paymentMethodStats = filteredData.reduce((acc, item) => {
      const method = item.paymentMethod || 'OTHER';
      acc[method] = (acc[method] || 0) + item.paidAmount;
      return acc;
    }, {} as Record<string, number>);

    const outstandingDebts = filteredData
      .filter(t => t.remainingAmount > 0)
      .reduce((sum, t) => sum + t.remainingAmount, 0);

    const partialPaymentsCount = filteredData
      .filter(t => t.paymentStatus === 'PARTIAL' || t.remainingAmount > 0).length;

    return {
      totalRevenue,
      totalPaid,
      totalRemaining,
      paymentRatio,
      transactionCount: filteredData.length,
      paymentMethodStats,
      outstandingDebts,
      partialPaymentsCount,
      totalSales: filteredData.length,
      averageSale: filteredData.length > 0 ? totalRevenue / filteredData.length : 0,
      totalCredit: totalRemaining,
    };
  }, [filteredData]);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (query.search) count++;
    if (query.paymentStatus) count++;
    if (query.paymentMethod) count++;
    if (query.startDate) count++;
    if (query.endDate) count++;
    if (query.minAmount !== undefined || query.maxAmount !== undefined) count++;
    setActiveFilters(count);
  }, [query]);

  const onChange: PaginationProps['onChange'] = (page) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  const onShowSizeChange: PaginationProps['onShowSizeChange'] = (current, size) => {
    setQuery((prev) => ({ ...prev, page: 1, limit: size }));
  };

  // Handle search input change with debounce
  const handleSearch = (value: string) => {
    setQuery((prev) => ({ 
      ...prev, 
      search: value,
      page: 1
    }));
  };

  // Handle search input clear
  const handleSearchClear = () => {
    setQuery((prev) => ({ 
      ...prev, 
      search: '',
      page: 1 
    }));
  };

  // Apply filters from drawer
  const handleApplyFilters = (values: FilterValues) => {
    const newQuery: QueryParams = {
      page: 1,
      limit: query.limit,
      search: values.search || '',
    };

    if (values.paymentStatus?.length === 1) {
      newQuery.paymentStatus = values.paymentStatus[0];
    }

    if (values.paymentMethod?.length === 1) {
      newQuery.paymentMethod = values.paymentMethod[0];
    }

    if (values.dateRange) {
      newQuery.startDate = values.dateRange[0].format('YYYY-MM-DD');
      newQuery.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }

    if (values.amountRange) {
      newQuery.minAmount = values.amountRange[0] || undefined;
      newQuery.maxAmount = values.amountRange[1] || undefined;
    }

    setQuery(newQuery);
    setFilterDrawerVisible(false);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setQuery({
      page: 1,
      limit: query.limit,
      search: '',
    });
    filterForm.resetFields();
    setFilterDrawerVisible(false);
  };

  // Remove specific filter
  const handleRemoveFilter = (filterKey: keyof QueryParams) => {
    setQuery(prev => {
      const newQuery = { ...prev, page: 1 };
      
      if (filterKey === 'startDate') {
        delete newQuery.startDate;
        delete newQuery.endDate;
      } else if (filterKey === 'minAmount') {
        delete newQuery.minAmount;
        delete newQuery.maxAmount;
      } else {
        delete newQuery[filterKey];
      }
      
      return newQuery;
    });
  };

  // Excel Export Functions
  const exportToExcel = async (exportType: 'all' | 'filtered' | 'current') => {
    try {
      setExportLoading(true);
      
      let dataToExport: ITableSale[];
      
      switch (exportType) {
        case 'all':
          dataToExport = allTableData;
          message.info(`Exporting all ${allTableData.length} transactions...`);
          break;
        case 'filtered':
          dataToExport = filteredData;
          message.info(`Exporting ${filteredData.length} filtered transactions...`);
          break;
        case 'current':
          dataToExport = paginatedData;
          message.info(`Exporting ${paginatedData.length} current page transactions...`);
          break;
        default:
          dataToExport = filteredData;
      }

      // Prepare Excel data
      const excelData = prepareExcelData(dataToExport, exportType);
      
      // Generate and download Excel file
      await generateAndDownloadExcel(excelData, exportType);
      
      message.success(`Exported ${dataToExport.length} transactions successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const prepareExcelData = (data: ITableSale[], exportType: string) => {
    // Main data rows
    const rows = data.map((item, index) => ({
      'Transaction Code': item.code,
      'Product Name': item.productName,
      'Buyer': item.buyerName,
      'Ctn': item.ctn,
      'Quantity': item.quantity,
      'Unit': item.unit,
      'Unit Price': `ETB ${item.productPrice?.toFixed(2) || '0.00'}`,
      'Total Price': `ETB ${item.totalPrice.toFixed(2)}`,
      'Paid Amount': `ETB ${item.paidAmount.toFixed(2)}`,
      'Remaining Amount': `ETB ${item.remainingAmount.toFixed(2)}`,
      'Payment Method': item.paymentMethod,
      'Bank Name': item.bankName || '',
      'Payment Status': item.paymentStatus,
      'Casher Name': item.casherName,
      'Reciever Name': item.recieverName || '',
      'Seller': item.sellerName,
      'Date': item.date,
      'Original Date': item.originalDate || '',
    }));

    // Summary row
    const summaryRow = {
      'Transaction Code': '',
      'Product Name': '',
      'Buyer': '',
      'Ctn': '',
      'Quantity': '',
      'Unit': '',
      'Unit Price': '',
      'Total Price': '',
      'Paid Amount': '',
      'Remaining Amount': '',
      'Payment Method': '',
      'Bank Name': '',
      'Payment Status': '',
      'Casher Name': '',
      'Reciever Name': '',
      'Date': '',
      'Original Date': '',
    };

    // Filter information
    const filterInfo = getFilterInformation(exportType);

    return {
      rows,
      summaryRow,
      filterInfo,
      totalRows: data.length,
      exportType,
    };
  };

  const getFilterInformation = (exportType: string) => {
    const filters: string[] = [];
    
    if (query.search) {
      filters.push(`Search: "${query.search}"`);
    }
    if (query.paymentStatus) {
      filters.push(`Status: ${query.paymentStatus}`);
    }
    if (query.paymentMethod) {
      filters.push(`Method: ${query.paymentMethod}`);
    }
    if (query.startDate && query.endDate) {
      filters.push(`Date Range: ${query.startDate} to ${query.endDate}`);
    }
    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      const min = query.minAmount !== undefined ? `ETB ${query.minAmount}` : 'Any';
      const max = query.maxAmount !== undefined ? `ETB ${query.maxAmount}` : 'Any';
      filters.push(`Amount Range: ${min} - ${max}`);
    }

    return {
      exportType,
      appliedFilters: filters,
      exportDate: new Date().toLocaleString(),
      totalAllTransactions: allTableData.length,
      totalFilteredTransactions: filteredData.length,
    };
  };

  const generateAndDownloadExcel = async (excelData: any, exportType: string) => {
    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create worksheets
      const mainData = [
        // Header row
        ['Sales Transactions Export'],
        [''],
        [`Export Type: ${exportType.toUpperCase()}`],
        [`Export Date: ${excelData.filterInfo.exportDate}`],
        [`Applied Filters: ${excelData.filterInfo.appliedFilters.join(' | ') || 'None'}`],
        [`Total Records: ${excelData.totalRows}`],
        [''],
        // Column headers
        Object.keys(excelData.rows[0] || {}),
        // Data rows
        ...excelData.rows.map((row: any) => Object.values(row)),
        // Empty row
        [],
        // Summary row
        Object.values(excelData.summaryRow),
      ];

      // Create worksheets
      const ws = XLSX.utils.aoa_to_sheet(mainData);
      //const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // No.
        { wch: 20 },  // Transaction Code
        { wch: 25 },  // Product Name
        { wch: 20 },  // Buyer
        { wch: 8 },   // Ctn
        { wch: 10 },  // Quantity
        { wch: 8 },   // Unit
        { wch: 12 },  // Unit Price
        { wch: 12 },  // Total Price
        { wch: 12 },  // Paid Amount
        { wch: 15 },  // Remaining Amount
        { wch: 15 },  // Payment Method
        { wch: 20 },  // Bank Name
        { wch: 12 },  // Payment Status
        { wch: 20 },  // Casher
        { wch: 20 },  // Reciever
        { wch: 20 },  // Seller
        { wch: 15 },  // Date
        { wch: 15 },  // Original Date
      ];
      ws['!cols'] = colWidths;

      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      //XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Generate filename
      const filename = `sales_export_${exportType}_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('Excel generation error:', error);
      
      // Fallback to CSV if XLSX fails
      generateCSVFallback(excelData, exportType);
    }
  };

  const generateCSVFallback = (excelData: any, exportType: string) => {
    try {
      // Create CSV content
      let csvContent = 'Sales Transactions Export\n\n';
      csvContent += `Export Type: ${exportType.toUpperCase()}\n`;
      csvContent += `Export Date: ${excelData.filterInfo.exportDate}\n`;
      csvContent += `Applied Filters: ${excelData.filterInfo.appliedFilters.join(' | ') || 'None'}\n`;
      csvContent += `Total Records: ${excelData.totalRows}\n\n`;

      // Add headers
      const headers = Object.keys(excelData.rows[0] || {});
      csvContent += headers.join(',') + '\n';

      // Add data rows
      excelData.rows.forEach((row: any) => {
        csvContent += Object.values(row).join(',') + '\n';
      });

      // Add summary
      csvContent += '\n' + Object.values(excelData.summaryRow).join(',');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `sales_export_${exportType}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('CSV fallback error:', error);
      throw error;
    }
  };

  // Export dropdown items
  const exportItems: MenuProps['items'] = [
    {
      key: 'current',
      label: 'Export Current Page',
      icon: <ExportOutlined />,
      onClick: () => exportToExcel('current'),
    },
    {
      key: 'filtered',
      label: 'Export Filtered Data',
      icon: <FilterOutlined />,
      onClick: () => exportToExcel('filtered'),
    },
    {
      key: 'all',
      label: 'Export All Data',
      icon: <ExportOutlined />,
      onClick: () => exportToExcel('all'),
    },
  ];

  // Reset form fields based on current query
  useEffect(() => {
    if (filterDrawerVisible) {
      filterForm.setFieldsValue({
        search: query.search,
        paymentStatus: query.paymentStatus ? [query.paymentStatus] : [],
        paymentMethod: query.paymentMethod ? [query.paymentMethod] : [],
        dateRange: query.startDate && query.endDate 
          ? [dayjs(query.startDate), dayjs(query.endDate)]
          : null,
        amountRange: query.minAmount !== undefined || query.maxAmount !== undefined
          ? [query.minAmount || 0, query.maxAmount || 0]
          : null,
      });
    }
  }, [filterDrawerVisible, query, filterForm]);

  // Mobile responsive columns
  const getMobileColumns = (): TableColumnsType<ITableSale> => {
    return [
      {
        title: 'Transaction',
        key: 'transaction',
        render: (record: ITableSale) => (
          <div style={{ padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: 4 }}>
                  {record.code} - {record.productName}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                  Buyer: {record.buyerName}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                  Seller: {record.sellerName}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Date: {record.date}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '16px' }}>
                  ETB {record.totalPrice.toLocaleString()}
                </div>
                <Tag 
                  color={record.paymentStatus === 'FULL' ? 'success' : 
                         record.paymentStatus === 'PARTIAL' ? 'warning' : 'error'}
                  style={{ fontSize: '10px', marginTop: 4 }}
                >
                  {record.paymentStatus}
                </Tag>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: 8, 
              marginBottom: 12,
              fontSize: '12px'
            }}>
              <div style={{ textAlign: 'center', background: '#f5f5f5', padding: '6px', borderRadius: '4px' }}>
                <div>Qty</div>
                <div style={{ fontWeight: 'bold' }}>{record.quantity}</div>
              </div>
              <div style={{ textAlign: 'center', background: '#e6f7ff', padding: '6px', borderRadius: '4px' }}>
                <div>Paid</div>
                <div style={{ fontWeight: 'bold', color: '#52c41a' }}>ETB {record.paidAmount.toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'center', background: '#fff2f0', padding: '6px', borderRadius: '4px' }}>
                <div>Remaining</div>
                <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>ETB {record.remainingAmount.toLocaleString()}</div>
              </div>
            </div>
            
            <Flex gap="small" wrap="wrap">
              <Text style={{ fontSize: '11px', color: '#666' }}>
                Method: 
                <Tag 
                  color="blue" 
                  style={{ 
                    marginLeft: '4px', 
                    fontSize: '10px',
                    padding: '2px 8px'
                  }}
                >
                  {record.paymentMethod}
                </Tag>
              </Text>
            </Flex>
            
            <div style={{ marginTop: '12px' }}>
              <Flex gap="small" wrap="wrap">
                {record.remainingAmount > 0 && record.paymentStatus !== 'FULL' && (
                  <RepaymentModal 
                    transaction={record} 
                    onSuccess={() => refetch()} 
                    size="small"
                  />
                )}
              </Flex>
            </div>
          </div>
        ),
      }
    ];
  };

  // Desktop columns
  const getDesktopColumns = (): TableColumnsType<ITableSale> => {
    return [
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        ellipsis: true,
        width: 120,
        sorter: (a, b) => a.code.localeCompare(b.code),
      },
      {
        title: 'Product',
        dataIndex: 'productName',
        key: 'productName',
        ellipsis: true,
        width: 200,
        sorter: (a, b) => a.productName.localeCompare(b.productName),
      },
      {
        title: 'Buyer',
        dataIndex: 'buyerName',
        key: 'buyerName',
        ellipsis: true,
        width: 150,
        sorter: (a, b) => a.buyerName.localeCompare(b.buyerName),
      },
      {
        title: 'Ctn',
        dataIndex: 'ctn',
        key: 'ctn',
        align: 'center' as const,
        width: 80,
        sorter: (a, b) => a.ctn - b.ctn,
      },
      {
        title: 'Qty',
        dataIndex: 'quantity',
        key: 'quantity',
        align: 'center' as const,
        width: 80,
        sorter: (a, b) => a.quantity - b.quantity,
      },
      {
        title: 'Total Price',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        align: 'right' as const,
        width: 120,
        render: (price: number) => `ETB ${price.toLocaleString()}`,
        sorter: (a, b) => a.totalPrice - b.totalPrice,
      },
      {
        title: 'Paid',
        dataIndex: 'paidAmount',
        key: 'paidAmount',
        align: 'right' as const,
        width: 120,
        render: (amount: number) => `ETB ${amount.toLocaleString()}`,
        sorter: (a, b) => a.paidAmount - b.paidAmount,
      },
      {
        title: 'Remaining',
        dataIndex: 'remainingAmount',
        key: 'remainingAmount',
        align: 'right' as const,
        width: 120,
        render: (amount: number) => (
          <Tag color={amount > 0 ? 'red' : 'green'}>
            ETB {amount.toLocaleString()}
          </Tag>
        ),
        sorter: (a, b) => a.remainingAmount - b.remainingAmount,
      },
      {
        title: 'Payment Method',
        dataIndex: 'paymentMethod',
        key: 'paymentMethod',
        align: 'center' as const,
        width: 140,
        render: (method: string) => {
          const methodConfig: Record<string, { text: string; color: string }> = {
            BANK_TRANSFER: { text: 'Bank', color: 'blue' },
            TELEBIRR: { text: 'Telebirr', color: 'green' },
            CASH: { text: 'Cash', color: 'orange' },
            PARTIAL: { text: 'Partial', color: 'purple' },
          };
          
          const config = methodConfig[method] || { text: method, color: 'default' };
          return <Tag color={config.color}>{config.text}</Tag>;
        },
        filters: [
          { text: 'Cash', value: 'CASH' },
          { text: 'Bank', value: 'BANK_TRANSFER' },
          { text: 'Telebirr', value: 'TELEBIRR' },
        ],
        onFilter: (value, record) => record.paymentMethod === value,
      },
      {        title: 'Bank',
        dataIndex: 'bankName',
        key: 'bankName',
        ellipsis: true,
        width: 150,
        sorter: (a, b) => (a.bankName || '').localeCompare(b.bankName || ''),
      },
      {
        title: 'Status',
        dataIndex: 'paymentStatus',
        key: 'paymentStatus',
        align: 'center' as const,
        width: 100,
        render: (status: string, record: ITableSale) => {
          const statusConfig: Record<string, { color: string; text?: string }> = {
            FULL: { color: 'success', text: 'Paid' },
            PARTIAL: { color: 'warning', text: 'Partial' },
            PENDING: { color: 'error', text: 'Pending' },
          };
          
          const config = statusConfig[status] || { color: 'default', text: status };
          return (
            <Tag color={config.color}>
              {config.text}
              {record.remainingAmount > 0 && ` (ETB ${record.remainingAmount.toLocaleString()})`}
            </Tag>
          );
        },
        filters: [
          { text: 'Paid', value: 'FULL' },
          { text: 'Partial', value: 'PARTIAL' },
          { text: 'Pending', value: 'PENDING' },
        ],
        onFilter: (value, record) => record.paymentStatus === value,
      },
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        align: 'center' as const,
        width: 120,
        sorter: (a, b) => new Date(a.originalDate || a.date).getTime() - new Date(b.originalDate || b.date).getTime(),
      },
      {
        title: 'Receiver',
        dataIndex: 'recieverName',
        key: 'recieverName',
        ellipsis: true,
        width: 150,
        sorter: (a, b) => a.recieverName.localeCompare(b.recieverName),
      },
      {
        title: 'Casher',
        dataIndex: 'casherName',
        key: 'casherName',
        ellipsis: true,
        width: 150,
        sorter: (a, b) => a.casherName.localeCompare(b.casherName),
      },
      // {
      //   title: 'Seller/system',
      //   dataIndex: 'sellerName',
      //   key: 'sellerName',
      //   ellipsis: true,
      //   width: 150,
      //   sorter: (a, b) => a.sellerName.localeCompare(b.sellerName),
      // },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center' as const,
        width: 150,
        fixed: 'right' as const,
        render: (_, record: ITableSale) => (
          <Flex gap="small" justify="center">
            {record.remainingAmount > 0 && record.paymentStatus !== 'FULL' && (
              <RepaymentModal 
                transaction={record} 
                onSuccess={() => refetch()} 
              />
            )}
          </Flex>
        ),
      },
    ];
  };

  const columns = screens.md ? getDesktopColumns() : getMobileColumns();
  const isMobile = !screens.md;

  // Helper function for Tag size styling
  const getTagSizeStyles = (isMobile: boolean) => {
    return isMobile ? { fontSize: '10px', padding: '2px 8px' } : {};
  };

  return (
    <div style={{ padding: isMobile ? '12px' : '16px' }}>
      {/* Safety Notice */}
      <Alert
        message="Sales Data Protection"
        description={
          <div>
            <p>Sale deletion is disabled to protect financial data integrity. Sales records are critical for:</p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Financial reporting and auditing</li>
              <li>Tax compliance and documentation</li>
              <li>Inventory management and tracking</li>
              <li>Customer purchase history</li>
              <li>Business analytics and forecasting</li>
            </ul>
            <p style={{ marginTop: '8px', fontWeight: 'bold' }}>
              To correct errors, use the repayment feature for partial payments or contact your system administrator.
            </p>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ 
          marginBottom: '16px',
          backgroundColor: '#e6f7ff',
          borderColor: '#91d5ff'
        }}
      />

      {/* Mobile Header */}
      {isMobile ? (
        <Card size="small" style={{ marginBottom: '12px' }}>
          <Flex justify="space-between" align="center">
            <div>
              <Title level={5} style={{ margin: 0 }}>Sales</Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {filteredData.length} transactions
              </Text>
            </div>
            <Flex gap="small">
              <Badge count={activeFilters} size="small" offset={[-5, 5]}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setFilterDrawerVisible(true)}
                  size="small"
                />
              </Badge>
              <Dropdown 
                menu={{ 
                  items: exportItems,
                  disabled: exportLoading || filteredData.length === 0
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  icon={<ExportOutlined />}
                  loading={exportLoading}
                  disabled={filteredData.length === 0}
                  size="small"
                />
              </Dropdown>
              <Button
                icon={showMobileSummary ? <UpOutlined /> : <DownOutlined />}
                onClick={() => setShowMobileSummary(!showMobileSummary)}
                size="small"
              />
            </Flex>
          </Flex>
          
          {/* Mobile Search */}
          <div style={{ marginTop: '12px' }}>
            <Input.Search
              placeholder="Search sales..."
              style={{ width: '100%' }}
              value={query.search}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              allowClear
              onClear={handleSearchClear}
              enterButton={<SearchOutlined />}
              size="small"
            />
          </div>
        </Card>
      ) : (
        /* Desktop Header */
        <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>Sales Management</Title>
          <Flex gap="small" align="center">
            <Input.Search
              placeholder="Search by product, buyer, code, or seller..."
              style={{ width: '300px' }}
              value={query.search}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
              allowClear
              onClear={handleSearchClear}
              enterButton={<SearchOutlined />}
              loading={isFetching}
            />
            <Badge count={activeFilters} size="small">
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerVisible(true)}
              >
                Filters
              </Button>
            </Badge>
            <Dropdown 
              menu={{ 
                items: exportItems,
                disabled: exportLoading || filteredData.length === 0
              }}
              trigger={['click']}
            >
              <Button
                icon={<ExportOutlined />}
                loading={exportLoading}
                disabled={exportLoading || filteredData.length === 0}
              >
                Export
              </Button>
            </Dropdown>
            {activeFilters > 0 && (
              <Button
                icon={<ClearOutlined />}
                onClick={handleClearAllFilters}
                danger
                size="small"
              >
                Clear All
              </Button>
            )}
          </Flex>
        </Flex>
      )}

      {/* Active Filters Display */}
      {activeFilters > 0 && (
        <Card size="small" style={{ marginBottom: isMobile ? '12px' : '16px' }}>
          <Flex gap="small" align="center" wrap="wrap">
            <Text type="secondary" style={{ fontSize: '12px', marginRight: '8px' }}>
              Active Filters:
            </Text>
            {query.search && (
              <Tag 
                closable 
                onClose={() => handleRemoveFilter('search')} 
                style={getTagSizeStyles(isMobile)}
              >
                Search: "{query.search}"
              </Tag>
            )}
            {query.paymentStatus && (
              <Tag 
                closable 
                onClose={() => handleRemoveFilter('paymentStatus')} 
                style={getTagSizeStyles(isMobile)}
              >
                Status: {query.paymentStatus}
              </Tag>
            )}
            {query.paymentMethod && (
              <Tag 
                closable 
                onClose={() => handleRemoveFilter('paymentMethod')} 
                style={getTagSizeStyles(isMobile)}
              >
                Method: {query.paymentMethod}
              </Tag>
            )}
            {query.startDate && query.endDate && (
              <Tag 
                closable 
                onClose={() => handleRemoveFilter('startDate')} 
                style={getTagSizeStyles(isMobile)}
              >
                Date: {query.startDate} to {query.endDate}
              </Tag>
            )}
            {(query.minAmount !== undefined || query.maxAmount !== undefined) && (
              <Tag 
                closable 
                onClose={() => handleRemoveFilter('minAmount')} 
                style={getTagSizeStyles(isMobile)}
              >
                Amount: {query.minAmount !== undefined ? `ETB ${query.minAmount.toLocaleString()}` : 'Any'} - {query.maxAmount !== undefined ? `ETB ${query.maxAmount.toLocaleString()}` : 'Any'}
              </Tag>
            )}
          </Flex>
        </Card>
      )}

      {/* Mobile Summary Collapse */}
      {isMobile && showMobileSummary && (
        <Collapse 
          defaultActiveKey={['1']}
          style={{ marginBottom: '12px' }}
          size="small"
        >
          <Panel 
            header={
              <Flex justify="space-between" align="center">
                <Text strong>Summary</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Click to expand/collapse
                </Text>
              </Flex>
            } 
            key="1"
          >
            <MobileSummary filteredStats={filteredStats} />
          </Panel>
        </Collapse>
      )}

      {/* Desktop Summary Cards */}
      {!isMobile && (
        <>
          {/* Outstanding Debts Alert */}
          {filteredStats.outstandingDebts > 0 && (
            <Alert
              message={
                <Flex justify="space-between" align="center">
                  <div>
                    <strong>Outstanding Debts:</strong> ETB {filteredStats.outstandingDebts.toLocaleString()} 
                    <span style={{ marginLeft: '16px', color: '#666' }}>
                      ({filteredStats.partialPaymentsCount} partial payments pending)
                    </span>
                  </div>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => {
                      const partialRows = document.querySelectorAll('[data-partial="true"]');
                      if (partialRows.length > 0) {
                        partialRows[0].scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    View Partial Payments
                  </Button>
                </Flex>
              }
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {/* Summary Cards */}
          <Card size="small" style={{ marginBottom: '20px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={4}>
                <Statistic
                  title="Total Revenue"
                  value={filteredStats.totalRevenue}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                  formatter={(value) => `ETB ${Number(value).toLocaleString()}`}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Statistic
                  title="Total Paid"
                  value={filteredStats.totalPaid}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  formatter={(value) => `ETB ${Number(value).toLocaleString()}`}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Statistic
                  title="Outstanding"
                  value={filteredStats.outstandingDebts}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                  formatter={(value) => `ETB ${Number(value).toLocaleString()}`}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Statistic
                  title="Payment Ratio"
                  value={(filteredStats.paymentRatio * 100).toFixed(1)}
                  suffix="%"
                  valueStyle={{ 
                    color: filteredStats.paymentRatio >= 0.9 ? '#52c41a' : 
                           filteredStats.paymentRatio >= 0.5 ? '#1890ff' : '#ff4d4f'
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Statistic
                  title="Partial Payments"
                  value={filteredStats.partialPaymentsCount}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <Statistic
                  title="Transactions"
                  value={filteredStats.transactionCount}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
            
            {/* Additional Summary Info */}
            <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
              <Row gutter={[16, 8]}>
                <Col xs={12} sm={6}>
                  <div>Total Sales: <strong>{filteredStats.totalSales}</strong></div>
                </Col>
                <Col xs={12} sm={6}>
                  <div>Remaining: <strong>ETB {filteredStats.totalRemaining.toLocaleString()}</strong></div>
                </Col>
                <Col xs={12} sm={6}>
                  <div>Avg Sale: <strong>ETB {filteredStats.averageSale.toLocaleString()}</strong></div>
                </Col>
                <Col xs={12} sm={6}>
                  <div>Credit: <strong>ETB {filteredStats.totalCredit.toLocaleString()}</strong></div>
                </Col>
              </Row>
            </div>
          </Card>

          {/* Payment Method Stats */}
          {Object.keys(filteredStats.paymentMethodStats).length > 0 && (
            <Card size="small" style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>Payment Methods</div>
              <Row gutter={[8, 8]}>
                {Object.entries(filteredStats.paymentMethodStats).map(([method, amount]) => (
                  <Col key={method} xs={12} sm={6} md={3}>
                    <Card size="small" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        {method.replace('_', ' ')}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        ETB {(amount as number).toLocaleString()}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </>
      )}

      {/* Mobile Outstanding Debts Alert */}
      {isMobile && filteredStats.outstandingDebts > 0 && (
        <Alert
          message={
            <div>
              <Text strong>Outstanding: ETB {filteredStats.outstandingDebts.toLocaleString()}</Text>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {filteredStats.partialPaymentsCount} partial payments
              </div>
            </div>
          }
          type="warning"
          showIcon
          action={
            <Button 
              type="primary" 
              size="small"
              onClick={() => {
                const partialRows = document.querySelectorAll('[data-partial="true"]');
                if (partialRows.length > 0) {
                  partialRows[0].scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              View
            </Button>
          }
          style={{ marginBottom: '12px' }}
        />
      )}

      {allTableData.length === 0 && isFetching ? (
        <div style={{ textAlign: 'center', padding: isMobile ? '32px 16px' : '48px 24px' }}>
          <div style={{ fontSize: isMobile ? '14px' : '16px' }}>Loading transactions...</div>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: isMobile ? '32px 16px' : '48px 24px',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          marginTop: '16px'
        }}>
          <Title level={isMobile ? 4 : 3}>No transactions found</Title>
          <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
            {query.search || activeFilters > 0 ? 'No results found with current filters' : 'No transactions available'}
          </Text>
          {(query.search || activeFilters > 0) && (
            <Button 
              type="primary" 
              onClick={handleClearAllFilters}
              style={{ marginTop: '16px' }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <Card size="small">
            {!isMobile && (
              <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold' }}>
                  Transactions ({filteredData.length} filtered from {allTableData.length} total)
                  {query.search && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                      Search: "{query.search}"
                    </span>
                  )}
                </div>
                <Flex gap="small" align="center">
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    Page Size:
                  </span>
                  <Select
                    size="small"
                    value={query.limit}
                    onChange={(value) => onShowSizeChange(1, value)}
                    style={{ width: 80 }}
                  >
                    <Option value={10}>10</Option>
                    <Option value={25}>25</Option>
                    <Option value={50}>50</Option>
                    <Option value={100}>100</Option>
                    <Option value={500}>500</Option>
                  </Select>
                </Flex>
              </Flex>
            )}
            
            <Table
              columns={columns}
              dataSource={paginatedData.map(item => ({
                ...item,
                'data-partial': item.remainingAmount > 0 ? 'true' : 'false'
              }))}
              loading={isFetching}
              pagination={false}
              bordered={!isMobile}
              size={isMobile ? "middle" : "middle"}
              scroll={isMobile ? undefined : { x: 'max-content' }}
              rowClassName={(record) => record.remainingAmount > 0 ? 'partial-payment-row' : ''}
              showHeader={!isMobile}
              style={{
                borderRadius: isMobile ? '0' : '8px',
                overflow: isMobile ? 'visible' : 'auto'
              }}
            />
          </Card>
          
          {filteredData.length > 0 && (
            <Flex 
              justify="space-between" 
              align="center" 
              style={{ marginTop: '24px' }}
              wrap={isMobile ? 'wrap' : 'nowrap'}
              gap={isMobile ? 'small' : 'none'}
            >
              <div style={{ color: '#666', fontSize: isMobile ? '12px' : '14px', marginBottom: isMobile ? '8px' : 0 }}>
                Showing {((query.page - 1) * query.limit) + 1} to{' '}
                {Math.min(query.page * query.limit, filteredData.length)} of{' '}
                {filteredData.length} transactions
              </div>
              <Pagination
                current={query.page}
                onChange={onChange}
                total={filteredData.length}
                pageSize={query.limit}
                pageSizeOptions={['10', '25', '50', '100']}
                showSizeChanger={!isMobile}
                showQuickJumper={!isMobile}
                showTotal={!isMobile ? (total, range) => `${range[0]}-${range[1]} of ${total} items` : undefined}
                simple={isMobile}
                size={isMobile ? "small" : "default"}
                responsive={true}
              />
            </Flex>
          )}
        </>
      )}

      {/* Filter Drawer - Mobile Optimized */}
      <Drawer
        title={
          <Flex justify="space-between" align="center">
            <Text strong>Filters</Text>
            <Badge count={activeFilters} size="small" />
          </Flex>
        }
        placement={isMobile ? "bottom" : "right"}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={isMobile ? '100%' : 400}
        height={isMobile ? '80%' : '100%'}
        style={{ 
          borderTopLeftRadius: isMobile ? '12px' : 0,
          borderTopRightRadius: isMobile ? '12px' : 0 
        }}
        extra={
          <Button 
            type="link" 
            onClick={handleClearAllFilters}
            size="small"
          >
            Clear All
          </Button>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={handleApplyFilters}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Form.Item
              label="Search"
              name="search"
            >
              <Input.Search
                placeholder="Search by product, buyer, code, or seller..."
                allowClear
                size={isMobile ? "large" : "middle"}
              />
            </Form.Item>

            <Form.Item
              label="Payment Status"
              name="paymentStatus"
            >
              <Select
                mode="multiple"
                placeholder="Select payment status"
                allowClear
                maxTagCount="responsive"
                size={isMobile ? "large" : "middle"}
              >
                <Option value="FULL">Paid</Option>
                <Option value="PARTIAL">Partial</Option>
                <Option value="PENDING">Pending</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Payment Method"
              name="paymentMethod"
            >
              <Select
                mode="multiple"
                placeholder="Select payment method"
                allowClear
                maxTagCount="responsive"
                size={isMobile ? "large" : "middle"}
              >
                <Option value="CASH">Cash</Option>
                <Option value="BANK_TRANSFER">Bank Transfer</Option>
                <Option value="TELEBIRR">Telebirr</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Date Range"
              name="dateRange"
            >
              <RangePicker
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder={['Start Date', 'End Date']}
                size={isMobile ? "large" : "middle"}
              />
            </Form.Item>

            <Form.Item
              label="Amount Range (ETB)"
              name="amountRange"
            >
              <Input.Group compact>
                <Form.Item
                  name={['amountRange', 0]}
                  noStyle
                >
                  <InputNumber
                    style={{ width: '50%' }}
                    placeholder="Min"
                    min={0}
                    formatter={(value) => `ETB ${value}`}
                    size={isMobile ? "large" : "middle"}
                  />
                </Form.Item>
                <Form.Item
                  name={['amountRange', 1]}
                  noStyle
                >
                  <InputNumber
                    style={{ width: '50%' }}
                    placeholder="Max"
                    min={0}
                    formatter={(value) => `ETB ${value}`}
                    size={isMobile ? "large" : "middle"}
                  />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </div>

          <div style={{ paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            <Space style={{ width: '100%' }}>
              <Button
                onClick={() => setFilterDrawerVisible(false)}
                style={{ width: '50%' }}
                size={isMobile ? "large" : "middle"}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: '50%' }}
                size={isMobile ? "large" : "middle"}
              >
                Apply Filters
              </Button>
            </Space>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

// Mobile Summary Component
const MobileSummary = ({ filteredStats }: { filteredStats: any }) => {
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ textAlign: 'center', background: '#e6f7ff', padding: '12px 8px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Revenue</div>
          <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '14px' }}>
            ETB {filteredStats.totalRevenue.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'center', background: '#f6ffed', padding: '12px 8px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Paid</div>
          <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: '14px' }}>
            ETB {filteredStats.totalPaid.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'center', background: '#fff2f0', padding: '12px 8px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Outstanding</div>
          <div style={{ fontWeight: 'bold', color: '#ff4d4f', fontSize: '14px' }}>
            ETB {filteredStats.outstandingDebts.toLocaleString()}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ textAlign: 'center', background: '#fff7e6', padding: '12px 8px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Ratio</div>
          <div style={{ fontWeight: 'bold', color: '#fa8c16', fontSize: '14px' }}>
            {(filteredStats.paymentRatio * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ textAlign: 'center', background: '#f9f0ff', padding: '12px 8px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Partial</div>
          <div style={{ fontWeight: 'bold', color: '#722ed1', fontSize: '14px' }}>
            {filteredStats.partialPaymentsCount}
          </div>
        </div>
        <div style={{ textAlign: 'center', background: '#f6ffed', padding: '12px 8px', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Transactions</div>
          <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: '14px' }}>
            {filteredStats.transactionCount}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Repayment Modal - Mobile Optimized
 */
const RepaymentModal = ({ transaction, onSuccess, size = "middle" }: { 
  transaction: any, 
  onSuccess: () => void, 
  size?: "small" | "middle" | "large" 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [addPayment, { isLoading }] = useRecordRepaymentMutation(); // Use addPayment, not updateSale
  const screens = useBreakpoint();
  
  // Ensure we have valid transaction data
  const maxAmount = transaction.remainingAmount || 0;
  const originalTotal = transaction.totalPrice || 0;
  const alreadyPaid = transaction.paidAmount || 0;
  const saleId = transaction.id; // This should be the sale ID

  const showModal = () => {
    setIsModalOpen(true);
    form.setFieldsValue({
      amount: maxAmount > 0 ? maxAmount : 0,
      paymentMethod: 'CASH'
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    try {
      const paymentAmount = parseFloat(values.amount);
      
      // Validate payment amount
      if (paymentAmount <= 0) {
        toastMessage({ 
          icon: 'error', 
          text: 'Payment amount must be greater than 0' 
        });
        return;
      }

      if (paymentAmount > maxAmount) {
        toastMessage({ 
          icon: 'error', 
          text: `Payment amount (ETB ${paymentAmount.toLocaleString()}) cannot exceed remaining amount (ETB ${maxAmount.toLocaleString()})` 
        });
        return;
      }

      if (!saleId) {
        toastMessage({ 
          icon: 'error', 
          text: 'Invalid transaction ID' 
        });
        return;
      }

      // Prepare payment data according to backend expectations
      const paymentData = {
        amount: paymentAmount,
        paymentMethod: values.paymentMethod,
        notes: values.notes || '',
        // Include optional fields if needed
        bankName: values.bankName,
        transactionId: values.transactionId,
        senderName: values.senderName,
        telebirrPhone: values.telebirrPhone,
        telebirrTransactionId: values.telebirrTransactionId,
        otherMethod: values.otherMethod,
        otherReference: values.otherReference
      };

      console.log('Sending payment data:', {
        saleId,
        paymentData
      });

      // Call the addPayment mutation (NOT updateSale)
      const res = await addPayment({ 
        saleId: saleId, 
        ...paymentData 
      }).unwrap();

      console.log('Payment response:', res);

      if (res.success) {
        toastMessage({ 
          icon: 'success', 
          text: `Payment of ETB ${paymentAmount.toLocaleString()} recorded successfully!` 
        });
        onSuccess(); // Refresh the data
        handleCancel(); // Close modal
      } else {
        toastMessage({ 
          icon: 'error', 
          text: res.message || 'Failed to record payment' 
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toastMessage({ 
        icon: 'error', 
        text: error.data?.message || error.message || 'Failed to record payment' 
      });
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<DollarOutlined />}
        onClick={showModal}
        size={size}
        style={{ backgroundColor: '#52c41a' }}
        disabled={maxAmount <= 0} // Disable if no remaining amount
      >
        {screens.md ? 'Repay' : ''}
      </Button>
      
      <Modal
        title="Record Payment"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={screens.md ? 500 : '90%'}
        style={{ 
          top: screens.md ? undefined : 20,
          maxHeight: screens.md ? undefined : '90vh',
          overflow: 'auto'
        }}
      >
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            <strong>Transaction Details:</strong>
          </div>
          <Row gutter={[16, 8]}>
            <Col span={screens.md ? 12 : 24}>
              <div style={{ fontSize: '12px' }}>Buyer:</div>
              <div style={{ fontWeight: 'bold' }}>{transaction.buyerName || 'N/A'}</div>
            </Col>
            <Col span={screens.md ? 12 : 24}>
              <div style={{ fontSize: '12px' }}>Product:</div>
              <div style={{ fontWeight: 'bold' }}>{transaction.productName || 'N/A'}</div>
            </Col>
            <Col span={screens.md ? 8 : 12}>
              <div style={{ fontSize: '12px' }}>Total:</div>
              <div style={{ fontWeight: 'bold' }}>ETB {originalTotal.toLocaleString()}</div>
            </Col>
            <Col span={screens.md ? 8 : 12}>
              <div style={{ fontSize: '12px' }}>Paid:</div>
              <div style={{ fontWeight: 'bold', color: '#52c41a' }}>ETB {alreadyPaid.toLocaleString()}</div>
            </Col>
            <Col span={screens.md ? 8 : 24}>
              <div style={{ fontSize: '12px' }}>Remaining:</div>
              <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>ETB {maxAmount.toLocaleString()}</div>
            </Col>
          </Row>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Payment Amount (ETB)"
            name="amount"
            rules={[
              { required: true, message: 'Please enter payment amount' },
              { 
                type: 'number',
                min: 0.01,
                max: maxAmount,
                message: `Amount must be between ETB 0.01 and ETB ${maxAmount.toLocaleString()}`
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              max={maxAmount}
              step={0.01}
              precision={2}
              placeholder={`Enter amount up to ETB ${maxAmount.toLocaleString()}`}
              formatter={(value) => `ETB ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/ETB\s?|(,*)/g, '')}
              size={screens.md ? "middle" : "large"}
              disabled={maxAmount <= 0}
            />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select 
              placeholder="Select payment method"
              size={screens.md ? "middle" : "large"}
            >
              <Option value="CASH">Cash</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="TELEBIRR">Telebirr</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>

          {/* Optional fields based on payment method */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.paymentMethod !== currentValues.paymentMethod}
          >
            {({ getFieldValue }) => {
              const paymentMethod = getFieldValue('paymentMethod');
              
              if (paymentMethod === 'BANK_TRANSFER') {
                return (
                  <>
                    <Form.Item
                      label="Bank Name"
                      name="bankName"
                      rules={[{ required: true, message: 'Bank name is required for bank transfers' }]}
                    >
                      <Input placeholder="Enter bank name" />
                    </Form.Item>
                    <Form.Item
                      label="Transaction ID"
                      name="transactionId"
                      rules={[{ required: true, message: 'Transaction ID is required' }]}
                    >
                      <Input placeholder="Enter transaction ID" />
                    </Form.Item>
                    <Form.Item
                      label="Sender Name"
                      name="senderName"
                    >
                      <Input placeholder="Enter sender name" />
                    </Form.Item>
                  </>
                );
              }
              
              if (paymentMethod === 'TELEBIRR') {
                return (
                  <>
                    <Form.Item
                      label="Telebirr Phone"
                      name="telebirrPhone"
                      rules={[{ required: true, message: 'Phone number is required for Telebirr' }]}
                    >
                      <Input placeholder="Enter phone number" />
                    </Form.Item>
                    <Form.Item
                      label="Transaction ID"
                      name="telebirrTransactionId"
                      rules={[{ required: true, message: 'Transaction ID is required' }]}
                    >
                      <Input placeholder="Enter transaction ID" />
                    </Form.Item>
                  </>
                );
              }
              
              return null;
            }}
          </Form.Item>

          <Form.Item
            label="Notes (Optional)"
            name="notes"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="Add any notes about this payment..." 
              size={screens.md ? "middle" : "large"}
            />
          </Form.Item>

          <Flex justify="space-between" style={{ marginTop: '24px' }}>
            <Button 
              onClick={handleCancel} 
              disabled={isLoading}
              size={screens.md ? "middle" : "large"}
              style={{ width: '48%' }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              icon={<CheckCircleOutlined />}
              size={screens.md ? "middle" : "large"}
              style={{ width: '48%' }}
              disabled={maxAmount <= 0}
            >
              Record Payment
            </Button>
          </Flex>
        </Form>
      </Modal>
    </>
  );
};

export default SaleManagementPage;