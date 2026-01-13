// components/warehouse/QuickTransfer.tsx
import React from 'react';
import { Button, Dropdown, Menu, Space, Typography } from 'antd';
import {
  ArrowRightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  ExportOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface QuickTransferProps {
  onTransferClick: (product_id?: number) => void;
}

const QuickTransfer: React.FC<QuickTransferProps> = ({ onTransferClick }) => {
  const menu = (
    <Menu
      items={[
        {
          key: 'bulk',
          label: 'Bulk Transfer',
          icon: <ExportOutlined />,
          onClick: () => onTransferClick()
        },
        {
          type: 'divider'
        },
        {
          key: 'warehouse-a',
          label: 'Main → Secondary',
          icon: <VerticalAlignBottomOutlined />,
          onClick: () => onTransferClick()
        },
        {
          key: 'warehouse-b',
          label: 'Secondary → Main',
          icon: <VerticalAlignTopOutlined />,
          onClick: () => onTransferClick()
        }
      ]}
    />
  );

  return (
    <Space wrap>
      <Button
        icon={<ArrowRightOutlined />}
        onClick={() => onTransferClick()}
        type="dashed"
      >
        Quick Transfer
      </Button>
      <Dropdown overlay={menu} placement="bottomRight">
        <Button>More Actions</Button>
      </Dropdown>
    </Space>
  );
};

export default QuickTransfer;