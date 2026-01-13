import { Alert, Tag, Select, Typography, Space, Grid } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMonthlySaleQuery } from '../../redux/features/management/saleApi';
import Loader from '../Loader';
import { useState, useMemo } from 'react';

const { Option } = Select;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const MonthlyChart = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = !screens.lg && screens.md;
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // State for year selection
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
  );
  
  // Fetch monthly data
  const { data: monthlyResponse, isLoading, error, refetch } = 
    useMonthlySaleQuery({ month: selectedMonth });

  // Extract sales data from API response
  const salesData = useMemo(() => {
    if (!monthlyResponse?.success) return [];
    
    if (Array.isArray(monthlyResponse.data?.sales)) {
      return monthlyResponse.data.sales;
    }
    
    if (Array.isArray(monthlyResponse.data)) {
      return monthlyResponse.data;
    }
    
    return [];
  }, [monthlyResponse]);

  // Generate month options for the current year
  const monthOptions = useMemo(() => {
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const monthStr = i.toString().padStart(2, '0');
      months.push({
        value: `${selectedYear}-${monthStr}`,
        label: new Date(selectedYear, i - 1).toLocaleString('default', { month: 'short' })
      });
    }
    return months;
  }, [selectedYear]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!salesData.length) {
      return {
        totalRevenue: 0,
        totalQuantity: 0,
        totalSales: 0,
        averageRevenue: 0,
        activeDays: 0
      };
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyRevenue: Record<number, number> = {};

    salesData.forEach((sale: any) => {
      if (!sale.date) return;
      
      try {
        const saleDate = new Date(sale.date);
        if (
          saleDate.getFullYear() === year && 
          saleDate.getMonth() + 1 === month
        ) {
          const day = saleDate.getDate();
          dailyRevenue[day] = (dailyRevenue[day] || 0) + (Number(sale.total_price) || 0);
        }
      } catch (error) {
        console.error('Error processing sale:', error);
      }
    });

    const totals = salesData.reduce(
      (acc, sale) => ({
        totalRevenue: acc.totalRevenue + (Number(sale.total_price) || 0),
        totalQuantity: acc.totalQuantity + (Number(sale.quantity) || 0),
        totalSales: acc.totalSales + 1,
      }),
      { totalRevenue: 0, totalQuantity: 0, totalSales: 0 }
    );

    return {
      ...totals,
      averageRevenue: totals.totalSales > 0 ? totals.totalRevenue / totals.totalSales : 0,
      activeDays: Object.keys(dailyRevenue).length
    };
  }, [salesData, selectedMonth]);

  // Prepare chart data - optimized version
  const chartData = useMemo(() => {
    if (!salesData.length) return [];

    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Initialize array for all days
      const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        return {
          day,
          date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          revenue: 0,
          quantity: 0,
          transactionCount: 0
        };
      });

      // Process sales data
      salesData.forEach((sale: any) => {
        if (!sale.date) return;
        
        try {
          const saleDate = new Date(sale.date);
          if (
            saleDate.getFullYear() === year && 
            saleDate.getMonth() + 1 === month
          ) {
            const day = saleDate.getDate() - 1;
            if (day >= 0 && day < dailyData.length) {
              dailyData[day].revenue += Number(sale.total_price) || 0;
              dailyData[day].quantity += Number(sale.quantity) || 0;
              dailyData[day].transactionCount += 1;
            }
          }
        } catch (error) {
          // Silently handle date parsing errors
        }
      });

      // Format for chart
      return dailyData.map(dayData => ({
        ...dayData,
        name: isMobile ? dayData.day.toString() : `Day ${dayData.day}`,
        label: dayData.day.toString(),
        fullDate: dayData.date
      }));
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return [];
    }
  }, [salesData, selectedMonth, isMobile]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0]?.payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          minWidth: '160px',
          fontSize: '12px'
        }}>
          <p style={{ 
            margin: '0 0 6px 0', 
            fontWeight: 'bold', 
            fontSize: '13px' 
          }}>
            {dataItem?.fullDate || `Day ${dataItem?.day}`}
          </p>
          <div style={{ lineHeight: '1.4' }}>
            <p style={{ margin: '3px 0', color: '#1890ff' }}>
              <strong>Revenue:</strong> ${dataItem?.revenue?.toLocaleString()}
            </p>
            <p style={{ margin: '3px 0', color: '#666' }}>
              <strong>Quantity:</strong> {dataItem?.quantity?.toLocaleString()}
            </p>
            <p style={{ margin: '3px 0', color: '#666' }}>
              <strong>Transactions:</strong> {dataItem?.transactionCount}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Data"
        description="Failed to load monthly sales data"
        type="error"
        showIcon
        style={{ margin: '10px' }}
        action={
          <button 
            onClick={() => refetch()} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#1890ff', 
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        }
      />
    );
  }

  if (salesData.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Alert
          message="No Sales Data"
          description={`No sales transactions found for ${selectedMonth}.`}
          type="info"
          showIcon
        />
      </div>
    );
  }

  const hasData = chartData.some(day => day.revenue > 0);
  
  if (!hasData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Alert
          message="No Chart Data"
          description={`No sales data available for ${selectedMonth}.`}
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // Responsive X-axis tick formatter
  const xAxisTickFormatter = (value: string) => {
    const day = parseInt(value);
    const daysInMonth = chartData.length;
    
    if (isMobile) {
      // Show only 1st, middle, and last days on mobile
      if (day === 1 || day === Math.floor(daysInMonth / 2) || day === daysInMonth) {
        return day.toString();
      }
      return '';
    } else if (isTablet) {
      // Show every 5th day on tablet
      return day % 5 === 0 ? day.toString() : '';
    } else {
      // Show every 3rd day on desktop
      return day % 3 === 0 ? day.toString() : '';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with controls - Compact version */}
      <div style={{ 
        marginBottom: '12px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '8px'
      }}>
        <Text strong style={{ 
          fontSize: isMobile ? '14px' : '16px',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          {selectedMonth}
        </Text>
        
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size="small">
          <Select
            value={selectedYear}
            onChange={(year) => {
              setSelectedYear(year);
              setSelectedMonth(`${year}-${selectedMonth.split('-')[1]}`);
            }}
            style={{ width: isMobile ? '100%' : '90px' }}
            size="small"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>
          
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            style={{ width: isMobile ? '100%' : '110px' }}
            size="small"
            options={monthOptions}
          />
        </Space>
      </div>

      {/* Compact Summary Stats */}
      <div style={{ 
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: '#fafafa',
        borderRadius: '6px',
        border: '1px solid #f0f0f0'
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '6px',
          justifyContent: 'center'
        }}>
          <Tag color="blue" style={{ 
            fontSize: '11px', 
            padding: '2px 6px',
            margin: 0
          }}>
            ${statistics.totalRevenue.toLocaleString()}
          </Tag>
          <Tag color="green" style={{ 
            fontSize: '11px', 
            padding: '2px 6px',
            margin: 0
          }}>
            {statistics.totalSales} sales
          </Tag>
          <Tag color="orange" style={{ 
            fontSize: '11px', 
            padding: '2px 6px',
            margin: 0
          }}>
            ${statistics.averageRevenue.toFixed(0)} avg
          </Tag>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ flex: 1, minHeight: '0' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}
            margin={{
              top: 5,
              right: 5,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              fontSize={10}
              tickFormatter={xAxisTickFormatter}
              tick={{ fill: '#666' }}
            />
            <YAxis 
              fontSize={10}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              width={40}
              tick={{ fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="#1890ff" 
              name="Revenue ($)"
              radius={[2, 2, 0, 0]}
              barSize={isMobile ? 10 : 14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Info */}
      <div style={{ 
        marginTop: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
        color: '#666'
      }}>
        <span>
          Active days: {statistics.activeDays}/{chartData.length}
        </span>
        <span>
          Total: ${statistics.totalRevenue.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default MonthlyChart;