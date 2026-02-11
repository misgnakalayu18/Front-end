import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Alert,
  Button,
  Collapse,
  Empty,
  Flex,
  Form,
  Grid,
  Pagination,
  PaginationProps,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
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
import { SaleRecord } from "../../types/sale.type";
import formatDate from "../../utils/formatDate";

const { Text, Title } = Typography;
const { Panel } = Collapse;
const { useBreakpoint } = Grid;

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
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
    search: "",
  });

  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [filterForm] = Form.useForm<FilterValues>();
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedSplitSaleId, setSelectedSplitSaleId] = useState<string | null>(
    null,
  );
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  // API calls
  const {
    data: apiData,
    isFetching,
    refetch,
  } = useGetAllSaleQuery(query, {
    refetchOnMountOrArgChange: true,
  });

  const { data: splitPaymentDetails, isLoading: splitDetailsLoading } =
    useGetSplitPaymentDetailsQuery(selectedSplitSaleId, {
      skip: !selectedSplitSaleId,
    });

  // ✅ REPLACE with lazy query for export
  const [triggerGetAllSalesNoPagination, { isLoading: isExportLoading }] = 
    useLazyGetAllSaleNoPaginationQuery();

  // Data transformation
  const allTransactions = useMemo(() => {
    if (!apiData || !apiData.success) return [];
    const transactions = apiData.data?.sales || [];
    return Array.isArray(transactions) ? transactions : [];
  }, [apiData]);

  useEffect(() => {
  console.log("🔍 SEARCH DEBUG:");
  console.log("Query parameters:", query);
  console.log("Local search:", localSearch);
  console.log("API Data:", {
    hasData: !!apiData,
    success: apiData?.success,
    totalItems: apiData?.data?.total,
    salesCount: apiData?.data?.sales?.length || 0,
    firstSale: apiData?.data?.sales?.[0] ? {
      code: apiData.data.sales[0].code,
      productName: apiData.data.sales[0].product_name,
      buyerName: apiData.data.sales[0].buyer_name,
    } : null,
  });
  console.log("All table data count:", allTableData.length);
}, [apiData, query, localSearch]);

// Also add logging to the search handler
const handleSearch = useCallback((value: string) => {
  const searchValue = value.trim();
  console.log("🔍 Search triggered:", {
    searchValue,
    previousQuery: query.search,
  });
  setLocalSearch(searchValue);
  setQuery((prev) => ({ ...prev, search: searchValue, page: 1 }));
}, [query.search]);

  // Function to fetch all filtered data for export
