import { Button, Flex } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toastMessage from '../../lib/toastMessage';
import { useRegisterMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';
import { toast } from 'sonner';

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [userRegistration] = useRegisterMutation();
  
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data: FieldValues) => {
    const toastId = toast.loading('Registering new account!');
    
    try {
      // Prepare data for backend (remove confirmPassword)
      const registrationData = {
        name: data.name,
        email: data.email,
        password: data.password
      };

      console.log('Sending registration data:', registrationData); // For debugging

      const res = await userRegistration(registrationData).unwrap();

      if (res.statusCode === 201) {
        const user = decodeToken(res.data.token);
        dispatch(loginUser({ token: res.data.token, user }));
        navigate('/profile');
        toast.success(res.message, { id: toastId });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.data?.message || 'Registration failed', { id: toastId });
    }
  };

  return (
    <Flex justify='center' align='center' style={{ height: '100vh' }}>
      <Flex
        vertical
        style={{
          width: '400px',
          padding: '3rem',
          border: '1px solid #164863',
          borderRadius: '.6rem',
        }}
      >
        <h1 style={{ marginBottom: '.7rem', textAlign: 'center', textTransform: 'uppercase' }}>
          Register
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type='text'
            {...register('name', { required: 'Name is required' })}
            placeholder='Your Name*'
            className={`input-field ${errors['name'] ? 'input-field-error' : ''}`}
          />
          {errors.name && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {errors.name.message as string}
            </p>
          )}

          <input
            type='email'
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address'
              }
            })}
            placeholder='Your Email*'
            className={`input-field ${errors['email'] ? 'input-field-error' : ''}`}
          />
          {errors.email && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {errors.email.message as string}
            </p>
          )}

          <input
            type='password'
            placeholder='Your Password*'
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            className={`input-field ${errors['password'] ? 'input-field-error' : ''}`}
          />
          {errors.password && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {errors.password.message as string}
            </p>
          )}

          <input
            type='password'
            placeholder='Confirm Password*'
            {...register('confirmPassword', { 
              required: 'Confirm Password is required',
              validate: (value) => value === password || 'Passwords do not match'
            })}
            className={`input-field ${errors['confirmPassword'] ? 'input-field-error' : ''}`}
          />
          {errors.confirmPassword && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {errors.confirmPassword.message as string}
            </p>
          )}

          <Flex justify='center' style={{ marginTop: '1rem' }}>
            <Button
              htmlType='submit'
              type='primary'
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
            >
              Register
            </Button>
          </Flex>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <Link to='/login'>Login Here</Link>
        </p>
      </Flex>
    </Flex>
  );
};

export default RegisterPage;