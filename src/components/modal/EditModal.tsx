import { Button, Flex, Modal } from 'antd';
import { useEffect, useState } from 'react';
import toastMessage from '../../lib/toastMessage';
import { useUpdateProductMutation } from '../../redux/features/management/productApi';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  getUpdateModal,
  getUpdateModalData,
  toggleUpdateModel,
} from '../../redux/services/modal.Slice';
import { IProduct } from '../../types/product.types';
import ControlledModalInput from './ControlledModalInput';

// Helper function for safe property assignment
const setProductProperty = <T extends Partial<IProduct>>(
  obj: T,
  key: string,
  value: any
): T => {
  const newObj = { ...obj };
  
  // Define all number fields in IProduct
  const numberFields = [
    'price', 'qty', 'default_price', 'min_sale_price', 'max_sale_price',
    'shegole_muluneh_qty', 'embilta_qty', 'new_shegole_qty',
    'merkato_qty', 'damage_qty', 'backup_qty', 'total_qty', 'total_price',
    'min_stock_level', 'reorder_point', 'negative_stock_pieces',
    'ctn' // Add ctn if it's a number field
  ];
  
  if (numberFields.includes(key)) {
    if (value === '' || value === null || value === undefined) {
      (newObj as any)[key] = undefined;
    } else {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue)) {
        // Round to 2 decimal places
        const roundedValue = Math.round((numValue + Number.EPSILON) * 100) / 100;
        (newObj as any)[key] = roundedValue;
      } else {
        (newObj as any)[key] = undefined;
      }
    }
  } else {
    // For string/enum/boolean fields
    (newObj as any)[key] = value;
  }
  
  return newObj;
};

const EditModal = () => {
  const modalOpen = useAppSelector(getUpdateModal);
  const data = useAppSelector(getUpdateModalData);
  const [updateProduct] = useUpdateProductMutation();
  const dispatch = useAppDispatch();
  const [updateData, setUpdateData] = useState<Partial<IProduct>>({});

  // Initialize form with data when modal opens
  useEffect(() => {
    if (data && modalOpen) {
      // Ensure numbers are properly typed
      const initializedData: Partial<IProduct> = { ...data };
      
      // Convert string numbers to actual numbers
      const numberFields = ['price', 'qty', 'default_price', 'min_sale_price', 'max_sale_price'];
      numberFields.forEach(field => {
        if (initializedData[field as keyof IProduct] !== undefined && 
            typeof initializedData[field as keyof IProduct] === 'string') {
          (initializedData as any)[field] = parseFloat((initializedData as any)[field]);
        }
      });
      
      setUpdateData(initializedData);
    }
  }, [data, modalOpen]);

  const handleControlledChange = (name: string, value: string | number | undefined) => {
    setUpdateData(prev => setProductProperty(prev, name, value));
  };

  const onSubmit = async () => {
    try {
      // Prepare payload
      const payload: any = {};
      
      // Only include fields that have changed or are not undefined
      Object.keys(updateData).forEach(key => {
        if (key !== 'id' && updateData[key as keyof IProduct] !== undefined) {
          payload[key] = updateData[key as keyof IProduct];
        }
      });

      console.log('Sending payload:', payload);

      const res = await updateProduct({ 
        id: updateData?.id as number, 
        payload 
      }).unwrap();
      
      if (res.success) {
        toastMessage({ icon: 'success', text: res.message });
        dispatch(toggleUpdateModel({ open: false, data: null }));
      } else {
        toastMessage({ icon: 'error', text: res.message });
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toastMessage({ icon: 'error', text: error.data?.message || 'Failed to update product' });
    }
  };

  const handleClose = () => {
    setUpdateData({});
    dispatch(toggleUpdateModel({ open: false, data: null }));
  };

  // Format display value for number fields
  const formatDisplayValue = (value: any, fieldName: string): string => {
    if (value === undefined || value === null) return '';
    
    const numberFields = ['price', 'qty', 'default_price', 'min_sale_price', 'max_sale_price'];
    
    if (numberFields.includes(fieldName)) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(numValue) ? '' : numValue.toString();
    }
    
    return value?.toString() || '';
  };

  return (
    <Modal
      title='Update Product'
      centered
      open={modalOpen}
      onOk={handleClose}
      onCancel={handleClose}
      footer={[
        <Button key='back' onClick={handleClose}>
          Close
        </Button>,
      ]}
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <ControlledModalInput
          name='code'
          value={updateData?.code || ''}
          onChange={handleControlledChange}
          label='Code'
        />
        <ControlledModalInput
          name='name'
          value={updateData?.name || ''}
          onChange={handleControlledChange}
          label='Name'
        />
        <ControlledModalInput
          name='price'
          value={formatDisplayValue(updateData?.price, 'price')}
          onChange={handleControlledChange}
          label='Price'
          type='number'
          step="0.01"
          min="0"
          //placeholder="0.00"
        />
        <ControlledModalInput
          name='qty'
          value={formatDisplayValue(updateData?.qty, 'qty')}
          onChange={handleControlledChange}
          label='Quantity'
          type='number'
          step="0.01"
          min="0"
          //placeholder="0.00"
        />
        <Flex justify='center' style={{ margin: '1rem' }}>
          <Button key='submit' type='primary' onClick={onSubmit}>
            Update
          </Button>
        </Flex>
      </form>
    </Modal>
  );
};

export default EditModal;