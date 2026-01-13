import { Col, Row, Spin, Card, Statistic, Typography } from 'antd';
import {
  useDailySaleQuery,
  useMonthlySaleQuery,
  useWeeklySaleQuery,
  useYearlySaleQuery,
} from '../redux/features/management/saleApi';
import { useMemo } from 'react';
import {
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const SaleHistoryPage = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const todayFormatted = new Date().toISOString().split('T')[0];
  
  // Fetch data
  const { data: yearlyResponse, isFetching: isYearlyLoading } = 
    useYearlySaleQuery({ year: currentYear });
  
  const { data: monthlyResponse, isFetching: isMonthlyLoading } = 
    useMonthlySaleQuery({ year: currentYear, month: currentMonth });
  
  const { data: weeklyResponse, isFetching: isWeeklyLoading } = 
    useWeeklySaleQuery({ year: currentYear, month: currentMonth });
  
  const { data: dailyResponse, isFetching: isDailyLoading } = 
    useDailySaleQuery({ createdAt: todayFormatted });

  // Extract revenue from API responses
  const extractRevenue = (response: any): number => {
    if (!response) return 0;
    
    // Yearly API with snake_case
    if (response.success && response.data?.summary) {
      return Number(response.data.summary.total_revenue || response.data.summary.totalRevenue || 0);
    }
    
    // Monthly/Weekly API with camelCase
    if (response.success && response.data?.summary) {
      return Number(response.data.summary.totalRevenue || response.data.summary.total_revenue || 0);
    }
    
    // Transformed response with summary
    if (response.summary) {
      return Number(response.summary.total_revenue || response.summary.totalRevenue || 0);
    }
    
    // Daily API as array
    if (Array.isArray(response)) {
      return response.reduce((sum: number, transaction: any) => {
        return sum + (Number(transaction.totalPrice) || 0);
      }, 0);
    }
    
    // Daily API wrapped
    if (response.success && Array.isArray(response.data)) {
      return response.data.reduce((sum: number, transaction: any) => {
        return sum + (Number(transaction.totalPrice) || 0);
      }, 0);
    }
    
    return 0;
  };

  // Calculate revenues
  const yearlyRevenue = extractRevenue(yearlyResponse);
  const monthlyRevenue = extractRevenue(monthlyResponse);
  const weeklyRevenue = extractRevenue(weeklyResponse);
  const dailyRevenue = extractRevenue(dailyResponse);

  const periodData = useMemo(() => [
    {
      key: 'yearly',
      title: 'Yearly Revenue',
      subtitle: `Total for ${currentYear}`,
      revenue: yearlyRevenue,
      isLoading: isYearlyLoading,
      color: '#1890ff',
      icon: <CalendarOutlined style={{ color: '#1890ff' }} />,
    },
    {
      key: 'monthly',
      title: 'Monthly Revenue',
      subtitle: `December ${currentYear}`,
      revenue: monthlyRevenue,
      isLoading: isMonthlyLoading,
      color: '#52c41a',
      icon: <CalendarOutlined style={{ color: '#52c41a' }} />,
    },
    {
      key: 'weekly',
      title: 'Weekly Revenue',
      subtitle: 'This week',
      revenue: weeklyRevenue,
      isLoading: isWeeklyLoading,
      color: '#722ed1',
      icon: <CalendarOutlined style={{ color: '#722ed1' }} />,
    },
    {
      key: 'daily',
      title: 'Daily Revenue',
      subtitle: `Today (${todayFormatted})`,
      revenue: dailyRevenue,
      isLoading: isDailyLoading,
      color: '#fa8c16',
      icon: <CalendarOutlined style={{ color: '#fa8c16' }} />,
    },
  ], [
    yearlyRevenue, monthlyRevenue, weeklyRevenue, dailyRevenue,
    isYearlyLoading, isMonthlyLoading, isWeeklyLoading, isDailyLoading,
    currentYear, todayFormatted
  ]);

  const isLoading = isYearlyLoading || isMonthlyLoading || isWeeklyLoading || isDailyLoading;

  // Show loading state
  if (isLoading && !yearlyResponse && !monthlyResponse && !weeklyResponse && !dailyResponse) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh' 
      }}>
        <Spin size="large" tip="Loading revenue data..." />
      </div>
    );
  }

  // Calculate total for display (optional)
  const totalDisplayRevenue = periodData.reduce((sum, period) => sum + period.revenue, 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, color: '#1890ff' }}>Revenue Dashboard</h1>
        <Text type="secondary">Live sales performance tracking</Text>
      </div>

      {/* Main Yearly Revenue Card */}
      <Card 
        styles={{
          body: {
            padding: '24px',
            background: 'linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)',
            color: 'white',
            borderRadius: '8px',
          }
        }}
        style={{ marginBottom: '24px' }}
      >
        <Statistic
          title={<span style={{ color: 'white', fontSize: '16px' }}>Total Yearly Revenue</span>}
          value={yearlyRevenue}
          prefix={<DollarOutlined style={{ color: 'white' }} />}
          precision={0}
          valueStyle={{ 
            color: 'white', 
            fontSize: '36px',
            fontWeight: 'bold'
          }}
        />
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px', display: 'block' }}>
          Total revenue for {currentYear}
        </Text>
      </Card>

      {/* Period Revenue Cards */}
      <Row gutter={[16, 16]}>
        {periodData.slice(1).map((period) => (
          <Col xs={24} sm={12} lg={6} key={period.key}>
            <Card 
              style={{ 
                borderLeft: `4px solid ${period.color}`,
                borderRadius: '8px',
                height: '100%',
              }}
              styles={{
                body: { padding: '20px' }
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: `${period.color}15`,
                  marginBottom: '12px'
                }}>
                  {period.icon}
                </div>
                <Text strong style={{ display: 'block', fontSize: '16px' }}>
                  {period.title}
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {period.subtitle}
                </Text>
              </div>
              
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: period.color,
                marginBottom: '8px'
              }}>
                ETB {period.revenue.toLocaleString()}
              </div>
              
              <div style={{ fontSize: '12px', color: '#999' }}>
                {period.isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Spin size="small" style={{ marginRight: '6px' }} />
                    <span>Loading...</span>
                  </div>
                ) : period.revenue > 0 ? (
                  <Text type="success">✓ Live data</Text>
                ) : (
                  <Text type="secondary">No sales recorded</Text>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default SaleHistoryPage;