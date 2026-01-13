import React from "react";
import { Table, Spin, Empty } from "antd";

interface HistoryTableProps {
  data: any;        // can be anything
  isFetching: boolean;
}

const safeArray = (input: any): any[] => {
  if (Array.isArray(input)) return input;
  if (input?.data && Array.isArray(input.data)) return input.data;
  if (input?.sales && Array.isArray(input.sales)) return input.sales;
  return []; // fallback
};

const generateColumns = (row: any) => {
  if (!row) return [];

  return Object.keys(row).map((key) => ({
    title: key.replace(/([A-Z])/g, " $1").toUpperCase(),
    dataIndex: key,
    key,
    ellipsis: true,
    sorter: (a: any, b: any) => {
      const A = a[key] ?? "";
      const B = b[key] ?? "";

      if (typeof A === "number" && typeof B === "number") return A - B;

      return String(A).localeCompare(String(B));
    },
  }));
};

const HistoryTable: React.FC<HistoryTableProps> = ({ data, isFetching }) => {
  const rows = safeArray(data); // ALWAYS returns an array
  const columns = generateColumns(rows[0]);

  if (isFetching && rows.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin tip="Loading..." size="large" />
      </div>
    );
  }

  if (rows.length === 0) {
    return <Empty description="No Data Available" style={{ padding: "40px 0" }} />;
  }

  return (
    <Table
      dataSource={rows.map((r, i) => ({ ...r, key: i }))}
      columns={columns}
      pagination={{ pageSize: 10 }}
      loading={isFetching}
      bordered
    />
  );
};

export default HistoryTable;
