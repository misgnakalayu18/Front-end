// Updated DailyChart.tsx with better responsiveness
import { Alert } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { useDailySaleQuery } from '../../redux/features/management/saleApi';
import Loader from '../Loader';
import { useEffect, useMemo, useState } from 'react';

export default function DailyChart() {
  const todayFormatted = new Date().toISOString().split('T')[0];
  const { 
    data: dailyResponse, 
    isFetching: isDailyLoading, 
    error, 
    refetch 
  } = useDailySaleQuery({ date: todayFormatted });

  const [containerWidth, setContainerWidth] = useState(0);

  // Get transactions from response
  const getTransactions = useMemo(() => {
    if (!dailyResponse) return [];
    
    if (dailyResponse.success && dailyResponse.data && Array.isArray(dailyResponse.data.sales)) {
      return dailyResponse.data.sales;
    }
    
    if (Array.isArray(dailyResponse?.data?.sales)) {
      return dailyResponse.data.sales;
    }
    
    if (Array.isArray(dailyResponse)) {
      return dailyResponse;
    }
    
    return [];
  }, [dailyResponse]);

  const transactions = getTransactions;

  // Aggregate by hour for today's sales
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    try {
      const hourlyAggregates: { [key: string]: any } = {};

      transactions.forEach((sale: any) => {
        if (!sale.date) return;

        try {
          const saleDate = new Date(sale.date);
          if (isNaN(saleDate.getTime())) return;

          const hour = saleDate.getHours();
          const hourKey = `${hour.toString().padStart(2, '0')}:00`;

          if (!hourlyAggregates[hourKey]) {
            hourlyAggregates[hourKey] = {
              hour,
              hourKey,
              totalRevenue: 0,
              totalQuantity: 0,
              salesCount: 0,
              label: hourKey
            };
          }

          hourlyAggregates[hourKey].totalRevenue += Number(sale.total_price) || 0;
          hourlyAggregates[hourKey].totalQuantity += Number(sale.quantity) || 0;
          hourlyAggregates[hourKey].salesCount += 1;
        } catch (error) {
          console.error('Error processing sale:', error);
        }
      });

      // Create all 24 hours (00:00 to 23:00) with 0 values
      return Array.from({ length: 24 }, (_, i) => {
        const hourKey = `${i.toString().padStart(2, '0')}:00`;
        return {
          name: hourKey,
          hourKey,
          hour: i,
          revenue: hourlyAggregates[hourKey]?.totalRevenue || 0,
          quantity: hourlyAggregates[hourKey]?.totalQuantity || 0,
          salesCount: hourlyAggregates[hourKey]?.salesCount || 0,
          label: hourKey
        };
      });
    } catch (error) {
      console.error('Error aggregating daily data:', error);
      return [];
    }
  }, [transactions]);

  // Calculate totals for display
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, sale) => ({
        totalRevenue: acc.totalRevenue + (Number(sale.total_price) || 0),
        totalQuantity: acc.totalQuantity + (Number(sale.quantity) || 0),
        totalSales: acc.totalSales + 1,
      }),
      { totalRevenue: 0, totalQuantity: 0, totalSales: 0 }
    );
  }, [transactions]);

  // Responsive x-axis tick formatter
  const xAxisTickFormatter = (value: string) => {
    const hour = parseInt(value.split(':')[0]);
    
    // Show fewer labels on smaller screens
    if (containerWidth < 400) {
      return hour % 6 === 0 ? `${hour}:00` : '';
    } else if (containerWidth < 600) {
      return hour % 4 === 0 ? `${hour}:00` : '';
    } else {
      return hour % 3 === 0 ? `${hour}:00` : '';
    }
  };

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
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '13px' }}>
            {dataItem?.name || label}
          </p>
          <div style={{ lineHeight: '1.4' }}>
            <p style={{ margin: '3px 0', color: '#8884d8' }}>
              <strong>Revenue:</strong> ETB {dataItem?.revenue?.toLocaleString()}
            </p>
            <p style={{ margin: '3px 0', color: '#82ca9d' }}>
              <strong>Quantity:</strong> {dataItem?.quantity?.toLocaleString()} pcs
            </p>
            <p style={{ margin: '3px 0', color: '#666' }}>
              <strong>Sales:</strong> {dataItem?.salesCount}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isDailyLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Daily Data"
        description="There was an error loading the daily sales chart."
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

  if (transactions.length === 0) {
    return (
      <Alert
        message="No Daily Data"
        description="No sales data available for today."
        type="info"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        marginBottom: '12px', 
        fontWeight: 'bold', 
        fontSize: '14px',
        textAlign: 'center'
      }}>
        Today's Hourly Sales
      </div>
      
      <div style={{ 
        marginBottom: '12px', 
        padding: '8px', 
        backgroundColor: '#f6ffed', 
        borderRadius: '4px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <strong>Revenue:</strong> ETB {totals.totalRevenue.toLocaleString()}
          </div>
          <div>
            <strong>Quantity:</strong> {totals.totalQuantity.toLocaleString()} pcs
          </div>
          <div>
            <strong>Transactions:</strong> {totals.totalSales}
          </div>
        </div>
      </div>
      
      <div 
        style={{ flex: 1, minHeight: '200px' }}
        ref={(el) => {
          if (el) {
            setContainerWidth(el.clientWidth);
          }
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              fontSize={10}
              tickFormatter={xAxisTickFormatter}
              interval={0}
            />
            <YAxis 
              fontSize={10}
              tickFormatter={(value) => `ETB ${value.toLocaleString()}`}
              width={containerWidth < 400 ? 50 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar 
              dataKey="revenue" 
              fill="#8884d8" 
              name="Revenue (ETB)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}