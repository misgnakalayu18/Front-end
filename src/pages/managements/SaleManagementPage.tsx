import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Alert,
  Button,
  Collapse,
  Empty,
  Flex,
  Form,
  Grid,
  InputNumber,
  Select,
  Spin,
  Typography,
  message,
} from "antd";
import {
  DoubleLeftOutlined,
  DoubleRightOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// Components
import SalesHeader from "../../components/sales/SalesHeader";
import SalesTable from "../../components/sales/SalesTable";
import SalesFilters from "../../components/sales/SalesFilters";
import SalesStats from "../../components/sales/SalesStats";
import MobileSummary from "../../components/sales/MobileSummary";
import { SalesExport } from "../../components/sales/SalesExport";
import SplitPaymentModal from "../../components/modal/SplitPaymentModal";
import ActiveFiltersBar from "../../components/sales/ActiveFiltersBar";

// Hooks & Utils
import {
  useGetAllSaleQuery,
  useGetSplitPaymentDetailsQuery,
  useLazyGetAllSaleNoPaginationQuery,
} from "../../redux/features/management/saleApi";
import { ISaleApiResponse, SaleRecord } from "../../types/sale.type";
import formatDate from "../../utils/formatDate";
import { extractBankName } from '../../utils/extractBankName';

const { Text } = Typography;
const { Panel } = Collapse;
const { useBreakpoint } = Grid;

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  bankName?: string;        // ← NEW: comma-separated bank names
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

interface FilterValues {
  search: string;
  paymentStatus: string[];
  paymentMethod: string[];
  bankName: string[];        // ← NEW
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  amountRange: [number, number] | null;
}

const SaleManagementPage = () => {
  const screens = useBreakpoint();
  const [query, setQuery] = useState<QueryParams>({
    page: 1,
    limit: 10,
    search: "",
  });

  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [filterForm] = Form.useForm<FilterValues>();
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedSplitSaleId, setSelectedSplitSaleId] = useState<string | null>(null);
  const [splitModalVisible, setSplitModalVisible] = useState(false);

  // API calls
  const {
    data: apiData,
    isFetching,
    refetch,
  } = useGetAllSaleQuery(query, {
    refetchOnMountOrArgChange: true,
  });

  const { data: splitPaymentDetails } = useGetSplitPaymentDetailsQuery(
    selectedSplitSaleId,
    { skip: !selectedSplitSaleId }
  );

  const [triggerGetAllSalesNoPagination] = useLazyGetAllSaleNoPaginationQuery();

  // Debug logging
  useEffect(() => {
    console.log("🔍 SEARCH DEBUG:", {
      query,
      apiData: {
        success: apiData?.success,
        totalItems: apiData?.data?.total,
        salesCount: apiData?.data?.sales?.length || 0,
      },
    });
  }, [query, apiData]);

  // ─── Transform API data to SaleRecord ──────────────────────────────────────
  const allTableData: SaleRecord[] = useMemo(() => {
    if (!apiData?.success) return [];
    const transactions = apiData.data?.sales || [];
    if (!Array.isArray(transactions)) return [];

    return transactions.map((transaction: ISaleApiResponse, index: number) => {
      let receiverName = undefined;

      if (transaction.payments && transaction.payments.length > 0) {
        for (const payment of transaction.payments) {
          if (payment.details && Array.isArray(payment.details)) {
            const receiverDetail = payment.details.find(
              (d) => d.detail_key === "receiver_name"
            );
            if (receiverDetail?.detail_value) {
              receiverName = receiverDetail.detail_value;
              break;
            }
          }
        }
      }

      if (!receiverName && transaction.payment_splits?.length) {
        const splitWithReceiver = transaction.payment_splits.find(
          (split) => split.receiver_name
        );
        if (splitWithReceiver?.receiver_name) {
          receiverName = splitWithReceiver.receiver_name;
        }
      }

      if (!receiverName && transaction.receiver_name) {
        receiverName = transaction.receiver_name;
      }

      const paymentSplits = (transaction.payment_splits || []).map((split) => ({
        id: split.id,
        method: split.payment_method || "CASH",
        amount: Number(split.amount) || 0,
        percentage: Number(split.percentage) || 0,
        bankName: split.bank_name,
        senderName: split.sender_name,
        receiverName: split.receiver_name,
        telebirrPhone: split.telebirr_phone,
        telebirrTransactionId: split.telebirr_transaction_id,
        reference: split.reference,
        createdAt: split.created_at,
      }));

      return {
        key: transaction.id?.toString() || `${index}`,
        id: transaction.id?.toString() || "",
        code: transaction.code || "N/A",
        ctn: Number(transaction.ctn) || 0,
        unit: transaction.product?.unit || "PC",
        productName: transaction.product_name || "N/A",
        productPrice: Number(transaction.product_price) || 0,
        sellPrice: Number(transaction.product_price) || 0,
        buyerName: transaction.buyer_name || "N/A",
        quantity: Number(transaction.quantity) || 0,
        totalPrice: Number(transaction.total_price) || 0,
        paidAmount: Number(transaction.paid_amount) || 0,
        remainingAmount: Number(transaction.remaining_amount) || 0,
        date: transaction.date
          ? formatDate(transaction.date)
          : transaction.created_at
            ? formatDate(transaction.created_at)
            : "N/A",
        paymentMethod: transaction.payment_method || "CASH",
        bankName: transaction.bank_name || undefined,
        paymentStatus: transaction.payment_status || "FULL",
        casherName: transaction.casher_name || "N/A",
        recieverName: receiverName,
        sellerName: transaction.user?.name || "N/A",
        originalTransaction: transaction,
        originalDate: transaction.date || transaction.created_at || "",
        useCustomPrice: transaction.use_custom_price || false,
        discountPercentage: Number(transaction.discount_percentage) || 0,
        salePriceType: transaction.sale_price_type || "DEFAULT",
        isNegativeStockSale: transaction.is_negative_stock_sale || false,
        negativeStockPieces: Number(transaction.negative_stock_pieces) || 0,
        bulkDiscountApplied: transaction.bulk_discount_applied || false,
        totalDiscountAmount: Number(transaction.total_discount_amount) || 0,
        defaultProductPrice: Number(transaction.default_product_price) || 0,
        customPricePerPiece: Number(transaction.custom_price_per_piece) || 0,
        paymentSplits: paymentSplits,
        isSplitPayment:
          transaction.payment_method === "SPLIT" || paymentSplits.length > 0,
      };
    });
  }, [apiData]);

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const pagination = useMemo(
    () => ({
      total: apiData?.data?.total || 0,
      page: apiData?.data?.page || query.page,
      limit: apiData?.data?.limit || query.limit,
      totalPages: apiData?.data?.pages || 1,
    }),
    [apiData, query.page, query.limit]
  );

  const pageStats = useMemo(
    () => SalesExport.calculateStats(allTableData),
    [allTableData]
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = useCallback((value: string) => {
    const searchValue = value.trim();
    setQuery((prev) => ({ ...prev, search: searchValue, page: 1 }));
  }, []);

  const handleSearchClear = useCallback(() => {
    setQuery((prev) => ({ ...prev, search: "", page: 1 }));
  }, []);

  const handleApplyFilters = (values: FilterValues) => {
    const newQuery: QueryParams = {
      page: 1,
      limit: query.limit,
      search: values.search || "",
    };

    if (values.paymentStatus?.length) {
      newQuery.paymentStatus = values.paymentStatus.join(",");
    }
    if (values.paymentMethod?.length) {
      newQuery.paymentMethod = values.paymentMethod.join(",");
    }
    // ← NEW: bankName
    if (values.bankName?.length) {
      newQuery.bankName = values.bankName.join(",");
    }
    if (values.dateRange) {
      newQuery.startDate = values.dateRange[0].format("YYYY-MM-DD");
      newQuery.endDate = values.dateRange[1].format("YYYY-MM-DD");
    }
    if (values.amountRange) {
      newQuery.minAmount = values.amountRange[0] || undefined;
      newQuery.maxAmount = values.amountRange[1] || undefined;
    }

    setQuery(newQuery);
    setFilterDrawerVisible(false);
  };

  const handleClearAllFilters = () => {
    setQuery({ page: 1, limit: query.limit, search: "" });
    filterForm.resetFields();
    setFilterDrawerVisible(false);
  };

  const handleRemoveFilter = (filterKey: string) => {
    setQuery((prev) => {
      const newQuery = { ...prev, page: 1 };
      switch (filterKey) {
        case "search":
          return { ...newQuery, search: "" };
        case "paymentStatus":
          return { ...newQuery, paymentStatus: undefined };
        case "paymentMethod":
          return { ...newQuery, paymentMethod: undefined };
        case "bankName":                                   // ← NEW
          return { ...newQuery, bankName: undefined };
        case "dateRange":
          return { ...newQuery, startDate: undefined, endDate: undefined };
        case "amountRange":
          return { ...newQuery, minAmount: undefined, maxAmount: undefined };
        default:
          return newQuery;
      }
    });
  };

  // ─── Active filter count ────────────────────────────────────────────────────
  const calculateActiveFilters = useCallback(() => {
    let count = 0;
    if (query.search?.trim()) count++;
    if (query.paymentStatus?.length) count++;
    if (query.paymentMethod?.length) count++;
    if (query.bankName?.trim()) count++;           // ← NEW
    if (query.startDate || query.endDate) count++;
    if (query.minAmount !== undefined || query.maxAmount !== undefined) count++;
    return count;
  }, [query]);

  useEffect(() => {
    setActiveFilters(calculateActiveFilters());
  }, [query, calculateActiveFilters]);

  // ─── Sync form when drawer opens ────────────────────────────────────────────
  useEffect(() => {
    if (filterDrawerVisible) {
      filterForm.setFieldsValue({
        search: query.search || "",
        paymentStatus: query.paymentStatus?.split(",") || [],
        paymentMethod: query.paymentMethod?.split(",") || [],
        bankName: query.bankName?.split(",") || [],    // ← NEW
        dateRange:
          query.startDate && query.endDate
            ? [dayjs(query.startDate), dayjs(query.endDate)]
            : null,
        amountRange:
          query.minAmount !== undefined || query.maxAmount !== undefined
            ? [query.minAmount || 0, query.maxAmount || 0]
            : null,
      });
    }
  }, [filterDrawerVisible, query, filterForm]);

  // ─── Split payment modal ─────────────────────────────────────────────────────
  const handleViewSplitPayment = (record: SaleRecord) => {
    setSelectedSplitSaleId(record.id);
    setSplitModalVisible(true);
  };

  const handleCloseSplitModal = () => {
    setSplitModalVisible(false);
    setSelectedSplitSaleId(null);
  };

  // ─── Pagination handlers ─────────────────────────────────────────────────────
  const handlePageChange = (page: number, pageSize?: number) => {
    if (page < 1) page = 1;
    if (page > pagination.totalPages) page = pagination.totalPages;
    if (page === pagination.page && (!pageSize || pageSize === query.limit)) return;
    setQuery((prev) => ({ ...prev, page, limit: pageSize || prev.limit }));
  };

  const handlePageSizeChange = (size: number) => {
    setQuery((prev) => ({ ...prev, page: 1, limit: size }));
  };

  const isMobile = !screens.md;

  // ─── Export ──────────────────────────────────────────────────────────────────
  const transformTransaction = (transaction: ISaleApiResponse, index: number): SaleRecord => {
  // Debug partial payments specifically
  if (transaction.payment_method === 'PARTIAL') {
    console.log('🔍 PROCESSING PARTIAL PAYMENT:', {
      id: transaction.id,
      payment_method: transaction.payment_method,
      payments_count: transaction.payments?.length,
      payments_details: transaction.payments?.map(p => p.details)
    });
  }

  // ── receiver name extraction (unchanged) ──────────────────────────────────
  let receiverName: string | undefined = undefined;

  if (transaction.payments?.length) {
    for (const payment of transaction.payments) {
      if (payment.details?.length) {
        const receiverDetail = payment.details.find(
          (d) => d.detail_key === 'receiver_name'
        );
        if (receiverDetail?.detail_value) {
          receiverName = receiverDetail.detail_value;
          break;
        }
      }
    }
  }
  if (!receiverName && transaction.payment_splits?.length) {
    const splitWithReceiver = transaction.payment_splits.find(
      (split) => split.receiver_name
    );
    if (splitWithReceiver?.receiver_name) {
      receiverName = splitWithReceiver.receiver_name;
    }
  }
  if (!receiverName && transaction.receiver_name) {
    receiverName = transaction.receiver_name;
  }

  // ── payment splits (unchanged) ────────────────────────────────────────────
  const paymentSplits = (transaction.payment_splits || []).map((split) => ({
    id: split.id,
    method: split.payment_method || 'CASH',
    amount: Number(split.amount) || 0,
    percentage: Number(split.percentage) || 0,
    bankName: split.bank_name,
    senderName: split.sender_name,
    receiverName: split.receiver_name,
    telebirrPhone: split.telebirr_phone,
    telebirrTransactionId: split.telebirr_transaction_id,
    reference: split.reference,
    createdAt: split.created_at,
  }));

  // ── Extract bank name with direct access for partial payments ─────────────
  let extractedBankName: string | undefined = undefined;
  
  // Check for PARTIAL payment specifically (most reliable)
  if (transaction.payment_method === 'PARTIAL' && transaction.payments?.length) {
    for (const payment of transaction.payments) {
      if (payment.details?.length) {
        const bankDetail = payment.details.find(
          (d) => d.detail_key === 'first_payment_bank'
        );
        if (bankDetail?.detail_value) {
          extractedBankName = bankDetail.detail_value;
          console.log(`✅ Found PARTIAL payment bank: ${extractedBankName}`);
          break;
        }
      }
    }
  }
  
  // If not found, use the generic extractBankName function
  if (!extractedBankName) {
    extractedBankName = extractBankName(transaction);
  }

  console.log(`🏦 Transaction ${transaction.id} (${transaction.payment_method}) bank name:`, extractedBankName);

  return {
    key: transaction.id?.toString() || `${index}`,
    id: transaction.id?.toString() || '',
    code: transaction.code || 'N/A',
    ctn: Number(transaction.ctn) || 0,
    unit: transaction.product?.unit || 'PC',
    productName: transaction.product_name || 'N/A',
    productPrice: Number(transaction.product_price) || 0,
    sellPrice: Number(transaction.product_price) || 0,
    buyerName: transaction.buyer_name || 'N/A',
    quantity: Number(transaction.quantity) || 0,
    totalPrice: Number(transaction.total_price) || 0,
    paidAmount: Number(transaction.paid_amount) || 0,
    remainingAmount: Number(transaction.remaining_amount) || 0,
    date: transaction.date
      ? formatDate(transaction.date)
      : transaction.created_at
        ? formatDate(transaction.created_at)
        : 'N/A',
    paymentMethod: transaction.payment_method || 'CASH',
    bankName: extractedBankName, // Use our extracted bank name
    paymentStatus: transaction.payment_status || 'FULL',
    casherName: transaction.casher_name || 'N/A',
    recieverName: receiverName,
    sellerName: transaction.user?.name || 'N/A',
    originalTransaction: transaction,
    originalDate: transaction.date || transaction.created_at || '',
    useCustomPrice: transaction.use_custom_price || false,
    discountPercentage: Number(transaction.discount_percentage) || 0,
    salePriceType: transaction.sale_price_type || 'DEFAULT',
    isNegativeStockSale: transaction.is_negative_stock_sale || false,
    negativeStockPieces: Number(transaction.negative_stock_pieces) || 0,
    bulkDiscountApplied: transaction.bulk_discount_applied || false,
    totalDiscountAmount: Number(transaction.total_discount_amount) || 0,
    defaultProductPrice: Number(transaction.default_product_price) || 0,
    customPricePerPiece: Number(transaction.custom_price_per_piece) || 0,
    paymentSplits,
    isSplitPayment:
      transaction.payment_method === 'SPLIT' || paymentSplits.length > 0,
  };
};

  const fetchAllFilteredData = async (): Promise<SaleRecord[]> => {
    try {
      setExportLoading(true);
      const exportQuery: QueryParams = {
        page: 1,
        limit: 10000,
        search: query.search,
        paymentStatus: query.paymentStatus,
        paymentMethod: query.paymentMethod,
        bankName: query.bankName,           // ← NEW: include in export query
        startDate: query.startDate,
        endDate: query.endDate,
        minAmount: query.minAmount,
        maxAmount: query.maxAmount,
      };

      const cleanQuery = Object.fromEntries(
        Object.entries(exportQuery).filter(([_, v]) => v !== undefined && v !== "")
      );

      const response = await triggerGetAllSalesNoPagination(cleanQuery).unwrap();
      if (response?.success) {
        const allData = response.data?.sales || [];
        const exportData = allData.map(transformTransaction);
        message.success(`Preparing ${exportData.length} records for export...`);
        return exportData;
      }
      return [];
    } catch (error) {
      console.error("❌ Export error:", error);
      message.error("Failed to fetch data for export");
      return [];
    } finally {
      setExportLoading(false);
    }
  };

  const fetchAllData = async (): Promise<SaleRecord[]> => fetchAllFilteredData();

  const splitModalData = useMemo(() => {
    if (!selectedSplitSaleId) return null;
    if (splitPaymentDetails?.success) return splitPaymentDetails.data;
    return allTableData.find((sale) => sale.id === selectedSplitSaleId) || null;
  }, [selectedSplitSaleId, splitPaymentDetails, allTableData]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: isMobile ? "12px" : "16px" }}>
      <Alert
        message="Sales Data Protection"
        description="Sale deletion is disabled to protect financial data integrity."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: "16px" }}
      />

      <SalesHeader
        activeFilters={activeFilters}
        exportLoading={exportLoading}
        hasData={allTableData.length > 0}
        query={query}
        onSearch={handleSearch}
        onSearchClear={handleSearchClear}
        onFilterClick={() => setFilterDrawerVisible(true)}
        onExportClick={(info) => {
          SalesExport.handleExport(
            info.key,
            allTableData,
            query,
            pagination.total,
            pagination.totalPages,
            fetchAllFilteredData,
            fetchAllData,
          );
        }}
        onClearFilters={handleClearAllFilters}
        onPageSizeChange={handlePageSizeChange}
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.total}
        showMobileSummary={showMobileSummary}
        onToggleMobileSummary={() => setShowMobileSummary(!showMobileSummary)}
        exportItems={SalesExport.getExportMenuItems(
          allTableData,
          activeFilters > 0,
          exportLoading,
        )}
        isMobile={isMobile}
      />

      <ActiveFiltersBar
        activeFilters={activeFilters}
        query={query}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        isMobile={isMobile}
      />

      {isMobile && showMobileSummary && (
        <Collapse defaultActiveKey={["1"]} style={{ marginBottom: "12px" }} size="small">
          <Panel
            header={
              <Flex justify="space-between" align="center">
                <Text strong>Summary (Page {pagination.page})</Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Click to expand/collapse
                </Text>
              </Flex>
            }
            key="1"
          >
            <MobileSummary
              pageStats={pageStats}
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              isExpanded={true}
            />
          </Panel>
        </Collapse>
      )}

      {!isMobile && (
        <SalesStats
          pageStats={pageStats}
          currentPage={pagination.page}
          totalItems={pagination.total}
        />
      )}

      {isFetching && allTableData.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <Spin size="large" />
          <div style={{ marginTop: "16px" }}>Loading transactions...</div>
        </div>
      ) : allTableData.length === 0 ? (
        <Empty
          description={
            activeFilters > 0
              ? "No transactions found with current filters"
              : "No transactions available"
          }
          style={{ padding: "48px 0" }}
        >
          {activeFilters > 0 && (
            <Button type="primary" onClick={handleClearAllFilters}>
              Clear all filters
            </Button>
          )}
        </Empty>
      ) : (
        <SalesTable
          data={allTableData}
          loading={isFetching}
          onViewSplitPayment={handleViewSplitPayment}
          onRefetch={refetch}
          onPaymentMethodFilter={(value) =>
            setQuery((prev) => ({ ...prev, paymentMethod: value as string, page: 1 }))
          }
          onPaymentStatusFilter={(value) =>
            setQuery((prev) => ({ ...prev, paymentStatus: value as string, page: 1 }))
          }
        />
      )}

      {/* Pagination */}
      {!isFetching && allTableData.length > 0 && (
        <>
          {/* Desktop */}
          {!isMobile && (
            <Flex
              justify="space-between"
              align="center"
              style={{
                marginTop: "24px",
                padding: "16px",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
                border: "1px solid #f0f0f0",
              }}
            >
              <div style={{ color: "#666" }}>
                Showing <Text strong>{allTableData.length}</Text> of{" "}
                <Text strong>{pagination.total}</Text> items • Page{" "}
                <Text strong>{pagination.page}</Text> of{" "}
                <Text strong>{pagination.totalPages}</Text>
              </div>

              <Flex gap="middle" align="center">
                <Flex gap="small" align="center">
                  <span style={{ color: "#666" }}>Rows:</span>
                  <Select
                    value={query.limit}
                    onChange={handlePageSizeChange}
                    style={{ width: 70 }}
                    size="middle"
                    options={[
                      { value: 10, label: "10" },
                      { value: 25, label: "25" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" },
                    ]}
                  />
                </Flex>

                <Flex gap={4} align="center">
                  <Button icon={<DoubleLeftOutlined />} onClick={() => handlePageChange(1, query.limit)} disabled={false} size="middle" />
                  <Button icon={<LeftOutlined />} onClick={() => handlePageChange(pagination.page - 1, query.limit)} disabled={false} size="middle" />
                  <Flex gap={4} align="center" style={{ margin: "0 8px" }}>
                    <InputNumber
                      min={1}
                      max={pagination.totalPages}
                      value={pagination.page}
                      onChange={(value) => value && handlePageChange(value, query.limit)}
                      disabled={false}
                      style={{ width: 50, textAlign: "center" }}
                      size="small"
                    />
                    <span>/ {pagination.totalPages}</span>
                  </Flex>
                  <Button icon={<RightOutlined />} onClick={() => handlePageChange(pagination.page + 1, query.limit)} disabled={false} size="middle" />
                  <Button icon={<DoubleRightOutlined />} onClick={() => handlePageChange(pagination.totalPages, query.limit)} disabled={false} size="middle" />
                </Flex>
              </Flex>
            </Flex>
          )}

          {/* Mobile */}
          {isMobile && (
            <Flex
              vertical
              style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#fafafa",
                borderRadius: "8px",
                border: "1px solid #f0f0f0",
              }}
              gap="middle"
            >
              <Flex justify="center">
                <Text style={{ fontSize: "13px", color: "#666" }}>
                  Showing {allTableData.length} of {pagination.total} items • Page {pagination.page} of {pagination.totalPages}
                </Text>
              </Flex>
              <Flex justify="center" align="center" gap="small" wrap="wrap">
                <Button icon={<DoubleLeftOutlined />} onClick={() => handlePageChange(1, query.limit)} disabled={pagination.page === 1 || isFetching} size="small" />
                <Button icon={<LeftOutlined />} onClick={() => handlePageChange(pagination.page - 1, query.limit)} disabled={pagination.page === 1 || isFetching} size="small" />
                <Flex gap={2} align="center">
                  <InputNumber
                    min={1}
                    max={pagination.totalPages}
                    value={pagination.page}
                    onChange={(value) => value && handlePageChange(value, query.limit)}
                    disabled={false}
                    style={{ width: 45, textAlign: "center" }}
                    size="small"
                  />
                  <Text>/ {pagination.totalPages}</Text>
                </Flex>
                <Button icon={<RightOutlined />} onClick={() => handlePageChange(pagination.page + 1, query.limit)} disabled={false} size="small" />
                <Button icon={<DoubleRightOutlined />} onClick={() => handlePageChange(pagination.totalPages, query.limit)} disabled={false} size="small" />
              </Flex>
              <Flex justify="center" align="center" gap="small">
                <Text style={{ fontSize: "13px", color: "#666" }}>Rows per page:</Text>
                <Select
                  value={query.limit}
                  onChange={handlePageSizeChange}
                  style={{ width: 65 }}
                  size="small"
                  options={[
                    { value: 10, label: "10" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                  ]}
                />
              </Flex>
            </Flex>
          )}
        </>
      )}

      <SalesFilters
        visible={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        form={filterForm}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
        onClearAllFilters={handleClearAllFilters}
        isMobile={isMobile}
      />

      <SplitPaymentModal
        visible={splitModalVisible}
        onClose={handleCloseSplitModal}
        sale={splitModalData}
      />
    </div>
  );
};

export default SaleManagementPage;