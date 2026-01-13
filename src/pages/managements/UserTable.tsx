import React from 'react';
import { Table, Button, Tag } from 'antd';
import { useGetAllUsersQuery, useUpdateUserMutation } from '../../redux/features/management/userApi';

const UserTable: React.FC = () => {
  const { data: users, isLoading } = useGetAllUsersQuery(undefined);
  const [updateUser] = useUpdateUserMutation();

  const handleStatusChange = async (id: string, status: string) => {
    await updateUser({ id, status });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color={role === 'ADMIN' ? 'blue' : 'green'}>{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : status === 'PENDING' ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <>
          {record.status !== 'ACTIVE' && (
            <Button onClick={() => handleStatusChange(record._id, 'ACTIVE')} type="primary" style={{ marginRight: 8 }}>
              Activate
            </Button>
          )}
          {record.status !== 'BLOCK' && (
            <Button onClick={() => handleStatusChange(record._id, 'BLOCK')} danger>
              Block
            </Button>
          )}
        </>
      ),
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  

  return <Table dataSource={users?.data} columns={columns} rowKey="_id" />;
  
};
export default UserTable;