const fetchAllFilteredData = async (): Promise<SaleRecord[]> => {
  try {
    setExportLoading(true);
    
    // Create query with ALL the same filters but without pagination
    const exportQuery: QueryParams = {
      page: 1,
      limit: 10000, // Large limit to get all records
      search: query.search,
      paymentStatus: query.paymentStatus,
      paymentMethod: query.paymentMethod,
      startDate: query.startDate,
      endDate: query.endDate,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
    };

    console.log("📤 Exporting filtered data with query:", exportQuery);
    
    // ✅ IMPORTANT: Remove undefined values so they don't get sent as empty strings
    const cleanQuery = Object.fromEntries(
      Object.entries(exportQuery).filter(([_, v]) => v !== undefined && v !== '')
    );
    
    console.log("📤 Clean query for API:", cleanQuery);
    
    const response = await triggerGetAllSalesNoPagination(cleanQuery).unwrap();
    
    console.log("📥 Export response:", {
      success: response?.success,
      salesCount: response?.data?.sales?.length || 0,
      total: response?.data?.total
    });
    
    if (response?.success) {
      const allData = response.data?.sales || [];
      
      // Map the data using your existing mapping logic
      const exportData = allData.map((transaction: any, index: number) => {
        const remainingAmount =
          transaction.remaining_amount || transaction.remainingAmount || 0;
        const paymentStatus =
          transaction.payment_status ||
          transaction.paymentStatus ||
          (remainingAmount > 0 ? "PARTIAL" : "FULL");

        return {
          key: transaction.id?.toString() || `${index}-${Date.now()}`,
          id: transaction.id?.toString() || "",
          code: transaction.code || "N/A",
          ctn: transaction.ctn || 0,
          unit: transaction.product?.unit || "PC",
          productName:
            transaction.product_name || transaction.productName || "N/A",
          productPrice:
            transaction.product_price || transaction.productPrice || 0,
          sellPrice:
            transaction.product_price || transaction.productPrice || 0,
          buyerName: transaction.buyer_name || transaction.buyerName || "N/A",
          quantity: transaction.quantity || 0,
          totalPrice: transaction.total_price || transaction.totalPrice || 0,
          paidAmount: transaction.paid_amount || transaction.paidAmount || 0,
          remainingAmount,
          date: transaction.date
            ? formatDate(transaction.date)
            : transaction.created_at
              ? formatDate(transaction.created_at)
              : "N/A",
          paymentMethod:
            transaction.payment_method || transaction.paymentMethod || "CASH",
          bankName: transaction.bank_name || transaction.bankName,
          paymentStatus,
          casherName:
            transaction.casher_name || transaction.casherName || "N/A",
          recieverName: transaction.receiver_name || transaction.recieverName,
          sellerName: transaction.user?.name || "N/A",
          originalTransaction: transaction,
          originalDate: transaction.date || transaction.created_at || "",
          useCustomPrice: transaction.use_custom_price || false,
          discountPercentage: transaction.discount_percentage || 0,
          salePriceType: transaction.sale_price_type || "DEFAULT",
          isNegativeStockSale: transaction.is_negative_stock_sale || false,
          negativeStockPieces: transaction.negative_stock_pieces || 0,
          bulkDiscountApplied: transaction.bulk_discount_applied || false,
          totalDiscountAmount: transaction.total_discount_amount || 0,
          defaultProductPrice: transaction.default_product_price || 0,
          customPricePerPiece: transaction.custom_price_per_piece || 0,
          paymentSplits: (transaction.payment_splits || []).map(
            (split: any) => ({
              id: split.id,
              method: split.payment_method || "CASH",
              amount: split.amount || 0,
              percentage: split.percentage || 0,
              bankName: split.bank_name,
              senderName: split.sender_name,
              receiverName: split.receiver_name,
              telebirrPhone: split.telebirr_phone,
              telebirrTransactionId: split.telebirr_transaction_id,
              reference: split.reference,
              createdAt: split.created_at || new Date().toISOString(),
            }),
          ),
          isSplitPayment:
            transaction.payment_method === "SPLIT" ||
            (transaction.payment_splits || []).length > 0,
        };
      });
      
      setExportLoading(false);
      message.success(`Preparing ${exportData.length} records for export...`);
      return exportData;
    }

    setExportLoading(false);
    message.warning("No data received from server");
    return [];
  } catch (error) {
    console.error("❌ Error fetching filtered data:", error);
    message.error("Failed to fetch filtered data for export");
    setExportLoading(false);
    return [];
  }
};

  // ✅ FIXED: Function to fetch all data (no filters)
  const fetchAllData = async (): Promise<SaleRecord[]> => {
  try {
    setExportLoading(true);
    
    // Query with no filters
    const allDataQuery: QueryParams = {
      page: 1,
      limit: 1000000,
      search: "",
    };

    console.log("📤 Exporting ALL data...");
    const response = await triggerGetAllSalesNoPagination(allDataQuery).unwrap();
    
    console.log("📥 All data response:", {
      success: response?.success,
      salesCount: response?.data?.sales?.length || 0
    });
    
    if (response?.success) {
      const allData = response.data?.sales || [];
      
      // ✅ COPY THE MAPPING LOGIC FROM fetchAllFilteredData
      const exportData = allData.map((transaction: any, index: number) => {
        const remainingAmount =
          transaction.remaining_amount || transaction.remainingAmount || 0;
        const paymentStatus =
          transaction.payment_status ||
          transaction.paymentStatus ||
          (remainingAmount > 0 ? "PARTIAL" : "FULL");

        return {
          key: transaction.id?.toString() || `${index}-${Date.now()}`,
          id: transaction.id?.toString() || "",
          code: transaction.code || "N/A",
          ctn: transaction.ctn || 0,
          unit: transaction.product?.unit || "PC",
          productName:
            transaction.product_name || transaction.productName || "N/A",
          productPrice:
            transaction.product_price || transaction.productPrice || 0,
          sellPrice:
            transaction.product_price || transaction.productPrice || 0,
          buyerName: transaction.buyer_name || transaction.buyerName || "N/A",
          quantity: transaction.quantity || 0,
          totalPrice: transaction.total_price || transaction.totalPrice || 0,
          paidAmount: transaction.paid_amount || transaction.paidAmount || 0,
          remainingAmount,
          date: transaction.date
            ? formatDate(transaction.date)
            : transaction.created_at
              ? formatDate(transaction.created_at)
              : "N/A",
          paymentMethod:
            transaction.payment_method || transaction.paymentMethod || "CASH",
          bankName: transaction.bank_name || transaction.bankName,
          paymentStatus,
          casherName:
            transaction.casher_name || transaction.casherName || "N/A",
          recieverName: transaction.receiver_name || transaction.recieverName,
          sellerName: transaction.user?.name || "N/A",
          originalTransaction: transaction,
          originalDate: transaction.date || transaction.created_at || "",
          useCustomPrice: transaction.use_custom_price || false,
          discountPercentage: transaction.discount_percentage || 0,
          salePriceType: transaction.sale_price_type || "DEFAULT",
          isNegativeStockSale: transaction.is_negative_stock_sale || false,
          negativeStockPieces: transaction.negative_stock_pieces || 0,
          bulkDiscountApplied: transaction.bulk_discount_applied || false,
          totalDiscountAmount: transaction.total_discount_amount || 0,
          defaultProductPrice: transaction.default_product_price || 0,
          customPricePerPiece: transaction.custom_price_per_piece || 0,
          paymentSplits: (transaction.payment_splits || []).map(
            (split: any) => ({
              id: split.id,
              method: split.payment_method || "CASH",
              amount: split.amount || 0,
              percentage: split.percentage || 0,
              bankName: split.bank_name,
              senderName: split.sender_name,
              receiverName: split.receiver_name,
              telebirrPhone: split.telebirr_phone,
              telebirrTransactionId: split.telebirr_transaction_id,
              reference: split.reference,
              createdAt: split.created_at || new Date().toISOString(),
            }),
          ),
          isSplitPayment:
            transaction.payment_method === "SPLIT" ||
            (transaction.payment_splits || []).length > 0,
        };
      });
      
      setExportLoading(false);
      message.success(`Preparing ${exportData.length} records for export...`);
      return exportData;
    }

    setExportLoading(false);
    message.warning("No data received from server");
    return [];
  } catch (error) {
    console.error("❌ Error fetching all data:", error);
    message.error("Failed to fetch all data for export");
    setExportLoading(false);
    return [];
  }
};

  const allTableData: SaleRecord[] = useMemo(() => {
    return allTransactions.map((transaction: any, index: number) => {
      // Get remaining amount first
      const remainingAmount =
        transaction.remaining_amount || transaction.remainingAmount || 0;
      const paymentStatus =
        transaction.payment_status ||
        transaction.paymentStatus ||
        (remainingAmount > 0 ? "PARTIAL" : "FULL");

      // Extract and convert payment splits
      const paymentSplitsRaw =
        transaction.payment_splits || transaction.paymentSplits || [];
      const paymentSplits = paymentSplitsRaw.map((split: any) => ({
        id: split.id,
        method: split.payment_method || split.method || "CASH",
        amount: split.amount || 0,
        percentage: split.percentage || 0,
        bankName: split.bank_name || split.bankName,
        senderName: split.sender_name || split.senderName,
        receiverName: split.receiver_name || split.receiverName,
        telebirrPhone: split.telebirr_phone || split.telebirrPhone,
        telebirrTransactionId:
          split.telebirr_transaction_id || split.telebirrTransactionId,
        reference: split.reference,
        createdAt:
          split.created_at || split.createdAt || new Date().toISOString(),
      }));

      const isSplitPayment =
        transaction.payment_method === "SPLIT" ||
        transaction.paymentMethod === "SPLIT" ||
        paymentSplits.length > 0;

      // Get the original date - ensure it's always a string
      const originalDate = transaction.date || transaction.created_at || "";

      // Create the SaleRecord object
      const saleRecord: SaleRecord = {
        key: transaction.id?.toString() || `${index}-${Date.now()}`,
        id: transaction.id?.toString() || "",
        code: transaction.code || "N/A",
        ctn: transaction.ctn || 0,
        unit: transaction.product?.unit || "PC",
        productName:
          transaction.product_name || transaction.productName || "N/A",
        productPrice:
          transaction.product_price || transaction.productPrice || 0,
        sellPrice: transaction.product_price || transaction.productPrice || 0,
        buyerName: transaction.buyer_name || transaction.buyerName || "N/A",
        quantity: transaction.quantity || 0,
        totalPrice: transaction.total_price || transaction.totalPrice || 0,
        paidAmount: transaction.paid_amount || transaction.paidAmount || 0,
        remainingAmount,
        date: transaction.date
          ? formatDate(transaction.date)
          : transaction.created_at
            ? formatDate(transaction.created_at)
            : "N/A",
        paymentMethod:
          transaction.payment_method || transaction.paymentMethod || "CASH",
        bankName: transaction.bank_name || transaction.bankName,
        paymentStatus,
        casherName: transaction.casher_name || transaction.casherName || "N/A",
        recieverName: transaction.receiver_name || transaction.recieverName,
        sellerName: transaction.user?.name || "N/A",
        originalTransaction: transaction,
        originalDate,

        // New fields
        useCustomPrice: transaction.use_custom_price || false,
        discountPercentage: transaction.discount_percentage || 0,
        salePriceType: transaction.sale_price_type || "DEFAULT",
        isNegativeStockSale: transaction.is_negative_stock_sale || false,
        negativeStockPieces: transaction.negative_stock_pieces || 0,
        bulkDiscountApplied: transaction.bulk_discount_applied || false,
        totalDiscountAmount: transaction.total_discount_amount || 0,
        defaultProductPrice: transaction.default_product_price || 0,
        customPricePerPiece: transaction.custom_price_per_piece || 0,

        // Split payment fields
        paymentSplits,
        isSplitPayment,
      };

      return saleRecord;
    });
  }, [allTransactions]);

  // Statistics
  const pageStats = useMemo(
    () => SalesExport.calculateStats(allTableData),
    [allTableData],
  );

  // Pagination metadata
  const totalItems = useMemo(() => apiData?.data?.total || 0, [apiData]);
  const totalPages = useMemo(() => apiData?.data?.pages || 1, [apiData]);
  const currentPage = useMemo(
    () => apiData?.data?.page || query.page,
    [apiData, query.page],
  );

  // Handlers
  // const handleSearch = useCallback((value: string) => {
  //   const searchValue = value.trim();
  //   setLocalSearch(searchValue);
  //   setQuery((prev) => ({ ...prev, search: searchValue, page: 1 }));
  // }, []);

  const handleSearchClear = useCallback(() => {
    setLocalSearch("");
    setQuery((prev) => ({ ...prev, search: "", page: 1 }));
  }, []);

  const handleApplyFilters = (values: FilterValues) => {
    const newQuery: QueryParams = {
      page: 1,
      limit: query.limit,
      search: values.search || "",
    };

    if (values.paymentStatus?.length > 0)
      newQuery.paymentStatus = values.paymentStatus.join(",");
    if (values.paymentMethod?.length > 0)
      newQuery.paymentMethod = values.paymentMethod.join(",");
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
    setQuery({ page: 1, limit: 10, search: "" });
    setLocalSearch("");
    filterForm.resetFields();
    setFilterDrawerVisible(false);
  };

  const handleRemoveFilter = (filterKey: string) => {
    setQuery(prev => {
      const newQuery = { ...prev, page: 1 };
      
      switch (filterKey) {
        case 'search':
          setLocalSearch('');
          return { ...newQuery, search: '' };
          
        case 'paymentStatus':
          return { ...newQuery, paymentStatus: undefined };
          
        case 'paymentMethod':
          return { ...newQuery, paymentMethod: undefined };
          
        case 'dateRange':
          return { ...newQuery, startDate: undefined, endDate: undefined };
          
        case 'amountRange':
          return { ...newQuery, minAmount: undefined, maxAmount: undefined };
          
        default:
          return newQuery;
      }
    });
  };

  // Calculate active filters count
  const calculateActiveFilters = useCallback(() => {
  let count = 0;
  
  if (query.search && query.search.trim() !== '') count++;
  if (query.paymentStatus && query.paymentStatus.length > 0) count++;
  if (query.paymentMethod && query.paymentMethod.length > 0) count++;
  if (query.startDate || query.endDate) count++;
  if (query.minAmount !== undefined || query.maxAmount !== undefined) count++;
  
  console.log("🔍 Active filters count:", count, query); // Add this for debugging
  return count;
}, [query]);

