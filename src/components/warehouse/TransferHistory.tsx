// components/warehouse/TransferHistory.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  Button,
  Select,
  DatePicker,
  Modal,
  Descriptions,
  Typography,
  Tooltip,
  Spin,
  message,
  Badge,
  Alert,
} from "antd";
import {
  EyeOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  SearchOutlined,
  ClearOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  HistoryOutlined,
  ArrowRightOutlined,
  FilterFilled,
} from "@ant-design/icons";
import { useGetTransfersQuery } from "../../redux/features/warehouseApi";
import { Warehouse, TransferStatus } from "../../types/warehouse.types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import * as XLSX from "xlsx";
import debounce from "lodash/debounce";

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface TransferHistoryProps {
  isMobile: boolean;
}

// Define the actual API response structure
interface ApiTransfer {
  id: number;
  transfer_number: string;
  from_warehouse: Warehouse;
  to_warehouse: Warehouse;
  product_id: number;
  quantity: number;
  unit: string;
  status: string;
  transfer_type: string;
  requested_by: number;
  approved_by: number | null;
  completed_by: number | null;
  reason: string;
  notes: string;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  cartons: number;
  piecesPerCarton: number;
  totalPieces: number;
  product: {
    id: number;
    code: string;
    name: string;
    unit: string;
    price: number;
    qty: number;
  };
  requester: {
    id: number;
    name: string;
    email: string;
  } | null;
  approver: any;
  completer: any;
}

// API parameters that match the backend expectations
interface ApiFilterParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  fromWarehouse?: Warehouse;      // Changed from from_warehouse
  toWarehouse?: Warehouse;        // Changed from to_warehouse
  status?: TransferStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  productId?: number;             // Changed from productCode (expects ID, not code)
}

// Component state parameters (what we collect from UI)
interface UiFilterParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  status?: TransferStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  productCode?: string;           // We keep this for UI, but convert to productId for API
}

