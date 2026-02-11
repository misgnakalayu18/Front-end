import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectRoute from '../components/layout/ProtectRoute';
import Sidebar from '../components/layout/Sidebar';
import CreateProduct from '../pages/CreateProduct';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import ProfilePage from '../pages/ProfilePage';
import SaleHistoryPage from '../pages/SaleHistoryPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ProductManagePage from '../pages/managements/ProductManagePage';
import SaleManagementPage from '../pages/managements/SaleManagementPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import EditProfilePage from '../pages/EditProfilePage';
import GenerateReportPage from '../pages/GenerateReportpage';
import ManageUsersPage from '../pages/managements/ManageUsersPage'
import ProductSellingPage from '../pages/ProductSellingPage';
import EnhancedBulkUpload from '../pages/EnhancedBulkUpload';
import WarehouseManagement from '../pages/managements/WarehouseManagement';
import SplitPaymentManagementPage from '../pages/managements/SplitPaymentManagementPage';


export const router = createBrowserRouter([

  {
    path: '/',
    element: <Navigate to="/login" replace />, // Redirect root to login
  },
  {
    
    path: '/',
    element: <Sidebar />,
    children: [
      {
        path: 'profile',
        element: (
          <ProtectRoute>
            <ProfilePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectRoute>
            <Dashboard />
          </ProtectRoute>
        ),
      },
      {
        path: 'create-product',
        element: (
          <ProtectRoute>
            <CreateProduct />
          </ProtectRoute>
        ),
      },
      {
        path: 'enhanced-bulk-upload',
        element: (
          <ProtectRoute>
            <EnhancedBulkUpload />
          </ProtectRoute>
        ),
      },
      {
        path: 'products',
        element: (
          <ProtectRoute>
            <ProductManagePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'sales',
        element: (
          <ProtectRoute>
            <SaleManagementPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'supplier-products',
        element: (
          <ProtectRoute>
            <ProductSellingPage/>
          </ProtectRoute>
        ),
      },
      
      {
        path: 'manage-users',
        element: (
          <ProtectRoute>
            <ManageUsersPage />,
          </ProtectRoute>
        ),
      },
      {
        path: 'sales-history',
        element: (
          <ProtectRoute>
            <SaleHistoryPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'generate-report',
        element: (
          <ProtectRoute>
            <GenerateReportPage />
          </ProtectRoute>
        ),
      },

      {
        path: 'edit-profile',
        element: (
          <ProtectRoute>
            <EditProfilePage />
          </ProtectRoute>
        ),
      },
      {
        path: 'change-password',
        element: (
          <ProtectRoute>
            <ChangePasswordPage />
          </ProtectRoute>
        ),
      },
      {
        path: 'warehouse',
        element: (
          <ProtectRoute>
            <WarehouseManagement />
          </ProtectRoute>
        ),
      },
      // ==================== WAREHOUSE MANAGEMENT ====================
      // Main Warehouse Management Page (Overview)
      {
        path: 'warehouse',
        element: (
          <ProtectRoute>
        
              <WarehouseManagement />
          
          </ProtectRoute>
        ),
      },
      {
        path: '/management/sales/split-payments',
        element: (
          <ProtectRoute>
            <SplitPaymentManagementPage />
          </ProtectRoute>
        ),
      },
      

    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '*', element: <NotFound /> },
]);
