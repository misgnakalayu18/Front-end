// components/EnhancedBulkUpload.tsx
import { useState, useMemo, useEffect, useCallback } from "react";
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
              <Text
                type={alertType === "error" ? "danger" : "warning"}
                style={{ fontSize: "12px" }}
              >
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
        <Button key="cancel" onClick={onClose} disabled={isUploading}>
          Close
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={onUpload}
          loading={isUploading}
          icon={<UploadOutlined />}
        >
          {isUploading ? "Uploading..." : "Start Upload"}
        </Button>,
      ]}
      width={isMobile ? "100%" : 1200}
      bodyStyle={isMobile ? { padding: "12px", maxHeight: "calc(100vh - 110px)", overflowY: "auto" } : { padding: "24px" }}
      destroyOnClose
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
              scroll={{ x: 800 }}
              size="small"
              bordered
              rowKey="key"
            />
          </div>
        </>
      ) : (
        <Alert
          message="No Preview Available"
          description="No data to preview. Please check your CSV file format."
          type="info"
          showIcon
        />
      )}
    </Modal>
  );
};

const EnhancedBulkUpload = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  // State
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<CSVProductData[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState<RcFile | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redux hooks
  const [bulkUpload] = useBulkUploadMutation();
  const [downloadTemplate] = useDownloadTemplateMutation();
  const { data: historyData, refetch: refetchHistory } =
    useGetUploadHistoryQuery({ page: 1, limit: 10 }, { skip: !showHistory });

  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  const getResponsiveColumns = () => {
    const baseColumns = [
      {
        title: "Code",
        dataIndex: "code",
        key: "code",
        width: isMobile ? 80 : 100,
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
        width: isMobile ? 120 : 200,
        ellipsis: true,
        render: (text: string) => (
          <Tooltip title={text}>
            <Text>{text}</Text>
          </Tooltip>
        ),
      },
      {
        title: isMobile ? "WH" : "Warehouse",
        dataIndex: "warehouse",
        key: "warehouse",
        width: isMobile ? 60 : 90,
        render: (warehouse: string) => getWarehouseTag(warehouse),
      },
      {
        title: "Unit",
        dataIndex: "unit",
        key: "unit",
        width: isMobile ? 50 : 70,
        render: (unit: string) => getUnitTag(unit),
      },
      {
        title: isMobile ? "Qty" : "Pcs/Carton",
        dataIndex: "qty",
        key: "qty",
        width: isMobile ? 60 : 100,
        render: (qty: number) => (
          <Badge count={qty || 0} style={{ backgroundColor: "#1890ff" }} />
        ),
      },
      {
        title: "CTN",
        dataIndex: "ctn",
        key: "ctn",
        width: isMobile ? 60 : 90,
        render: (ctn: number) => (
          <Badge count={ctn || 0} style={{ backgroundColor: "#52c41a" }} />
        ),
      },
      {
        title: isMobile ? "Total" : "Total Pieces",
        key: "totalPieces",
        width: isMobile ? 70 : 100,
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
        title: isMobile ? "Price" : "Price/Piece",
        dataIndex: "price",
        key: "price",
        width: isMobile ? 80 : 110,
        render: (price: number) => (
          <Text strong type="success">
            ETB {price?.toLocaleString()}
          </Text>
        ),
      },
    ];

    if (!isMobile) {
      baseColumns.push({
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
      });
    }

    return baseColumns;
  };

  const resetUploadState = useCallback(() => {
    setFileList([]);
    setPreviewData([]);
    setUploadResult(null);
    setCurrentStep(0);
    setCurrentFile(null);
    setIsPreviewModalVisible(false);
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  const handleFileSuccess = useCallback((file: RcFile, preview: CSVProductData[]) => {
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
    setCurrentStep(1);
    setUploadResult(null);
    message.success(`File "${file.name}" loaded successfully!`);
  }, []);

  const readAndPreviewFile = useCallback((file: RcFile) => {
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
  }, [handleFileSuccess]);

  const beforeUpload = useCallback((file: RcFile) => {
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (fileExtension !== ".csv") {
      message.error("You can only upload CSV files!");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      message.error(`File must be smaller than 10MB! Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }

    readAndPreviewFile(file);
    return false;
  }, [readAndPreviewFile]);

  const uploadProps: UploadProps = {
    name: "file",
    multiple: false,
    accept: ".csv",
    fileList,
    beforeUpload,
    onRemove: resetUploadState,
  };

  const uploadHistory = useMemo<UploadHistoryItem[]>(() => {
    if (!historyData?.data) return [];
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

  const getWarehouseTag = useCallback((warehouse: string) => {
    const normalizedWarehouse = warehouse?.toUpperCase().replace(/\s+/g, "_");
    const color = WAREHOUSE_COLORS[normalizedWarehouse] || "default";
    return (
      <Tooltip title={warehouse}>
        <Tag color={color}>{normalizedWarehouse}</Tag>
      </Tooltip>
    );
  }, []);

  const getUnitTag = useCallback((unit: string) => {
    const normalizedUnit = unit?.toUpperCase();
    const color = UNIT_COLORS[normalizedUnit] || "default";
    return <Tag color={color}>{normalizedUnit}</Tag>;
  }, []);

  const handleUpload = async () => {
  if (!currentFile) {
    message.error("No file selected. Please select a file first.");
    return;
  }

  setIsUploading(true);
  setCurrentStep(2);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    formData.append("file", currentFile);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10));
    }, 300);

    const result = await bulkUpload(formData).unwrap();
    
    clearInterval(progressInterval);
    setUploadProgress(100);

    console.log("Upload result:", result);

    // Set the result exactly as received
    setUploadResult(result);
    setCurrentStep(3);
    setIsPreviewModalVisible(false);

    if (result.success) {
      message.success(result.message);
    } else {
      message.error(result.message || "Upload failed");
    }

    // Only refetch history if it's currently being shown
    if (showHistory) {
      refetchHistory();
    }
    
  } catch (error: any) {
    console.error("Upload failed:", error);
    message.error(error?.data?.message || "Upload failed. Please try again.");
    
    setUploadResult({
      success: false,
      message: error?.data?.message || "Upload failed",
      data: {
        totalRows: 0,
        successfulRows: 0,
        failedRows: 0,
        errors: [error?.data?.message || "Upload failed"],
        warnings: [],
      },
    });
    setCurrentStep(3);
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};

  const handleDownloadTemplate = async () => {
    try {
      const result = await downloadTemplate({ format: "csv" }).unwrap();
      const blob = new Blob([result], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "product_upload_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("CSV template downloaded successfully!");
    } catch (error: any) {
      console.error("Failed to download template:", error);
      message.error("Failed to download template.");
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
          <Text>{isMobile ? filename.slice(0, 20) + (filename.length > 20 ? "..." : "") : filename}</Text>
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
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "✓",
      dataIndex: "successful_rows",
      key: "successfulRows",
      width: 75,
      render: (value: number) => <Badge count={value || 0} style={{ backgroundColor: "#52c41a" }} />,
    },
    {
      title: "✗",
      dataIndex: "failed_rows",
      key: "failedRows",
      width: 60,
      render: (value: number) => <Badge count={value || 0} style={{ backgroundColor: "#ff4d4f" }} />,
    },
    {
      title: "Total",
      dataIndex: "total_rows",
      key: "totalRows",
      width: 70,
      render: (value: number) => <Badge count={value || 0} style={{ backgroundColor: "#1890ff" }} />,
    },
  ];

  const mobileMenuActions = (
    <Space direction="vertical" style={{ width: "100%", padding: "16px" }}>
      <Button block onClick={handleDownloadTemplate} icon={<DownloadOutlined />} size="large">
        Download CSV Template
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
        <Button block danger onClick={resetUploadState} icon={<DeleteOutlined />} size="large">
          Remove File
        </Button>
      )}
    </Space>
  );

  return (
    <div style={{ padding: isMobile ? "12px" : "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <Card
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <FileExcelOutlined style={{ fontSize: isMobile ? "18px" : "20px", color: "#52c41a" }} />
                <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
                  Bulk Product Upload (CSV)
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
                <Space>
                  <Button onClick={handleDownloadTemplate} icon={<DownloadOutlined />}>
                    Download Template
                  </Button>
                  <Button onClick={() => setShowHistory(!showHistory)} icon={<HistoryOutlined />}>
                    {showHistory ? "Hide History" : "Show History"}
                  </Button>
                </Space>
              </Col>
            )}
          </Row>
        }
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {isMobile && (
            <Drawer
              title="Actions"
              placement="right"
              onClose={() => setMobileMenuOpen(false)}
              open={mobileMenuOpen}
              width={280}
            >
              {mobileMenuActions}
            </Drawer>
          )}

          <Steps current={currentStep} items={STEPS} size={isMobile ? "small" : "default"} />

          {showHistory && uploadHistory.length > 0 && (
            <Card size="small" title="Recent Uploads" extra={<Button size="small" onClick={() => setShowHistory(false)}>Hide</Button>}>
              <Table dataSource={uploadHistory} columns={historyColumns} pagination={false} size="small" rowKey="id" scroll={{ x: 500 }} />
            </Card>
          )}

          {currentStep === 0 && (
            <Dragger {...uploadProps}>
              <Space direction="vertical" align="center">
                <FileExcelOutlined style={{ fontSize: "48px", color: "#52c41a" }} />
                <Title level={4}>Upload CSV File</Title>
                <Paragraph type="secondary">Drag & drop your CSV file here, or click to browse</Paragraph>
                <Alert
                  message="Required CSV Format"
                  description="code, name, warehouse, unit, qty, ctn, price, remark"
                  type="info"
                  showIcon
                />
              </Space>
            </Dragger>
          )}

          {currentStep === 1 && fileList.length > 0 && (
            <Card
              title="Selected File"
              extra={!isMobile && <Button danger onClick={resetUploadState} icon={<DeleteOutlined />}>Remove</Button>}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <Space>
                    <FileExcelOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
                    <div>
                      <Text strong>{fileList[0].name}</Text>
                      <br />
                      <Text type="secondary">Size: {(fileList[0].size! / 1024).toFixed(2)} KB</Text>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button onClick={() => setIsPreviewModalVisible(true)} icon={<EyeOutlined />}>
                      Preview Data
                    </Button>
                    <Button type="primary" onClick={handleUpload} loading={isUploading} icon={<UploadOutlined />}>
                      Start Upload
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          {currentStep === 2 && isUploading && (
            <Card>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Progress percent={uploadProgress} status="active" />
                <Text type="secondary" style={{ textAlign: "center" }}>
                  Uploading "{currentFile?.name}"...
                </Text>
              </Space>
            </Card>
          )}

          {uploadResult && currentStep === 3 && (
            <Card
              title={
                <Space>
                  {uploadResult.data.failedRows === 0 ? (
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  ) : (
                    <ExclamationCircleOutlined style={{ color: "#faad14" }} />
                  )}
                  <span>Upload Results</span>
                </Space>
              }
              style={{
                backgroundColor: uploadResult.data.failedRows === 0 ? "#f6ffed" : "#fff7e6",
                borderColor: uploadResult.data.failedRows === 0 ? "#b7eb8f" : "#ffd591",
              }}
            >
              <Alert
                message={uploadResult.message}
                type={uploadResult.data.failedRows === 0 ? "success" : "warning"}
                showIcon
              />
              <Divider />
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="Total Rows" value={uploadResult.data.totalRows} />
                </Col>
                <Col span={6}>
                  <Statistic title="Successful" value={uploadResult.data.successfulRows} valueStyle={{ color: "#52c41a" }} />
                </Col>
                <Col span={6}>
                  <Statistic title="Failed" value={uploadResult.data.failedRows} valueStyle={{ color: "#ff4d4f" }} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Success Rate"
                    value={uploadResult.data.totalRows > 0 ? ((uploadResult.data.successfulRows / uploadResult.data.totalRows) * 100).toFixed(1) : 0}
                    suffix="%"
                  />
                </Col>
              </Row>
              {uploadResult.data.errors?.length > 0 && (
                <>
                  <Divider />
                  <ErrorList errors={uploadResult.data.errors} title={`${uploadResult.data.errors.length} Errors Detected`} />
                </>
              )}
              {uploadResult.data.warnings?.length > 0 && (
                <>
                  <Divider />
                  <ErrorList errors={uploadResult.data.warnings} title={`${uploadResult.data.warnings.length} Warnings`} alertType="warning" />
                </>
              )}
              <Divider />
              <Button type="primary" onClick={resetUploadState} icon={<ReloadOutlined />}>
                Upload Another File
              </Button>
            </Card>
          )}
        </Space>
      </Card>

      <PreviewModal
        visible={isPreviewModalVisible}
        onClose={() => setIsPreviewModalVisible(false)}
        onUpload={handleUpload}
        isUploading={isUploading}
        previewData={previewData}
        currentFile={currentFile}
        columns={getResponsiveColumns()}
        totalValues={totalPreviewValues}
        isMobile={isMobile}
      />
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
            
            if (cleanHeader === "price") {
              row.price = parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
            } else if (cleanHeader === "qty" || cleanHeader === "ctn") {
              row[cleanHeader] = parseInt(value.replace(/[^\d]/g, "")) || 0;
            } else {
              row[cleanHeader] = value.trim();
            }
          }
        });

        return {
          key: index.toString(),
          code: row.code || `ROW_${index}`,
          name: row.name || "Unnamed Product",
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
    PC: "PC", PCS: "PC", PIECE: "PC", PIECES: "PC", UNIT: "PC", UNITS: "PC",
    DOZ: "DOZ", DOZEN: "DOZ", DOZENS: "DOZ", DZ: "DOZ",
    SET: "SET", SETS: "SET",
  };
  return unitMap[unitStr] || "PC";
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let inQuotes = false;
  let currentField = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
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