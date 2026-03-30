import React from 'react';
import { 
  FilterOutlined, 
  ExportOutlined, 
  ClearOutlined, 
  DownOutlined, 
  UpOutlined,
  SearchOutlined 
} from '@ant-design/icons';
import { 
  Button, 
  Input, 
  Flex, 
  Badge, 
  Dropdown, 
  Select, 
  Typography,
  Card,
  Tag
} from 'antd';
import type { MenuProps } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

interface SalesHeaderProps {
  activeFilters: number;
  exportLoading: boolean;
  hasData: boolean;
  query: any;
  onSearch: (value: string) => void;
  onSearchClear: () => void;
  onFilterClick: () => void;
  onExportClick: MenuProps['onClick'];
  onClearFilters: () => void;
  onPageSizeChange: (value: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  showMobileSummary?: boolean;
  onToggleMobileSummary?: () => void;
  exportItems: MenuProps['items'];
  isMobile?: boolean;
}

const SalesHeader: React.FC<SalesHeaderProps> = ({
  activeFilters,
  exportLoading,
  hasData,
  query,
  onSearch,
  onSearchClear,
  onFilterClick,
  onExportClick,
  onClearFilters,
  onPageSizeChange,
  currentPage,
  totalPages,
  totalItems,
  showMobileSummary,
  onToggleMobileSummary,
  exportItems,
  isMobile = false
}) => {
  // Handle search input change - call parent immediately
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearch(value); // Call parent immediately
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(e.currentTarget.value);
    }
  };

  if (isMobile) {
    return (
      <Card size="small" style={{ marginBottom: '12px' }}>
        <Flex justify="space-between" align="center" wrap="wrap" gap="small">
          <div>
            <Title level={5} style={{ margin: 0 }}>Sales Management</Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Page {currentPage} of {totalPages} • {totalItems} total
            </Text>
          </div>
          <Flex gap="small">
            <Badge count={activeFilters} size="small" offset={[-5, 5]}>
              <Button
                icon={<FilterOutlined />}
                onClick={onFilterClick}
                size="small"
              />
            </Badge>
            <Dropdown 
              menu={{ items: exportItems, onClick: onExportClick }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                icon={<ExportOutlined />}
                loading={exportLoading}
                disabled={!hasData}
                size="small"
              />
            </Dropdown>
            {onToggleMobileSummary && (
              <Button
                icon={showMobileSummary ? <UpOutlined /> : <DownOutlined />}
                onClick={onToggleMobileSummary}
                size="small"
              />
            )}
          </Flex>
        </Flex>
        
        <div style={{ marginTop: '12px' }}>
          <Input.Search
            placeholder="Search by buyer, casher, or product code..."
            style={{ width: '100%' }}
            defaultValue={query.search || ''}
            onChange={handleSearchChange}
            onSearch={onSearch}
            onKeyPress={handleKeyPress}
            allowClear
            onClear={onSearchClear}
            enterButton={<SearchOutlined />}
            size="small"
          />
          {query.search && (
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 11 }}>
              Searching: "<Text mark>{query.search}</Text>"
            </Text>
          )}
        </div>

        {activeFilters > 0 && (
          <Flex justify="flex-end" style={{ marginTop: '8px' }}>
            <Button
              type="link"
              icon={<ClearOutlined />}
              onClick={onClearFilters}
              size="small"
              danger
            >
              Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
            </Button>
          </Flex>
        )}
      </Card>
    );
  }

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }} wrap="wrap" gap="middle">
        <Title level={3} style={{ margin: 0 }}>Sales Management</Title>
        <Flex gap="small" align="center" wrap="wrap">
          <Input.Search
            placeholder="Search by buyer, casher, or product code..."
            style={{ width: '350px' }}
            defaultValue={query.search || ''}
            onChange={handleSearchChange}
            onSearch={onSearch}
            onKeyPress={handleKeyPress}
            allowClear
            onClear={onSearchClear}
            enterButton={
              <Button type="primary" icon={<SearchOutlined />}>
                Search
              </Button>
            }
          />
          <Badge count={activeFilters} size="small">
            <Button
              icon={<FilterOutlined />}
              onClick={onFilterClick}
            >
              Filters
            </Button>
          </Badge>
          <Dropdown 
            menu={{ items: exportItems, onClick: onExportClick }}
            trigger={['click']}
          >
            <Button
              icon={<ExportOutlined />}
              loading={exportLoading}
              disabled={exportLoading || !hasData}
            >
              Export
            </Button>
          </Dropdown>
          {activeFilters > 0 && (
            <Button
              icon={<ClearOutlined />}
              onClick={onClearFilters}
              danger
            >
              Clear All ({activeFilters})
            </Button>
          )}
        </Flex>
      </Flex>

      <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }} wrap="wrap" gap="small">
        <div>
          <Text strong>
            Page {currentPage} of {totalPages} • {totalItems} total transactions
          </Text>
          {query.search && (
            <Text type="secondary" style={{ marginLeft: 8 }}>
              Searching: "<Text mark>{query.search}</Text>"
            </Text>
          )}
        </div>
        <Flex gap="small" align="center">
          <Text type="secondary" style={{ fontSize: '12px' }}>Page Size:</Text>
          <Select
            size="small"
            value={query.limit}
            onChange={onPageSizeChange}
            style={{ width: 80 }}
          >
            <Option value={10}>10</Option>
            <Option value={25}>25</Option>
            <Option value={50}>50</Option>
            <Option value={100}>100</Option>
            <Option value={500}>500</Option>
          </Select>
        </Flex>
      </Flex>
    </>
  );
};

export default SalesHeader;