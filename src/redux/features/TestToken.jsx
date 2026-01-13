// TestToken.jsx
import { useEffect } from 'react';
import { useAppSelector } from '../redux/hooks';
import { getCurrentToken } from '../redux/services/authSlice';

const TestToken = () => {
  const token = useAppSelector(getCurrentToken);

  useEffect(() => {
    const testToken = async () => {
      if (token) {
        try {
          console.log('Testing token:', token);
          const response = await fetch('http://localhost:8000/api/users/self', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const result = await response.json();
          console.log('Token test result:', result);
        } catch (error) {
          console.error('Token test failed:', error);
        }
      }
    };
    
    testToken();
  }, [token]);

  return <div>Testing token...</div>;
};