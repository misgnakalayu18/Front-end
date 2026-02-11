import React, { useState, useEffect, useRef } from "react";
import { Card, Button, Row, Col, InputNumber, Select, Input, Alert } from "antd";
import { DeleteOutlined, PlusOutlined, MobileOutlined, TransactionOutlined, UserOutlined } from "@ant-design/icons";
import { ethiopianBanks, SplitPaymentMethodType } from "../../types";

interface PaymentSplit {
  id: string;
  method: SplitPaymentMethodType;
  amount: number;
  percentage: number;
  bankName?: string;
  senderName?: string;
  receiverName?: string;
  telebirrPhone?: string;
  telebirrTransactionId?: string;
  reference?: string;
  otherDetails?: string;
}

interface SplitPaymentFormProps {
  paymentDetails: any;
  onPaymentDetailChange: (field: string, value: any) => void;
  calculateCartTotal: () => number;
  cartItemCount?: number;
}

const SplitPaymentForm: React.FC<SplitPaymentFormProps> = ({
  paymentDetails,
  onPaymentDetailChange,
  calculateCartTotal,
  cartItemCount = 1,
}) => {
  const [activeSplitMethod, setActiveSplitMethod] = useState<SplitPaymentMethodType>('CASH');
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [editingSplitId, setEditingSplitId] = useState<string | null>(null);
  const lastAmountRef = useRef<{ [key: string]: number }>({});
  const totalAmount = calculateCartTotal();

  // Initialize from paymentDetails if exists
  useEffect(() => {
    if (paymentDetails.paymentSplits && Array.isArray(paymentDetails.paymentSplits)) {
      setPaymentSplits(paymentDetails.paymentSplits);
    }
  }, [paymentDetails.paymentSplits]);

  const filterBankOption = (input: string, option?: { label: string; value: string }) => {
    return (option?.label?.toLowerCase() ?? "").includes(input.toLowerCase());
  };

  const addSplit = () => {
    const newSplit: PaymentSplit = {
      id: `split_${Date.now()}`,
      method: activeSplitMethod,
      amount: 0,
      percentage: 0,
      receiverName: "",
    };
    
    const updatedSplits = [...paymentSplits, newSplit];
    setPaymentSplits(updatedSplits);
    onPaymentDetailChange("paymentSplits", updatedSplits);
  };
  
  const removeSplit = (id: string) => {
    const updatedSplits = paymentSplits.filter(split => split.id !== id);
    setPaymentSplits(updatedSplits);
    onPaymentDetailChange("paymentSplits", updatedSplits);
    if (editingSplitId === id) {
      setEditingSplitId(null);
    }
    delete lastAmountRef.current[id];
  };
  
  const updateSplit = (id: string, updates: Partial<PaymentSplit>) => {
    const updatedSplits = paymentSplits.map(split => 
      split.id === id ? { ...split, ...updates } : split
    );
    setPaymentSplits(updatedSplits);
    onPaymentDetailChange("paymentSplits", updatedSplits);
  };
  
  const calculateRemaining = () => {
    const totalPaid = paymentSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
    return totalAmount - totalPaid;
  };
  
  const handleAmountChange = (id: string, newAmount: number) => {
    if (isNaN(newAmount) || newAmount < 0) {
      return;
    }
    
    // Store the old amount for reference
    const oldAmount = lastAmountRef.current[id] || 0;
    lastAmountRef.current[id] = newAmount;
    
    // Set this split as being edited
    setEditingSplitId(id);
    
    // Calculate percentage
    const percentage = totalAmount > 0 ? (newAmount / totalAmount) * 100 : 0;
    
    // Update just this split
    updateSplit(id, { amount: newAmount, percentage });
  };

  const handlePercentageChange = (id: string, newPercentage: number) => {
    if (isNaN(newPercentage) || newPercentage < 0) {
      return;
    }
    
    // Cap percentage at 100
    const cappedPercentage = Math.min(newPercentage, 100);
    
    // Set this split as being edited
    setEditingSplitId(id);
    
    // Calculate amount from percentage
    const amount = (totalAmount * cappedPercentage) / 100;
    
    // Update just this split
    updateSplit(id, { amount, percentage: cappedPercentage });
  };

  const handleAmountBlur = (id: string) => {
    // When user finishes editing, clear the editing state
    setTimeout(() => {
      setEditingSplitId(null);
      // Optionally adjust other splits to fix the total if needed
      fixTotalIfNeeded();
    }, 100);
  };

  const handlePercentageBlur = (id: string) => {
    // When user finishes editing, clear the editing state
    setTimeout(() => {
      setEditingSplitId(null);
      // Optionally adjust other splits to fix the total if needed
      fixTotalIfNeeded();
    }, 100);
  };

  const fixTotalIfNeeded = () => {
    const currentTotal = calculateTotalAmount();
    const tolerance = 0.01;
    
    // If totals don't match and user isn't editing, show alert but don't auto-adjust
    if (Math.abs(currentTotal - totalAmount) > tolerance && !editingSplitId) {
      // Just log for now - we'll let user manually fix or use normalize button
      console.log(`Total mismatch: ${currentTotal} vs ${totalAmount}`);
    }
  };

  const calculateTotalPercentage = () => {
    return paymentSplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  };

  const calculateTotalAmount = () => {
    return paymentSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
  };

  // New approach: Smart normalize that only adjusts if needed
  const normalizeSplits = () => {
    const currentTotal = calculateTotalAmount();
    
    if (isNaN(totalAmount) || isNaN(currentTotal)) {
      return;
    }
    
    const tolerance = 0.01;
    
    // If already matching, do nothing
    if (Math.abs(currentTotal - totalAmount) < tolerance) {
      return;
    }
    
    if (paymentSplits.length === 0) return;
    
    // Strategy 1: Distribute difference among all splits proportionally
    const ratio = totalAmount / currentTotal;
    
    if (!isFinite(ratio)) return;
    
    const normalizedSplits = paymentSplits.map(split => {
      const newAmount = parseFloat((split.amount * ratio).toFixed(2));
      const newPercentage = parseFloat(((newAmount / totalAmount) * 100).toFixed(2));
      
      if (isNaN(newAmount) || isNaN(newPercentage)) {
        return split;
      }
      
      return {
        ...split,
        amount: newAmount,
        percentage: newPercentage
      };
    });
    
    setPaymentSplits(normalizedSplits);
    onPaymentDetailChange("paymentSplits", normalizedSplits);
  };

  // New: Fill remaining amount in a specific split
  const fillRemainingInSplit = (id: string) => {
    const currentTotal = calculateTotalAmount();
    const remaining = totalAmount - (currentTotal || 0);
    
    if (remaining <= 0) return;
    
    const split = paymentSplits.find(s => s.id === id);
    if (!split) return;
    
    const newAmount = parseFloat((split.amount + remaining).toFixed(2));
    const newPercentage = parseFloat(((newAmount / totalAmount) * 100).toFixed(2));
    
    updateSplit(id, { amount: newAmount, percentage: newPercentage });
  };

  // New: Clear a split amount
  const clearSplitAmount = (id: string) => {
    updateSplit(id, { amount: 0, percentage: 0 });
  };

  const remainingAmount = calculateRemaining();
  const isFullPayment = Math.abs(remainingAmount) < 0.01;
  const totalPercentage = calculateTotalPercentage();
  const isMultipleItems = cartItemCount > 1;
  const currentTotal = calculateTotalAmount();

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      {isMultipleItems && (
        <Alert
          message={`Note: Split payments will be distributed across ${cartItemCount} items proportionally`}
          description="Each item will receive a proportional share of the split payments based on its value."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: 4 }}>
              Total Amount
            </div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>
              ${totalAmount.toFixed(2)}
            </div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: "12px", color: "#1890ff", marginBottom: 4 }}>
              Split Total
            </div>
            <div style={{ 
              fontSize: "18px", 
              fontWeight: "bold", 
              color: Math.abs(currentTotal - totalAmount) < 0.01 ? "#52c41a" : "#fa541c" 
            }}>
              ${currentTotal.toFixed(2)}
            </div>
          </Col>
          <Col span={6}>
            <div style={{ 
              fontSize: "12px", 
              color: Math.abs(totalPercentage - 100) < 0.01 ? "#52c41a" : "#fa541c", 
              marginBottom: 4 
            }}>
              Percentage Total
            </div>
            <div style={{ 
              fontSize: "18px", 
              fontWeight: "bold", 
              color: Math.abs(totalPercentage - 100) < 0.01 ? "#52c41a" : "#fa541c" 
            }}>
              {totalPercentage.toFixed(2)}%
            </div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: 4 }}>
              Remaining
            </div>
            <div style={{ 
              fontSize: "18px", 
              fontWeight: "bold", 
              color: remainingAmount > 0 ? "#fa541c" : "#52c41a" 
            }}>
              ${remainingAmount.toFixed(2)}
            </div>
          </Col>
        </Row>
        
        {/* Action buttons */}
        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col>
            <Button 
              type="link" 
              size="small" 
              onClick={normalizeSplits}
              disabled={Math.abs(currentTotal - totalAmount) < 0.01}
            >
              Normalize to match total
            </Button>
          </Col>
          <Col>
            <Button 
              type="link" 
              size="small" 
              onClick={() => {
                const lastSplit = paymentSplits[paymentSplits.length - 1];
                if (lastSplit) {
                  fillRemainingInSplit(lastSplit.id);
                }
              }}
              disabled={remainingAmount <= 0 || paymentSplits.length === 0}
            >
              Fill remaining in last split
            </Button>
          </Col>
        </Row>
        
        {!isFullPayment && remainingAmount > 0 && (
          <Alert
            message={`$${remainingAmount.toFixed(2)} remaining to allocate`}
            type="warning"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
        
        {isFullPayment && paymentSplits.length > 0 && (
          <Alert
            message="Full payment allocated"
            type="success"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}

        {Math.abs(totalPercentage - 100) > 0.01 && paymentSplits.length > 0 && (
          <Alert
            message={`Percentages sum to ${totalPercentage.toFixed(2)}% (should be 100%)`}
            type="warning"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </div>
      
      {/* Add new split button */}
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={16}>
            <Select<SplitPaymentMethodType>
              style={{ width: '100%' }}
              value={activeSplitMethod}
              onChange={setActiveSplitMethod}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'TELEBIRR', label: 'Telebirr' },
                { value: 'OTHER', label: 'Other' },
              ]}
            />
          </Col>
          <Col span={8}>
            <Button 
              type="dashed" 
              onClick={addSplit}
              block
              icon={<PlusOutlined />}
            >
              Add Split
            </Button>
          </Col>
        </Row>
      </div>
      
      {/* Split payments list */}
      {paymentSplits.map((split, index) => (
        <Card 
          key={split.id} 
          size="small" 
          style={{ 
            marginBottom: 8, 
            backgroundColor: editingSplitId === split.id ? '#f0f7ff' : '#fafafa',
            border: editingSplitId === split.id ? '1px solid #1890ff' : '1px solid #f0f0f0'
          }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Payment #{index + 1} - {split.method}</span>
              <div>
                <Button
                  type="link"
                  size="small"
                  onClick={() => fillRemainingInSplit(split.id)}
                  disabled={remainingAmount <= 0}
                >
                  Fill Remaining
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => clearSplitAmount(split.id)}
                >
                  Clear
                </Button>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeSplit(split.id)}
                />
              </div>
            </div>
          }
        >
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: 4 }}>
                Amount ($)
              </div>
              <InputNumber
                style={{ width: '100%' }}
                value={split.amount}
                onChange={(value) => handleAmountChange(split.id, value || 0)}
                onBlur={() => handleAmountBlur(split.id)}
                onPressEnter={() => handleAmountBlur(split.id)}
                min={0}
                max={totalAmount}
                formatter={(value) => `$ ${value}`}
                parser={(value) => {
                  const num = parseFloat(value?.replace(/\$\s?|(,*)/g, "") || "0");
                  return isNaN(num) ? 0 : num;
                }}
                precision={2}
              />
              <div style={{ fontSize: "10px", color: "#999", marginTop: 2 }}>
                Max: ${totalAmount.toFixed(2)}
              </div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: 4 }}>
                Percentage (%)
              </div>
              <InputNumber
                style={{ width: '100%' }}
                value={split.percentage}
                onChange={(value) => handlePercentageChange(split.id, value || 0)}
                onBlur={() => handlePercentageBlur(split.id)}
                onPressEnter={() => handlePercentageBlur(split.id)}
                min={0}
                max={100}
                formatter={(value) => `${value}%`}
                parser={(value) => {
                  const num = parseFloat(value?.replace('%', '') || "0");
                  return isNaN(num) ? 0 : num;
                }}
                precision={2}
              />
              <div style={{ fontSize: "10px", color: "#999", marginTop: 2 }}>
                Max: 100%
              </div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: 4 }}>
                Method
              </div>
              <Select<SplitPaymentMethodType>
                style={{ width: '100%' }}
                value={split.method}
                onChange={(value) => updateSplit(split.id, { method: value })}
                options={[
                  { value: 'CASH', label: 'Cash' },
                  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                  { value: 'TELEBIRR', label: 'Telebirr' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
            </Col>
          </Row>
          
          {/* Receiver Name - Added for all payment methods */}
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={24}>
              <Input
                placeholder="Receiver name"
                value={split.receiverName || ''}
                onChange={(e) => updateSplit(split.id, { receiverName: e.target.value })}
                prefix={<UserOutlined />}
              />
            </Col>
          </Row>
          
          {/* Method-specific fields */}
          {split.method === 'BANK_TRANSFER' && (
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select bank"
                  value={split.bankName}
                  onChange={(value) => updateSplit(split.id, { bankName: value })}
                  allowClear
                  showSearch
                  filterOption={filterBankOption}
                  options={ethiopianBanks.map((bank) => ({
                    label: bank,
                    value: bank,
                  }))}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Sender name"
                  value={split.senderName || ''}
                  onChange={(e) => updateSplit(split.id, { senderName: e.target.value })}
                />
              </Col>
            </Row>
          )}
          
          {split.method === 'TELEBIRR' && (
            <Row gutter={16} style={{ marginTop: 8 }}>
              <Col span={12}>
                <Input
                  placeholder="Phone number"
                  value={split.telebirrPhone || ''}
                  onChange={(e) => updateSplit(split.id, { telebirrPhone: e.target.value })}
                  prefix={<MobileOutlined />}
                />
              </Col>
              <Col span={12}>
                <Input
                  placeholder="Transaction ID"
                  value={split.telebirrTransactionId || ''}
                  onChange={(e) => updateSplit(split.id, { telebirrTransactionId: e.target.value })}
                  prefix={<TransactionOutlined />}
                />
              </Col>
            </Row>
          )}
          
          {split.method === 'OTHER' && (
            <div style={{ marginTop: 8 }}>
              <Input
                placeholder="Payment details"
                value={split.otherDetails || ''}
                onChange={(e) => updateSplit(split.id, { otherDetails: e.target.value })}
              />
            </div>
          )}
        </Card>
      ))}
      
      {paymentSplits.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          <TransactionOutlined style={{ fontSize: 24, marginBottom: 8 }} />
          <div>No split payments added yet</div>
          <div style={{ fontSize: "12px", marginTop: 4 }}>
            Add payment splits to divide the total amount
          </div>
        </div>
      )}
    </Card>
  );
};

export default SplitPaymentForm;