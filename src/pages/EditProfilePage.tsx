import { UploadOutlined, ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Spin, message } from 'antd';
import userProPic from '../assets/User.png';
import CustomInput from '../components/common/CustomInput';
import { useForm } from 'react-hook-form';
import { profileInputFields } from '../constant/profile';
import { useGetSelfProfileQuery, useUpdateProfileMutation } from '../redux/features/authApi';
import Loader from '../components/common/Loader';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { config } from '../utils/config';
import React, { useState } from 'react';

// Edit Profile Form Component
const EditProfileForm = ({ data }: { data: any }) => {
  const navigate = useNavigate();
  const [updateProfile] = useUpdateProfileMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: data });

  const onSubmit = async (formData: any) => {
    // Clean the payload - only include fields that can be updated
    const cleanedData = {
      name: formData.name,
      title: formData.title,
      description: formData.description,
      address: formData.address,
      phone: formData.phone,
      // avatar field will be updated separately via file upload
    };

    console.log('Sending update payload:', cleanedData);

    const toastId = toast.loading('Updating profile...');
    try {
      const res = await updateProfile(cleanedData).unwrap();

      if (res.success) {
        toast.success('Profile updated successfully', { id: toastId });
        navigate('/profile');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error?.data?.message || 'Failed to update profile', { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {profileInputFields.map((input) => (
        <CustomInput
          key={input.id}
          name={input.name}
          errors={errors}
          label={input.label}
          register={register}
          required={false}
        />
      ))}

      <Flex justify='center'>
        <Button
          htmlType='submit'
          type='primary'
          style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
        >
          Update Profile
        </Button>
      </Flex>
    </form>
  );
};

// Main Edit Profile Page Component
const EditProfilePage = () => {
  const { data, isLoading, refetch } = useGetSelfProfileQuery(undefined);
  const [updateProfile] = useUpdateProfileMutation();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  if (isLoading) {
    return <Loader />;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Validate file exists
    if (!file) {
      toast.error('No file selected');
      return;
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      e.target.value = ''; // Reset input
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading image...');

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('avatar', file);
      
      // If your backend needs additional fields
      formData.append('userId', data?.data?.id || '');
      formData.append('userEmail', data?.data?.email || '');

      // Get authentication token
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Upload to your backend
      const response = await fetch(`${config.baseUrl}/users/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || `Upload failed with status: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success && responseData.data?.avatarUrl) {
        // Update profile with new avatar URL
        const updateResponse = await updateProfile({ 
          avatar: responseData.data.avatarUrl 
        }).unwrap();

        if (updateResponse.success) {
          toast.success('Profile picture updated successfully!', { 
            id: toastId,
            duration: 3000 
          });
          
          // Clear file input to allow selecting same file again
          e.target.value = '';
          
          // Refetch user data to get updated avatar
          await refetch();
        } else {
          toast.error('Failed to update profile', { 
            id: toastId,
            duration: 4000 
          });
        }
      } else {
        toast.error('Failed to get avatar URL from server', { 
          id: toastId,
          duration: 4000 
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload image';
      if (error.message?.includes('token')) {
        errorMessage = 'Authentication error. Please login again.';
        // Optionally redirect to login
        // navigate('/login');
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { 
        id: toastId,
        duration: 5000 
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Row>
      <Col xs={{ span: 24 }} lg={{ span: 8 }}>
        <Flex align='center' vertical style={{ margin: '1rem 0' }}>
          <Flex
            justify='center'
            align='center'
            style={{
              width: '250px',
              height: '250px',
              border: '2px dashed #d9d9d9',
              padding: '.5rem',
              borderRadius: '50%',
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.3s',
              backgroundColor: data?.data?.avatar ? 'transparent' : '#1890ff',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement).style.borderColor = '#1890ff'}
            onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement).style.borderColor = '#d9d9d9'}
          >
            {isUploading ? (
              <Spin 
                indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />}
              />
            ) : data?.data?.avatar ? (
              <img
                src={data?.data?.avatar}
                alt='Profile'
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: '50%',
                  transition: 'transform 0.3s',
                }}
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = 'none';
                  // Show initials instead
                  const avatarContainer = e.currentTarget.parentElement;
                  if (avatarContainer) {
                    const initialsSpan = document.createElement('span');
                    initialsSpan.style.cssText = `
                      color: white;
                      font-size: 60px;
                      font-weight: bold;
                    `;
                    initialsSpan.textContent = getInitials(data?.data?.name);
                    avatarContainer.appendChild(initialsSpan);
                  }
                }}
              />
            ) : (
              <span style={{ color: 'white', fontSize: '60px', fontWeight: 'bold' }}>
                {getInitials(data?.data?.name)}
              </span>
            )}
            
            {/* Upload Overlay - Only show when not uploading */}
            {!isUploading && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.3s',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onClick={() => document.getElementById('avatar')?.click()}
              >
                <UploadOutlined style={{ fontSize: '24px', color: 'white' }} />
                <span style={{ color: 'white', marginLeft: '8px' }}>Change</span>
              </div>
            )}
          </Flex>
          
          <Flex style={{ padding: '1rem' }}>
            <input
              type='file'
              name='avatar'
              id='avatar'
              accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label
              htmlFor='avatar'
              style={{
                background: isUploading ? '#d9d9d9' : '#1890ff',
                color: '#fff',
                padding: '8px 16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                fontSize: '14px',
                borderRadius: '6px',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.backgroundColor = '#40a9ff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.backgroundColor = '#1890ff';
                }
              }}
            >
              {isUploading ? (
                <LoadingOutlined spin />
              ) : (
                <UploadOutlined />
              )}
              {isUploading ? 'Uploading...' : 'Change Profile Picture'}
            </label>
          </Flex>
          
          {/* File info */}
          <div style={{ 
            fontSize: '12px', 
            color: '#666',
            textAlign: 'center',
            marginTop: '-10px',
            marginBottom: '10px'
          }}>
            Supports: JPEG, PNG, GIF, WebP | Max: 5MB
          </div>
        </Flex>
      </Col>
      <Col xs={{ span: 24 }} lg={{ span: 16 }}>
        <Flex justify='end' style={{ margin: '1rem 0' }}>
          <Button 
            type='default' 
            onClick={() => navigate('/profile')}
            icon={<ArrowLeftOutlined />}
            disabled={isUploading}
          >
            Go Back
          </Button>
        </Flex>
        <EditProfileForm data={data?.data} />
      </Col>
    </Row>
  );
};

export default EditProfilePage;