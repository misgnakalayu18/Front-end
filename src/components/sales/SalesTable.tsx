import React, { useMemo } from 'react';
import { Table, Card } from 'antd';
import { Grid } from 'antd';
import { SaleRecord } from '../../types/sale.type';
import { getDesktopColumns, getMobileColumns } from './tableColumns';

const { useBreakpoint } = Grid;

interface SalesTableProps {
  data: SaleRecord[];
  loading: boolean;
  onViewSplitPayment: (record: SaleRecord) => void;
  onRefetch: () => void;
  onPaymentMethodFilter?: (value: string) => void;
  onPaymentStatusFilter?: (value: string) => void;
  onBankNameFilter?: (value: string) => void;   // ← NEW
}

const SalesTable: React.FC<SalesTableProps> = ({
  data,
  loading,
  onViewSplitPayment,
  onRefetch,
  onPaymentMethodFilter,
  onPaymentStatusFilter,
  onBankNameFilter,     // ← NEW
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const columns = useMemo(() => 
    isMobile 
      ? getMobileColumns({ onViewSplitPayment, onRefetch })
      : getDesktopColumns({
          onViewSplitPayment,
          onRefetch,
          onPaymentMethodFilter,
          onPaymentStatusFilter,
          onBankNameFilter,     // ← NEW
        }),
    [isMobile, onViewSplitPayment, onRefetch, onPaymentMethodFilter, onPaymentStatusFilter, onBankNameFilter]
  );

  return (
    <Card size="small">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        bordered={!isMobile}
        size="middle"
        scroll={isMobile ? undefined : { x: 'max-content' }}
        rowClassName={(record) => record.remainingAmount > 0 ? 'partial-payment-row' : ''}
        showHeader={!isMobile}
        style={{
          borderRadius: isMobile ? '0' : '8px',
          overflow: isMobile ? 'visible' : 'auto'
        }}
        rowKey="key"
      />
    </Card>
  );
};

export default SalesTable;