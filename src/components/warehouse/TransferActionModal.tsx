// components/warehouse/TransferActionModal.tsx
import React from 'react';
import { Modal, Descriptions, Tag, Typography, Button } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface TransferActionModalProps {
  visible: boolean;
  transfer: any;
  onClose: () => void;
  isMobile: boolean;
}

const TransferActionModal: React.FC<TransferActionModalProps> = ({ 
  visible, 
  transfer, 
  onClose, 
  isMobile 
}) => {
  return (
    <Modal
      title="Transfer Details"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Close
        </Button>,
        <Button 
          key="complete" 
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={onClose}
        >
          Complete Transfer
        </Button>
      ]}
      width={isMobile ? '90%' : 600}
    >
      {transfer && (
        <Descriptions 
          bordered 
          column={1}
          size={isMobile ? "small" : "default"}
        >
          <Descriptions.Item label="Transfer Number">
            <Text strong>{transfer.transfer_number}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Product">
            {transfer.product?.name || 'N/A'} ({transfer.product?.code || 'N/A'})
          </Descriptions.Item>
          <Descriptions.Item label="From Warehouse">
            <Tag color="blue">{transfer.from_warehouse?.replace('_', ' ') || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="To Warehouse">
            <Tag color="green">{transfer.to_warehouse?.replace('_', ' ') || 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Quantity">
            {transfer.cartons || 0} cartons ({transfer.quantity || 0} pieces)
          </Descriptions.Item>
          <Descriptions.Item label="Unit">
            {transfer.unit || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Requested By">
            {transfer.requester?.name || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Requested At">
            {transfer.requested_at ? dayjs(transfer.requested_at).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Time Since Request">
            {transfer.requested_at ? dayjs(transfer.requested_at).fromNow() : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
};

export default TransferActionModal;