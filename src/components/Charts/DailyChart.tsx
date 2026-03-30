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
import Loader from '../common/Loader';
import { useMemo, useState } from 'react';

export default function DailyChart() {
   const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayFormatted = `${year}-${month}-${day}`; // This will be "2026-02-26"
  
  console.log('DailyChart - Requesting date:', todayFormatted); // Should log "2026-02-26"

  const { 
    data: dailyResponse, 
    isFetching: isDailyLoading, 
    error, 
    refetch 
  } = useDailySaleQuery({ date: todayFormatted });

  const [containerWidth, setContainerWidth] = useState(0);

  // Log the actual response to debug
  console.log('DailyChart - Full Response:', dailyResponse);

  // Extract transactions correctly from the API response
  const transactions = useMemo(() => {
    if (!dailyResponse) return [];

    // Case 1: Response with success flag and data.sales array (your actual structure)
    if (dailyResponse.success && dailyResponse.data?.sales && Array.isArray(dailyResponse.data.sales)) {
      console.log('DailyChart - Found sales:', dailyResponse.data.sales.length);
      return dailyResponse.data.sales;
    }
    
    // Case 2: Direct array in response
    if (Array.isArray(dailyResponse)) {
      return dailyResponse;
    }
    
    // Case 3: Response with data that is an array
    if (dailyResponse.data && Array.isArray(dailyResponse.data)) {
      return dailyResponse.data;
    }

    console.log('DailyChart - No sales array found, response structure:', dailyResponse);
    return [];
  }, [dailyResponse]);

  // Aggregate by hour for today's sales
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    try {
      const hourlyAggregates: { [key: string]: any } = {};

      transactions.forEach((sale: any) => {
        // Handle different possible date field names
        const dateStr = sale.date || sale.created_at || sale.sale_date;
        if (!dateStr) {
          console.warn('Sale missing date:', sale);
          return;
        }

        try {
          const saleDate = new Date(dateStr);
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

          // Handle different possible price field names
          const revenue = Number(sale.total_price || sale.totalPrice || sale.total || 0);
          const quantity = Number(sale.quantity || sale.qty || 0);

          hourlyAggregates[hourKey].totalRevenue += revenue;
          hourlyAggregates[hourKey].totalQuantity += quantity;
          hourlyAggregates[hourKey].salesCount += 1;
        } catch (error) {
          console.error('Error processing sale:', error, sale);
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
      (acc, sale) => {
        const revenue = Number(sale.total_price || sale.totalPrice || sale.total || 0);
        const quantity = Number(sale.quantity || sale.qty || 0);
        return {
          totalRevenue: acc.totalRevenue + revenue,
          totalQuantity: acc.totalQuantity + quantity,
          totalSales: acc.totalSales + 1,
        };
      },
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
              <strong>Transactions:</strong> {dataItem?.salesCount}
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
    console.error('DailyChart - Error:', error);
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
        message="No Sales Today"
        description="No sales data available for today (February 26, 2026)."
        type="info"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  // Check if any hour has revenue
  const hasData = chartData.some(hour => hour.revenue > 0);
  if (!hasData) {
    return (
      <Alert
        message="No Hourly Data"
        description="Sales exist but could not be grouped by hour."
        type="warning"
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
        Today's Hourly Sales  - {todayFormatted}
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