const TransferHistory: React.FC<TransferHistoryProps> = ({ isMobile }) => {
  const [params, setParams] = useState<UiFilterParams>({
    page: 1,
    limit: 10,
    sortBy: "requested_at",
    sortOrder: "desc",
  });

  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [productIdMap, setProductIdMap] = useState<Map<string, number>>(new Map());

  // Convert UI params to API params
  const apiParams: ApiFilterParams = {
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    fromWarehouse: params.fromWarehouse,
    toWarehouse: params.toWarehouse,
    status: params.status,
    startDate: params.startDate,
    endDate: params.endDate,
    search: params.search,
    // Convert productCode to productId if we have a mapping
    productId: params.productCode ? productIdMap.get(params.productCode) : undefined,
  };

  // Fetch data from API with all filters
  const {
    data: transfersData,
    isLoading,
    refetch,
    isFetching,
  } = useGetTransfersQuery(apiParams);

  const displayedTransfers: ApiTransfer[] = transfersData?.transfers || [];
  const totalRecords = transfersData?.pagination?.total || 0;
  const totalPages = transfersData?.pagination?.totalPages || 0;

  // Build product code to ID mapping from the fetched data
  useEffect(() => {
    if (displayedTransfers.length > 0) {
      const newMap = new Map<string, number>();
      displayedTransfers.forEach(transfer => {
        if (transfer.product?.code && transfer.product?.id) {
          newMap.set(transfer.product.code, transfer.product.id);
        }
      });
      setProductIdMap(prevMap => new Map([...Array.from(prevMap), ...Array.from(newMap)]));
    }
  }, [displayedTransfers]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (params.fromWarehouse) count++;
    if (params.toWarehouse) count++;
    if (params.status) count++;
    if (params.productCode) count++;
    if (params.search) count++;
    if (params.startDate || params.endDate) count++;
    setActiveFilterCount(count);
  }, [params]);

  // Warehouse options from enum
  const warehouseOptions = useMemo(
    () =>
      Object.values(Warehouse).map((wh) => ({
        id: wh,
        name: wh.replace(/_/g, " "),
      })),
    [],
  );

  // Status options from enum
  const statusOptions = useMemo(
    () =>
      Object.values(TransferStatus).map((status) => ({
        value: status,
        label: status.charAt(0) + status.slice(1).toLowerCase(),
      })),
    [],
  );

  // Fetch unique product codes for filter dropdown
  const uniqueProductCodes = useMemo(() => {
    return Array.from(
      new Set(
        displayedTransfers
          .map((transfer) => transfer.product?.code)
          .filter((code): code is string => !!code && code.trim() !== ""),
      ),
    ).sort();
  }, [displayedTransfers]);

  const handleFilterChange = (key: keyof UiFilterParams, value: any) => {
    setParams((prev) => {
      // If value is undefined or empty string, remove the filter
      const newParams = { ...prev, [key]: value || undefined, page: 1 };
      return newParams;
    });
  };

  const handleDateRangeChange = (dates: any) => {
    setParams((prev) => ({
      ...prev,
      startDate: dates?.[0]?.format("YYYY-MM-DD") || undefined,
      endDate: dates?.[1]?.format("YYYY-MM-DD") || undefined,
      page: 1,
    }));
  };

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        handleFilterChange("search", value || undefined);
      }, 500),
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInputValue(value);
    debouncedSearch(value);
  };

  const resetFilters = () => {
    setParams({
      page: 1,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
    setSearchInputValue("");
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setParams((prev) => ({
      ...prev,
      page: pagination.current || 1,
      limit: pagination.pageSize || 10,
      sortBy: sorter.field || prev.sortBy,
      sortOrder: sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : prev.sortOrder,
    }));
  };

  // Safe string formatting functions
  const formatWarehouseName = (warehouse: Warehouse | string | undefined): string => {
    if (!warehouse) return "N/A";
    return warehouse.replace(/_/g, " ");
  };

  const formatTransferType = (type: string | undefined): string => {
    if (!type) return "N/A";
    return type.replace(/_/g, " ");
  };

  const getProductName = (transfer: ApiTransfer): string => {
    return transfer.product?.name || "N/A";
  };

  const getProductCode = (transfer: ApiTransfer): string => {
    return transfer.product?.code || "N/A";
  };

  const getRequesterName = (transfer: ApiTransfer): string => {
    return transfer.requester?.name || "N/A";
  };

  const getCompleterName = (transfer: ApiTransfer): string => {
    return transfer.completer?.name || "N/A";
  };

  // Export to Excel function
  const handleExportToExcel = async () => {
    if (totalRecords === 0) {
      message.warning("No data to export");
      return;
    }

    try {
      message.loading("Preparing export...", 0);

      // Fetch all data for export
      let allTransfers: ApiTransfer[] = [...displayedTransfers];
      
      if (totalPages > 1) {
        const exportPromises = [];
        for (let page = 2; page <= totalPages; page++) {
          exportPromises.push(
            fetch(`/api/transfers?page=${page}&limit=${params.limit}&sortBy=${params.sortBy}&sortOrder=${params.sortOrder}`)
              .then(res => res.json())
          );
        }
        
        const results = await Promise.all(exportPromises);
        results.forEach(data => {
          allTransfers = [...allTransfers, ...(data.transfers || [])];
        });
      }

      const exportData = allTransfers.map((transfer) => ({
        "Transfer Number": transfer.transfer_number || "N/A",
        "Product Code": getProductCode(transfer),
        "Product Name": getProductName(transfer),
        "From Warehouse": formatWarehouseName(transfer.from_warehouse),
        "To Warehouse": formatWarehouseName(transfer.to_warehouse),
        Cartons: transfer.cartons || 0,
        "Pieces Per Carton": transfer.piecesPerCarton || 0,
        "Total Pieces": transfer.quantity || 0,
        Unit: transfer.unit || "N/A",
        "Product Price": transfer.product?.price || 0,
        Status: transfer.status || "N/A",
        "Transfer Type": formatTransferType(transfer.transfer_type),
        "Requested By": getRequesterName(transfer),
        "Completed By": getCompleterName(transfer),
        Reason: transfer.reason || "",
        Notes: transfer.notes || "",
        "Requested Date": transfer.requested_at
          ? dayjs(transfer.requested_at).format("YYYY-MM-DD HH:mm:ss")
          : "",
        "Completed Date": transfer.completed_at
          ? dayjs(transfer.completed_at).format("YYYY-MM-DD HH:mm:ss")
          : "",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const wscols = [
        { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
        { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 30 },
        { wch: 30 }, { wch: 20 }, { wch: 20 },
      ];
      ws["!cols"] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, "Transfer History");

      const timestamp = dayjs().format("YYYY-MM-DD_HH-mm");
      let filterInfo = "";
      if (params.fromWarehouse) filterInfo += `_from${params.fromWarehouse}`;
      if (params.toWarehouse) filterInfo += `_to${params.toWarehouse}`;
      if (params.status) filterInfo += `_${params.status}`;
      if (params.productCode) filterInfo += `_${params.productCode}`;
      if (params.search) filterInfo += `_search${params.search.substring(0, 10)}`;

      const filename = `transfer_history${filterInfo}_${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);

      message.destroy();
      message.success(`Exported ${exportData.length} transfers to Excel`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.destroy();
      message.error("Failed to export to Excel");
    }
  };

  const showTransferDetails = (record: ApiTransfer) => {
    Modal.info({
      title: "Transfer Details",
      width: isMobile ? "90%" : 600,
      content: (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Transfer Number">
            <Text strong>{record.transfer_number || "N/A"}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Product">
            {getProductName(record)} ({getProductCode(record)})
          </Descriptions.Item>
          <Descriptions.Item label="From Warehouse">
            <Tag color="blue">{formatWarehouseName(record.from_warehouse)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="To Warehouse">
            <Tag color="green">{formatWarehouseName(record.to_warehouse)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Quantity">
            {record.cartons || 0} cartons (
            {record.totalPieces || record.quantity || 0} pieces)
          </Descriptions.Item>
          <Descriptions.Item label="Unit">
            {record.unit || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Transfer Type">
            {formatTransferType(record.transfer_type)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag
              color={
                record.status === TransferStatus.COMPLETED
                  ? "green"
                  : record.status === TransferStatus.CANCELLED
                    ? "red"
                    : "orange"
              }
            >
              {record.status ? formatTransferType(record.status) : "Unknown"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Requested At">
            {record.requested_at
              ? dayjs(record.requested_at).format("YYYY-MM-DD HH:mm:ss")
              : "N/A"}
          </Descriptions.Item>
          {record.completed_at && (
            <Descriptions.Item label="Completed At">
              {dayjs(record.completed_at).format("YYYY-MM-DD HH:mm:ss")}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Requested By">
            {getRequesterName(record)}
          </Descriptions.Item>
          {record.completer && (
            <Descriptions.Item label="Completed By">
              {getCompleterName(record)}
            </Descriptions.Item>
          )}
          {record.reason && (
            <Descriptions.Item label="Reason">
              {record.reason}
            </Descriptions.Item>
          )}
          {record.notes && (
            <Descriptions.Item label="Notes">{record.notes}</Descriptions.Item>
          )}
          <Descriptions.Item label="Product Price">
            ${record.product?.price || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Pieces Per Carton">
            {record.piecesPerCarton || record.product?.qty || 0}
          </Descriptions.Item>
        </Descriptions>
      ),
    });
  };

  const columns = [
    {
      title: "Transfer #",
      dataIndex: "transfer_number",
      key: "transfer_number",
      render: (text: string) => (
        <Text strong style={{ fontSize: isMobile ? "12px" : "14px" }}>
          {text || "N/A"}
        </Text>
      ),
      sorter: true,
    },
    {
      title: "Product",
      key: "product",
      render: (_: any, record: ApiTransfer) => (
        <div>
          <div style={{ fontWeight: "500", fontSize: isMobile ? "12px" : "14px" }}>
            {getProductName(record)}
          </div>
          <div style={{ fontSize: isMobile ? "10px" : "12px", color: "#666" }}>
            Code: {getProductCode(record)}
          </div>
          <div style={{ fontSize: isMobile ? "10px" : "11px", color: "#888" }}>
            Unit: {record.unit || "N/A"} • ${record.product?.price || 0}
          </div>
        </div>
      ),
      sorter: true,
    },
    {
      title: "From → To",
      key: "warehouses",
      render: (_: any, record: ApiTransfer) => (
        <Space direction={isMobile ? "vertical" : "horizontal"} size="small">
          <Tag color="blue" style={{ margin: 0 }}>
            {formatWarehouseName(record.from_warehouse)}
          </Tag>
          {!isMobile && (
            <ArrowRightOutlined style={{ fontSize: "12px", color: "#8c8c8c" }} />
          )}
          <Tag color="green" style={{ margin: 0 }}>
            {formatWarehouseName(record.to_warehouse)}
          </Tag>
        </Space>
      ),
      sorter: true,
    },
    {
      title: "Quantity",
      key: "quantity",
      render: (_: any, record: ApiTransfer) => (
        <div style={{ textAlign: isMobile ? "left" : "center" }}>
          <div style={{ fontWeight: "bold", fontSize: isMobile ? "12px" : "14px" }}>
            {record.cartons || 0} cartons
          </div>
          <div style={{ fontSize: isMobile ? "10px" : "12px", color: "#666" }}>
            ({record.totalPieces || record.quantity || 0} pieces)
          </div>
          <div style={{ fontSize: isMobile ? "9px" : "11px", color: "#888", fontStyle: "italic" }}>
            {record.piecesPerCarton || record.product?.qty || 1} pcs/carton
          </div>
        </div>
      ),
      sorter: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: ApiTransfer) => {
        const statusConfig: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
          [TransferStatus.COMPLETED]: {
            color: "#52c41a",
            icon: <CheckCircleFilled />,
            text: "Completed",
          },
          [TransferStatus.CANCELLED]: {
            color: "#ff4d4f",
            icon: <CloseCircleFilled />,
            text: "Cancelled",
          },
          [TransferStatus.PENDING]: {
            color: "#fa8c16",
            icon: <ClockCircleOutlined />,
            text: "Pending",
          },
        };

        const config = statusConfig[status] || {
          color: "#666",
          icon: null,
          text: status ? formatTransferType(status) : "Unknown",
        };

        let tooltipText = `Status: ${config.text}`;
        if (record.completed_at) {
          tooltipText += `\nCompleted: ${dayjs(record.completed_at).format("YYYY-MM-DD HH:mm")}`;
        } else if (record.approved_at) {
          tooltipText += `\nApproved: ${dayjs(record.approved_at).format("YYYY-MM-DD HH:mm")}`;
        }

        return (
          <Tooltip title={tooltipText}>
            <Tag color={config.color} icon={config.icon} style={{ margin: 0 }}>
              {config.text}
            </Tag>
          </Tooltip>
        );
      },
      sorter: true,
    },
    {
      title: "Requested",
      dataIndex: "requested_at",
      key: "requested_at",
      render: (date: string) =>
        date ? (
          <Tooltip title={dayjs(date).format("YYYY-MM-DD HH:mm:ss")}>
            <Text type="secondary" style={{ fontSize: isMobile ? "12px" : "14px" }}>
              {dayjs(date).fromNow()}
            </Text>
          </Tooltip>
        ) : (
          "N/A"
        ),
      sorter: true,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ApiTransfer) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showTransferDetails(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const loading = isLoading || isFetching;

  if (isLoading && params.page === 1) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin tip="Loading transfer history..." />
      </div>
    );
  }

  return (
    <Card bodyStyle={{ padding: isMobile ? "8px" : "16px" }}>
      {/* Filters Section */}
      <div style={{ marginBottom: "16px" }}>
        {/* Search and Export Row */}
        <Space
          wrap
          style={{
            width: "100%",
            marginBottom: "12px",
            justifyContent: "space-between",
          }}
        >
          <Space>
            <Badge count={activeFilterCount} offset={[-5, 5]} showZero={false}>
              <FilterFilled style={{ fontSize: "16px", color: activeFilterCount ? "#1890ff" : "#bfbfbf" }} />
            </Badge>
            <Search
              placeholder="Search by transfer number, product, warehouse..."
              style={{ width: isMobile ? "100%" : 350 }}
              allowClear
              size={isMobile ? "small" : "middle"}
              onChange={handleSearchChange}
              value={searchInputValue}
              prefix={<SearchOutlined />}
            />
          </Space>

          <Space>
            <Tooltip title="Refresh Data">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                size={isMobile ? "small" : "middle"}
              />
            </Tooltip>

            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportToExcel}
              size={isMobile ? "small" : "middle"}
              disabled={totalRecords === 0}
            >
              {!isMobile && "Export"}
            </Button>
          </Space>
        </Space>

        {/* Filter Controls Row */}
        <Space wrap style={{ marginTop: "12px", width: "100%" }} size={[8, 8]}>
          <Select
            placeholder="From Warehouse"
            style={{ width: isMobile ? "100%" : 180 }}
            value={params.fromWarehouse}
            onChange={(value) => handleFilterChange("fromWarehouse", value)}
            allowClear
            size={isMobile ? "small" : "middle"}
          >
            {warehouseOptions.map((wh) => (
              <Option key={wh.id} value={wh.id}>
                {wh.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="To Warehouse"
            style={{ width: isMobile ? "100%" : 180 }}
            value={params.toWarehouse}
            onChange={(value) => handleFilterChange("toWarehouse", value)}
            allowClear
            size={isMobile ? "small" : "middle"}
          >
            {warehouseOptions.map((wh) => (
              <Option key={wh.id} value={wh.id}>
                {wh.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Status"
            style={{ width: isMobile ? "100%" : 130 }}
            value={params.status}
            onChange={(value) => handleFilterChange("status", value)}
            allowClear
            size={isMobile ? "small" : "middle"}
          >
            {statusOptions.map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Product Code"
            style={{ width: isMobile ? "100%" : 150 }}
            value={params.productCode}
            onChange={(value) => handleFilterChange("productCode", value)}
            allowClear
            showSearch
            filterOption={(input: string, option: any) =>
              (option?.children as string)
                ?.toLowerCase()
                .indexOf(input.toLowerCase()) >= 0
            }
            size={isMobile ? "small" : "middle"}
            notFoundContent={uniqueProductCodes.length === 0 ? "No products available" : null}
          >
            {uniqueProductCodes.map((code) => (
              <Option key={code} value={code}>
                {code}
              </Option>
            ))}
          </Select>

          <RangePicker
            style={{ width: isMobile ? "100%" : 250 }}
            onChange={handleDateRangeChange}
            size={isMobile ? "small" : "middle"}
            allowClear
            placeholder={["Start Date", "End Date"]}
          />

          {activeFilterCount > 0 && (
            <Tooltip title="Reset All Filters">
              <Button
                icon={<ClearOutlined />}
                onClick={resetFilters}
                size={isMobile ? "small" : "middle"}
                danger
              >
                {!isMobile && "Reset"}
              </Button>
            </Tooltip>
          )}
        </Space>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              background: "#e6f7ff",
              borderRadius: "4px",
              border: "1px solid #91d5ff",
            }}
          >
            <Space wrap size={[4, 4]}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Active filters:
              </Text>
              {params.fromWarehouse && (
                <Tag color="blue" closable onClose={() => handleFilterChange("fromWarehouse", undefined)}>
                  From: {formatWarehouseName(params.fromWarehouse)}
                </Tag>
              )}
              {params.toWarehouse && (
                <Tag color="green" closable onClose={() => handleFilterChange("toWarehouse", undefined)}>
                  To: {formatWarehouseName(params.toWarehouse)}
                </Tag>
              )}
              {params.status && (
                <Tag color="orange" closable onClose={() => handleFilterChange("status", undefined)}>
                  Status: {formatTransferType(params.status)}
                </Tag>
              )}
              {params.productCode && (
                <Tag color="purple" closable onClose={() => handleFilterChange("productCode", undefined)}>
                  Code: {params.productCode}
                </Tag>
              )}
              {params.search && (
                <Tag color="cyan" closable onClose={() => {
                  handleFilterChange("search", undefined);
                  setSearchInputValue("");
                }}>
                  Search: {params.search}
                </Tag>
              )}
              {(params.startDate || params.endDate) && (
                <Tag color="geekblue" closable onClose={() => {
                  setParams(prev => ({
                    ...prev,
                    startDate: undefined,
                    endDate: undefined,
                    page: 1,
                  }));
                }}>
                  Date: {params.startDate || "..."} to {params.endDate || "..."}
                </Tag>
              )}
            </Space>
          </div>
        )}

        {/* Filter Stats */}
        <div style={{ marginTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            Showing {displayedTransfers.length} of {totalRecords} transfers
          </Text>
          {loading && <Spin size="small" />}
        </div>
      </div>

      {/* Table Section */}
      <Table
        columns={columns}
        dataSource={displayedTransfers}
        rowKey="id"
        loading={loading}
        scroll={isMobile ? { x: true } : { x: "max-content" }}
        size={isMobile ? "small" : "middle"}
        pagination={{
          current: params.page,
          pageSize: params.limit,
          total: totalRecords,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) => 
            `Showing ${range[0]}-${range[1]} of ${total} transfers`,
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: totalRecords === 0 && activeFilterCount > 0 ? (
            <div style={{ padding: "20px" }}>
              <Alert
                message="No matching transfers"
                description="Try adjusting your filters or clear them to see all transfers"
                type="info"
                showIcon
                action={
                  <Button size="small" type="primary" onClick={resetFilters}>
                    Clear Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <HistoryOutlined style={{ fontSize: isMobile ? "32px" : "48px", color: "#666", marginBottom: "16px" }} />
              <Text strong style={{ fontSize: isMobile ? "16px" : "20px", display: "block" }}>
                No Transfer History
              </Text>
              <Text type="secondary">No transfer records found</Text>
            </div>
          ),
        }}
      />
    </Card>
  );
};

export default TransferHistory;