// Update the useEffect to run whenever query changes
useEffect(() => {
  const count = calculateActiveFilters();
  setActiveFilters(count);
  console.log("📊 Active filters updated:", count);
}, [query, calculateActiveFilters]);

  const handleViewSplitPayment = (record: SaleRecord) => {
    setSelectedSplitSaleId(record.id);
    setSplitModalVisible(true);
  };

  const handleCloseSplitModal = () => {
    setSplitModalVisible(false);
    setSelectedSplitSaleId(null);
  };

  const handlePageChange: PaginationProps["onChange"] = (page, pageSize) => {
    setQuery((prev) => ({ ...prev, page, limit: pageSize }));
  };

  const handlePageSizeChange = (size: number) => {
    setQuery((prev) => ({ ...prev, page: 1, limit: size }));
  };

  // Effects
  useEffect(() => {
    if (filterDrawerVisible) {
      filterForm.setFieldsValue({
        search: query.search,
        paymentStatus: query.paymentStatus ? query.paymentStatus.split(',') : [],
        paymentMethod: query.paymentMethod ? query.paymentMethod.split(',') : [],
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

  const isMobile = !screens.md;

  // Prepare split modal data
  const splitModalData = useMemo(() => {
    if (!selectedSplitSaleId) return null;
    
    // Try to get from API first
    if (splitPaymentDetails?.success) {
      return splitPaymentDetails.data;
    }
    
    // Fallback to local data
    const localSale = allTableData.find(sale => sale.id === selectedSplitSaleId);
    if (!localSale) return null;

    return {
      id: localSale.id,
      saleId: parseInt(localSale.id) || 0,
      buyerName: localSale.buyerName,
      productName: localSale.productName,
      totalPrice: localSale.totalPrice,
      date: localSale.originalDate || localSale.date,
      paymentSplits: localSale.paymentSplits?.map(split => ({
        id: split.id,
        method: split.method,
        amount: split.amount,
        percentage: split.percentage,
        bankName: split.bankName,
        senderName: split.senderName,
        receiverName: split.receiverName,
        telebirrPhone: split.telebirrPhone,
        telebirrTransactionId: split.telebirrTransactionId,
        reference: split.reference,
        createdAt: split.createdAt,
      })) || [],
      sellerName: localSale.sellerName,
      paymentStatus: localSale.paymentStatus,
      productCode: localSale.code,
      quantity: localSale.quantity,
    };
  }, [selectedSplitSaleId, splitPaymentDetails, allTableData]);

  return (
    <div style={{ padding: isMobile ? "12px" : "16px" }}>
      {/* Safety Notice */}
      <Alert
        message="Sales Data Protection"
        description="Sale deletion is disabled to protect financial data integrity."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: "16px" }}
      />

      {/* Header */}
      <SalesHeader
        activeFilters={activeFilters}
        exportLoading={exportLoading}
        hasData={allTableData.length > 0}
        query={{ ...query, search: localSearch }}
        onSearch={handleSearch}
        onSearchClear={handleSearchClear}
        onFilterClick={() => setFilterDrawerVisible(true)}
        onExportClick={(info) => {
          SalesExport.handleExport(
            info.key,
            allTableData,
            query,
            totalItems,
            totalPages,
            fetchAllFilteredData,
            fetchAllData
            // setExportLoading removed from here
          );
        }}
        onClearFilters={handleClearAllFilters}
        onPageSizeChange={handlePageSizeChange}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        showMobileSummary={showMobileSummary}
        onToggleMobileSummary={() => setShowMobileSummary(!showMobileSummary)}
        exportItems={SalesExport.getExportMenuItems(allTableData, activeFilters > 0, exportLoading)}
        isMobile={isMobile}
      />

      {/* Active Filters */}
      <ActiveFiltersBar
        activeFilters={activeFilters}
        query={query}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        isMobile={isMobile}
      />

      {/* Mobile Summary */}
      {isMobile && showMobileSummary && (
        <Collapse
          defaultActiveKey={["1"]}
          style={{ marginBottom: "12px" }}
          size="small"
        >
          <Panel
            header={
              <Flex justify="space-between" align="center">
                <Text strong>Summary (Page {currentPage})</Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  Click to expand/collapse
                </Text>
              </Flex>
            }
            key="1"
          >
            <MobileSummary
              pageStats={pageStats}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              isExpanded={true}
            />
          </Panel>
        </Collapse>
      )}

      {/* Desktop Stats */}
      {!isMobile && (
        <SalesStats
          pageStats={pageStats}
          currentPage={currentPage}
          totalItems={totalItems}
        />
      )}

      {/* Loading/Empty States */}
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
        <>
          {/* Table */}
          <SalesTable
            data={allTableData}
            loading={isFetching}
            onViewSplitPayment={handleViewSplitPayment}
            onRefetch={refetch}
            onPaymentMethodFilter={(value) =>
              setQuery((prev) => ({ ...prev, paymentMethod: value, page: 1 }))
            }
            onPaymentStatusFilter={(value) =>
              setQuery((prev) => ({ ...prev, paymentStatus: value, page: 1 }))
            }
          />

          {/* Pagination */}
          {totalItems > 0 && (
            <Flex
              justify="space-between"
              align="center"
              style={{ marginTop: "24px" }}
              wrap={isMobile ? "wrap" : "nowrap"}
            >
              <div
                style={{ color: "#666", fontSize: isMobile ? "12px" : "14px" }}
              >
                Showing {allTableData.length} items • Page {currentPage} of{" "}
                {totalPages}
              </div>
              <Pagination
                current={currentPage}
                onChange={handlePageChange}
                total={totalItems}
                pageSize={query.limit}
                pageSizeOptions={["10", "25", "50", "100", "500"]}
                showSizeChanger={!isMobile}
                showQuickJumper={!isMobile}
                simple={isMobile}
                size={isMobile ? "small" : "default"}
                disabled={isFetching}
              />
            </Flex>
          )}
        </>
      )}

      {/* Filter Drawer */}
      <SalesFilters
        visible={filterDrawerVisible}
        onClose={() => setFilterDrawerVisible(false)}
        form={filterForm}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
        onClearAllFilters={handleClearAllFilters}
        isMobile={isMobile}
      />

      {/* Split Payment Modal */}
      <SplitPaymentModal
        visible={splitModalVisible}
        onClose={handleCloseSplitModal}
        sale={splitModalData}
        //isLoading={splitDetailsLoading}
      />
    </div>
  );
};

export default SaleManagementPage;