import { EditFilled, EditOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { useGetSelfProfileQuery } from '../redux/features/authApi';
import { profileKeys } from '../constant/profile';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import Loader from '../components/common/Loader';

const ProfilePage = () => {
  const { data, isLoading } = useGetSelfProfileQuery(undefined);
  
  // Move hooks before any conditional returns
  const userData = data?.data;
  
  // Get initials from name (since backend returns name field)
  const getInitials = () => {
    const name = userData?.name || '';
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase() || 'U';
  };

  // Generate consistent random color based on user ID or name
  const getAvatarColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
      '#DDA0DD', '#98D8C8', '#F7D794', '#E6A0C4', '#B5EAD7',
      '#C7CEEA', '#FFB7B2', '#C3E2C2', '#F6AE9A', '#9B9EFF'
    ];
    
    const identifier = userData?.id?.toString() || userData?.name || '';
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Use useMemo hooks consistently
  const avatarColor = useMemo(() => getAvatarColor(), [userData?.id, userData?.name]);
  const initials = useMemo(() => getInitials(), [userData?.name]);

  // Conditional return after all hooks
  if (isLoading) return <Loader />;

  // Format value based on field type
  const formatValue = (key: string, value: any) => {
    if (!value && value !== 0) return 'Not provided';
    
    // Handle special fields
    if (key === 'created_at' || key === 'updated_at') {
      return new Date(value).toLocaleDateString();
    }
    
    return value;
  };

  return (
    <Flex vertical style={{ minHeight: 'calc(100vh - 10rem)', padding: '2rem 1rem' }}>
      <Flex justify='center' style={{ width: '100%', marginBottom: '2rem' }}>
        <Flex
          justify='center'
          align='center'
          style={{
            width: '250px',
            height: '250px',
            background: avatarColor,
            border: '4px solid white',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          }}
          className="profile-avatar"
        >
          <span
            style={{
              fontSize: '5rem',
              fontWeight: '600',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              letterSpacing: '2px',
            }}
          >
            {initials}
          </span>
        </Flex>
      </Flex>

      <Flex justify='center' style={{ marginBottom: '2rem' }}>
        <Flex gap={16} wrap='wrap' justify='center'>
          <Link to='/edit-profile'>
            <Button type='primary' icon={<EditOutlined />} size="large">
              Edit Profile
            </Button>
          </Link>
          <Link to='/change-password'>
            <Button type='primary' icon={<EditFilled />} size="large">
              Change Password
            </Button>
          </Link>
        </Flex>
      </Flex>

      <Row justify="center">
        <Col xs={24} lg={18} xl={16}>
          <div
            style={{
              maxWidth: '800px',
              margin: '0 auto',
              background: 'white',
              borderRadius: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #f0f0f0',
                background: '#fafafa',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
                Profile Information
              </h2>
            </div>
            <div style={{ padding: '2rem' }}>
              {Object.entries(userData || {})
                .filter(([key]) => !['id', 'password', 'created_at', 'updated_at'].includes(key))
                .map(([key, value]) => (
                  <ProfileInfoItems
                    key={key}
                    keyName={key}
                    value={formatValue(key, value)}
                  />
                ))}
            </div>
          </div>
        </Col>
      </Row>

      <style>{`
        .profile-avatar:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
      `}</style>
    </Flex>
  );
};

export default ProfilePage;

const ProfileInfoItems = ({ keyName, value }: { keyName: string; value: string }) => {
  // Format display name for better readability
  const formatKeyName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Get icon or special styling based on field
  const getFieldIcon = (key: string) => {
    const icons: Record<string, string> = {
      name: '👤',
      email: '📧',
      phone: '📱',
      address: '📍',
      role: '🔑',
      status: '⚡',
      title: '👔',
      description: '📝',
    };
    return icons[key] || '•';
  };

  return (
    <Flex
      style={{
        width: '100%',
        padding: '0.75rem 0',
        borderBottom: '1px solid #f5f5f5',
      }}
      gap={24}
      align="flex-start"
    >
      <div style={{ flex: 1, minWidth: '120px' }}>
        <h3
          style={{
            fontWeight: '600',
            textTransform: 'capitalize',
            margin: 0,
            color: '#1f1f1f',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{getFieldIcon(formatKeyName(keyName).toLowerCase())}</span>
          {formatKeyName(keyName)}
        </h3>
      </div>
      <div style={{ flex: 3 }}>
        <p
          style={{
            margin: 0,
            fontWeight: '400',
            color: '#595959',
            fontSize: '1rem',
            wordBreak: 'break-word',
          }}
        >
          {value}
        </p>
      </div>
    </Flex>
  );
};