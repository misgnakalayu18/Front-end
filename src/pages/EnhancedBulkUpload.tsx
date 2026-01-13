// components/EnhancedBulkUpload.tsx
import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Card,
  Upload,
  Table,
  Alert,
  Space,
  Steps,
  Modal,
  Typography,
  Tag,
  message,
  Progress,
  Divider,
  Statistic,
  Row,
  Col,
  Tooltip,
  Badge,
  Grid,
  Drawer,
} from "antd";
import {
  UploadOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  HistoryOutlined,
  EyeOutlined,
  DeleteOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { UploadProps, UploadFile, RcFile } from "antd/es/upload/interface";

// Import Redux hooks
import {
  useBulkUploadMutation,
  useGetUploadHistoryQuery,
  useDownloadTemplateMutation,
} from "../redux/features/management/bulkUploadApi";

const { Dragger } = Upload;
const { Text, Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

// Interfaces
interface UploadResult {
  success: boolean;
  message: string;
  data: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    errors: string[];
    warnings?: string[];
  };
}

interface CSVProductData {
  key: string;
  code: string;
  name: string;
  warehouse: string;
  unit: string;
  qty: number;
  ctn: number;
  price: number;
  remark?: string;
  totalPieces?: number;
  totalPrice?: number;
}

interface UploadHistoryItem {
  id: number;
  filename: string;
  successful_rows: number;
  failed_rows: number;
  total_rows: number;
  status: string;
  created_at: string;
}

// Constants
const VALID_FILE_TYPES = [".csv", ".xlsx", ".xls"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const STEPS = [
  { title: "Select File", icon: <FileExcelOutlined /> },
  { title: "Preview", icon: <EyeOutlined /> },
  { title: "Processing", icon: <UploadOutlined /> },
  { title: "Complete", icon: <CheckCircleOutlined /> },
];

const WAREHOUSE_COLORS: Record<string, string> = {
  SHEGOLE_MULUNEH: "blue",
  EMBILTA: "green",
  NEW_SHEGOLE: "orange",
  MERKATO: "purple",
  DAMAGE: "red",
  BACKUP: "gray",
};

const UNIT_COLORS: Record<string, string> = {
  PC: "blue",
  DOZ: "green",
  SET: "orange",
};

// Helper Components
interface ErrorListProps {
  errors: string[];
  title: string;
  alertType?: "error" | "warning";
}

const ErrorList = ({ errors, title, alertType = "error" }: ErrorListProps) => (
  <Alert
    message={title}
    description={
      <div style={{ maxHeight: "200px", overflow: "auto" }}>
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          {errors.slice(0, 20).map((error, index) => (
            <li key={index} style={{ marginBottom: "4px" }}>
              <Text type={alertType === "error" ? "danger" : "warning"} style={{ fontSize: "12px" }}>
                {error}
              </Text>
            </li>
          ))}
          {errors.length > 20 && (
            <li>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                ... and {errors.length - 20} more
              </Text>
            </li>
          )}
        </ul>
      </div>
    }
    type={alertType}
    showIcon
  />
);

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onUpload: () => void;
  isUploading: boolean;
  previewData: CSVProductData[];
  currentFile: RcFile | null;
  columns: any[];
  totalValues: { totalPieces: number; totalValue: number };
  isMobile: boolean;
}

const PreviewModal = ({
  visible,
  onClose,
  onUpload,
  isUploading,
  previewData,
  currentFile,
  columns,
  totalValues,
  isMobile,
}: PreviewModalProps) => {
  const modalWidth = isMobile ? "100%" : 1500;
  const modalStyle = isMobile ? { top: 0, padding: 0 } : { top: 20 };

  return (
    <Modal
      title={
        <Space>
          <EyeOutlined />
          <span>Data Preview</span>
          <Tag color="blue">{previewData.length} rows</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Close
        </Button>,
        <Button key="upload" type="primary" onClick={onUpload} loading={isUploading} icon={<UploadOutlined />}>
          Start Upload
        </Button>,
      ]}
      width={modalWidth}
      style={modalStyle}
      bodyStyle={isMobile ? { padding: 0, height: "100vh" } : undefined}
    >
      {previewData.length > 0 ? (
        <>
          <Alert
            message="Preview Mode"
            description={
              <div>
                <Text>This shows the first 10 rows of your file. Please verify the data before uploading.</Text>
                <br />
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  • Existing products with matching code and warehouse will be updated
                  <br />
                  • New products will be created
                  <br />• Total pieces and value are calculated automatically
                </Text>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <div style={{ overflowX: "auto" }}>
            <Table
              columns={columns}
              dataSource={previewData}
              pagination={false}
              scroll={isMobile ? { x: 800, y: 300 } : { x: 1300, y: 400 }}
              size={isMobile ? "small" : "middle"}
              bordered
              rowKey="key"
              summary={() => (
                <Table.Summary fixed="bottom">
                  <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Text strong>Total Preview:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>
                        {previewData.reduce((sum, row) => sum + (row.qty || 0), 0)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong>
                        {previewData.reduce((sum, row) => sum + (row.ctn || 0), 0)}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong type="warning">
                        {totalValues.totalPieces.toLocaleString()}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} colSpan={5}>
                      <Text strong type="danger">
                        ETB {totalValues.totalValue.toLocaleString()}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>
          <div style={{ marginTop: 16, fontSize: "12px", color: "#666" }}>
            <Alert
              message="File Information"
              description={
                <Space direction="vertical" size={2}>
                  <Text type="secondary">File: {currentFile?.name}</Text>
                  <Text type="secondary">Rows in preview: {previewData.length}</Text>
                  <Text type="secondary">
                    Estimated total value: ETB {totalValues.totalValue.toLocaleString()}
                  </Text>
                </Space>
              }
              type="info"
              showIcon={false}
              style={{ backgroundColor: "transparent" }}
            />
          </div>
        </>
      ) : (
        <Alert
          message="Limited Preview Available"
          description={
            <div>
              <Text>
                {currentFile?.name.endsWith(".xlsx") || currentFile?.name.endsWith(".xls")
                  ? "For Excel files, preview is limited. The data will be processed directly when you upload."
                  : "No preview data available. This may be due to file format or empty data."}
              </Text>
              <br />
              <Text type="secondary">Click "Start Upload" to process the file directly.</Text>
            </div>
          }
          type="info"
          showIcon
        />
      )}
    </Modal>
  );
};

const EnhancedBulkUpload = () => {
  // Responsive hooks
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isDesktop = screens.lg;

  // State
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<CSVProductData[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState<RcFile | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  //const [isUploading, setIsUploading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redux hooks
  const [bulkUpload] = useBulkUploadMutation();
  const [downloadTemplate] = useDownloadTemplateMutation();
  const { data: historyData, refetch: refetchHistory } =
  useGetUploadHistoryQuery({ page: 1, limit: 10 }, { skip: !showHistory });

  // Responsive adjustments
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  const getResponsiveColumns = () => {
    if (isMobile) {
      return [
        {
          title: "Code",
          dataIndex: "code",
          key: "code",
          width: 80,
          fixed: "left" as const,
          render: (text: string) => (
            <Text strong style={{ fontFamily: "monospace", fontSize: "12px" }}>
              {text}
            </Text>
          ),
        },
        {
          title: "Name",
          dataIndex: "name",
          key: "name",
          width: 120,
          ellipsis: true,
          render: (text: string) => (
            <Tooltip title={text}>
              <Text style={{ fontSize: "12px" }}>{text}</Text>
            </Tooltip>
          ),
        },
        {
          title: "WH",
          dataIndex: "warehouse",
          key: "warehouse",
          width: 60,
          render: (warehouse: string) => getWarehouseTag(warehouse),
        },
        {
          title: "Unit",
          dataIndex: "unit",
          key: "unit",
          width: 50,
          render: (unit: string) => (
            <Tag
              color={UNIT_COLORS[unit?.toUpperCase()] || "default"}
              style={{ fontWeight: "bold", padding: "2px 6px", fontSize: "10px" }}
            >
              {unit?.toUpperCase().slice(0, 3)}
            </Tag>
          ),
        },
        {
          title: "Qty",
          dataIndex: "qty",
          key: "qty",
          width: 60,
          render: (qty: number) => (
            <Badge count={qty || 0} style={{ backgroundColor: "#1890ff", fontSize: "10px" }} />
          ),
        },
        {
          title: "CTN",
          dataIndex: "ctn",
          key: "ctn",
          width: 60,
          render: (ctn: number) => (
            <Badge count={ctn || 0} style={{ backgroundColor: "#52c41a", fontSize: "10px" }} />
          ),
        },
        {
          title: "Total",
          key: "totalPieces",
          width: 70,
          render: (record: CSVProductData) => {
            const totalPieces = (record.qty || 0) * (record.ctn || 0);
            return (
              <Text strong type="warning" style={{ fontSize: "11px" }}>
                {totalPieces.toLocaleString()}
              </Text>
            );
          },
        },
      ];
    }

    if (isTablet) {
      return [
        {
          title: "Code",
          dataIndex: "code",
          key: "code",
          width: 90,
          fixed: "left" as const,
          render: (text: string) => (
            <Text strong style={{ fontFamily: "monospace" }}>
              {text}
            </Text>
          ),
        },
        {
          title: "Product Name",
          dataIndex: "name",
          key: "name",
          width: 150,
          ellipsis: true,
          render: (text: string) => (
            <Tooltip title={text}>
              <Text>{text}</Text>
            </Tooltip>
          ),
        },
        {
          title: "Warehouse",
          dataIndex: "warehouse",
          key: "warehouse",
          width: 90,
          render: (warehouse: string) => getWarehouseTag(warehouse),
        },
        {
          title: "Unit",
          dataIndex: "unit",
          key: "unit",
          width: 70,
          render: (unit: string) => getUnitTag(unit),
        },
        {
          title: "Pcs/Carton",
          dataIndex: "qty",
          key: "qty",
          width: 100,
          render: (qty: number) => (
            <Badge count={qty || 0} style={{ backgroundColor: "#1890ff" }} />
          ),
        },
        {
          title: "Cartons",
          dataIndex: "ctn",
          key: "ctn",
          width: 90,
          render: (ctn: number) => (
            <Badge count={ctn || 0} style={{ backgroundColor: "#52c41a" }} />
          ),
        },
        {
          title: "Total Pieces",
          key: "totalPieces",
          width: 100,
          render: (record: CSVProductData) => {
            const totalPieces = (record.qty || 0) * (record.ctn || 0);
            return (
              <Text strong type="warning">
                {totalPieces.toLocaleString()}
              </Text>
            );
          },
        },
        {
          title: "Price",
          dataIndex: "price",
          key: "price",
          width: 90,
          render: (price: number) => (
            <Text strong type="success">
              ETB {price?.toLocaleString()}
            </Text>
          ),
        },
      ];
    }

    // Desktop columns (original)
    return [
      {
        title: "Code",
        dataIndex: "code",
        key: "code",
        width: 100,
        fixed: "left" as const,
        render: (text: string) => (
          <Text strong style={{ fontFamily: "monospace" }}>
            {text}
          </Text>
        ),
      },
      {
        title: "Product Name",
        dataIndex: "name",
        key: "name",
        width: 200,
        ellipsis: true,
        render: (text: string) => (
          <Tooltip title={text}>
            <Text>{text}</Text>
          </Tooltip>
        ),
      },
      {
        title: "Warehouse",
        dataIndex: "warehouse",
        key: "warehouse",
        width: 90,
        render: (warehouse: string) => getWarehouseTag(warehouse),
      },
      {
        title: "Unit",
        dataIndex: "unit",
        key: "unit",
        width: 70,
        render: (unit: string) => getUnitTag(unit),
      },
      {
        title: "Pcs/Carton",
        dataIndex: "qty",
        key: "qty",
        width: 100,
        render: (qty: number) => (
          <Badge count={qty || 0} style={{ backgroundColor: "#1890ff" }} />
        ),
      },
      {
        title: "Cartons",
        dataIndex: "ctn",
        key: "ctn",
        width: 90,
        render: (ctn: number) => (
          <Badge count={ctn || 0} style={{ backgroundColor: "#52c41a" }} />
        ),
      },
      {
        title: "Total Pieces",
        key: "totalPieces",
        width: 100,
        render: (record: CSVProductData) => {
          const totalPieces = (record.qty || 0) * (record.ctn || 0);
          return (
            <Text strong type="warning">
              {totalPieces.toLocaleString()}
            </Text>
          );
        },
      },
      {
        title: "Price/Piece",
        dataIndex: "price",
        key: "price",
        width: 110,
        render: (price: number) => (
          <Text strong type="success">
            ETB {price?.toLocaleString()}
          </Text>
        ),
      },
      {
        title: "Total Value",
        key: "totalPrice",
        width: 120,
        render: (record: CSVProductData) => {
          const totalPieces = (record.qty || 0) * (record.ctn || 0);
          const totalPrice = totalPieces * (record.price || 0);
          return (
            <Text strong type="danger">
              ETB {totalPrice.toLocaleString()}
            </Text>
          );
        },
      },
      {
        title: "Remark",
        dataIndex: "remark",
        key: "remark",
        width: 150,
        ellipsis: true,
        render: (remark: string) => (
          <Tooltip title={remark}>
            <Text type="secondary" italic>
              {remark || "-"}
            </Text>
          </Tooltip>
        ),
      },
    ];
  };

  // Helper functions
  const resetUploadState = () => {
    setFileList([]);
    setPreviewData([]);
    setUploadResult(null);
    setCurrentStep(0);
    setCurrentFile(null);
    setIsPreviewModalVisible(false);
    setUploadProgress(0);
    //setIsUploading(false);
  };

  const handleFileSuccess = (file: RcFile, preview: CSVProductData[]) => {
    setCurrentFile(file);
    setPreviewData(preview.slice(0, 10));
    
    const uploadFile: UploadFile = {
      uid: file.uid,
      name: file.name,
      size: file.size,
      type: file.type,
      originFileObj: file,
      status: "done",
    };
    
    setFileList([uploadFile]);
    setCurrentStep(2);
    message.success(`File "${file.name}" loaded successfully!`);
  };

  const readAndPreviewFile = (file: RcFile) => {
    if (file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const preview = parseCSVPreview(content);
          handleFileSuccess(file, preview);
          
          if (preview.length > 0) {
            setIsPreviewModalVisible(true);
          }
        } catch (error) {
          console.error("Error reading CSV:", error);
          message.error("Error reading CSV file. Please check the format.");
        }
      };
      reader.readAsText(file, "UTF-8");
    } else {
      // For Excel files
      handleFileSuccess(file, []);
      message.info('Excel file selected. Click "Preview Data" to see the data.');
    }
  };

  const beforeUpload = (file: RcFile) => {
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!VALID_FILE_TYPES.includes(fileExtension)) {
      message.error("You can only upload CSV or Excel files!");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      message.error(
        `File must be smaller than 10MB! Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      return false;
    }

    readAndPreviewFile(file);
    return false;
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: VALID_FILE_TYPES.join(", "),
    fileList,
    beforeUpload,
    onRemove: resetUploadState,
  };

  // Computed values
  const uploadHistory = useMemo<UploadHistoryItem[]>(() => {
    if (!historyData?.data) return [];
    // Handle nested response structure
    const data = historyData.data as any;
    return data.data?.history || data.history || [];
  }, [historyData]);

  const totalPreviewValues = useMemo(() => {
    if (previewData.length === 0) return { totalPieces: 0, totalValue: 0 };
    
    return previewData.reduce(
      (acc, row) => {
        const pieces = (row.qty || 0) * (row.ctn || 0);
        const value = pieces * (row.price || 0);
        return {
          totalPieces: acc.totalPieces + pieces,
          totalValue: acc.totalValue + value,
        };
      },
      { totalPieces: 0, totalValue: 0 }
    );
  }, [previewData]);

  const getWarehouseTag = (warehouse: string) => {
    const normalizedWarehouse = warehouse?.toUpperCase().replace(/\s+/g, "_");
    const color = WAREHOUSE_COLORS[normalizedWarehouse] || "default";

    const displayText = isMobile 
      ? normalizedWarehouse
          ?.split("_")
          .map((word) => word.charAt(0))
          .join("")
      : normalizedWarehouse
          ?.split("_")
          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
          .join(" ");

    return (
      <Tooltip title={warehouse}>
        <Tag color={color} style={{ 
          textTransform: isMobile ? "uppercase" : "none",
          padding: isMobile ? "2px 6px" : "4px 8px",
          fontSize: isMobile ? "10px" : "12px"
        }}>
          {displayText}
        </Tag>
      </Tooltip>
    );
  };

  const getUnitTag = (unit: string) => {
    const normalizedUnit = unit?.toUpperCase();
    const color = UNIT_COLORS[normalizedUnit] || "default";

    return (
      <Tag color={color} style={{ 
        fontWeight: "bold",
        padding: isMobile ? "2px 6px" : "4px 8px",
        fontSize: isMobile ? "10px" : "12px"
      }}>
        {normalizedUnit}
      </Tag>
    );
  };

  const handleUpload = async () => {
  if (!currentFile) {
    message.error("No file selected. Please select a file first.");
    return;
  }

    //setIsUploading(true);
    setCurrentStep(3);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", currentFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 300);

      const result = await bulkUpload(formData).unwrap();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadResult(result);
      setCurrentStep(3);
      setIsPreviewModalVisible(false);
      
      if (result.success) {
      const { data } = result;
      if (data.failedRows === 0) {
        message.success(`Successfully uploaded ${data.successfulRows} products!`);
      } else {
        message.warning(
          `Upload completed with ${data.successfulRows} successes and ${data.failedRows} failures.`
        );
      }
    } else {
      message.error(result.message || "Upload failed");
      setCurrentStep(1);
    }
    
    refetchHistory();
  } catch (error: any) {
    console.error("Upload failed:", error);
    setCurrentStep(1);
    
    // Improved error handling
    let errorMessage = "Upload failed. Please try again.";
    
    if (error?.data?.message) {
      errorMessage = error.data.message;
    } else if (error?.status) {
      if (error.status === 413) {
        errorMessage = "File too large. Maximum size is 10MB.";
      } else if (error.status === 415) {
        errorMessage = "Invalid file type. Please upload CSV or Excel files.";
      } else if (error.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
    } else if (error?.message?.includes('serializable')) {
      errorMessage = "Data format error. Please check your file format.";
    }
    
    message.error(`Upload failed: ${errorMessage}`);
  } finally {
    setUploadProgress(0);
    // Don't set isUploading to false here - the mutation hook handles it
  }
};

  const handleDownloadTemplate = async (format: 'csv' | 'excel') => {
  try {
    const result = await downloadTemplate({ 
      format: format === 'excel' ? 'excel' : 'csv' 
    }).unwrap();
    
    // Create blob from result
    const contentType = format === 'excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv;charset=utf-8;';
    
    const blob = new Blob([result], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `product_upload_template.${format === 'excel' ? 'xlsx' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success(`${format.toUpperCase()} template downloaded successfully!`);
  } catch (error: any) {
    console.error(`Failed to download ${format} template:`, error);
    
    // Handle specific error types
    if (error?.status === 404) {
      message.error('Template endpoint not found. Please check server configuration.');
    } else if (error?.status === 500) {
      message.error('Server error while generating template.');
    } else {
      message.error(`Failed to download template. ${error?.data?.message || ''}`);
    }
  }
};

  const historyColumns = [
    {
      title: "File",
      dataIndex: "filename",
      key: "filename",
      ellipsis: true,
      width: isMobile ? 120 : 200,
      render: (filename: string) => (
        <Tooltip title={filename}>
          <Text style={{ fontSize: isMobile ? "12px" : "14px" }}>
            {isMobile ? filename.slice(0, 20) + (filename.length > 20 ? "..." : "") : filename}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: isMobile ? 80 : 100,
      render: (record: UploadHistoryItem) => {
        const status = record.status || "PROCESSING";
        const colorMap: Record<string, string> = {
          COMPLETED: "success",
          PARTIALLY_COMPLETED: "warning",
          FAILED: "error",
          PROCESSING: "processing",
        };
        
        const displayStatus = isMobile 
          ? status.slice(0, 3)
          : status;
        
        return (
          <Tag 
            color={colorMap[status] || "default"}
            style={{ fontSize: isMobile ? "10px" : "12px", padding: isMobile ? "2px 4px" : "4px 8px" }}
          >
            {displayStatus}
          </Tag>
        );
      },
    },
    {
      title: "✓",
      dataIndex: "successful_rows",
      key: "successfulRows",
      width: 75,
      render: (value: number) => (
        <Badge 
          count={value || 0} 
          style={{ 
            backgroundColor: "#52c41a",
            fontSize: isMobile ? "10px" : "12px"
          }} 
        />
      ),
    },
    {
      title: "✗",
      dataIndex: "failed_rows",
      key: "failedRows",
      width: 60,
      render: (value: number) => (
        <Badge 
          count={value || 0} 
          style={{ 
            backgroundColor: "#ff4d4f",
            fontSize: isMobile ? "10px" : "12px"
          }} 
        />
      ),
    },
    {
      title: "Total",
      dataIndex: "total_rows",
      key: "totalRows",
      width: 70,
      render: (value: number) => (
        <Badge 
          count={value || 0} 
          style={{ 
            backgroundColor: "#1890ff",
            fontSize: isMobile ? "10px" : "12px"
          }} 
        />
      ),
    },
    ...(isMobile ? [] : [{
      title: "Date",
      dataIndex: "created_at",
      key: "createdAt",
      width: 150,
      render: (date: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    }]),
  ];

  // Mobile menu actions
  const mobileMenuActions = (
    <Space direction="vertical" style={{ width: "100%", padding: "16px" }}>
      <Button 
        block 
        onClick={() => {
          handleDownloadTemplate('csv');
          setMobileMenuOpen(false);
        }} 
        icon={<DownloadOutlined />}
        size="large"
      >
        CSV Template
      </Button>
      <Button 
        block 
        onClick={() => {
          handleDownloadTemplate('excel');
          setMobileMenuOpen(false);
        }} 
        icon={<DownloadOutlined />}
        size="large"
      >
        Excel Template
      </Button>
      <Button 
        block 
        onClick={() => {
          setShowHistory(!showHistory);
          setMobileMenuOpen(false);
        }} 
        icon={<HistoryOutlined />}
        size="large"
      >
        {showHistory ? "Hide History" : "Show History"}
      </Button>
      {fileList.length > 0 && (
        <Button 
          block 
          danger 
          onClick={() => {
            resetUploadState();
            setMobileMenuOpen(false);
          }} 
          icon={<DeleteOutlined />}
          size="large"
        >
          Remove File
        </Button>
      )}
    </Space>
  );

  return (
    <div style={{ 
      padding: isMobile ? "12px" : "24px", 
      maxWidth: "1400px", 
      margin: "0 auto" 
    }}>
      <Card
        title={
          <Row justify="space-between" align="middle" wrap={false}>
            <Col flex="auto">
              <Space>
                <FileExcelOutlined style={{ fontSize: isMobile ? "18px" : "20px", color: "#52c41a" }} />
                <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                  Bulk Product Upload
                </Title>
              </Space>
            </Col>
            {isMobile ? (
              <Col>
                <Button
                  type="text"
                  icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                />
              </Col>
            ) : (
              <Col>
                <Space wrap>
                  <Button
                    onClick={() => handleDownloadTemplate('csv')}
                    icon={<DownloadOutlined />}
                    size={isMobile ? "small" : "middle"}
                  >
                    CSV Template
                  </Button>
                  <Button
                    onClick={() => handleDownloadTemplate('excel')}
                    icon={<DownloadOutlined />}
                    size={isMobile ? "small" : "middle"}
                  >
                    Excel Template
                  </Button>
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    icon={<HistoryOutlined />}
                    size={isMobile ? "small" : "middle"}
                  >
                    {showHistory ? "Hide History" : "Show History"}
                  </Button>
                </Space>
              </Col>
            )}
          </Row>
        }
        style={{ 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderRadius: isMobile ? "8px" : "12px" 
        }}
        bodyStyle={{ padding: isMobile ? "12px" : "24px" }}
      >
        <Space direction="vertical" size={isMobile ? "middle" : "large"} style={{ width: "100%" }}>
          {/* Mobile Menu Drawer */}
          {isMobile && (
            <Drawer
              title="Actions"
              placement="right"
              onClose={() => setMobileMenuOpen(false)}
              open={mobileMenuOpen}
              width={250}
            >
              {mobileMenuActions}
            </Drawer>
          )}

          {/* Steps - Responsive */}
          <Steps
            current={currentStep}
            items={STEPS.map(step => ({
              ...step,
              title: isMobile ? '' : step.title,
            }))}
            size={isMobile ? "small" : "default"}
            responsive={false}
          />

          {/* Upload History */}
          {showHistory && uploadHistory.length > 0 && (
            <Card
              title={
                <Space>
                  <HistoryOutlined />
                  <span>Recent Uploads</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: "16px", width: "100%" }}
              extra={
                <Button
                  size="small"
                  onClick={() => setShowHistory(false)}
                  icon={<DeleteOutlined />}
                >
                  Hide
                </Button>
              }
              bodyStyle={{ padding: isMobile ? "8px" : "12px" }}
            >
              <div style={{ overflowX: "auto" }}>
                <Table
                  dataSource={uploadHistory}
                  columns={historyColumns}
                  pagination={false}
                  size="small"
                  rowKey="id"
                  scroll={isMobile ? { x: 400 } : undefined}
                />
              </div>
            </Card>
          )}

          {/* Step 1: File Selection */}
          {currentStep === 0 && (
            <Dragger 
              {...uploadProps} 
              style={{ 
                padding: isMobile ? "30px 12px" : "60px 20px", 
                borderRadius: "8px",
                minHeight: isMobile ? "200px" : "300px"
              }}
            >
              <Space direction="vertical" size={isMobile ? "middle" : "large"} align="center" style={{ width: "100%" }}>
                <FileExcelOutlined style={{ 
                  fontSize: isMobile ? "48px" : "64px", 
                  color: "#52c41a" 
                }} />
                <div>
                  <Title level={isMobile ? 4 : 3} style={{ 
                    marginBottom: "8px", 
                    textAlign: "center",
                    fontSize: isMobile ? "18px" : "24px"
                  }}>
                    Upload Product Data
                  </Title>
                  <Paragraph type="secondary" style={{ 
                    textAlign: "center", 
                    marginBottom: isMobile ? "16px" : "24px",
                    fontSize: isMobile ? "12px" : "14px"
                  }}>
                    Drag & drop your CSV or Excel file here, or click to browse
                  </Paragraph>
                </div>
                
                <Card size="small" style={{ 
                  width: isMobile ? "100%" : "80%", 
                  backgroundColor: "#fafafa",
                  padding: isMobile ? "8px" : "12px"
                }}>
                  <Alert
                    message="Required Format"
                    description={
                      <div>
                        <Text strong style={{ fontSize: isMobile ? "12px" : "14px" }}>CSV columns:</Text>
                        <br />
                        <code style={{ fontSize: isMobile ? "11px" : "12px" }}>
                          code, name, warehouse, unit, qty, ctn, price, remark
                        </code>
                        <Divider style={{ margin: "8px 0" }} />
                        <Text type="secondary" style={{ fontSize: isMobile ? "11px" : "12px" }}>
                          • qty = pieces per carton
                          <br />
                          • ctn = number of cartons
                          <br />
                          • price = price per piece
                          <br />
                          • Total value calculated automatically
                        </Text>
                      </div>
                    }
                    type="info"
                    showIcon={!isMobile}
                    style={{ border: "none" }}
                  />
                </Card>
              </Space>
            </Dragger>
          )}

          {/* Step 1-3: File Selected & Actions */}
          {currentStep >= 1 && fileList.length > 0 && (
            <Card
              size="small"
              title={
                <Space>
                  <FileExcelOutlined style={{ color: "#52c41a" }} />
                  <span>Selected File</span>
                </Space>
              }
              bordered={false}
              style={{ width: "100%" }}
              extra={
                !isMobile && (
                  <Button
                    size="small"
                    danger
                    onClick={resetUploadState}
                    icon={<DeleteOutlined />}
                  >
                    Remove
                  </Button>
                )
              }
            >
              <Row align="middle" justify="space-between" wrap={isMobile}>
                <Col flex={isMobile ? "1 1 100%" : "auto"}>
                  <Space align="center" wrap={isMobile}>
                    <FileExcelOutlined style={{ 
                      color: "#52c41a", 
                      fontSize: isMobile ? "20px" : "24px" 
                    }} />
                    <div>
                      <Text strong style={{ 
                        fontSize: isMobile ? "14px" : "16px",
                        wordBreak: "break-all"
                      }}>
                        {fileList[0].name}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: isMobile ? "11px" : "12px" }}>
                        Size: {(fileList[0].size! / 1024).toFixed(2)} KB • Type:{" "}
                        {fileList[0].type || fileList[0].name.split(".").pop()?.toUpperCase()}
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col flex={isMobile ? "1 1 100%" : "auto"} style={{ marginTop: isMobile ? "12px" : 0 }}>
                  <Space 
                    direction={isMobile ? "vertical" : "horizontal"} 
                    style={{ width: isMobile ? "100%" : "auto" }}
                  >
                    <Button
                      onClick={() => setIsPreviewModalVisible(true)}
                      icon={<EyeOutlined />}
                      disabled={
                        previewData.length === 0 &&
                        !currentFile?.name.endsWith(".xlsx") &&
                        !currentFile?.name.endsWith(".xls")
                      }
                      block={isMobile}
                    >
                      Preview Data
                    </Button>
                    <Button
                      type="primary"
                      onClick={handleUpload}
                      //loading={isUploading}
                      icon={<UploadOutlined />}
                      size={isMobile ? "middle" : "large"}
                      block={isMobile}
                      style={{ minWidth: isMobile ? "100%" : "140px" }}
                    >
                      {/* {isUploading ? "Uploading..." : "Start Upload"} */}
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          {/* Step 2: Upload Progress */}
          {currentStep === 2 && (
            <Card title="Uploading..." bordered={false} style={{ width: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Progress
                  percent={uploadProgress}
                  status={uploadProgress === 100 ? "success" : "active"}
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                  strokeWidth={isMobile ? 3 : 4}
                  showInfo={!isMobile}
                />
                <Text type="secondary" style={{ 
                  textAlign: "center",
                  fontSize: isMobile ? "12px" : "14px"
                }}>
                  {uploadProgress < 100
                    ? `Uploading "${currentFile?.name}"... ${uploadProgress}%`
                    : "Processing data... Please wait"}
                </Text>
              </Space>
            </Card>
          )}

          {/* Step 3: Results */}
          {uploadResult && (
            <Card
              title={
                <Space>
                  {uploadResult.data.failedRows === 0 ? (
                    <CheckCircleOutlined style={{ 
                      color: "#52c41a", 
                      fontSize: isMobile ? "18px" : "20px" 
                    }} />
                  ) : (
                    <ExclamationCircleOutlined style={{ 
                      color: "#faad14", 
                      fontSize: isMobile ? "18px" : "20px" 
                    }} />
                  )}
                  <span style={{ fontSize: isMobile ? "16px" : "18px" }}>Upload Results</span>
                </Space>
              }
              bordered={false}
              style={{
                backgroundColor: uploadResult.data.failedRows === 0 ? "#f6ffed" : "#fff7e6",
                border: `1px solid ${uploadResult.data.failedRows === 0 ? "#b7eb8f" : "#ffd591"}`,
                width: "100%",
              }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Alert
                  message={
                    <Space>
                      {uploadResult.data.failedRows === 0 ? (
                        <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      ) : (
                        <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                      )}
                      <span style={{ fontSize: isMobile ? "14px" : "16px" }}>{uploadResult.message}</span>
                    </Space>
                  }
                  type={uploadResult.data.failedRows === 0 ? "success" : "warning"}
                  showIcon={false}
                  style={{ border: "none", background: "transparent" }}
                />

                <Divider />

                <Row gutter={[8, 16]}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Total Rows"
                      value={uploadResult.data.totalRows}
                      prefix={<FileExcelOutlined />}
                      valueStyle={{ fontSize: isMobile ? "20px" : "24px" }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Successful"
                      value={uploadResult.data.successfulRows}
                      valueStyle={{ 
                        color: "#52c41a",
                        fontSize: isMobile ? "20px" : "24px"
                      }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Failed"
                      value={uploadResult.data.failedRows}
                      valueStyle={{ 
                        color: "#ff4d4f",
                        fontSize: isMobile ? "20px" : "24px"
                      }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Success Rate"
                      value={
                        uploadResult.data.totalRows > 0
                          ? ((uploadResult.data.successfulRows / uploadResult.data.totalRows) * 100).toFixed(1)
                          : 0
                      }
                      suffix="%"
                      valueStyle={{
                        color:
                          uploadResult.data.failedRows === 0
                            ? "#52c41a"
                            : uploadResult.data.successfulRows / uploadResult.data.totalRows > 0.7
                            ? "#1890ff"
                            : "#faad14",
                        fontSize: isMobile ? "20px" : "24px"
                      }}
                    />
                  </Col>
                </Row>

                {uploadResult.data.errors?.length > 0 && (
                  <>
                    <Divider />
                    <ErrorList 
                      errors={uploadResult.data.errors} 
                      title={`${uploadResult.data.errors.length} Errors Detected`} 
                    />
                  </>
                )}

                {uploadResult.data.warnings?.length > 0 && (
                  <>
                    <Divider />
                    <ErrorList 
                      errors={uploadResult.data.warnings} 
                      title={`${uploadResult.data.warnings.length} Warnings`} 
                      alertType="warning" 
                    />
                  </>
                )}

                <Divider />

                <Space 
                  direction={isMobile ? "vertical" : "horizontal"} 
                  style={{ width: "100%" }}
                >
                  <Button 
                    type="primary" 
                    onClick={resetUploadState} 
                    icon={<ReloadOutlined />}
                    block={isMobile}
                  >
                    Upload Another File
                  </Button>
                  <Button 
                    onClick={() => setShowHistory(true)}
                    block={isMobile}
                  >
                    View Upload History
                  </Button>
                </Space>
              </Space>
            </Card>
          )}
        </Space>
      </Card>

      {/* Preview Modal */}
      <PreviewModal
        visible={isPreviewModalVisible}
        onClose={() => setIsPreviewModalVisible(false)}
        onUpload={handleUpload}
        // isUploading={isUploading}
        previewData={previewData}
        currentFile={currentFile}
        columns={getResponsiveColumns()}
        totalValues={totalPreviewValues}
        isMobile={isMobile} isUploading={false}      />
    </div>
  );
};

// CSV parsing utilities
const parseCSVPreview = (csvText: string): CSVProductData[] => {
  try {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);

    return lines
      .slice(1, 11)
      .map((line, index) => {
        const values = parseCSVLine(line);
        const row: any = { key: index.toString() };

        headers.forEach((header, idx) => {
          if (idx < values.length) {
            const cleanHeader = header.trim().toLowerCase();
            const value = values[idx] || "";
            let mappedHeader = cleanHeader;
            
            if (cleanHeader.includes("product") || cleanHeader === "productname") {
              mappedHeader = "name";
            } else if (cleanHeader.includes("remark") || cleanHeader === "comment") {
              mappedHeader = "remark";
            }

            if (mappedHeader === "price") {
              row[mappedHeader] = parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
            } else if (mappedHeader === "qty" || mappedHeader === "ctn") {
              row[mappedHeader] = parseInt(value.replace(/[^\d]/g, "")) || 0;
            } else {
              row[mappedHeader] = value.trim();
            }
          }
        });

        return {
          key: index.toString(),
          code: row.code || `ROW_${index}`,
          name: row.name || row.productname || "Unnamed Product",
          warehouse: (row.warehouse || "SHEGOLE_MULUNEH").toUpperCase(),
          unit: normalizeUnit(row.unit || "PC"),
          qty: row.qty || 0,
          ctn: row.ctn || 0,
          price: row.price || 0,
          remark: row.remark || "",
          totalPieces: (row.qty || 0) * (row.ctn || 0),
          totalPrice: (row.qty || 0) * (row.ctn || 0) * (row.price || 0),
        };
      })
      .filter((row) => row.code && row.name);
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
};

const normalizeUnit = (unit: string): string => {
  const unitStr = unit.toUpperCase().trim();
  const unitMap: Record<string, string> = {
    PC: "PC",
    PCS: "PC",
    PIECE: "PC",
    PIECES: "PC",
    UNIT: "PC",
    UNITS: "PC",
    DOZ: "DOZ",
    DOZEN: "DOZ",
    DOZENS: "DOZ",
    DOZZ: "DOZ",
    DZ: "DOZ",
    SET: "SET",
    SETS: "SET",
    PACK: "SET",
    PACKS: "SET",
    PACKAGE: "SET",
    PACKAGES: "SET",
  };

  return unitMap[unitStr] || "PC";
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let inQuotes = false;
  let currentField = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(currentField.trim());
      currentField = "";
    } else {
      currentField += char;
    }
  }

  result.push(currentField.trim());
  return result;
};

export default EnhancedBulkUpload;