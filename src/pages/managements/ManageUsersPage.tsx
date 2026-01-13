import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  PlusOutlined,
  LockOutlined,
  UnlockOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { 
  useGetAllUsersQuery, 
  useUpdateUserStatusMutation, 
  useCreateUserMutation,
  useUpdateUserMutation 
} from '../../redux/features/management/userApi';
import Loader from '../../components/Loader';

const { Option } = Select;

interface IUser {
  id: number;
  name: string;
  email: string;
  title?: string;
  role: string;
  status: string;
  address?: string;
  phone?: string;
  createdAt: string;
}

const ManageUsersPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [form] = Form.useForm();

  const { data: usersData, isLoading, refetch } = useGetAllUsersQuery(undefined);
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const users = usersData?.data || [];

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((user: { status: string; }) => user.status === 'ACTIVE').length;
  const adminUsers = users.filter((user: { role: string; }) => user.role === 'ADMIN').length;

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user: IUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      title: user.title,
      role: user.role,
      address: user.address,
      phone: user.phone,
    });
    setIsModalVisible(true);
  };

  const handleStatusChange = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateUserStatus({ id: userId, status: newStatus }).unwrap();
      message.success(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error: any) {
      message.error(error?.data?.message || 'Failed to update user status');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // Update existing user
        await updateUser({ id: editingUser.id, ...values }).unwrap();
        message.success('User updated successfully');
      } else {
        // Create new user
        await createUser(values).unwrap();
        message.success('User created successfully');
      }
      
      setIsModalVisible(false);
      form.resetFields();
      refetch();
    } catch (error: any) {
      console.error('Form validation or API error:', error);
      message.error(error?.data?.message || 'Failed to save user');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingUser(null);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: IUser) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
          {record.title && (
            <Tooltip title="User Title">
              <Tag color="blue">{record.title}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
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
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'red' : role === 'SELLER' ? 'orange' : 'blue'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || 'N/A',
    },
    {
      title: 'Joined Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: IUser) => (
        <Space size="middle">
          <Tooltip title="Edit user details">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            >
              Edit
            </Button>
          </Tooltip>
          
          <Tooltip title={record.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user'}>
            <Button
              size="small"
              icon={record.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleStatusChange(record.id, record.status)}
              danger={record.status === 'ACTIVE'}
            >
              {record.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (isLoading) return <Loader />;

  return (
    <div style={{ padding: '1rem' }}>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Users"
              value={activeUsers}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Admin Users"
              value={adminUsers}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Users Table */}
      <Card
        title="User Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddUser}
          >
            Add New User
          </Button>
        }
      >
        <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
          <Space>
            <InfoCircleOutlined style={{ color: '#52c41a' }} />
            <span>User deletion is disabled for safety. Use "Deactivate" to disable user accounts instead.</span>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={users.map((user: { id: any; }) => ({ ...user, key: user.id }))}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          name="userForm"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter user name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' },
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="USER">User</Option>
                  <Option value="SELLER">Seller</Option>
                  <Option value="ADMIN">Admin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title/Position"
              >
                <Input placeholder="Enter job title" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="address"
                label="Address"
              >
                <Input placeholder="Enter address" />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ManageUsersPage;