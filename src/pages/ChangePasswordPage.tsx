import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useChangePasswordMutation } from '../redux/features/authApi';

const ChangePasswordPage = () => {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async (values: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    // Only send oldPassword and newPassword to the backend
    // confirmPassword is only for frontend validation
    const payload = {
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    };

    try {
      const toastId = toast.loading('Changing password...');
      const res = await changePassword(payload).unwrap();

      if (res.success) {
        toast.success('Password changed successfully!', {
          id: toastId,
          duration: 3000,
        });
        form.resetFields();

        // Optional: You might want to redirect to profile or login page
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Change password error details:', error);

      // Handle different error scenarios
      let errorMessage = 'Failed to change password';

      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Special handling for incorrect password
      if (errorMessage.toLowerCase().includes('old password is incorrect')) {
        toast.error('Current password is incorrect. Please try again.', {
          id: toast.loading('Changing password...'),
          duration: 4000,
        });
        // Focus on old password field
        form.setFields([
          {
            name: 'oldPassword',
            errors: ['Current password is incorrect'],
          },
        ]);
      } else {
        toast.error(errorMessage, {
          id: toast.loading('Changing password...'),
          duration: 4000,
        });
      }
    }
  };

  // Password strength validation
  const validatePasswordStrength = (_: any, value: string) => {
    if (!value) return Promise.resolve();

    if (value.length < 6) {
      return Promise.reject('Password must be at least 6 characters');
    }

    // Optional: Add more password strength checks
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasUpperCase) {
      return Promise.reject(
        'Password must contain at least one uppercase letter',
      );
    }
    if (!hasLowerCase) {
      return Promise.reject(
        'Password must contain at least one lowercase letter',
      );
    }
    if (!hasNumbers) {
      return Promise.reject('Password must contain at least one number');
    }

    return Promise.resolve();
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{ height: 'calc(100vh - 10rem)', padding: '1rem' }}
    >
      <Flex
        vertical
        style={{
          maxWidth: '500px',
          minWidth: '350px',
          width: '100%',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            Change Password
          </h2>
          <p style={{ margin: '8px 0 0', color: '#666' }}>
            Please enter your current password and choose a new one
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Current Password"
              name="oldPassword"
              rules={[
                {
                  required: true,
                  message: 'Please input your current password!',
                },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Enter current password"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: 'Please input your new password!' },
                { validator: validatePasswordStrength },
              ]}
              hasFeedback
            >
              <Input.Password size="large" placeholder="Enter new password" />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                {
                  required: true,
                  message: 'Please confirm your new password!',
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('The new passwords do not match!'),
                    );
                  },
                }),
              ]}
              hasFeedback
            >
              <Input.Password
                size="large"
                placeholder="Confirm new password"
                onPaste={(e) => e.preventDefault()}
              />
            </Form.Item>

            <div
              style={{
                background: '#f5f5f5',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '24px',
                fontSize: '12px',
                color: '#666',
              }}
            >
              <strong>Password requirements:</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                <li>At least 6 characters long</li>
                <li>Contains at least one uppercase letter</li>
                <li>Contains at least one lowercase letter</li>
                <li>Contains at least one number</li>
              </ul>
            </div>

            <ArrowLeftOutlined
              style={{ fontSize: '24px', color: '#1890ff', cursor: 'pointer' }}
              onClick={() => navigate('/profile')}
            />
            <span
              style={{
                marginLeft: '8px',
                color: '#1890ff',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              onClick={() => navigate('/profile')}
            >
              Back to Profile
            </span>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={isLoading}
                block
                style={{ marginBottom: '12px' }}
              >
                Change Password
              </Button>
              <Button
                type="default"
                onClick={() => navigate('/profile')}
                size="large"
                block
                icon={<ArrowLeftOutlined />}
              >
                Go Back
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Flex>
    </Flex>
  );
};

export default ChangePasswordPage;
