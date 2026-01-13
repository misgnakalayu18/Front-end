// components/ProductManagementTabs.tsx
import React, { useState } from 'react';
import { Tabs, Card, Button, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import CreateProduct from './CreateProduct';
import BulkUpload from './EnhancedBulkUpload';
import ProductList from './ProductSellingPage';

const ProductManagementTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');

  const tabItems = [
    {
      key: 'list',
      label: 'Product List',
      children: <ProductList />,
    },
    {
      key: 'create',
      label: (
        <Space>
          <PlusOutlined />
          Add Single Product
        </Space>
      ),
      children: <CreateProduct />,
    },
    {
      key: 'bulk',
      label: (
        <Space>
          <UploadOutlined />
          Bulk Upload
        </Space>
      ),
      children: <BulkUpload />,
    },
  ];

  return (
    <Card>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        tabBarExtraContent={
          <Space>
            <Button 
              type={activeTab === 'create' ? 'primary' : 'default'}
              icon={<PlusOutlined />}
              onClick={() => setActiveTab('create')}
            >
              Single Product
            </Button>
            <Button 
              type={activeTab === 'bulk' ? 'primary' : 'default'}
              icon={<UploadOutlined />}
              onClick={() => setActiveTab('bulk')}
            >
              Bulk Upload
            </Button>
          </Space>
        }
      />
    </Card>
  );
};

export default ProductManagementTabs;