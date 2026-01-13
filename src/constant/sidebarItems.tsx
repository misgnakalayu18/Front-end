import {
  AimOutlined,
  AntDesignOutlined,
  ApartmentOutlined,
  AreaChartOutlined,
  HistoryOutlined,
  MoneyCollectFilled,
  ProfileFilled,
  UserOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import React from 'react';
import { NavLink } from 'react-router-dom';

export const getSidebarItems = (role: string) => {
  // Normalize role to uppercase for consistent comparison
  const normalizedRole = role?.toUpperCase() || 'USER';
  
  const commonItems = [
    {
      key: 'Profile',
      label: <NavLink to='/profile'>PROFILE</NavLink>,
      icon: React.createElement(UserOutlined),
    },
  ];

  const adminItems = [
    {
      key: 'Dashboard',
      label: <NavLink to='/dashboard'>DASHBOARD</NavLink>,
      icon: React.createElement(ProfileFilled),
    },
    {
      key: 'Add Product',
      label: <NavLink to='/create-product'>ADD PRODUCT</NavLink>,
      icon: React.createElement(AntDesignOutlined),
    },
    {
      key: 'enhanced Bulk Upload',
      label: <NavLink to='/enhanced-bulk-upload'>Bulk UPLOAD PRODUCTS</NavLink>,
      icon: React.createElement(AntDesignOutlined),
    },
    {
      key: 'Manage Products',
      label: <NavLink to='/products'>MANAGE PRODUCTS</NavLink>,
      icon: React.createElement(MoneyCollectFilled),
    },
    {
      key: 'Manage warehouse',
      label: <NavLink to='/warehouse'>MANAGE WAREHOUSE</NavLink>,
      icon: React.createElement(MoneyCollectFilled),
    },
    {
      key: 'Product Selling ',
      label: <NavLink to='/supplier-products'>PRODUCT SELLING</NavLink>,
      icon: React.createElement(OrderedListOutlined),
    },
    {
      key: 'Manage Sales',
      label: <NavLink to='/sales'>MANAGE SALES</NavLink>,
      icon: React.createElement(AreaChartOutlined),
    },
    {
      key: 'Generate Report',
      label: <NavLink to='/generate-report'>GENERATE REPORT</NavLink>,
      icon: React.createElement(HistoryOutlined),
    },
    //  {
    //   key: 'Sales History',
    //   label: <NavLink to='/sales-history'>SALES SUMMARY</NavLink>,
    //   icon: React.createElement(HistoryOutlined),
    // },
    {
      key: 'Manage Users',
      label: <NavLink to="/manage-users">Manage Users</NavLink>,
      icon: <UserOutlined />,
    },
  ];

  const sellerItems = [
    {
      key: 'Product Selling',
      label: <NavLink to='/supplier-products'>PRODUCT SELLING</NavLink>,
      icon: React.createElement(OrderedListOutlined),
    },
  ];

  switch (normalizedRole) {
    case 'ADMIN':
      return [...commonItems, ...adminItems];
    case 'SELLER':
      return [...commonItems, ...sellerItems];
    default:
      return commonItems;
  }
};