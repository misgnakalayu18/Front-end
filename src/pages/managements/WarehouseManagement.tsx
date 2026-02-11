// pages/WarehouseManagementPage.tsx
import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Alert,
  Tabs,
  Badge,
  Drawer,
  Grid,
  message,
  Divider,
  Tooltip
} from 'antd';
import {
  HomeOutlined,
  ReloadOutlined,
  SwapOutlined,
  PlusOutlined,
  MenuOutlined,
  ClockCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  useGetDashboardDataQuery, 
  useGetTransfersQuery 
} from '../../redux/features/warehouseApi';
import WarehouseHeader from '../../components/warehouse/WarehouseHeader';
import PendingTransfers from '../../components/warehouse/PendingTransfers';
import TransferHistory from '../../components/warehouse/TransferHistory';
import TransferActionModal from '../../components/warehouse/TransferActionModal';
import TransferModal from '../../components/warehouse/TransferModal'; // Import TransferModal

const { Text } = Typography;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const WarehouseManagementPage = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  
  // State
  const [activeTab, setActiveTab] = useState('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [transferActionModal, setTransferActionModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false); // New state for TransferModal
  const [selectedProductForTransfer, setSelectedProductForTransfer] = useState<any>(null); // Selected product for transfer
  
  // API Hooks
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    refetch: refetchDashboard 
  } = useGetDashboardDataQuery({});
  
  // Pending transfers query
  const { 
    data: pendingTransfersData, 
    isLoading: pendingTransfersLoading, 
    refetch: refetchPendingTransfers 
  } = useGetTransfersQuery({
    status: 'PENDING',
    page: 1,
    limit: 10,
    sortBy: 'requested_at',
    sortOrder: 'desc'
  });
  
  const pendingCount = pendingTransfersData?.pagination?.total || 0;

  // Responsive helpers
  const isMobile = !screens.md;

  // Handlers
  const handleRefresh = () => {
    refetchDashboard();
    refetchPendingTransfers();
    message.success('Data refreshed');
  };

  const handleNewTransfer = () => {
    setSelectedProductForTransfer(null); // No specific product selected
    setTransferModalOpen(true); // Open the transfer modal
  };

  const handleTransferClick = (product: any) => {
    setSelectedProductForTransfer(product);
    setTransferModalOpen(true);
  };

  const handleShowTransferDetails = (transfer: any) => {
    setSelectedTransfer(transfer);
    setTransferActionModal(true);
  };

  const handleCloseTransferModal = () => {
    setTransferActionModal(false);
    setSelectedTransfer(null);
  };

  const handleCloseTransferModalComponent = () => {
    setTransferModalOpen(false);
    setSelectedProductForTransfer(null);
    refetchDashboard(); // Refresh data after transfer
    refetchPendingTransfers(); // Refresh pending transfers
  };

  return (
    <div style={{ 
      padding: isMobile ? '12px' : '24px',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <WarehouseHeader 
        isMobile={isMobile}
        onMenuClick={() => setDrawerVisible(true)}
      />

      {/* Mobile Drawer */}
      <Drawer
        title="Actions"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={300}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            icon={<ReloadOutlined />}
            onClick={() => {
              handleRefresh();
              setDrawerVisible(false);
            }}
            block
          >
            Refresh
          </Button>
          <Tooltip title="Transfer products between Warehouses">
            <Button 
              type="primary" 
              icon={<SwapOutlined />}
              onClick={() => {
                handleNewTransfer();
                setDrawerVisible(false);
              }}
              block
            >
              New Transfer
            </Button>
          </Tooltip>
          <Button 
            icon={<PlusOutlined />}
            onClick={() => {
              setModalVisible(true);
              setDrawerVisible(false);
            }}
            block
          >
            Add Stock
          </Button>
          <Divider />
          <Text strong>Quick Navigation</Text>
          <Button 
            onClick={() => {
              setActiveTab('pending');
              setDrawerVisible(false);
            }}
            block
            type={activeTab === 'pending' ? 'primary' : 'default'}
          >
            Pending Transfers
            {pendingCount > 0 && (
              <Badge count={pendingCount} style={{ marginLeft: '8px' }} />
            )}
          </Button>
          <Button 
            onClick={() => {
              setActiveTab('history');
              setDrawerVisible(false);
            }}
            block
            type={activeTab === 'history' ? 'primary' : 'default'}
          >
            Transfer History
          </Button>
        </Space>
      </Drawer>

      {/* Pending Transfers Alert */}
      {pendingCount > 0 && (
        <Alert
          message={
            <Space direction={isMobile ? "vertical" : "horizontal"} align="start">
              <ClockCircleOutlined />
              <div>
                <strong>{pendingCount} pending transfers</strong> require your attention
              </div>
              <Badge count={pendingCount} style={{ backgroundColor: '#fa8c16' }} />
            </Space>
          }
          description={!isMobile ? "Complete or cancel pending transfers to keep inventory accurate." : undefined}
          type="warning"
          showIcon={!isMobile}
          action={
            <Button 
              type="primary" 
              size="small"
              onClick={() => setActiveTab('pending')}
            >
              View All
            </Button>
          }
          style={{ marginBottom: isMobile ? '12px' : '24px' }}
        />
      )}

      {/* Main Content Tabs */}
      <Card bodyStyle={{ padding: isMobile ? '12px' : '24px' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          tabPosition={isMobile ? "top" : "top"}
          type={isMobile ? "card" : "line"}
          tabBarExtraContent={!isMobile ? (
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
              <Tooltip title="Start new transfer between warehouses">
                <Button 
                  onClick={handleNewTransfer}
                  type='primary'
                  size="small"
                  style={{ backgroundColor: '#722ed1' }}
                  icon={<SwapOutlined />}
                >
                  New Transfer
                </Button>
              </Tooltip>
            </Space>
          ) : undefined}
        >
          {/* Pending Transfers Tab */}
          <TabPane tab={
            <span>
              Pending
              {pendingCount > 0 && !isMobile && (
                <Badge count={pendingCount} style={{ marginLeft: '8px' }} />
              )}
            </span>
          } key="pending">
            <PendingTransfers 
              isMobile={isMobile}
              onShowTransferDetails={handleShowTransferDetails}
              //onTransferClick={handleTransferClick} // Pass handler to PendingTransfers if needed
            />
          </TabPane>

          {/* Transfer History Tab */}
          <TabPane tab={
            <span>
              <HistoryOutlined /> Transfer History
            </span>
          } key="history">
            <TransferHistory isMobile={isMobile} />
          </TabPane>
        </Tabs>
      </Card>

      {/* Transfer Modal for creating new transfers */}
      <TransferModal
        open={transferModalOpen}
        onClose={handleCloseTransferModalComponent}
        product={selectedProductForTransfer} // Pass product if any
      />

      {/* Transfer Action Modal for pending transfers */}
      <TransferActionModal
        visible={transferActionModal}
        transfer={selectedTransfer}
        onClose={handleCloseTransferModal}
        isMobile={isMobile}
      />
    </div>
  );
};

export default WarehouseManagementPage;