import { Button, Modal, InputNumber, Select, Divider, Row, Col, Tag, DatePicker, Form, Switch, Alert } from 'antd';
import { ChangeEvent, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import toastMessage from '../../lib/toastMessage';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getSaleModal, getSaleModalData, toggleSaleModel } from '../../redux/services/modal.Slice';
import ModalInput from './ModalInput';
import { useCreateSaleMutation } from '../../redux/features/management/saleApi';

const { Option } = Select;
const { useForm } = Form;

// Ethiopian banks list
const ethiopianBanks = [
  'Commercial Bank of Ethiopia',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Wegagen Bank',
  'Nib International Bank',
  'Cooperative Bank of Oromia',
  'Hibret Bank',
  'Abay Bank',
  'Addis International Bank',
  'Zemen Bank',
  'Bunna International Bank',
  'Berhan International Bank',
  'Lion International Bank',
  'Enat Bank',
  'Oromia International Bank',
  'United Bank',
  'Beltel Bank',
  'Hijira Bank',
  'zemzem Bank',
  'OTHER'
];

const SaleModal = () => {
  const modalOpen = useAppSelector(getSaleModal);
  const data = useAppSelector(getSaleModalData);
  const [createNewSale] = useCreateSaleMutation();
  const dispatch = useAppDispatch();
  const [form] = useForm();

  const [formData, setFormData] = useState({
    buyerName: '',
    ctn: 1,
    date: dayjs().format('YYYY-MM-DD'),
    casherName: '',
    paymentMethod: '',
    paidAmount: 0,
    bankName: '',
    senderName: '',
    senderPhone: '',
    telebirrPhone: '',
    telebirrTransactionId: '',
    otherMethod: '',
    otherReference: '',
    firstPaymentMethod: '',
    dueDate: '',
    paymentNotes: '',
    firstPaymentBank: '',
    firstPaymentReference: '',
    firstPaymentPhone: '',
    firstPaymentDetails: '',
    // New fields
    customPricePerPiece: null as number | null,
    useCustomPrice: false,
    allowNegativeStock: false
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pricePerPiece, setPricePerPiece] = useState(0);
  const [isNegativeStock, setIsNegativeStock] = useState(false);

  // Calculate available stock in cartons
  const piecesPerCarton = data?.qtyPerCarton ?? data?.qty ?? 1;
  const totalCartons = data?.cartonCount ?? 0;

  const calculateAvailableStock = () => {
    if (!data) return { pieces: 0, cartons: 0 };
    
    if (data.cartonCount !== undefined && data.qtyPerCarton !== undefined) {
      const pieces = data.cartonCount * data.qtyPerCarton;
      return { pieces, cartons: data.cartonCount };
    }
    
    if (data.qty !== undefined && data.qtyPerCarton !== undefined) {
      const cartons = Math.floor(data.qty / data.qtyPerCarton);
      return { pieces: data.qty, cartons };
    }
    
    if (data.qty !== undefined) {
      const cartons = data.qty;
      return { pieces: data.qty, cartons };
    }
    
    return { pieces: 0, cartons: 0 };
  };

  const { pieces: availablePiecesInMerkato, cartons: availableStockInCartons } = calculateAvailableStock();

  // Initialize price per piece
  useEffect(() => {
    if (data?.price) {
      setPricePerPiece(data.price);
    }
  }, [data]);

  // Reset form when modal opens/closes or data changes
  useEffect(() => {
    if (modalOpen && data) {
      const defaultPricePerPiece = data.price;
      const cartons = formData.allowNegativeStock ? formData.ctn : 1;
      const totalPieces = cartons * piecesPerCarton;
      const total = totalPieces * (formData.useCustomPrice && formData.customPricePerPiece 
        ? formData.customPricePerPiece 
        : defaultPricePerPiece);
      
      const paidAmount = formData.paymentMethod === 'PARTIAL' ? formData.paidAmount : total;

      setFormData(prev => ({
        ...prev,
        ctn: 1,
        paidAmount: paidAmount,
        date: dayjs().format('YYYY-MM-DD'),
        customPricePerPiece: defaultPricePerPiece,
        useCustomPrice: false,
        allowNegativeStock: false
      }));

      setPricePerPiece(defaultPricePerPiece);
      setIsNegativeStock(false);
    } else if (!modalOpen) {
      resetForm();
    }
  }, [modalOpen, data]);

  // Calculate total amount and remaining amount when quantity, price, or payment details change
  useEffect(() => {
    if (!data) return;

    const cartons = formData.ctn || 1;
    const totalPieces = cartons * piecesPerCarton;
    
    // Use custom price if enabled, otherwise use default product price
    const currentPrice = formData.useCustomPrice && formData.customPricePerPiece 
      ? formData.customPricePerPiece 
      : data.price;
    
    const total = totalPieces * currentPrice;

    let paid = formData.paidAmount || 0;

    // If not partial payment, paid amount should equal total
    if (formData.paymentMethod !== 'PARTIAL') {
      paid = total;
      setFormData(prev => ({ ...prev, paidAmount: total }));
    }

    setTotalAmount(total);
    setRemainingAmount(total - paid);
    setPricePerPiece(currentPrice);
    
    // Check if we're creating negative stock
    const requestedCartons = Number(formData.ctn) || 0;
    setIsNegativeStock(requestedCartons > availableStockInCartons);
  }, [
    formData.ctn, 
    formData.paidAmount, 
    formData.paymentMethod, 
    formData.useCustomPrice,
    formData.customPricePerPiece,
    data, 
    piecesPerCarton,
    availableStockInCartons
  ]);

  const handleCustomPriceToggle = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      useCustomPrice: checked,
      customPricePerPiece: checked ? (prev.customPricePerPiece || data?.price || 0) : null
    }));
  };

  const handleCustomPriceChange = (value: number | null) => {
    setFormData(prev => ({ 
      ...prev, 
      customPricePerPiece: value 
    }));
  };

  const handleAllowNegativeStockToggle = (checked: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      allowNegativeStock: checked 
    }));
    
    // If disabling negative stock and current quantity exceeds available, reset to available
    if (!checked && formData.ctn > availableStockInCartons) {
      setFormData(prev => ({ 
        ...prev, 
        ctn: Math.max(1, availableStockInCartons) 
      }));
    }
  };

  const onSubmit = async () => {
    // Stock validation (unless negative stock is allowed)
    const requestedCartons = Number(formData.ctn) || 0;
    if (!formData.allowNegativeStock && requestedCartons > availableStockInCartons) {
      toastMessage({
        icon: 'error',
        text: `Insufficient stock! Available: ${availableStockInCartons} cartons, Requested: ${requestedCartons} cartons. Enable "Allow Negative Stock" to proceed.`
      });
      return;
    }

    // Basic validation
    if (!formData.buyerName) {
      toastMessage({ icon: 'error', text: 'Buyer name is required' });
      return;
    }

    if (!formData.casherName) {
      toastMessage({ icon: 'error', text: 'Casher name is required' });
      return;
    }

    if (!formData.paymentMethod) {
      toastMessage({ icon: 'error', text: 'Payment method is required' });
      return;
    }

    // Validate custom price if enabled
    if (formData.useCustomPrice) {
      if (!formData.customPricePerPiece || formData.customPricePerPiece <= 0) {
        toastMessage({ icon: 'error', text: 'Please enter a valid custom price' });
        return;
      }
    }

    // Validate partial payment
    if (formData.paymentMethod === 'PARTIAL') {
      if (!formData.paidAmount || formData.paidAmount <= 0) {
        toastMessage({ icon: 'error', text: 'Please enter paid amount for partial payment' });
        return;
      }
      if (formData.paidAmount > totalAmount) {
        toastMessage({ icon: 'error', text: 'Paid amount cannot exceed total amount' });
        return;
      }
      if (!formData.firstPaymentMethod) {
        toastMessage({ icon: 'error', text: 'Please select payment method for first payment' });
        return;
      }
    }

    // Validate bank transfer
    if (formData.paymentMethod === 'BANK_TRANSFER') {
      if (!formData.bankName) {
        toastMessage({ icon: 'error', text: 'Bank name is required for bank transfer' });
        return;
      }
    }

    // Validate telebirr
    if (formData.paymentMethod === 'TELEBIRR') {
      if (!formData.telebirrPhone) {
        toastMessage({ icon: 'error', text: 'Phone number is required for Telebirr payment' });
        return;
      }
      if (!formData.telebirrTransactionId) {
        toastMessage({ icon: 'error', text: 'Transaction ID is required for Telebirr payment' });
        return;
      }
    }

    // Validate other payment method
    if (formData.paymentMethod === 'OTHER') {
      if (!formData.otherMethod) {
        toastMessage({ icon: 'error', text: 'Please specify the payment method' });
        return;
      }
    }

    // Prepare payload according to the backend interface
    const payload = {
      buyerName: formData.buyerName,
      ctn: Number(formData.ctn),
      date: formData.date,
      casherName: formData.casherName,
      productName: data?.name,
      productPrice: formData.useCustomPrice ? formData.customPricePerPiece : data?.price,
      code: data?.code,
      totalAmount: totalAmount,
      paymentMethod: formData.paymentMethod,
      paidAmount: formData.paymentMethod === 'PARTIAL' ? formData.paidAmount : totalAmount,
      remainingAmount: formData.paymentMethod === 'PARTIAL' ? remainingAmount : 0,
      allowNegativeStock: formData.allowNegativeStock,
      useCustomPrice: formData.useCustomPrice,
      customPricePerPiece: formData.customPricePerPiece,

      // Bank transfer details
      ...(formData.paymentMethod === 'BANK_TRANSFER' && {
        bankName: formData.bankName,
        senderName: formData.senderName,
        senderPhone: formData.senderPhone,
      }),

      // Telebirr details
      ...(formData.paymentMethod === 'TELEBIRR' && {
        telebirrPhone: formData.telebirrPhone,
        telebirrTransactionId: formData.telebirrTransactionId,
      }),

      // Other payment details
      ...(formData.paymentMethod === 'OTHER' && {
        otherMethod: formData.otherMethod,
        otherReference: formData.otherReference,
      }),

      // Partial payment details
      ...(formData.paymentMethod === 'PARTIAL' && {
        firstPaymentMethod: formData.firstPaymentMethod,
        paymentNotes: formData.paymentNotes,
        ...(formData.firstPaymentMethod === 'BANK_TRANSFER' && {
          firstPaymentBank: formData.firstPaymentBank,
          firstPaymentReference: formData.firstPaymentReference,
        }),
        ...(formData.firstPaymentMethod === 'TELEBIRR' && {
          firstPaymentPhone: formData.firstPaymentPhone,
        }),
        ...(formData.firstPaymentMethod === 'OTHER' && {
          firstPaymentDetails: formData.firstPaymentDetails,
        }),
      }),
    };

    setIsLoading(true);
    try {
      const res = await createNewSale(payload).unwrap();

      // Check for success
      if (res) {
        toastMessage({ 
          icon: 'success', 
          text: `Sale completed successfully!${isNegativeStock ? ' (Negative stock recorded)' : ''}` 
        });
        dispatch(toggleSaleModel({ open: false, data: null }));
        resetForm();
      }
    } catch (error: any) {
      // Handle errors
      toastMessage({
        icon: 'error',
        text: error.data?.message || error.message || 'Failed to complete sale'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      buyerName: '',
      ctn: 1,
      date: dayjs().format('YYYY-MM-DD'),
      casherName: '',
      paymentMethod: '',
      paidAmount: data ? data.price * piecesPerCarton : 0,
      bankName: '',
      senderName: '',
      senderPhone: '',
      telebirrPhone: '',
      telebirrTransactionId: '',
      otherMethod: '',
      otherReference: '',
      firstPaymentMethod: '',
      dueDate: '',
      paymentNotes: '',
      firstPaymentBank: '',
      firstPaymentReference: '',
      firstPaymentPhone: '',
      firstPaymentDetails: '',
      customPricePerPiece: data?.price || null,
      useCustomPrice: false,
      allowNegativeStock: false
    });
    setTotalAmount(0);
    setRemainingAmount(0);
    setIsNegativeStock(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Reset payment details when payment method changes
    if (name === 'paymentMethod') {
      if (value !== 'PARTIAL') {
        setFormData(prev => ({
          ...prev,
          paidAmount: totalAmount,
          firstPaymentMethod: '',
          firstPaymentBank: '',
          firstPaymentReference: '',
          firstPaymentPhone: '',
          firstPaymentDetails: ''
        }));
      }
    }
  };

  const handleNumberChange = (name: string, value: number | null) => {
    setFormData(prev => ({ ...prev, [name]: value || 0 }));
  };

  const handleDateChange = (name: string, date: any) => {
    setFormData(prev => ({ ...prev, [name]: date ? date.format('YYYY-MM-DD') : '' }));
  };

  const handleCancel = () => {
    dispatch(toggleSaleModel({ open: false, data: null }));
    resetForm();
  };

  return (
    <Modal
      title='New Product Sale'
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
        >
          Complete Sale
        </Button>,
      ]}
      width={900}
    >
      {/* Product Information */}
      {data && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <Row gutter={16}>
            <Col span={12}>
              <strong>Product:</strong> {data.name}
            </Col>
            <Col span={12}>
              <strong>Code:</strong> {data.code}
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '0.5rem' }}>
            <Col span={12}>
              <strong>Default price per piece:</strong> ${(data?.price ?? 0).toFixed(2)}
            </Col>
            <Col span={12}>
              <strong>Default price per carton:</strong> ${(data.price * piecesPerCarton).toFixed(2)}
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: '0.5rem' }}>
            <Col span={12}>
              <strong>Available in Merkato:</strong>
              <span style={{
                color: availablePiecesInMerkato > 0 ? '#52c41a' : '#f5222d',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {availablePiecesInMerkato} pieces ({availableStockInCartons} cartons)
              </span>
            </Col>
            <Col span={12}>
              <strong>Pieces per carton:</strong> {piecesPerCarton}
            </Col>
          </Row>

          {/* Custom Price Section */}
          <Divider orientation="left" style={{ margin: '16px 0' }}>Pricing Options</Divider>
          
          <Row gutter={16} style={{ marginBottom: '1rem' }}>
            <Col span={8}>
              <div style={{ marginBottom: '0.5rem' }}>
                <Switch
                  checked={formData.useCustomPrice}
                  onChange={handleCustomPriceToggle}
                  checkedChildren="Custom Price"
                  unCheckedChildren="Default Price"
                />
              </div>
            </Col>
            <Col span={16}>
              {formData.useCustomPrice && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    <strong>Custom Price per Piece *</strong>
                  </label>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0.01}
                    step={0.01}
                    value={formData.customPricePerPiece}
                    onChange={handleCustomPriceChange}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                    placeholder="Enter custom price per piece"
                  />
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                    Custom price per carton: ${((formData.customPricePerPiece || 0) * piecesPerCarton).toFixed(2)}
                  </div>
                </div>
              )}
            </Col>
          </Row>

          {/* Negative Stock Option */}
          <Row gutter={16} style={{ marginBottom: '1rem' }}>
            <Col span={24}>
              <div style={{ 
                backgroundColor: isNegativeStock ? '#fff2f0' : '#f6ffed',
                padding: '1rem',
                borderRadius: '4px',
                border: `1px solid ${isNegativeStock ? '#ffccc7' : '#b7eb8f'}`
              }}>
                <Row gutter={16} align="middle">
                  <Col span={12}>
                    <div>
                      <Switch
                        checked={formData.allowNegativeStock}
                        onChange={handleAllowNegativeStockToggle}
                        checkedChildren="Allow Negative Stock"
                        unCheckedChildren="Normal Sale"
                      />
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                        {formData.allowNegativeStock 
                          ? 'Allowing sales beyond available stock'
                          : 'Normal sale mode'}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    {formData.allowNegativeStock && isNegativeStock && (
                      <Alert
                        message="Negative Stock Sale"
                        description={`You're selling ${formData.ctn} cartons but only ${availableStockInCartons} are available. The system will record negative stock until replenished.`}
                        type="warning"
                        showIcon
                      />
                    )}
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {/* Only show if there's stock available OR negative stock is allowed */}
          {(availablePiecesInMerkato > 0 || formData.allowNegativeStock) ? (
            <>
              <Row gutter={16} style={{
                marginTop: '0.5rem',
                backgroundColor: isNegativeStock ? '#fff7e6' : '#e6f7ff',
                padding: '0.5rem',
                borderRadius: '4px'
              }}>
                <Col span={12}>
                  <strong>You're selling:</strong> {formData.ctn} carton(s)
                  {isNegativeStock && (
                    <Tag color="orange" style={{ marginLeft: '8px' }}>Negative Stock</Tag>
                  )}
                </Col>
                <Col span={12}>
                  <strong>Total pieces:</strong> {(Number(formData.ctn) * piecesPerCarton)} pieces
                </Col>
              </Row>
              <Row gutter={16} style={{
                marginTop: '0.5rem',
                backgroundColor: '#f6ffed',
                padding: '0.5rem',
                borderRadius: '4px'
              }}>
                <Col span={24} style={{ textAlign: 'center' }}>
                  <strong style={{ fontSize: '1.1rem' }}>
                    Total Amount: ${totalAmount.toFixed(2)}
                  </strong>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    ({formData.ctn} cartons × {piecesPerCarton} pieces × ${pricePerPiece.toFixed(2)}/piece)
                    {formData.useCustomPrice && <Tag color="blue" style={{ marginLeft: '8px' }}>Custom Price</Tag>}
                  </div>
                </Col>
              </Row>
            </>
          ) : (
            <Row gutter={16} style={{
              marginTop: '0.5rem',
              backgroundColor: '#fff2f0',
              padding: '1rem',
              borderRadius: '4px',
              border: '1px solid #ffccc7'
            }}>
              <Col span={24}>
                <div style={{ color: '#f5222d', textAlign: 'center' }}>
                  <strong>⚠️ No stock available in Merkato warehouse!</strong>
                  <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                    Total stock in all warehouses: {data.totalQty || 0} pieces
                    {data.totalQty > 0 && (
                      <div>You need to transfer stock to Merkato warehouse first or enable "Allow Negative Stock".</div>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </div>
      )}

      {/* Buyer Information */}
      <div style={{ marginBottom: '1rem' }}>
        <ModalInput
          handleChange={handleChange}
          name='buyerName'
          defaultValue={formData.buyerName}
          label='Buyer Name *'
        />
      </div>

      {/* Cartons to Sell */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
          Number of Cartons to Sell *
          {data && (
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 'normal',
              color: availableStockInCartons > 0 ? '#52c41a' : '#f5222d',
              marginLeft: '8px'
            }}>
              (Available: {availableStockInCartons} cartons)
              {formData.allowNegativeStock && ' - Negative Allowed'}
            </span>
          )}
        </label>
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          max={formData.allowNegativeStock ? 999999 : availableStockInCartons}
          value={formData.ctn}
          onChange={(value) => {
            const newCtn = value ?? 1;
            setFormData(prev => ({ ...prev, ctn: newCtn }));
          }}
          placeholder="Enter number of cartons"
          disabled={availableStockInCartons === 0 && !formData.allowNegativeStock}
        />
        {availableStockInCartons === 0 && !formData.allowNegativeStock && (
          <div style={{ color: '#f5222d', fontSize: '0.9rem', marginTop: '4px' }}>
            Out of stock! Enable "Allow Negative Stock" to proceed.
          </div>
        )}
        {isNegativeStock && (
          <div style={{ color: '#fa8c16', fontSize: '0.9rem', marginTop: '4px' }}>
            ⚠️ Selling beyond available stock. Will create negative stock of {formData.ctn - availableStockInCartons} cartons.
          </div>
        )}
      </div>

      {/* Date */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
          Selling Date *
        </label>
        <DatePicker
          style={{ width: '100%' }}
          value={formData.date ? dayjs(formData.date) : dayjs()}
          onChange={(date) => handleDateChange('date', date)}
          format="YYYY-MM-DD"
        />
      </div>

      {/* Payment Section */}
      <Divider orientation="left">Payment Information</Divider>

      {/* Payment Method */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
          Payment Method *
        </label>
        <Select
          style={{ width: '100%' }}
          placeholder="Select Payment Method"
          value={formData.paymentMethod || undefined}
          onChange={(value) => handleSelectChange('paymentMethod', value)}
        >
          <Option value=''>Select Payment Method</Option>
          <Option value='CASH'>Cash (Full Payment)</Option>
          <Option value='BANK_TRANSFER'>Bank Transfer</Option>
          <Option value='TELEBIRR'>Telebirr</Option>
          <Option value='PARTIAL'>Partial Payment</Option>
          <Option value='OTHER'>Other Payment Method</Option>
        </Select>
      </div>

      {/* Payment Details */}
      {formData.paymentMethod && (
        <div style={{
          backgroundColor: '#f0f8ff',
          padding: '1rem',
          borderRadius: '6px',
          border: '1px solid #d6e9ff',
          marginBottom: '1rem'
        }}>
          {/* Bank Transfer Details */}
          {formData.paymentMethod === 'BANK_TRANSFER' && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#1890ff' }}>Bank Transfer Details</h4>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                  Bank Name *
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select Bank"
                  value={formData.bankName || undefined}
                  onChange={(value) => handleSelectChange('bankName', value)}
                >
                  {ethiopianBanks.map(bank => (
                    <Option key={bank} value={bank}>{bank}</Option>
                  ))}
                </Select>
              </div>

              {formData.bankName === 'OTHER' && (
                <ModalInput
                  handleChange={handleChange}
                  label='Specify Bank Name'
                  name='bankName'
                  defaultValue={formData.bankName}
                />
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <ModalInput
                    handleChange={handleChange}
                    name='senderName'
                    label='Sender Name'
                    defaultValue={formData.senderName}
                  />
                </Col>
                <Col span={12}>
                  <ModalInput
                    handleChange={handleChange}
                    name='senderPhone'
                    label='Sender Phone'
                    defaultValue={formData.senderPhone}
                  />
                </Col>
              </Row>
            </div>
          )}

          {/* Telebirr Details */}
          {formData.paymentMethod === 'TELEBIRR' && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#722ed1' }}>Telebirr Payment Details</h4>
              <Row gutter={16}>
                <Col span={12}>
                  <ModalInput
                    handleChange={handleChange}
                    name='telebirrPhone'
                    label='Phone Number *'
                    defaultValue={formData.telebirrPhone}
                  />
                </Col>
                <Col span={12}>
                  <ModalInput
                    handleChange={handleChange}
                    name='telebirrTransactionId'
                    label='Transaction ID *'
                    defaultValue={formData.telebirrTransactionId}
                  />
                </Col>
              </Row>
            </div>
          )}

          {/* Other Payment Details */}
          {formData.paymentMethod === 'OTHER' && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#fa8c16' }}>Other Payment Method</h4>
              <ModalInput
                handleChange={handleChange}
                name='otherMethod'
                label='Payment Method Name *'
                defaultValue={formData.otherMethod}
              />
              <ModalInput
                handleChange={handleChange}
                name='otherReference'
                label='Reference/Transaction ID'
                defaultValue={formData.otherReference}
              />
            </div>
          )}

          {/* Partial Payment Details */}
          {formData.paymentMethod === 'PARTIAL' && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#fa541c' }}>Partial Payment Details</h4>

              <Row gutter={16}>
                <Col span={12}>
                  <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                    Paid Amount *
                  </label>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={totalAmount}
                    value={formData.paidAmount}
                    onChange={(value) => handleNumberChange('paidAmount', value)}
                    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                    placeholder="Enter paid amount"
                  />
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                    Minimum: $1, Maximum: ${(totalAmount - 1).toFixed(2)}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                      Payment Method for First Payment *
                    </label>
                    <Select
                      style={{ width: '100%' }}
                      placeholder="Select Method"
                      value={formData.firstPaymentMethod || undefined}
                      onChange={(value) => handleSelectChange('firstPaymentMethod', value)}
                    >
                      <Option value=''>Select Method</Option>
                      <Option value='CASH'>Cash</Option>
                      <Option value='BANK_TRANSFER'>Bank Transfer</Option>
                      <Option value='TELEBIRR'>Telebirr</Option>
                      <Option value='OTHER'>Other</Option>
                    </Select>
                  </div>
                </Col>
              </Row>

              {/* First Payment Method Details */}
              {formData.firstPaymentMethod === 'BANK_TRANSFER' && (
                <Row gutter={16}>
                  <Col span={12}>
                    <ModalInput
                      handleChange={handleChange}
                      name='firstPaymentBank'
                      label='Bank Name'
                      defaultValue={formData.firstPaymentBank}
                    />
                  </Col>
                  <Col span={12}>
                    <ModalInput
                      handleChange={handleChange}
                      name='firstPaymentReference'
                      label='Reference'
                      defaultValue={formData.firstPaymentReference}
                    />
                  </Col>
                </Row>
              )}

              {formData.firstPaymentMethod === 'TELEBIRR' && (
                <ModalInput
                  handleChange={handleChange}
                  name='firstPaymentPhone'
                  label='Phone Number'
                  defaultValue={formData.firstPaymentPhone}
                />
              )}

              {formData.firstPaymentMethod === 'OTHER' && (
                <ModalInput
                  handleChange={handleChange}
                  name='firstPaymentDetails'
                  label='Payment Details'
                  defaultValue={formData.firstPaymentDetails}
                />
              )}

              {/* Remaining Balance */}
              <div style={{
                backgroundColor: '#f6ffed',
                padding: '1rem',
                borderRadius: '4px',
                border: '1px solid #b7eb8f',
                marginTop: '1rem'
              }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div><strong>Total Amount:</strong></div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1890ff' }}>
                        ${totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div><strong>Remaining Balance:</strong></div>
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: remainingAmount > 0 ? '#fa541c' : '#52c41a'
                      }}>
                        ${remainingAmount.toFixed(2)}
                      </div>
                    </div>
                  </Col>
                </Row>

                {remainingAmount > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <ModalInput
                      handleChange={handleChange}
                      name='paymentNotes'
                      label='Payment Agreement Notes'
                      defaultValue={formData.paymentNotes}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Payment Summary */}
          {formData.paymentMethod !== 'PARTIAL' && formData.paymentMethod !== '' && (
            <div style={{
              backgroundColor: '#f6ffed',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #b7eb8f',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Total Amount: ${totalAmount.toFixed(2)}
              </div>
              <Tag color="green">
                {formData.paymentMethod === 'CASH' && 'Cash Payment - Full Amount'}
                {formData.paymentMethod === 'BANK_TRANSFER' && 'Bank Transfer - Full Amount'}
                {formData.paymentMethod === 'TELEBIRR' && 'Telebirr Payment - Full Amount'}
                {formData.paymentMethod === 'OTHER' && 'Other Payment Method - Full Amount'}
              </Tag>
            </div>
          )}
        </div>
      )}

      {/* Casher Name */}
      <div style={{ marginBottom: '1rem' }}>
        <ModalInput
          handleChange={handleChange}
          label='Casher Name *'
          type='text'
          name='casherName'
          defaultValue={formData.casherName}
        />
      </div>

      {/* Summary Card */}
      {data && formData.ctn && (
        <div style={{
          backgroundColor: '#fafafa',
          padding: '1rem',
          borderRadius: '6px',
          border: '1px solid #d9d9d9',
          marginTop: '1rem'
        }}>
          <h4 style={{ marginBottom: '1rem', color: '#1890ff' }}>Sale Summary</h4>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Product:</strong> {data.name}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Cartons to sell:</strong> {formData.ctn}
                {isNegativeStock && (
                  <Tag color="orange" style={{ marginLeft: '8px' }}>Negative: {formData.ctn - availableStockInCartons}</Tag>
                )}
              </div>
              <div>
                <strong>Total Pieces:</strong> {Number(formData.ctn) * piecesPerCarton}
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Price per piece:</strong> ${pricePerPiece.toFixed(2)}
                {formData.useCustomPrice && <Tag color="blue" style={{ marginLeft: '8px' }}>Custom</Tag>}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Price per carton:</strong> ${(pricePerPiece * piecesPerCarton).toFixed(2)}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1890ff' }}>
                <strong>Total Amount:</strong> ${totalAmount.toFixed(2)}
              </div>
            </Col>
          </Row>
          {formData.paymentMethod === 'PARTIAL' && (
            <Row gutter={16} style={{ marginTop: '1rem' }}>
              <Col span={12}>
                <div style={{ color: '#fa541c' }}>
                  <strong>Paid Amount:</strong> ${formData.paidAmount.toFixed(2)}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ color: remainingAmount > 0 ? '#fa541c' : '#52c41a' }}>
                  <strong>Remaining Balance:</strong> ${remainingAmount.toFixed(2)}
                </div>
              </Col>
            </Row>
          )}
          {isNegativeStock && (
            <Row gutter={16} style={{ marginTop: '1rem' }}>
              <Col span={24}>
                <Alert
                  message="Negative Stock Notice"
                  description={`This sale will create negative stock of ${formData.ctn - availableStockInCartons} cartons (${(formData.ctn - availableStockInCartons) * piecesPerCarton} pieces). Stock will need to be replenished.`}
                  type="warning"
                  showIcon
                />
              </Col>
            </Row>
          )}
        </div>
      )}
    </Modal>
  );
};

export default SaleModal;