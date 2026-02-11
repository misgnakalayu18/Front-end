// components/CreateProduct.tsx
import { Button, Col, Flex, Row, Card, Alert } from 'antd';
import { FieldValues, useForm, useWatch } from 'react-hook-form';
import CustomInput from '../components/common/CustomInput';
import toastMessage from '../lib/toastMessage';
import { useCreateNewProductMutation } from '../redux/features/management/productApi';
import { Warehouse, Unit } from '../types/product.types';
import { useEffect } from 'react';
import { 
  BarcodeOutlined, 
  TagOutlined, 
  AppstoreOutlined, 
  CalculatorOutlined, 
  InboxOutlined, 
  DollarOutlined,
  HomeOutlined,
  SaveOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';

const CreateProduct = () => {
  const [createNewProduct] = useCreateNewProductMutation();

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm();

  const price = useWatch({ control, name: 'price' });
  const quantity = useWatch({ control, name: 'qty' });
  const carthon = useWatch({ control, name: 'ctn' });

  useEffect(() => {
    const calculatedTotal = parseFloat(price || 0) * parseInt(quantity || 0) * parseInt(carthon || 0);
    if (!isNaN(calculatedTotal) && calculatedTotal > 0) {
      setValue('totalPrice', calculatedTotal);
    } else {
      setValue('totalPrice', '');
    }
  }, [price, quantity, carthon, setValue]);

  const onSubmit = async (data: FieldValues) => {
    const payload = { ...data };
    payload.price = parseFloat(data.price);
    payload.qty = parseInt(data.qty);
    payload.ctn = parseInt(data.ctn);

    if (isNaN(payload.price) || payload.price <= 0) {
      toastMessage({ icon: 'error', text: 'Please enter a valid price' });
      return;
    }
    if (isNaN(payload.qty) || payload.qty < 0) {
      toastMessage({ icon: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    payload.totalPrice = payload.totalPrice ? parseFloat(payload.totalPrice) : payload.price * payload.qty * payload.ctn;

    try {
      const res = await createNewProduct(payload).unwrap();
      if (res.statusCode === 201) {
        toastMessage({ icon: 'success', text: res.message });
        reset();
      }
    } catch (error: any) {
      console.log(error);
      toastMessage({ icon: 'error', text: error.data.message });
    }
  };

  return (
    <Row justify="center" align="middle" style={{ 
      minHeight: 'calc(100vh - 6rem)', 
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
    }}>
      <Col xs={24} sm={22} md={20} lg={18} xl={16} xxl={14}>
        <Card
          style={{
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(22, 72, 99, 0.15)',
            border: '1px solid #d9d9d9',
            backgroundColor: 'white',
            width: '100%'
          }}
          bodyStyle={{ padding: '2rem' }}
        >
          <h1 style={{
            marginBottom: '2rem',
            fontWeight: '900',
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#164863',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: '1.8rem'
          }}>
            <AppstoreOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
            Add New Product
          </h1>

          <Alert
            message="Product Creation Guide"
            description="Fill in all required fields to add a new product to your inventory. The total price will be automatically calculated based on quantity and unit price."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: '1.5rem', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}
          />
          
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Product Code */}
            <Row gutter={[24, 16]} align="middle" style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} md={6} lg={5}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#0050b3'
                }}>
                  <BarcodeOutlined />
                  Product Code *
                </label>
              </Col>
              <Col xs={24} md={18} lg={19}>
                <CustomInput
                  name='code'
                  errors={errors}
                  register={register}
                  required={true}
                  placeholder='EK-001'
                  label={''}
                />
              </Col>
            </Row>

            {/* Product Name */}
            <Row gutter={[24, 16]} align="middle" style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} md={6} lg={5}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#389e0d'
                }}>
                  <TagOutlined />
                  Product Name *
                </label>
              </Col>
              <Col xs={24} md={18} lg={19}>
                <CustomInput
                  name='name'
                  errors={errors}
                  register={register}
                  required={true}
                  placeholder='1034 AIR FRYER SONIFER'
                  label={''}
                />
              </Col>
            </Row>

            {/* Unit Selection */}
            <Row gutter={[24, 16]} align="middle" style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} md={6} lg={5}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#d46b08'
                }}>
                  <AppstoreOutlined />
                  Unit *
                </label>
              </Col>
              <Col xs={24} md={18} lg={19}>
                <div style={{ position: 'relative' }}>
                  <AppstoreOutlined style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#d46b08',
                    zIndex: 1
                  }} />
                  <select
                    defaultValue={Unit.PIECE}
                    className='input-field'
                    style={{
                      width: '200px',
                      paddingLeft: '40px',
                      border: '1px solid #ffd591',
                      backgroundColor: '#fff7e6',
                      height: '40px',
                      borderRadius: '6px',
                      color: '#d46b08',
                      fontWeight: '500'
                    }}
                    {...register('unit', { required: true })}
                  >
                    <option value={Unit.DOZEN}>DOZEN</option>
                    <option value={Unit.SET}>SET</option>
                    <option value={Unit.PIECE}>PIECE</option>
                  </select>
                </div>
                {errors.unit && (
                  <span style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Unit is required
                  </span>
                )}
              </Col>
            </Row>

            {/* Quantity per Carton */}
            <Row gutter={[24, 16]} align="middle" style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} md={6} lg={5}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#006d75'
                }}>
                  <CalculatorOutlined />
                  Qty per Carton *
                </label>
              </Col>
              <Col xs={24} md={18} lg={19}>
                <CustomInput
                  errors={errors}
                  type='number'
                  name='qty'
                  register={register}
                  required={true}
                  placeholder='2'
                  label={''}
                />
              </Col>
            </Row>

            {/* Number of Cartons */}
            <Row gutter={[24, 16]} align="middle" style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} md={6} lg={5}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#531dab'
                }}>
                  <InboxOutlined />
                  No. of Cartons *
                </label>
              </Col>
              <Col xs={24} md={18} lg={19}>
                <CustomInput
                  errors={errors}
                  type='number'
                  name='ctn'
                  register={register}
                  required={true}
                  placeholder='1'
                  label={''}
                />
              </Col>
            </Row>

            {/* Unit Price */}
            <Row gutter={[24, 16]} align="middle" style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} md={6} lg={5}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#c41d7f'
                }}>
                  <DollarOutlined />
                  Unit Price (ETB) *
                </label>
              </Col>
              <Col xs={24} md={18} lg={19}>
                <CustomInput
                  errors={errors}
                  type='number'
                  name='price'
                  register={register}
                  required={true}
                  placeholder='11000'
                  label={''}
                />
              </Col>
            </Row>

            {/* Total Price Calculation */}
            <div style={{ 
              marginBottom: '1.5rem',
              padding: '1.5rem',
              backgroundColor: '#f0f5ff',
              borderRadius: '8px',
              border: '1px solid #d6e4ff'
            }}>
              <Row gutter={[24, 16]} align="middle">
                <Col xs={24} md={6} lg={5}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1d39c4'
                  }}>
                    <CalculatorOutlined />
                    Total Price (ETB)
                  </label>
                </Col>
                <Col xs={24} md={18} lg={19}>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <CalculatorOutlined style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#1d39c4',
                      zIndex: 1
                    }} />
                    <input
                      type='number'
                      className='input-field'
                      style={{
                        width: '100%',
                        paddingLeft: '40px',
                        backgroundColor: 'white',
                        border: '2px solid #adc6ff',
                        cursor: 'not-allowed',
                        color: '#1d39c4',
                        fontWeight: 'bold',
                        height: '40px',
                        borderRadius: '6px'
                      }}
                      {...register('totalPrice')}
                      readOnly
                      placeholder='Auto-calculated'
                    />
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#1d39c4', 
                    padding: '6px 10px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #adc6ff',
                    fontWeight: '500'
                  }}>
                    <span style={{ fontWeight: '500' }}>Calculation:</span> {price || 0} × {quantity || 0} × {carthon || 0} = 
                    <span style={{ fontWeight: 'bold', marginLeft: '4px' }}>
                      {parseFloat(price || 0) * parseInt(quantity || 0) * parseInt(carthon || 0) || 0} ETB
                    </span>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Warehouse Selection */}
            <div style={{ 
              marginBottom: '2rem',
              padding: '1.5rem',
              backgroundColor: '#fff2e8',
              borderRadius: '8px',
              border: '1px solid #ffd8bf'
            }}>
              <Row gutter={[24, 16]} align="middle">
                <Col xs={24} md={6} lg={5}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#d4380d'
                  }}>
                    <HomeOutlined />
                    Select Warehouse *
                  </label>
                </Col>
                <Col xs={24} md={18} lg={19}>
                  <div style={{ position: 'relative' }}>
                    <HomeOutlined style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#d4380d',
                      zIndex: 1
                    }} />
                    <select
                      defaultValue={Warehouse.SHEGOLE_MULUNEH}
                      className='input-field'
                      style={{
                        width: '100%',
                        paddingLeft: '40px',
                        border: '2px solid #ffbb96',
                        backgroundColor: 'white',
                        height: '40px',
                        borderRadius: '6px',
                        color: '#d4380d',
                        fontWeight: '500'
                      }}
                      {...register('warehouse', { required: true })}
                    >
                      <option value={Warehouse.SHEGOLE_MULUNEH}>SHEGOLE MULUNEH</option>
                      <option value={Warehouse.EMBILTA}>EMBILTA</option>
                      <option value={Warehouse.NEW_SHEGOLE}>NEW SHEGOLE</option>
                      <option value={Warehouse.MERKATO}>MERKATO</option>
                      <option value={Warehouse.DAMAGE}>DAMAGE</option>
                      <option value={Warehouse.BACKUP}>BACKUP</option>
                    </select>
                  </div>
                  {errors.warehouse && (
                    <span style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                      Warehouse is required
                    </span>
                  )}
                </Col>
              </Row>
            </div>

            {/* Submit Button */}
            <Flex justify='center' style={{ marginTop: '2.5rem', borderTop: '1px solid #e8e8e8', paddingTop: '2rem' }}>
              <Button
                htmlType='submit'
                type='primary'
                icon={<SaveOutlined />}
                size="large"
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  padding: '0 3rem',
                  height: '3rem',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #164863 0%, #2a6fa8 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(22, 72, 99, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  minWidth: '220px'
                }}
              >
                Save Product
              </Button>
            </Flex>
          </form>
        </Card>
      </Col>
    </Row>
  );
};

export default CreateProduct;