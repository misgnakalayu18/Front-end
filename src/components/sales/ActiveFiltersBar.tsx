import React from 'react';
import { Tag, Card, Flex, Typography, Button, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ActiveFiltersBarProps {
  activeFilters: number;
  query: any;
  onRemoveFilter: (key: string) => void;
  onClearAllFilters: () => void;
  isMobile: boolean;
}

const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  activeFilters,
  query,
  onRemoveFilter,
  onClearAllFilters,
  isMobile
}) => {
  if (activeFilters === 0) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const renderFilterTag = (key: string, label: string, value: any, color: string) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    let displayValue = value;

    if (key === 'paymentStatus' || key === 'paymentMethod') {
      displayValue = Array.isArray(value) ? value.join(', ') : value;
    } else if (key === 'bankName') {
      // value is a comma-separated string from query
      displayValue = Array.isArray(value) ? value.join(', ') : value;
    } else if (key === 'startDate' || key === 'endDate') {
      displayValue = formatDate(value);
    }

    return (
      <Tag
        key={key}
        closable
        onClose={() => onRemoveFilter(key)}
        style={{
          fontSize: isMobile ? '10px' : '12px',
          padding: '2px 8px',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        color={color}
      >
        <span style={{ fontWeight: 'bold' }}>{label}:</span>
        <span>{displayValue}</span>
      </Tag>
    );
  };

  const filterTags = [
    {
      key: 'search',
      label: 'Search',
      value: query.search,
      color: 'blue',
      condition: query.search && query.search.trim() !== ''
    },
    {
      key: 'paymentStatus',
      label: 'Status',
      value: query.paymentStatus,
      color: 'green',
      condition: query.paymentStatus && query.paymentStatus.length > 0
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      value: query.paymentMethod,
      color: 'orange',
      condition: query.paymentMethod && query.paymentMethod.length > 0
    },
    {
      key: 'bankName',
      label: 'Bank',
      value: query.bankName,
      color: 'cyan',
      condition: query.bankName && query.bankName.trim() !== ''
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      value: `${formatDate(query.startDate)} to ${formatDate(query.endDate)}`,
      color: 'purple',
      condition: query.startDate || query.endDate
    },
    {
      key: 'amountRange',
      label: 'Amount Range',
      value: `${query.minAmount ? `ETB ${query.minAmount.toLocaleString()}` : 'Any'} - ${query.maxAmount ? `ETB ${query.maxAmount.toLocaleString()}` : 'Any'}`,
      color: 'red',
      condition: query.minAmount !== undefined || query.maxAmount !== undefined
    }
  ];

  return (
    <Card
      size="small"
      style={{
        marginBottom: isMobile ? '12px' : '16px',
        padding: isMobile ? '8px' : '12px',
        backgroundColor: '#fafafa'
      }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap="small">
        <Flex gap="small" align="center" wrap="wrap" style={{ flex: 1 }}>
          <Text
            type="secondary"
            style={{
              fontSize: '12px',
              marginRight: '8px',
              marginBottom: '4px'
            }}
          >
            Active Filters:
          </Text>

          {filterTags.map(filter =>
            filter.condition && renderFilterTag(
              filter.key,
              filter.label,
              filter.key === 'dateRange' ? filter.value : filter.value,
              filter.color
            )
          )}
        </Flex>

        <Tooltip title="Clear all filters">
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClearAllFilters}
            style={{
              fontSize: isMobile ? '10px' : '12px',
              padding: '0 8px',
              height: 'auto'
            }}
          >
            {isMobile ? '' : 'Clear All'}
          </Button>
        </Tooltip>
      </Flex>
    </Card>
  );
};

export default ActiveFiltersBar;