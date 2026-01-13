import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Row, 
  Col, 
  Table, 
  Card, 
  Statistic, 
  message, 
  Space, 
  Typography,
  Spin,
  Select,
  Descriptions
} from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined,
  CalendarOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  TransactionOutlined
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { useGenerateReportMutation } from '../redux/features/management/reportApi';

const { Title, Text } = Typography;
const { Option } = Select;

const GenerateReportPage = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportType, setReportType] = useState('sales');
  const [reportData, setReportData] = useState<any>(null);
  
  // Using RTK Query mutation
  const [generateReport, { isLoading }] = useGenerateReportMutation();

  const handleGenerate = async () => {
    if (!fromDate || !toDate) {
      message.error('Please select both from and to dates.');
      return;
    }

    try {
      const result = await generateReport({ 
        startDate: fromDate, 
        endDate: toDate,
        
      }).unwrap();
      
      if (result.success) {
        setReportData(result.data);
        message.success('Report generated successfully!');
      } else {
        message.error(result.message || 'Failed to generate report.');
      }
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to generate report.');
    }
  };

  // Generate PDF on frontend
  const generatePDF = () => {
    if (!reportData) {
      message.error('No report data available.');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Sales Report', 105, 20, { align: 'center' });
      
      // Date Range
      doc.setFontSize(12);
      doc.text(`Date Range: ${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}`, 105, 30, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 38, { align: 'center' });
      
      // Summary Section
      const startY = 50;
      doc.setFontSize(16);
      doc.text('Summary', 14, startY);
      
      const summaryData = [
        ['Total Revenue', `$${reportData.summary.totalRevenue.toFixed(2)}`],
        ['Total Paid', `$${reportData.summary.totalPaid.toFixed(2)}`],
        ['Total Credit', `$${reportData.summary.totalCredit.toFixed(2)}`],
        ['Total Quantity', reportData.summary.totalQuantity],
        ['Total Transactions', reportData.summary.totalTransactions],
        ['Avg Transaction', `$${reportData.summary.averageTransactionValue.toFixed(2)}`]
      ];
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 10 }
      });
      
      // Revenue by Payment Method
      const paymentMethodY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(16);
      doc.text('Revenue by Payment Method', 14, paymentMethodY);
      
      const paymentMethodData = reportData.revenueByPaymentMethod.map((item: any) => [
        item.paymentMethod,
        item.productName,
        `$${item.productPrice.toFixed(2)}`,
        `$${item.totalRevenue.toFixed(2)}`,
        item.quantity,
        item.count
      ]);
      
      autoTable(doc, {
        startY: paymentMethodY + 5,
        head: [['Payment Method', 'Product', 'Price', 'Revenue', 'Quantity', 'Transactions']],
        body: paymentMethodData,
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96], textColor: 255 },
        styles: { fontSize: 9 }
      });
      
      // Payment Method Totals
      const totalsY = (doc as any).lastAutoTable.finalY + 20;
      if (reportData.summary.paymentMethodTotals) {
        doc.setFontSize(16);
        doc.text('Payment Method Summary', 14, totalsY);
        
        const totalsData = Object.entries(reportData.summary.paymentMethodTotals).map(([method, data]: [string, any]) => [
          method,
          `$${data.revenue.toFixed(2)}`,
          data.count
        ]);
        
        autoTable(doc, {
          startY: totalsY + 5,
          head: [['Payment Method', 'Total Revenue', 'Transaction Count']],
          body: totalsData,
          theme: 'grid',
          headStyles: { fillColor: [142, 68, 173], textColor: 255 },
          styles: { fontSize: 10 }
        });
      }
      
      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.text('© Sales Management System', 105, finalY, { align: 'center' });
      
      // Save the PDF
      doc.save(`sales-report-${fromDate}-to-${toDate}.pdf`);
      message.success('PDF generated successfully!');
    } catch (error) {
      message.error('Failed to generate PDF.');
    }
  };

  // Generate Excel on frontend with detailed sales information
  const generateExcel = () => {
    if (!reportData) {
      message.error('No report data available.');
      return;
    }

    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Revenue by Payment Method sheet
      const paymentMethodSheetData = [
        ['Revenue by Payment Method'],
        [`Date Range: ${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}`],
        [`Report Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`],
        [],
        ['Payment Method', 'Product Name', 'Product Code', 'Product Price', 'Total Revenue', 'Quantity', 'Transaction Count']
      ];
      
      reportData.revenueByPaymentMethod.forEach((item: any) => {
        paymentMethodSheetData.push([
          item.paymentMethod,
          item.productName,
          item.productCode || 'N/A',
          item.productPrice,
          item.totalRevenue,
          item.quantity,
          item.count
        ]);
      });
      
      const paymentMethodSheet = XLSX.utils.aoa_to_sheet(paymentMethodSheetData);
      XLSX.utils.book_append_sheet(workbook, paymentMethodSheet, 'Payment Methods');
      
      // Detailed Sales sheet with comprehensive information from API response
      const detailedSheetData = [
        ['Detailed Sales Transactions'],
        [`Date Range: ${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}`],
        ['Total Records:', reportData.detailedSales.length],
        [],
        [
          'ID', 
          'Date', 
          'Product Name', 
          'Product Code', 
          'Product Price', 
          'Quantity', 
          'Total Price',
          'Paid Amount', 
          'Remaining Amount',
          'Payment Method', 
          'Payment Status',
          'Buyer Name',
          'Warehouse',
          'Sales Person',
          'Sales Email',
          'Created At'
        ]
      ];
      
      reportData.detailedSales.forEach((sale: any) => {
        detailedSheetData.push([
          sale.id,
          dayjs(sale.date).format('YYYY-MM-DD HH:mm:ss'),
          sale.product?.name || 'Unknown Product',
          sale.product?.code || 'N/A',
          sale.product?.price || 0,
          sale.quantity,
          sale.total_price || sale.totalPrice,
          sale.paid_amount || sale.paidAmount,
          sale.remaining_amount || sale.remainingAmount,
          sale.payment_method || sale.paymentMethod,
          sale.payment_status || sale.paymentStatus,
          sale.buyer_name || sale.buyerName || 'N/A',
          sale.warehouse || sale.product?.warehouse || 'N/A',
          sale.user?.name || 'N/A',
          sale.user?.email || 'N/A',
          dayjs(sale.created_at || sale.createdAt).format('YYYY-MM-DD HH:mm:ss')
        ]);
      });
      
      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedSheetData);
      
      // Set column widths for better readability
      const wscols = [
        {wch: 8},   // ID
        {wch: 20},  // Date
        {wch: 25},  // Product Name
        {wch: 15},  // Product Code
        {wch: 12},  // Product Price
        {wch: 10},  // Quantity
        {wch: 12},  // Total Price
        {wch: 12},  // Paid Amount
        {wch: 15},  // Remaining Amount
        {wch: 15},  // Payment Method
        {wch: 15},  // Payment Status
        {wch: 20},  // Buyer Name
        {wch: 15},  // Warehouse
        {wch: 20},  // Sales Person
        {wch: 25},  // Sales Email
        {wch: 20},  // Created At
      ];
      detailedSheet['!cols'] = wscols;
      
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Sales');
      
      // Daily Sales sheet
      if (reportData.analytics?.dailySales?.length > 0) {
        const dailySheetData = [
          ['Daily Sales Trend'],
          [`Date Range: ${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}`],
          [],
          ['Date', 'Revenue', 'Quantity Sold', 'Transactions']
        ];
        
        reportData.analytics.dailySales.forEach((day: any) => {
          dailySheetData.push([
            day.date,
            day.revenue,
            day.quantity,
            day.transactions || 0
          ]);
        });
        
        const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);
        XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Sales');
      }
      
      // Top Products sheet
      if (reportData.analytics?.topProducts?.length > 0) {
        const topProductsSheetData = [
          ['Top Performing Products'],
          [`Date Range: ${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}`],
          [],
          ['Rank', 'Product Name', 'Product Code', 'Total Revenue', 'Total Quantity', 'Sales Count', 'Average Price']
        ];
        
        reportData.analytics.topProducts.forEach((product: any, index: number) => {
          topProductsSheetData.push([
            index + 1,
            product.productName,
            product.productCode,
            product.totalRevenue,
            product.totalQuantity,
            product.salesCount,
            product.totalRevenue / product.totalQuantity
          ]);
        });
        
        const topProductsSheet = XLSX.utils.aoa_to_sheet(topProductsSheetData);
        XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Top Products');
      }
      
      // Product Performance sheet - aggregated from detailed sales
      if (reportData.detailedSales?.length > 0) {
        const productPerformance: Record<string, any> = {};
        
        reportData.detailedSales.forEach((sale: any) => {
          const productName = sale.product?.name || 'Unknown Product';
          const productCode = sale.product?.code || 'N/A';
          const key = `${productName}-${productCode}`;
          
          if (!productPerformance[key]) {
            productPerformance[key] = {
              productName,
              productCode,
              totalRevenue: 0,
              totalQuantity: 0,
              salesCount: 0,
              totalPaid: 0,
              totalRemaining: 0,
              warehouses: new Set(),
              paymentMethods: new Set()
            };
          }
          
          productPerformance[key].totalRevenue += sale.total_price || sale.totalPrice || 0;
          productPerformance[key].totalQuantity += sale.quantity || 0;
          productPerformance[key].salesCount += 1;
          productPerformance[key].totalPaid += sale.paid_amount || sale.paidAmount || 0;
          productPerformance[key].totalRemaining += sale.remaining_amount || sale.remainingAmount || 0;
          
          if (sale.warehouse) productPerformance[key].warehouses.add(sale.warehouse);
          if (sale.product?.warehouse) productPerformance[key].warehouses.add(sale.product.warehouse);
          if (sale.payment_method) productPerformance[key].paymentMethods.add(sale.payment_method);
          if (sale.paymentMethod) productPerformance[key].paymentMethods.add(sale.paymentMethod);
        });
        
        const productPerformanceSheetData = [
          ['Product Performance Summary'],
          [`Date Range: ${reportData.summary.dateRange.startDate} to ${reportData.summary.dateRange.endDate}`],
          [],
          ['Product Name', 'Product Code', 'Total Revenue', 'Total Quantity', 'Sales Count', 'Total Paid', 'Total Credit', 'Avg Price', 'Warehouses', 'Payment Methods']
        ];
        
        Object.values(productPerformance).forEach((product: any) => {
          productPerformanceSheetData.push([
            product.productName,
            product.productCode,
            product.totalRevenue,
            product.totalQuantity,
            product.salesCount,
            product.totalPaid,
            product.totalRemaining,
            product.totalQuantity > 0 ? product.totalRevenue / product.totalQuantity : 0,
            Array.from(product.warehouses).join(', '),
            Array.from(product.paymentMethods).join(', ')
          ]);
        });
        
        const productPerformanceSheet = XLSX.utils.aoa_to_sheet(productPerformanceSheetData);
        XLSX.utils.book_append_sheet(workbook, productPerformanceSheet, 'Product Performance');
      }
      
      // Save the Excel file
      const fileName = `sales-report-${fromDate}-to-${toDate}-${dayjs().format('YYYYMMDD-HHmmss')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      message.success('Excel file generated successfully!');
    } catch (error) {
      console.error('Excel generation error:', error);
      message.error('Failed to generate Excel file.');
    }
  };

  const columns = [
    { 
      title: 'Payment Method', 
      dataIndex: 'paymentMethod', 
      key: 'paymentMethod',
      filters: [
        { text: 'Cash', value: 'CASH' },
        { text: 'Bank Transfer', value: 'BANK_TRANSFER' },
        { text: 'Telebirr', value: 'TELEBIRR' },
        { text: 'Partial', value: 'PARTIAL' },
        { text: 'Other', value: 'OTHER' },
      ],
      onFilter: (value: any, record: any) => record.paymentMethod === value,
    },
    { 
      title: 'Product Name', 
      dataIndex: 'productName', 
      key: 'productName',
      sorter: (a: any, b: any) => a.productName?.localeCompare(b.productName),
    },
    { 
      title: 'Product Price', 
      dataIndex: 'productPrice', 
      key: 'productPrice', 
      render: (price: number) => price ? `$${price.toFixed(2)}` : 'N/A',
      sorter: (a: any, b: any) => (a.productPrice || 0) - (b.productPrice || 0),
    },
    { 
      title: 'Quantity Sold', 
      dataIndex: 'quantity', 
      key: 'quantity',
      sorter: (a: any, b: any) => a.quantity - b.quantity,
    },
    { 
      title: 'Total Revenue', 
      dataIndex: 'totalRevenue', 
      key: 'totalRevenue', 
      render: (revenue: number) => `$${revenue.toFixed(2)}`,
      sorter: (a: any, b: any) => a.totalRevenue - b.totalRevenue,
    },
    { 
      title: 'Transaction Count', 
      dataIndex: 'count', 
      key: 'count',
      sorter: (a: any, b: any) => a.count - b.count,
    },
  ];

  const detailedSalesColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'productName',
      render: (text: string, record: any) => record.product?.name || 'Unknown Product',
    },
    {
      title: 'Product Code',
      dataIndex: ['product', 'code'],
      key: 'productCode',
      render: (text: string, record: any) => record.product?.code || 'N/A',
    },
    {
      title: 'Buyer',
      dataIndex: 'buyerName',
      key: 'buyerName',
      render: (text: string) => text || 'N/A',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Total Price',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price: number) => `$${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (text: string, record: any) => record.payment_method || record.paymentMethod,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (text: string, record: any) => record.payment_status || record.paymentStatus,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse',
      key: 'warehouse',
      render: (text: string, record: any) => text || record.product?.warehouse || 'N/A',
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
        📊 Generate Sales Report
      </Title>

      {/* Date Selection and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <Space size="large" wrap>
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>From Date</Text>
              <Input
                type="date"
                style={{ width: '200px', height: '40px' }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                prefix={<CalendarOutlined />}
              />
            </div>
            
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>To Date</Text>
              <Input
                type="date"
                style={{ width: '200px', height: '40px' }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                prefix={<CalendarOutlined />}
              />
            </div>
            
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>Report Type</Text>
              <Select
                value={reportType}
                onChange={setReportType}
                style={{ width: '200px', height: '40px' }}
              >
                <Option value="sales">Sales Report</Option>
                {/* <Option value="inventory">Inventory Report</Option>
                <Option value="financial">Financial Report</Option> */}
              </Select>
            </div>
            
            <div style={{ alignSelf: 'flex-end' }}>
              <Button 
                type="primary" 
                size="large"
                onClick={handleGenerate} 
                loading={isLoading}
                icon={<DownloadOutlined />}
                style={{ height: '40px', padding: '0 24px' }}
              >
                Generate Report
              </Button>
            </div>
          </Space>
        </div>
      </Card>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="Generating report..." />
        </div>
      )}

      {reportData && !isLoading && (
        <>
          {/* Summary Section */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                bordered={false}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <Statistic
                  title={<Text style={{ color: 'white' }}>Total Revenue</Text>}
                  value={reportData.summary.totalRevenue}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  precision={2}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                bordered={false}
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
              >
                <Statistic
                  title={<Text style={{ color: 'white' }}>Total Paid</Text>}
                  value={reportData.summary.totalPaid}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  precision={2}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                bordered={false}
                style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
              >
                <Statistic
                  title={<Text style={{ color: 'white' }}>Total Credit</Text>}
                  value={reportData.summary.totalCredit}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  precision={2}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                bordered={false}
                style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
              >
                <Statistic
                  title={<Text style={{ color: 'white' }}>Quantity Sold</Text>}
                  value={reportData.summary.totalQuantity}
                  prefix={<ShoppingCartOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                bordered={false}
                style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}
              >
                <Statistic
                  title={<Text style={{ color: 'white' }}>Transactions</Text>}
                  value={reportData.summary.totalTransactions}
                  prefix={<TransactionOutlined style={{ color: 'white' }} />}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card 
                bordered={false}
                style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' }}
              >
                <Statistic
                  title={<Text style={{ color: 'white' }}>Avg Transaction</Text>}
                  value={reportData.summary.averageTransactionValue}
                  prefix={<DollarOutlined style={{ color: 'white' }} />}
                  precision={2}
                  valueStyle={{ color: 'white' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Date Range Info */}
          <Descriptions 
            title="Report Information" 
            bordered 
            style={{ marginBottom: '24px' }}
            column={{ xs: 1, sm: 2, md: 3 }}
          >
            <Descriptions.Item label="Date Range">
              {reportData.summary.dateRange.startDate} to {reportData.summary.dateRange.endDate}
            </Descriptions.Item>
            <Descriptions.Item label="Generated On">
              {dayjs(reportData.metadata?.generatedAt || new Date()).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="Total Records">
              {reportData.metadata?.recordCount?.detailedSales || reportData.detailedSales?.length || 0} sales records
            </Descriptions.Item>
          </Descriptions>

          {/* Export Buttons */}
          <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Space size="large">
              <Button 
                type="primary" 
                danger
                size="large"
                onClick={generatePDF}
                icon={<FilePdfOutlined />}
                style={{ 
                  padding: '0 30px',
                  height: '45px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                  border: 'none'
                }}
              >
                Export as PDF
              </Button>
              <Button 
                type="primary" 
                size="large"
                onClick={generateExcel}
                icon={<FileExcelOutlined />}
                style={{ 
                  padding: '0 30px',
                  height: '45px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #217346 0%, #29b474 100%)',
                  border: 'none'
                }}
              >
                Export as Excel
              </Button>
            </Space>
          </Card>

          {/* Revenue by Payment Method Table */}
          <Card 
            title="📈 Revenue by Payment Method" 
            style={{ marginBottom: '24px' }}
            extra={
              <Text type="secondary">
                Total Entries: {reportData.metadata?.recordCount?.revenueEntries || reportData.revenueByPaymentMethod?.length || 0}
              </Text>
            }
          >
            <Table
              dataSource={reportData.revenueByPaymentMethod}
              columns={columns}
              rowKey={(record) => `${record.paymentMethod}-${record.productName}-${record.productPrice}`}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} entries`
              }}
              scroll={{ x: 800 }}
            />
          </Card>

          {/* Detailed Sales Table */}
          <Card 
            title="📋 Detailed Sales" 
            style={{ marginBottom: '24px' }}
            extra={
              <Text type="secondary">
                Showing {Math.min(reportData.detailedSales?.length || 0, 100)} of {reportData.detailedSales?.length || 0} records
              </Text>
            }
          >
            <Table
              dataSource={reportData.detailedSales}
              columns={detailedSalesColumns}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
              scroll={{ x: 1200 }}
            />
          </Card>

          {/* Analytics Section */}
          {reportData.analytics && (
            <Row gutter={[16, 16]}>
              {/* Daily Sales */}
              {reportData.analytics.dailySales && reportData.analytics.dailySales.length > 0 && (
                <Col xs={24} md={12}>
                  <Card title="📅 Daily Sales Trend">
                    <div style={{ padding: '10px' }}>
                      <p>Showing data for {reportData.analytics.dailySales.length} days</p>
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {reportData.analytics.dailySales.map((day: any) => (
                          <div 
                            key={day.date}
                            style={{
                              padding: '8px',
                              borderBottom: '1px solid #f0f0f0',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}
                          >
                            <Text strong>{day.date}</Text>
                            <Text>
                              <DollarOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                              {day.revenue.toFixed(2)} | 
                              <ShoppingCartOutlined style={{ color: '#1890ff', marginLeft: '8px', marginRight: '4px' }} />
                              {day.quantity} units
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>
              )}

              {/* Top Products */}
              {reportData.analytics.topProducts && reportData.analytics.topProducts.length > 0 && (
                <Col xs={24} md={12}>
                  <Card title="🏆 Top Performing Products">
                    <div style={{ padding: '10px' }}>
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {reportData.analytics.topProducts.map((product: any, index: number) => (
                          <div 
                            key={product.product_id || product.productCode}
                            style={{
                              padding: '8px',
                              borderBottom: '1px solid #f0f0f0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <Text strong>#{index + 1}. {product.productName}</Text>
                              <div>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  Code: {product.productCode}
                                </Text>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div>
                                <DollarOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                                <Text strong>{product.totalRevenue.toFixed(2)}</Text>
                              </div>
                              <div>
                                <ShoppingCartOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
                                <Text>{product.totalQuantity} sold</Text>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default GenerateReportPage;