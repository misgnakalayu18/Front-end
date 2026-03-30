import { Alert } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMonthlySaleQuery } from '../../redux/features/management/saleApi';
import Loader from '../common/Loader';
import { useState, useMemo } from 'react';

interface DailyBreakdownItem {
  sale_date: string;
  day: number;
  transaction_count: string;
  total_revenue: number;
  total_quantity: number;
  total_cartons: number;
  payment_methods: string;
  split_methods: string | null;
  primary_payment_method: string;
  average_transaction_value: number;
}

interface MonthlyResponse {
  success: boolean;
  message: string;
  data: {
    month: string;
    year: number;
    monthIndex: number;
    summary: {
      total_revenue: number;
      total_quantity: number;
      total_cartons: number;
      total_transactions: number;
    };
    daily_breakdown: DailyBreakdownItem[];
    payment_methods: string[];
  };
}

export default function MonthlyChart() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const [selectedMonth] = useState<string>(
    `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
  );
  
  const { data: monthlyResponse, isLoading, error, refetch } = 
    useMonthlySaleQuery({ month: selectedMonth });

  // Prepare chart data
  const chartData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const allDaysData = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return {
        name: day.toString(),
        day: day,
        revenue: 0,
        quantity: 0,
        salesCount: 0,
        fullDate: `${selectedMonth}-${day.toString().padStart(2, '0')}`,
        hasData: false
      };
    });

    if (monthlyResponse?.success && monthlyResponse?.data?.daily_breakdown) {
      monthlyResponse.data.daily_breakdown.forEach(item => {
        const dayIndex = item.day - 1;
        if (dayIndex >= 0 && dayIndex < allDaysData.length) {
          allDaysData[dayIndex].revenue = Number(item.total_revenue) || 0;
          allDaysData[dayIndex].quantity = Number(item.total_quantity) || 0;
          allDaysData[dayIndex].salesCount = parseInt(item.transaction_count) || 0;
          allDaysData[dayIndex].hasData = true;
        }
      });
    }
    
    return allDaysData;
  }, [monthlyResponse, selectedMonth]);

  // Calculate totals
  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, day) => ({
        totalRevenue: acc.totalRevenue + (day.revenue || 0),
        totalQuantity: acc.totalQuantity + (day.quantity || 0),
        totalSales: acc.totalSales + (day.salesCount || 0),
        activeDays: acc.activeDays + (day.hasData ? 1 : 0),
      }),
      { totalRevenue: 0, totalQuantity: 0, totalSales: 0, activeDays: 0 }
    );
  }, [chartData]);

  // Find max revenue for scaling
  const maxRevenue = useMemo(() => {
    return Math.max(...chartData.map(d => d.revenue), 1000);
  }, [chartData]);

  // Responsive x-axis tick formatter - show more labels on wider monthly chart
  const xAxisTickFormatter = (value: string) => {
    const day = parseInt(value);
    if (!day) return '';
    
    const daysInMonth = chartData.length;
    
    // Monthly chart has more width, so we can show more labels
    if (window.innerWidth < 768) {
      // Mobile: show every 5th day
      return day % 5 === 0 ? day.toString() : '';
    } else if (window.innerWidth < 1200) {
      // Tablet: show every 3rd day
      return day % 3 === 0 ? day.toString() : '';
    } else {
      // Desktop: show every 2nd day
      return day % 2 === 0 ? day.toString() : '';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0]?.payload;
      if (!dataItem || dataItem.revenue === 0) return null;
      
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
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '13px' }}>
            {dataItem.fullDate}
          </p>
          <div style={{ lineHeight: '1.4' }}>
            <p style={{ margin: '3px 0', color: '#8884d8' }}>
              <strong>Revenue:</strong> ETB {dataItem.revenue?.toLocaleString()}
            </p>
            <p style={{ margin: '3px 0', color: '#82ca9d' }}>
              <strong>Quantity:</strong> {dataItem.quantity?.toLocaleString()} pcs
            </p>
            <p style={{ margin: '3px 0', color: '#666' }}>
              <strong>Sales:</strong> {dataItem.salesCount}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Monthly Data"
        description="There was an error loading the monthly sales chart."
        type="error"
        showIcon
        style={{ margin: '20px' }}
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

  if (totals.activeDays === 0) {
    return (
      <Alert
        message="No Monthly Data"
        description={`No sales data available for ${selectedMonth}.`}
        type="info"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      width: '100%',
      display: 'flex', 
      flexDirection: 'column'
    }}>
      <div style={{ 
        marginBottom: '8px', 
        fontWeight: 'bold', 
        fontSize: '14px',
        textAlign: 'center'
      }}>
        {selectedMonth} Daily Sales
      </div>
      
      <div style={{ 
        marginBottom: '8px', 
        padding: '6px 8px', 
        backgroundColor: '#f6ffed', 
        borderRadius: '4px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
          <span><strong>Revenue:</strong> ETB {(totals.totalRevenue / 1000000).toFixed(1)}M</span>
          <span><strong>Qty:</strong> {totals.totalQuantity}</span>
          <span><strong>Trans:</strong> {totals.totalSales}</span>
          <span><strong>Active:</strong> {totals.activeDays}/{chartData.length}</span>
        </div>
      </div>
      
      {/* Chart Container */}
      <div style={{ 
        width: '100%',
        height: '280px', // Slightly shorter to fit more width
        backgroundColor: '#ffffff',
        borderRadius: '4px'
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              fontSize={9}
              tickFormatter={xAxisTickFormatter}
              interval={0}
              tick={{ fill: '#666' }}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis 
              fontSize={9}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value.toString();
              }}
              width={35}
              tick={{ fill: '#666' }}
              domain={[0, maxRevenue * 1.1]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="#8884d8" 
              name="Revenue"
              radius={[2, 2, 0, 0]}
              barSize={window.innerWidth < 768 ? 6 : window.innerWidth < 1200 ? 8 : 10}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}