// components/warehouse/WarehouseHeader.tsx
import React from 'react';
import { Row, Col, Typography, Button, Space } from 'antd';
import { HomeOutlined, MenuOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface WarehouseHeaderProps {
  isMobile: boolean;
  onMenuClick: () => void;
}

const WarehouseHeader: React.FC<WarehouseHeaderProps> = ({ isMobile, onMenuClick }) => {
  return (
    <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col>
          <Title level={isMobile ? 4 : 2} style={{ margin: 0 }}>
            <HomeOutlined /> {isMobile ? 'Warehouses' : 'Warehouse Management'}
          </Title>
          {!isMobile && (
            <Text type="secondary">
              Manage inventory across all warehouses and handle pending transfers
            </Text>
          )}
        </Col>
        {isMobile && (
          <Col>
            <Space>
              <Button
                icon={<MenuOutlined />}
                onClick={onMenuClick}
              />
            </Space>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default WarehouseHeader;