import { Button, Flex, Modal, Input, InputNumber } from 'antd';
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

const EditModal = () => {
  const modalOpen = useAppSelector(getUpdateModal);
  const data = useAppSelector(getUpdateModalData) as IProduct | null;
  const [updateProduct, { isLoading }] = useUpdateProductMutation();
  const dispatch = useAppDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
  });

  // Initialize form with data when modal opens
  useEffect(() => {
    if (data && modalOpen) {
      console.log('📋 Initializing form with data:', {
        name: data.name,
        price: data.price,
        rawPrice: data.price
      });
      
      setFormData({
        name: data.name || '',
        price: Number(data.price) || 0,
      });
    }
  }, [data, modalOpen]);

  const handleChange = (field: string, value: any) => {
    console.log(`🔄 handleChange: ${field} =`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePriceChange = (value: number | null) => {
    console.log('💰 handlePriceChange called with:', value, 'Type:', typeof value);
    
    // If value is null, set to 0
    const newPrice = value === null ? 0 : value;
    
    console.log('💰 Setting price to:', newPrice);
    handleChange('price', newPrice);
  };

  const onSubmit = async () => {
    if (!data?.id) {
      toastMessage({ icon: 'error', text: 'No product selected' });
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toastMessage({ icon: 'error', text: 'Product name is required' });
      return;
    }

    if (formData.price <= 0) {
      toastMessage({ icon: 'error', text: 'Price must be greater than 0' });
      return;
    }

    try {
      // Prepare payload - only name and price
      const payload = {
        name: formData.name.trim(),
        price: formData.price,
      };

      console.log('🔄 Updating product:', { 
        id: data.id, 
        payload,
        currentData: {
          name: data.name,
          price: data.price
        },
        newData: payload
      });

      const res = await updateProduct({ 
        id: data.id, 
        payload 
      }).unwrap();
      
      console.log('✅ Update response:', res);
      
      if (res.success || res.statusCode === 200) {
        toastMessage({ 
          icon: 'success', 
          text: `Product updated! Name: ${payload.name}, Price: $${payload.price}` 
        });
        
        // Close modal and reset form
        handleClose();
        
        // Refresh page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toastMessage({ icon: 'error', text: res.message || 'Failed to update product' });
      }
    } catch (error: any) {
      console.error('❌ Update error:', error);
      toastMessage({ 
        icon: 'error', 
        text: error.data?.message || error.message || 'Failed to update product' 
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      price: 0,
    });
    dispatch(toggleUpdateModel({ open: false, data: null }));
  };

  return (
    <Modal
      title="Edit Product"
      centered
      open={modalOpen}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button 
          key="update" 
          type="primary" 
          onClick={onSubmit}
          loading={isLoading}
          disabled={!formData.name.trim() || formData.price <= 0}
        >
          Update Product
        </Button>,
      ]}
      width={500}
    >
      {!data ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No product selected for editing.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '1rem', 
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div><strong>Product Code:</strong> {data.code}</div>
              <div><strong>Current Name:</strong> {data.name}</div>
              <div><strong>Current Price:</strong> ${data.price.toFixed(2)}</div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                <strong>Debug:</strong> Form price value: ${formData.price}
              </div>
            </div>

            {/* Product Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600 
              }}>
                Product Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  console.log('📝 Name changed:', e.target.value);
                  handleChange('name', e.target.value);
                }}
                placeholder="Enter product name"
                size="large"
                style={{ width: '100%' }}
              />
            </div>

            {/* Product Price - Use InputNumber */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 600 
              }}>
                Price *
              </label>
              <InputNumber
                value={formData.price}
                onChange={handlePriceChange}
                placeholder="0.00"
                size="large"
                style={{ width: '100%' }}
                min={0}
                step={1}
                precision={2}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                onFocus={(e) => {
                  console.log('💰 Price input focused');
                  // Select all text when focused for easy editing
                  e.target.select();
                }}
                onBlur={() => {
                  console.log('💰 Price input blurred, current value:', formData.price);
                }}
              />
            </div>

            {/* Preview */}
            {formData.name.trim() && formData.price > 0 && (
              <div style={{ 
                backgroundColor: '#f6ffed', 
                padding: '1rem', 
                borderRadius: '6px',
                border: '1px solid #b7eb8f',
                marginTop: '1rem'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Preview (will be sent to API):
                </div>
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Price:</strong> ${formData.price.toFixed(2)}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  <strong>Payload:</strong> {JSON.stringify({name: formData.name, price: formData.price})}
                </div>
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditModal;