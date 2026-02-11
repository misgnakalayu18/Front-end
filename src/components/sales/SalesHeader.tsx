import React, { useState } from 'react';
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
  Tooltip,
  Space
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
  const [localSearch, setLocalSearch] = useState(query.search || '');

  // Handle local search input change
  const handleLocalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearch(value); // Call parent handler immediately or debounced
  };

  // Handle search button click
  const handleSearchClick = () => {
    onSearch(localSearch);
  };

  // Handle clear
  const handleClear = () => {
    setLocalSearch('');
    onSearchClear();
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(localSearch);
    }
  };

  if (isMobile) {
    return (
      <Card size="small" style={{ marginBottom: '12px' }}>
        <Flex justify="space-between" align="center">
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
            placeholder="Search sales..."
            style={{ width: '100%' }}
            value={localSearch}
            onChange={handleLocalSearchChange}
            onSearch={handleSearchClick}
            allowClear
            onClear={handleClear}
            onKeyPress={handleKeyPress}
            enterButton={<SearchOutlined />}
            size="small"
          />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
        <Title level={3} style={{ margin: 0 }}>Sales Management</Title>
        <Flex gap="small" align="center">
          <Input.Search
            placeholder="Search by product, buyer, code, or seller..."
            style={{ width: '300px' }}
            value={localSearch}
            onChange={handleLocalSearchChange}
            onSearch={handleSearchClick}
            onKeyPress={handleKeyPress}
            allowClear
            onClear={handleClear}
            enterButton={<SearchOutlined />}
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
              size="small"
            >
              Clear All
            </Button>
          )}
        </Flex>
      </Flex>

      <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 'bold' }}>
          Page {currentPage} of {totalPages} • {totalItems} total transactions
          {query.search && (
            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
              Search: "{query.search}"
            </span>
          )}
        </div>
        <Flex gap="small" align="center">
          <span style={{ fontSize: '12px', color: '#666' }}>Page Size:</span>
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