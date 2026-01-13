import React from 'react';
import { Tabs } from 'antd';
import UserTable from './UserTable';

const ManagementPage: React.FC = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>User Management</h1>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Users" key="1">
          <UserTable />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default ManagementPage;
