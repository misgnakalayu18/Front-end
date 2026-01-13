import { Button, Flex } from 'antd';
import { FieldValues, useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import toastMessage from '../../lib/toastMessage';
import { useLoginMutation } from '../../redux/features/authApi';
import { useAppDispatch } from '../../redux/hooks';
import { loginUser, TUser } from '../../redux/services/authSlice';
import decodeToken from '../../utils/decodeToken';

const LoginPage = () => {
  const [userLogin] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();
  

  const getRedirectPath = (role: string): string => {
    // Normalize role to uppercase to match your sidebar logic
    const normalizedRole = role?.toUpperCase()?.trim();
      console.log('🔍 DEBUG getRedirectPath:', {
    originalRole: role,
    normalizedRole: normalizedRole,
    type: typeof role
  });
    
    const roleRoutes: Record<string, string> = {
      USER: '/profile',
      SELLER: '/supplier-products',
      ADMIN: '/Dashboard',
    };
    console.log('User role:', role, 'Normalized:', normalizedRole);
  console.log('Redirecting to:', roleRoutes[normalizedRole] || '/');
    return roleRoutes[normalizedRole] || '/profile';
  };

  // In your LoginPage onSubmit function
const onSubmit = async (data: FieldValues) => {
  const toastId = toast.loading('Logging...');
  try {
    const res = await userLogin(data).unwrap();

    if (res.statusCode === 200) {
      const user = decodeToken(res.data.token) as TUser;
      
      // Check if token is expired
      const isTokenValid = (user: TUser): boolean => {
        if (!user.exp) return false;
        const expirationTime = user.exp * 1000;
        const currentTime = Date.now();
        return expirationTime > currentTime;
      };

      if (!isTokenValid(user)) {
        toast.error('Login token is expired');
        return;
      }
      
      dispatch(loginUser({ token: res.data.token, user }));
      
      const from = location.state?.from?.pathname;
      const redirectPath = from || getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
      
      toast.success('Successfully Login!', { id: toastId });
    }
  } catch (error: any) {
    toastMessage({ icon: 'error', text: error.data.message });
  }
};

  return (
    <Flex justify='center' align='center' style={{ height: '100vh' }}>
      <Flex
        vertical
        style={{
          width: '500px',
          padding: '6rem',
          border: '3px solid #e3ced6ff',
          borderRadius: '.4rem',
          //backgroundColor: '#8beaf7ff',
        }}
      >
        <h1 style={{ marginBottom: '.7rem', textAlign: 'center', textTransform: 'uppercase' }}>
          Login
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type='email'
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address'
              }
            })}
            placeholder='Your Email EX.kalayu@gmail.com'
            className={`input-field ${errors['email'] ? 'input-field-error' : ''}`}
          />
          {errors.email && (
            <span style={{ color: 'red', fontSize: '12px' }}>
              {errors.email.message as string}
            </span>
          )}
          
          <input
            type='password'
            placeholder='Your Password*'
            className={`input-field ${errors['password'] ? 'input-field-error' : ''}`}
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
          />
          {errors.password && (
            <span style={{ color: 'red', fontSize: '12px' }}>
              {errors.password.message as string}
            </span>
          )}
          
          <Flex justify='center'>
            <Button
              htmlType='submit'
              type='primary'
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
            >
              Login
            </Button>
          </Flex>
        </form>
        <p style={{ marginTop: '1rem' }}>
          Don't have any account? <Link to='/register'>Register Here</Link>
        </p>
      </Flex>
    </Flex>
  );
};

export default LoginPage;