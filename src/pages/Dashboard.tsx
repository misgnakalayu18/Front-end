// frontend/src/pages/Dashboard.tsx - Simplified version
import React from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Tag,
  Alert,
  Button,
  Typography,
  Grid,
} from "antd";
import {
  ShoppingOutlined,
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  SyncOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import Loader from "../components/common/Loader";
import { useGetDashboardStatsQuery } from "../redux/features/management/dashboardApi";
import DailyChart from "../components/Charts/DailyChart";
import MonthlyChart from "../components/Charts/MonthlyChart";
import { useEffect, useState } from "react";
import { format } from "date-fns";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

// Constants
const REFETCH_INTERVAL = 30000;
const CURRENCY = "ETB";

// Format currency helper
const formatCurrency = (amount: number): string => {
  return `${CURRENCY} ${amount?.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) || '0.00'}`;
};

// Reusable Card Components
const SummaryCard = ({
  title,
  value,
  icon,
  valueStyle,
  suffix,
  prefix,
  description,
  loading = false,
}: any) => (
  <Card style={{ height: "100%", minHeight: "120px" }} loading={loading}>
    <Statistic
      title={title}
      value={value}
      precision={typeof value === "number" && value % 1 !== 0 ? 2 : 0}
      prefix={icon}
      suffix={suffix}
      valueStyle={valueStyle}
    />
    {description && (
      <Text
        type="secondary"
        style={{ fontSize: "12px", marginTop: "8px", display: "block" }}
      >
        {description}
      </Text>
    )}
  </Card>
);

const PeriodCard = ({
  period,
  revenue,
  salesCount,
  color,
  loading = false,
}: any) => (
  <Card
    size="small"
    bordered={false}
    style={{ height: "100%", minHeight: "100px" }}
    loading={loading}
  >
    <div style={{ textAlign: "center", padding: "12px 8px" }}>
      <Text
        type="secondary"
        style={{ fontSize: "12px", display: "block", marginBottom: "8px" }}
      >
        {period}
      </Text>
      <div
        style={{
          fontSize: "1.25rem",
          fontWeight: "bold",
          color,
          marginBottom: "4px",
        }}
      >
        {formatCurrency(revenue)}
      </div>
      <Text type="secondary" style={{ fontSize: "11px" }}>
        {salesCount} sales
      </Text>
    </div>
  </Card>
);

const Dashboard = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isDesktop = screens.lg;

  const { 
  data: dashboardData, 
  isLoading, 
  error, 
  refetch 
} = useGetDashboardStatsQuery({});

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [chartHeight, setChartHeight] = useState(300);

  // Responsive chart height
  useEffect(() => {
    const updateChartHeight = () => {
      if (isMobile) {
        setChartHeight(250);
      } else {
        setChartHeight(350);
      }
    };
    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);
    return () => window.removeEventListener("resize", updateChartHeight);
  }, [isMobile]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastUpdated(new Date());
    }, REFETCH_INTERVAL);
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return <Loader />;
  }

  const stats = dashboardData?.data;
  const hasError = !!error;
  const hasData = !!stats;

  return (
    <div
      style={{
        padding: isMobile ? "0.5rem" : "1rem",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}>
        <Row justify="space-between" align="middle" gutter={[16, 8]}>
          <Col>
            <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
              Dashboard Overview
            </Title>
          </Col>
          <Col>
            <Row gutter={8} wrap={false}>
              <Col>
                <Tag
                  icon={<SyncOutlined spin={!hasError} />}
                  color={hasError ? "red" : "blue"}
                  style={{ fontSize: isMobile ? "11px" : "12px" }}
                >
                  {format(lastUpdated, "HH:mm")}
                </Tag>
              </Col>
              <Col>
                <Tag
                  color={hasData ? "green" : "orange"}
                  style={{ fontSize: isMobile ? "11px" : "12px" }}
                >
                  {stats?.overview?.totalSales || 0} sales
                </Tag>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert
          message="Dashboard Data Error"
          description="Unable to load dashboard statistics."
          type="error"
          showIcon
          style={{ marginBottom: "1rem" }}
          action={
            <Button size="small" type="primary" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}

      {!hasData && !hasError && (
        <Alert
          message="No Dashboard Data"
          description="Start creating sales to see dashboard analytics."
          type="info"
          showIcon
          style={{ marginBottom: "1rem" }}
        />
      )}

      {hasData && (
        <>
          {/* Summary Statistics */}
          <Row
            gutter={[16, 16]}
            style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}
          >
            <Col xs={24} sm={12} md={6}>
              <SummaryCard
                title="Total Stock"
                value={stats.products.totalStock}
                icon={<ShoppingOutlined />}
                valueStyle={{ color: "#1890ff" }}
                suffix="items"
                description={`${stats.products.totalProducts} products`}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <SummaryCard
                title="Total Sales"
                value={stats.overview.totalSales}
                icon={<TrophyOutlined />}
                valueStyle={{ color: "#52c41a" }}
                suffix="transactions"
                description={`${stats.overview.totalItemsSold} items sold`}
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <SummaryCard
                title="Total Revenue"
                value={stats.overview.totalRevenue}
                icon={<DollarOutlined />}
                valueStyle={{ color: "#fa8c16" }}
                description={
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      alignItems: "center",
                    }}
                  >
                    <span>Collected:</span>
                    <Tag color="green" style={{ margin: 0, fontSize: "11px" }}>
                      {formatCurrency(stats.overview.totalPaid)}
                    </Tag>
                    <span>Credit:</span>
                    <Tag color="orange" style={{ margin: 0, fontSize: "11px" }}>
                      {formatCurrency(stats.overview.totalCredit)}
                    </Tag>
                  </div>
                }
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <SummaryCard
                title="Avg. Sale Value"
                value={stats.overview.averageSale}
                icon={<BarChartOutlined />}
                valueStyle={{ color: "#722ed1" }}
                description={`${formatCurrency(stats.overview.averageSale)} per sale`}
              />
            </Col>
          </Row>

          {/* Performance Metrics */}
          <Row
            gutter={[16, 16]}
            style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}
          >
            <Col xs={24} sm={12} lg={8}>
              <Card style={{ height: "100%", minHeight: "140px" }}>
                <Statistic
                  title="Today's Performance"
                  value={stats.periodStats.today.revenue}
                  precision={2}
                  prefix={<RiseOutlined />}
                  valueStyle={{
                    color: stats.periodStats.today.revenue > 0 ? "#52c41a" : "#cf1322",
                    fontSize: isMobile ? "24px" : "28px",
                  }}
                />
                <Progress
                  percent={stats.periodStats.today.revenue > 0 ? 100 : 0}
                  size="small"
                  status={stats.periodStats.today.revenue > 0 ? "success" : "normal"}
                  style={{ marginTop: "12px" }}
                />
                <Text
                  type="secondary"
                  style={{
                    fontSize: isMobile ? "11px" : "12px",
                    display: "block",
                    marginTop: "8px",
                  }}
                >
                  {stats.periodStats.today.sales} sales • {formatCurrency(stats.periodStats.today.revenue)}
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8}>
              <Card style={{ height: "100%", minHeight: "140px" }}>
                <Statistic
                  title="Collection Rate"
                  value={stats.overview.collectionRate}
                  precision={1}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{
                    color:
                      stats.overview.collectionRate > 80
                        ? "#52c41a"
                        : stats.overview.collectionRate > 60
                        ? "#faad14"
                        : "#ff4d4f",
                    fontSize: isMobile ? "24px" : "28px",
                  }}
                />
                <Progress
                  percent={stats.overview.collectionRate}
                  size="small"
                  status={
                    stats.overview.collectionRate > 80
                      ? "success"
                      : stats.overview.collectionRate > 60
                      ? "active"
                      : "exception"
                  }
                  style={{ marginTop: "12px" }}
                />
                <Text
                  type="secondary"
                  style={{
                    fontSize: isMobile ? "11px" : "12px",
                    display: "block",
                    marginTop: "8px",
                  }}
                >
                  {formatCurrency(stats.overview.totalPaid)} collected
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={24} lg={8}>
              <SummaryCard
                title="Outstanding Credit"
                value={stats.overview.totalCredit}
                icon={<CreditCardOutlined />}
                valueStyle={{
                  color: stats.overview.totalCredit > 0 ? "#cf1322" : "#52c41a",
                  fontSize: isMobile ? "24px" : "28px",
                }}
                description={`${stats.alerts.pendingSales} pending sales`}
              />
            </Col>
          </Row>

          {/* Period Performance */}
          <Row
            gutter={[16, 16]}
            style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}
          >
            <Col xs={24} sm={8}>
              <PeriodCard
                period="Today"
                revenue={stats.periodStats.today.revenue}
                salesCount={stats.periodStats.today.sales}
                color="#1890ff"
              />
            </Col>

            <Col xs={24} sm={8}>
              <PeriodCard
                period="This Week"
                revenue={stats.periodStats.week.revenue}
                salesCount={stats.periodStats.week.sales}
                color="#52c41a"
              />
            </Col>

            <Col xs={24} sm={8}>
              <PeriodCard
                period="This Month"
                revenue={stats.periodStats.month.revenue}
                salesCount={stats.periodStats.month.sales}
                color="#722ed1"
              />
            </Col>
          </Row>

          {/* Alerts Section */}
          {(stats.products.outOfStockCount > 0 ||
            stats.products.lowStockCount > 0 ||
            stats.overview.totalCredit > 0) && (
            <Row
              gutter={[16, 16]}
              style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}
            >
              {stats.products.outOfStockCount > 0 && (
                <Col xs={24}>
                  <Alert
                    message="Out of Stock Alert"
                    description={`${stats.products.outOfStockCount} products are out of stock`}
                    type="error"
                    showIcon
                    icon={<WarningOutlined />}
                    action={
                      isDesktop && (
                        <Button size="small" type="primary" danger>
                          Manage Stock
                        </Button>
                      )
                    }
                  />
                </Col>
              )}

              {stats.products.lowStockCount > 0 && (
                <Col xs={24}>
                  <Alert
                    message="Low Stock Warning"
                    description={`${stats.products.lowStockCount} products have low stock (< 10 items)`}
                    type="warning"
                    showIcon
                    icon={<InfoCircleOutlined />}
                  />
                </Col>
              )}

              {stats.overview.totalCredit > 0 && (
                <Col xs={24}>
                  <Alert
                    message="Credit Management"
                    description={`${formatCurrency(stats.overview.totalCredit)} in outstanding credit across ${stats.alerts.pendingSales} sales`}
                    type="warning"
                    showIcon
                    icon={<CreditCardOutlined />}
                  />
                </Col>
              )}
            </Row>
          )}

          {/* Charts Section */}
          <Row gutter={[16, 16]} style={{ marginBottom: "1.5rem" }}>
            <Col xs={24} md={12}>
              <Card
                title="Daily Performance"
                bordered={false}
                style={{
                  height: "auto",
                  minHeight: `${chartHeight + 100}px`,
                }}
              >
                <div style={{ height: chartHeight }}>
                  <DailyChart />
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                title="Monthly Trends"
                bordered={false}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ flex: 1, minHeight: "0" }}>
                  <MonthlyChart />
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;