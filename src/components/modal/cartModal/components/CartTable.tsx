import React from "react";
import { Table, InputNumber, Switch, Tag, Button, Tooltip } from "antd";
import {
  WarningOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { CartItem } from "../types";
import { calculateItemTotal, getStockStatus } from "../utils/calculations";

interface CartTableProps {
  cart: CartItem[];
  updateCartItem: (productId: number, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: number) => void;
}

const CartTable: React.FC<CartTableProps> = ({
  cart,
  updateCartItem,
  removeFromCart,
}) => {
  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text: string, record: CartItem) => (
        <div>
          <strong>{text}</strong>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Code: {record.code} • {record.qtyPerCarton} {record.unit}/carton
            {record.useCustomPrice && (
              <div style={{ color: "#1890ff", marginTop: "2px" }}>
                <DollarOutlined /> Custom price: $
                {record.customPrice?.toFixed(2)}/piece
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Cartons to Sell",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (value: number, record: CartItem) => {
        const status = getStockStatus(record);
        const maxCartons = record.allowNegativeStock
          ? 9999
          : status.availableCartons;

        return (
          <div>
            <InputNumber
              min={1}
              max={maxCartons}
              value={value}
              onChange={(val) =>
                updateCartItem(record.id, { quantity: val || 1 })
              }
              style={{ width: "80px" }}
            />
            <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
              Max: {maxCartons} cartons
            </div>
          </div>
        );
      },
    },
    {
      title: "Price/Unit",
      key: "price",
      width: 150,
      render: (_: any, record: CartItem) => (
        <div>
          {record.useCustomPrice ? (
            <InputNumber
              value={record.customPrice}
              onChange={(val) =>
                updateCartItem(record.id, { customPrice: val })
              }
              formatter={(value) => `$ ${value}`}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
              style={{ width: "100px" }}
              size="small"
            />
          ) : (
            <span>${record.price.toFixed(2)}</span>
          )}
          <div style={{ marginTop: "4px" }}>
            <Switch
              checked={record.useCustomPrice}
              onChange={(checked) =>
                updateCartItem(record.id, {
                  useCustomPrice: checked,
                  customPrice: checked ? record.price : null,
                })
              }
              size="small"
            />
            <span style={{ fontSize: "11px", marginLeft: "4px" }}>
              {record.useCustomPrice ? "Custom" : "Default"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Stock Availability",
      key: "stock",
      width: 180,
      render: (_: any, record: CartItem) => {
        const status = getStockStatus(record);

        return (
          <Tooltip
            title={
              <div>
                <div>
                  <strong>Stock Details:</strong>
                </div>
                <div>
                  • Available: {status.availablePieces} pieces (
                  {status.availableCartons} cartons)
                </div>
                <div>
                  • Requested: {status.totalRequestedPieces} pieces (
                  {status.requestedCartons} cartons)
                </div>
                <div>• Pieces per carton: {record.qtyPerCarton}</div>
                {status.isNegativeStock && (
                  <div style={{ color: "#fa8c16" }}>
                    • Shortage: {status.shortagePieces} pieces (
                    {status.shortageCartons} cartons)
                  </div>
                )}
              </div>
            }
          >
            <div>
              {status.isNegativeStock ? (
                <div>
                  <Tag color="orange" icon={<WarningOutlined />}>
                    {status.availableCartons} / {status.requestedCartons}
                  </Tag>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#fa8c16",
                      marginTop: "4px",
                    }}
                  >
                    Shortage: {status.shortageCartons} ctns
                  </div>
                </div>
              ) : (
                <div>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    {status.availableCartons} / {status.requestedCartons}
                  </Tag>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#52c41a",
                      marginTop: "4px",
                    }}
                  >
                    In stock
                  </div>
                </div>
              )}
              <div style={{ marginTop: "4px" }}>
                <Switch
                  checked={record.allowNegativeStock}
                  onChange={(checked) =>
                    updateCartItem(record.id, { allowNegativeStock: checked })
                  }
                  size="small"
                />
                <span style={{ fontSize: "11px", marginLeft: "4px" }}>
                  {record.allowNegativeStock ? "Neg OK" : "Normal"}
                </span>
              </div>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Total",
      key: "total",
      width: 100,
      render: (_: any, record: CartItem) => {
        const total = calculateItemTotal(record);
        return `$${total.toFixed(2)}`;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_: any, record: CartItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.id)}
          size="small"
        />
      ),
    },
  ];

  return (
    <Table
      dataSource={cart}
      columns={columns}
      pagination={false}
      size="small"
      scroll={{ y: 300 }}
      rowKey="id"
    />
  );
};

export default CartTable;