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
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import Loader from "../components/Loader";
import {
  useCountProductsQuery,
  useGetAllProductsQuery,
} from "../redux/features/management/productApi";
import { useGetAllSaleQuery } from "../redux/features/management/saleApi";
import DailyChart from "../components/Charts/DailyChart";
import MonthlyChart from "../components/Charts/MonthlyChart";
import { useMemo, useEffect, useState, useCallback } from "react";
import { format } from "date-fns";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

// Constants
const REFETCH_INTERVAL = 30000;
const LOW_STOCK_THRESHOLD = 10;

// Helper functions
const safeReduce = (
  data: any[],
  key: string,
  defaultValue: number = 0
): number => {
  if (!Array.isArray(data)) return defaultValue;
  return data.reduce(
    (acc, item) => acc + (Number(item[key]) || 0),
    defaultValue
  );
};

const filterByDateRange = (
  data: any[],
  startDate: Date,
  endDate: Date = new Date()
): any[] => {
  if (!Array.isArray(data)) return [];
  return data.filter((item) => {
    try {
      if (!item.date) return false;
      const saleDate = new Date(item.date);
      return saleDate >= startDate && saleDate <= endDate;
    } catch {
      return false;
    }
  });
};

const getStartOfDay = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getStartOfWeek = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff));
};

const getStartOfMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
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
        ${revenue.toFixed(2)}
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
  const isTablet = !screens.lg && screens.md;
  const isDesktop = screens.lg;

  const { data: products, isLoading: productsLoading } =
    useCountProductsQuery(undefined);
  const { data: allProducts, isLoading: allProductsLoading } =
    useGetAllProductsQuery({});
  const {
    data: allSalesData,
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales,
  } = useGetAllSaleQuery({});

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [chartHeight, setChartHeight] = useState(300);

  // Responsive chart height
  useEffect(() => {
    const updateChartHeight = () => {
      if (isMobile) {
        setChartHeight(250);
      } else if (isTablet) {
        setChartHeight(300);
      } else {
        setChartHeight(350);
      }
    };

    updateChartHeight();
    window.addEventListener("resize", updateChartHeight);
    return () => window.removeEventListener("resize", updateChartHeight);
  }, [isMobile, isTablet]);

  // Memoized data extraction
  const salesTransactions = useMemo(
    () =>
      Array.isArray(allSalesData?.data?.sales) ? allSalesData.data.sales : [],
    [allSalesData]
  );

  const totalSalesCount = useMemo(
    () => allSalesData?.data?.total || 0,
    [allSalesData]
  );

  // Products data
  const totalStock = useMemo(
    () => products?.data?.totalQuantity || 0,
    [products]
  );
  const totalProductsCount = useMemo(
    () => products?.data?.totalProducts || 0,
    [products]
  );
  const allProductsData = useMemo(
    () => (Array.isArray(allProducts?.data) ? allProducts.data : []),
    [allProducts]
  );

  // Sales calculations with memoization
  const totalItemsSold = useMemo(
    () => safeReduce(salesTransactions, "quantity"),
    [salesTransactions]
  );
  const totalRevenue = useMemo(
    () => safeReduce(salesTransactions, "total_price"),
    [salesTransactions]
  );
  const totalPaid = useMemo(
    () => safeReduce(salesTransactions, "paid_amount"),
    [salesTransactions]
  );
  const totalCredit = useMemo(
    () => safeReduce(salesTransactions, "remaining_amount"),
    [salesTransactions]
  );

  // Derived metrics
  const averageSale = useMemo(
    () => (totalItemsSold > 0 ? totalRevenue / totalItemsSold : 0),
    [totalRevenue, totalItemsSold]
  );

  const collectionRate = useMemo(
    () => (totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0),
    [totalRevenue, totalPaid]
  );

  // Period-based calculations
  const todayStart = useMemo(getStartOfDay, []);
  const weekStart = useMemo(getStartOfWeek, []);
  const monthStart = useMemo(getStartOfMonth, []);

  const todaySales = useMemo(
    () => filterByDateRange(salesTransactions, todayStart),
    [salesTransactions, todayStart]
  );

  const weekSales = useMemo(
    () => filterByDateRange(salesTransactions, weekStart),
    [salesTransactions, weekStart]
  );

  const monthSales = useMemo(
    () => filterByDateRange(salesTransactions, monthStart),
    [salesTransactions, monthStart]
  );

  const todayRevenue = useMemo(
    () => safeReduce(todaySales, "total_price"),
    [todaySales]
  );
  const todayItemsSold = useMemo(
    () => safeReduce(todaySales, "quantity"),
    [todaySales]
  );
  const weekRevenue = useMemo(
    () => safeReduce(weekSales, "total_price"),
    [weekSales]
  );
  const weekItemsSold = useMemo(
    () => safeReduce(weekSales, "quantity"),
    [weekSales]
  );
  const monthRevenue = useMemo(
    () => safeReduce(monthSales, "total_price"),
    [monthSales]
  );
  const monthItemsSold = useMemo(
    () => safeReduce(monthSales, "quantity"),
    [monthSales]
  );

  // Alerts and warnings
  const lowStockProducts = useMemo(
    () =>
      allProductsData.filter(
        (product: any) => product.qty > 0 && product.qty < LOW_STOCK_THRESHOLD
      ),
    [allProductsData]
  );

  const outOfStockProducts = useMemo(
    () => allProductsData.filter((product: any) => product.qty === 0),
    [allProductsData]
  );

  const pendingSalesCount = useMemo(
    () =>
      salesTransactions.filter((s: any) => (s.remaining_amount || 0) > 0)
        .length,
    [salesTransactions]
  );

  // Performance metrics
  const stockTurnoverRate = useMemo(
    () =>
      totalStock > 0 ? Math.min((totalItemsSold / totalStock) * 100, 100) : 0,
    [totalStock, totalItemsSold]
  );

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetchSales();
      setLastUpdated(new Date());
    }, REFETCH_INTERVAL);

    return () => clearInterval(interval);
  }, [refetchSales]);

  // Responsive grid configurations
  const getChartColSpan = () => {
    if (isMobile) return 24;
    if (isTablet) return 24;
    return 12;
  };

  const getStatColSpan = () => {
    if (isMobile) return 24;
    if (isTablet) return 12;
    return 6;
  };

  const getPeriodColSpan = () => {
    if (isMobile) return 24;
    return 8;
  };

  const isLoading = productsLoading || salesLoading || allProductsLoading;
  const hasSalesData = salesTransactions.length > 0;
  const hasError = !!salesError;

  if (isLoading) {
    return <Loader />;
  }

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
                  color={hasSalesData ? "green" : "orange"}
                  style={{ fontSize: isMobile ? "11px" : "12px" }}
                >
                  {totalSalesCount} sales
                </Tag>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert
          message="Sales Data Error"
          description="Unable to load sales data. Some statistics may be unavailable."
          type="error"
          showIcon
          style={{ marginBottom: "1rem" }}
          action={
            <Button size="small" type="primary" onClick={() => refetchSales()}>
              Retry
            </Button>
          }
        />
      )}

      {!hasSalesData && !hasError && (
        <Alert
          message="No Sales Data"
          description="Start creating sales to see dashboard analytics."
          type="info"
          showIcon
          style={{ marginBottom: "1rem" }}
        />
      )}

      {/* Summary Statistics */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}
      >
        <Col xs={24} sm={12} md={getStatColSpan()}>
          <SummaryCard
            title="Total Stock"
            value={totalStock}
            icon={<ShoppingOutlined />}
            valueStyle={{ color: "#1890ff" }}
            suffix="items"
            description={`${totalProductsCount} products`}
            loading={productsLoading}
          />
        </Col>

        <Col xs={24} sm={12} md={getStatColSpan()}>
          <SummaryCard
            title="Total Sales"
            value={totalSalesCount}
            icon={<TrophyOutlined />}
            valueStyle={{ color: "#52c41a" }}
            suffix="transactions"
            description={`${totalItemsSold} items sold`}
            loading={salesLoading}
          />
        </Col>

        <Col xs={24} sm={12} md={getStatColSpan()}>
          <SummaryCard
            title="Total Revenue"
            value={totalRevenue}
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
                  ${totalPaid.toLocaleString()}
                </Tag>
                <span>Credit:</span>
                <Tag color="orange" style={{ margin: 0, fontSize: "11px" }}>
                  ${totalCredit.toLocaleString()}
                </Tag>
              </div>
            }
            loading={salesLoading}
          />
        </Col>

        <Col xs={24} sm={12} md={getStatColSpan()}>
          <SummaryCard
            title="Avg. Sale Value"
            value={averageSale}
            icon={<BarChartOutlined />}
            valueStyle={{ color: "#722ed1" }}
            description={`$${averageSale.toFixed(2)} per sale`}
            loading={salesLoading}
          />
        </Col>
      </Row>

      {/* Performance Metrics - Optimized for mobile */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}
      >
        <Col xs={24} sm={12} lg={8}>
          <Card style={{ height: "100%", minHeight: "140px" }}>
            <Statistic
              title="Today's Performance"
              value={todayRevenue}
              precision={2}
              prefix={<RiseOutlined />}
              valueStyle={{
                color: todayRevenue > 0 ? "#52c41a" : "#cf1322",
                fontSize: isMobile ? "24px" : "28px",
              }}
            />
            <Progress
              percent={todayRevenue > 0 ? 100 : 0}
              size="small"
              status={todayRevenue > 0 ? "success" : "normal"}
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
              {todayItemsSold} sales • ${todayRevenue.toLocaleString()}
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card style={{ height: "100%", minHeight: "140px" }}>
            <Statistic
              title="Collection Rate"
              value={collectionRate}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{
                color:
                  collectionRate > 80
                    ? "#52c41a"
                    : collectionRate > 60
                    ? "#faad14"
                    : "#ff4d4f",
                fontSize: isMobile ? "24px" : "28px",
              }}
            />
            <Progress
              percent={collectionRate}
              size="small"
              status={
                collectionRate > 80
                  ? "success"
                  : collectionRate > 60
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
              ${totalPaid.toLocaleString()} collected
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={24} lg={8}>
          <SummaryCard
            title="Outstanding Credit"
            value={totalCredit}
            icon={<CreditCardOutlined />}
            valueStyle={{
              color: totalCredit > 0 ? "#cf1322" : "#52c41a",
              fontSize: isMobile ? "24px" : "28px",
            }}
            description={`${pendingSalesCount} pending sales`}
          />
        </Col>
      </Row>

      {/* Period Performance - Stack on mobile */}
      <Row
        gutter={[16, 16]}
        style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}
      >
        <Col xs={24} sm={getPeriodColSpan()}>
          <PeriodCard
            period="Today"
            revenue={todayRevenue}
            salesCount={todayItemsSold}
            color="#1890ff"
          />
        </Col>

        <Col xs={24} sm={getPeriodColSpan()}>
          <PeriodCard
            period="This Week"
            revenue={weekRevenue}
            salesCount={weekItemsSold}
            color="#52c41a"
          />
        </Col>

        <Col xs={24} sm={getPeriodColSpan()}>
          <PeriodCard
            period="This Month"
            revenue={monthRevenue}
            salesCount={monthItemsSold}
            color="#722ed1"
          />
        </Col>
      </Row>

      {/* Alerts Section */}
      {(outOfStockProducts.length > 0 ||
        lowStockProducts.length > 0 ||
        totalCredit > 0) && (
        <Row
          gutter={[16, 16]}
          style={{ marginBottom: isMobile ? "1rem" : "1.5rem" }}
        >
          {outOfStockProducts.length > 0 && (
            <Col xs={24}>
              <Alert
                message="Out of Stock Alert"
                description={`${outOfStockProducts.length} products are out of stock`}
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

          {lowStockProducts.length > 0 && (
            <Col xs={24}>
              <Alert
                message="Low Stock Warning"
                description={`${lowStockProducts.length} products have low stock (< ${LOW_STOCK_THRESHOLD} items)`}
                type="warning"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            </Col>
          )}

          {totalCredit > 0 && (
            <Col xs={24}>
              <Alert
                message="Credit Management"
                description={`$${totalCredit.toFixed(
                  2
                )} in outstanding credit across ${pendingSalesCount} sales`}
                type="warning"
                showIcon
                icon={<CreditCardOutlined />}
              />
            </Col>
          )}
        </Row>
      )}

      {/* Charts Section - Stack vertically on mobile/tablet */}
      <Row gutter={[16, 16]} style={{ marginBottom: "1.5rem" }}>
        <Col xs={24} md={getChartColSpan()}>
          <Card
            title="Daily Performance"
            bordered={false}
            style={{
              height: "auto",
              minHeight: `${chartHeight + 100}px`,
            }}
            bodyStyle={{ padding: isMobile ? "12px" : "16px" }}
            headStyle={{
              padding: isMobile ? "0 12px" : "0 16px",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            <div style={{ height: chartHeight }}>
              <DailyChart />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={getChartColSpan()}>
          <Card
            title="Monthly Trends"
            bordered={false}
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
            bodyStyle={{
              padding: isMobile ? "8px" : "12px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "0", // Important for flex children
            }}
            headStyle={{
              padding: isMobile ? "8px 12px" : "12px 16px",
              fontSize: isMobile ? "14px" : "16px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div style={{ flex: 1, minHeight: "0" }}>
              <MonthlyChart />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats Footer */}
      <Card size="small" bodyStyle={{ padding: isMobile ? "12px" : "16px" }}>
        <Row gutter={[16, 16]} justify="space-around">
          <Col xs={12} sm={6}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "bold",
                  color: "#1890ff",
                  marginBottom: "4px",
                }}
              >
                {totalProductsCount.toLocaleString()}
              </div>
              <Text
                type="secondary"
                style={{ fontSize: isMobile ? "11px" : "12px" }}
              >
                Products
              </Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "bold",
                  color: "#52c41a",
                  marginBottom: "4px",
                }}
              >
                {totalSalesCount.toLocaleString()}
              </div>
              <Text
                type="secondary"
                style={{ fontSize: isMobile ? "11px" : "12px" }}
              >
                Sales
              </Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "bold",
                  color: "#fa8c16",
                  marginBottom: "4px",
                }}
              >
                ${Math.round(totalRevenue).toLocaleString()}
              </div>
              <Text
                type="secondary"
                style={{ fontSize: isMobile ? "11px" : "12px" }}
              >
                Revenue
              </Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "bold",
                  color:
                    collectionRate > 80
                      ? "#52c41a"
                      : collectionRate > 60
                      ? "#faad14"
                      : "#ff4d4f",
                  marginBottom: "4px",
                }}
              >
                {Math.round(collectionRate)}%
              </div>
              <Text
                type="secondary"
                style={{ fontSize: isMobile ? "11px" : "12px" }}
              >
                Collection Rate
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
