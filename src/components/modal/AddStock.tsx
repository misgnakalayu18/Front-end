import { Button, Col, Flex, Modal, Row, InputNumber, Select, Alert, Divider, Tag } from 'antd';
import { useEffect, useState } from 'react';
import toastMessage from '../../lib/toastMessage';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getCreateVariantModel,
  getCreateVariantModelData,
  toggleCreateVariantModel,
} from '../../redux/services/modal.Slice';
import { IProduct, Warehouse, ICurrentStockInfo } from '../../types/product.types';
import { useAddStockMutation } from '../../redux/features/management/productApi';

const { Option } = Select;

// Warehouse options with labels
const WAREHOUSE_OPTIONS = [
  { value: Warehouse.MERKATO, label: 'Merkato (Main)', color: 'blue' },
  { value: Warehouse.SHEGOLE_MULUNEH, label: 'Shegole Muluneh', color: 'green' },
  { value: Warehouse.EMBILTA, label: 'Embilta', color: 'orange' },
  { value: Warehouse.NEW_SHEGOLE, label: 'New Shegole', color: 'purple' },
  { value: Warehouse.DAMAGE, label: 'Damage Storage', color: 'red' },
  { value: Warehouse.BACKUP, label: 'Backup Storage', color: 'gray' },
];

const AddStockModal = () => {
  const modalOpen = useAppSelector(getCreateVariantModel);
  const data = useAppSelector(getCreateVariantModelData) as IProduct | null;
  const [addStock, { isLoading }] = useAddStockMutation();
  const dispatch = useAppDispatch();
  
  const [formData, setFormData] = useState({
    warehouse: '',
    addType: 'UNITS',
    quantity: 0,
    qtyPerCarton: 0,
  });

  const convertToCamelCaseState = (apiData: IProduct): ICurrentStockInfo => {
  if (!apiData) {
    return {
      qty: 0,
      ctn: 0,
      totalQty: 0,
      warehouse: '',
      merkato_qty: 0,
      embilta_qty: 0,
      shegole_muluneh_qty: 0,
      new_shegole_qty: 0,
      damage_qty: 0,
      backup_qty: 0,
    };
  }
  
  return {
    qty: Number(apiData.qty) || 1,
    ctn: Number(apiData.ctn) || 1,
    totalQty: Number(apiData.totalQty) || 0,
    warehouse: apiData.warehouse || '',
    merkato_qty: Number(apiData.merkatoQty) || 0,
    embilta_qty: Number(apiData.embiltaQty) || 0,
    shegole_muluneh_qty: Number(apiData.shegoleMulunehQty) || 0,
    new_shegole_qty: Number(apiData.newShegoleQty) || 0,
    damage_qty: Number(apiData.damageQty) || 0,
    backup_qty: Number(apiData.backupQty) || 0,
  };
};

// Update getWarehouseQtyFromResponse:
const getWarehouseQtyFromResponse = (apiData: IProduct | null, warehouse: string): number => {
  if (!apiData || !warehouse) return 0;
  
  switch (warehouse) {
    case Warehouse.MERKATO:
      return Number(apiData.merkatoQty) || 0;
    case Warehouse.SHEGOLE_MULUNEH:
      return Number(apiData.shegoleMulunehQty) || 0;
    case Warehouse.EMBILTA:
      return Number(apiData.embiltaQty) || 0;
    case Warehouse.NEW_SHEGOLE:
      return Number(apiData.newShegoleQty) || 0;
    case Warehouse.DAMAGE:
      return Number(apiData.damageQty) || 0;
    case Warehouse.BACKUP:
      return Number(apiData.backupQty) || 0;
    default:
      return 0;
  }
};
  
  const [currentStockInfo, setCurrentStockInfo] = useState<ICurrentStockInfo>({
    qty: 0,
    ctn: 0,
    totalQty: 0,
    warehouse: '',
    merkato_qty: 0,
    embilta_qty: 0,
    shegole_muluneh_qty: 0,
    new_shegole_qty: 0,
    damage_qty: 0,
    backup_qty: 0,
  });

  const handleNumberChange = (name: string, value: number | null) => {
    setFormData(prev => ({ ...prev, [name]: value || 0 }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotalUnitsToAdd = () => {
    if (formData.addType === 'UNITS') {
      return formData.quantity;
    } else {
      return formData.quantity * formData.qtyPerCarton;
    }
  };

  const onSubmit = async () => {
    // Check if data exists
    if (!data) {
      toastMessage({ icon: 'error', text: 'No product selected' });
      return;
    }

    // Validation
    if (!formData.quantity || formData.quantity <= 0) {
      toastMessage({ icon: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    if (formData.addType === 'CARTONS' && (!formData.qtyPerCarton || formData.qtyPerCarton <= 0)) {
      toastMessage({ icon: 'error', text: 'Please enter units per carton' });
      return;
    }

    if (!formData.warehouse) {
      toastMessage({ icon: 'error', text: 'Please select a warehouse' });
      return;
    }

    try {
      // Prepare parameters for addStock API
      // IMPORTANT: For CARTONS addition, send both qty (units per carton) and ctn (number of cartons)
      const params: any = {
        id: data.id,
        warehouse: formData.warehouse,
      };

      if (formData.addType === 'CARTONS') {
        // When adding cartons:
        // - qty parameter should be the units per carton
        // - ctn parameter should be the number of cartons to add
        params.qty = formData.qtyPerCarton;
        params.ctn = formData.quantity;
      } else {
        // When adding units:
        // - qty parameter should be the total units to add
        params.qty = formData.quantity;
      }

      console.log('📤 Sending addStock request:', params);

      // Call the addStock mutation
      const res = await addStock(params).unwrap();
      
      console.log('✅ Add stock successful:', res);
      
      if (res.success || res.id) {
        // Calculate the expected new totals
        const currentCtn = currentStockInfo.ctn;
        const currentTotalQty = currentStockInfo.totalQty;
        
        let message = '';
        if (formData.addType === 'CARTONS') {
          const unitsPerCarton = formData.qtyPerCarton;
          const cartonsAdded = formData.quantity;
          const totalUnitsAdded = cartonsAdded * unitsPerCarton;
          const newCtn = currentCtn + cartonsAdded;
          const newTotalQty = currentTotalQty + totalUnitsAdded;
          
          message = `Added ${cartonsAdded} cartons (${totalUnitsAdded} units) to ${formData.warehouse} warehouse. New total: ${newCtn} cartons, ${newTotalQty} units`;
        } else {
          const unitsAdded = formData.quantity;
          const unitsPerCarton = currentStockInfo.qty || 1;
          const newTotalQty = currentTotalQty + unitsAdded;
          const newCtn = Math.ceil(newTotalQty / unitsPerCarton);
          
          message = `Added ${unitsAdded} units to ${formData.warehouse} warehouse. New total: ${newCtn} cartons, ${newTotalQty} units`;
        }
        
        toastMessage({ icon: 'success', text: message });
        dispatch(toggleCreateVariantModel({ open: false, data: null }));
        resetForm();
        
        // Refresh after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      console.error('❌ Add stock error:', error);
      toastMessage({ 
        icon: 'error', 
        text: error.data?.message || error.message || 'Failed to add stock' 
      });
    }
  };

  const resetForm = () => {
    setFormData({
      warehouse: '',
      addType: 'UNITS',
      quantity: 0,
      qtyPerCarton: 0,
    });
  };

  const handleCancel = () => {
    dispatch(toggleCreateVariantModel({ open: false, data: null }));
    resetForm();
  };

  useEffect(() => {
    if (modalOpen && data) {
      // Convert API response (snake_case) to frontend state (camelCase)
      const stockInfo = convertToCamelCaseState(data);
      setCurrentStockInfo(stockInfo);

      // Set default form values
      setFormData(prev => ({
        ...prev,
        warehouse: data.warehouse || Warehouse.MERKATO,
        qtyPerCarton: stockInfo.qty || 1,
        quantity: 0, // Reset quantity when modal opens
      }));
    } else if (!modalOpen) {
      // Reset everything when modal closes
      setCurrentStockInfo({
        qty: 0,
        ctn: 0,
        totalQty: 0,
        warehouse: '',
        merkato_qty: 0,
        embilta_qty: 0,
        shegole_muluneh_qty: 0,
        new_shegole_qty: 0,
        damage_qty: 0,
        backup_qty: 0,
      });
      resetForm();
    }
  }, [modalOpen, data]);

  const totalUnitsToAdd = calculateTotalUnitsToAdd();

// Calculate new values for display - FIXED LOGIC
let newQty = currentStockInfo.qty;
let newCtn = currentStockInfo.ctn;
let newTotalQty = currentStockInfo.totalQty;

if (formData.addType === 'CARTONS') {
  // When adding cartons: cartons are additive
  const cartonsToAdd = formData.quantity;
  
  // FIX: Add cartons to existing count (1 + 5 = 6)
  newCtn = currentStockInfo.ctn + cartonsToAdd;
  
  // If user specified a new qtyPerCarton, use it
  if (formData.qtyPerCarton > 0) {
    newQty = formData.qtyPerCarton;
  }
  
  // FIX: Calculate total quantity based on new carton count
  newTotalQty = newCtn * newQty;
} else {
  // When adding units: units are additive, recalculate cartons
  const unitsToAdd = formData.quantity;
  const unitsPerCarton = currentStockInfo.qty || 1;
  
  newTotalQty = currentStockInfo.totalQty + unitsToAdd;
  newCtn = Math.ceil(newTotalQty / unitsPerCarton);
  newQty = unitsPerCarton;
}

// Calculate current warehouse quantity for display
const currentWarehouseQty = getWarehouseQtyFromResponse(data, formData.warehouse);
const newWarehouseQty = formData.warehouse 
  ? currentWarehouseQty + totalUnitsToAdd 
  : currentWarehouseQty;

  return (
    <>
      <Modal
        title={
          <Flex align="center" gap={8}>
            <span>Add Stock</span>
            {data && (
              <Tag color="blue">
                {data.code} - {data.name}
              </Tag>
            )}
          </Flex>
        }
        centered
        open={modalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key='back' onClick={handleCancel}>
            Cancel
          </Button>,
          <Button 
            key='submit' 
            type='primary' 
            onClick={onSubmit} 
            loading={isLoading}
            disabled={!data || !formData.warehouse || formData.quantity <= 0}
          >
            Add Stock
          </Button>,
        ]}
        width={700}
      >
        {!data ? (
          <Alert
            message="No Product Selected"
            description="Please select a product to add stock."
            type="warning"
            showIcon
          />
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            {/* Product Information */}
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '1rem', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div><strong>Product:</strong> {data.name}</div>
                  <div><strong>Code:</strong> {data.code}</div>
                  <div><strong>Current Warehouse:</strong> {data.warehouse}</div>
                </Col>
                <Col span={12}>
                  <div><strong>Current Stock:</strong></div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {currentStockInfo.totalQty} units
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    ({currentStockInfo.qty} units/ctn × {currentStockInfo.ctn} ctn)
                  </div>
                </Col>
              </Row>
              {formData.warehouse && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <strong>Current in {formData.warehouse}:</strong> {currentWarehouseQty} units
                </div>
              )}
            </div>

            <Divider orientation="left">Add Stock Details</Divider>

            {/* Warehouse Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Warehouse *
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Select warehouse"
                value={formData.warehouse || undefined}
                onChange={(value) => handleSelectChange('warehouse', value)}
                size="middle"
              >
                {WAREHOUSE_OPTIONS.map(wh => (
                  <Option key={wh.value} value={wh.value}>
                    <Tag color={wh.color} style={{ marginRight: 8 }}>{wh.value}</Tag>
                    {wh.label}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Add Type Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Add As
              </label>
              <Select
                style={{ width: '100%' }}
                value={formData.addType}
                onChange={(value) => handleSelectChange('addType', value)}
                size="middle"
              >
                <Option value="UNITS">Individual Units</Option>
                <Option value="CARTONS">Full Cartons</Option>
              </Select>
            </div>

            {/* Quantity Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                {formData.addType === 'UNITS' ? 'Units to Add *' : 'Cartons to Add *'}
              </label>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                max={100000}
                value={formData.quantity}
                onChange={(value) => handleNumberChange('quantity', value)}
                placeholder={formData.addType === 'UNITS' ? 'Enter units' : 'Enter cartons'}
                size="large"
              />
            </div>

            {/* Units per Carton for carton addition */}
            {formData.addType === 'CARTONS' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                  Units per Carton *
                </label>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={1000}
                  value={formData.qtyPerCarton}
                  onChange={(value) => handleNumberChange('qtyPerCarton', value)}
                  placeholder="Units per carton"
                  size="large"
                  addonAfter="units/ctn"
                />
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  Total units: {formData.quantity * formData.qtyPerCarton}
                </div>
              </div>
            )}

            {/* Summary */}
            {formData.quantity > 0 && formData.warehouse && (
              <div style={{ 
                backgroundColor: '#f6ffed', 
                padding: '1.5rem', 
                borderRadius: '6px',
                border: '1px solid #b7eb8f',
                marginTop: '1rem',
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#389e0d' }}>
                  Update Summary
                </div>
                
                {/* Current Stock Details */}
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #d9d9d9' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Current Stock:</div>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Cartons</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{currentStockInfo.ctn}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Units/Carton</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{currentStockInfo.qty}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Units</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{currentStockInfo.totalQty}</div>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* Adding Details */}
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #d9d9d9' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Adding:</div>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Cartons</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#52c41a' }}>
                          {formData.addType === 'CARTONS' ? formData.quantity : '—'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Units/Carton</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#52c41a' }}>
                          {formData.addType === 'CARTONS' ? formData.qtyPerCarton : '—'}
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Units</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#52c41a' }}>
                          {totalUnitsToAdd}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                {/* New Total */}
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>New Total Will Be:</div>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Cartons</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fa8c16' }}>{newCtn}</div>
                        <div style={{ fontSize: '0.8rem', color: '#fa8c16' }}>
                          ({currentStockInfo.ctn} + {formData.addType === 'CARTONS' ? formData.quantity : 0})
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Units/Carton</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fa8c16' }}>{newQty}</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Units</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fa8c16' }}>{newTotalQty}</div>
                        <div style={{ fontSize: '0.8rem', color: '#fa8c16' }}>
                          ({currentStockInfo.totalQty} + {totalUnitsToAdd})
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
                
                <Divider style={{ margin: '0.75rem 0' }} />
                
                {/* Warehouse Specific */}
                <Row>
                  <Col span={24}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Warehouse: {formData.warehouse}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span>Current in warehouse: {currentWarehouseQty} units</span>
                      <span>→</span>
                      <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                        New in warehouse: {newWarehouseQty} units
                      </span>
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </form>
        )}
      </Modal>
    </>
  );
};

export default AddStockModal;