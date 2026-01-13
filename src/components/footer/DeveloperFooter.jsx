// components/DeveloperFooter.jsx
import React from 'react';
import { PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Text } = Typography;

const DeveloperFooter = () => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(102, 126, 234, 0.03)',
      padding: '6px 20px',
      borderTop: '1px solid rgba(102, 126, 234, 0.08)',
      zIndex: 100,
      textAlign: 'center',
      backdropFilter: 'blur(2px)',
      opacity: 0.85,
      transition: 'opacity 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '0.95';
      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '0.85';
      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.03)';
    }}>
      <Text style={{ 
        color: 'rgba(102, 126, 234, 0.7)', 
        fontSize: '11px',
        fontWeight: 400,
        letterSpacing: '0.3px'
      }}>
        {/* Phone */}
        <PhoneOutlined style={{ 
          marginRight: '4px',
          fontSize: '10px',
          opacity: 0.6
        }} />
        <a 
          href="tel:+251927776614"
          style={{
            color: 'rgba(102, 126, 234, 0.7)',
            textDecoration: 'none',
            marginRight: '16px',
            transition: 'color 0.2s',
            fontWeight: 400
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(102, 126, 234, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(102, 126, 234, 0.7)';
          }}
        >
          +251 927 776 614
        </a>
        
        {/* Divider */}
        <span style={{ 
          margin: '0 8px',
          color: 'rgba(102, 126, 234, 0.3)'
        }}>•</span>
        
        {/* Email */}
        <MailOutlined style={{ 
          marginRight: '4px',
          fontSize: '10px',
          opacity: 0.6
        }} />
        <a 
          href="mailto:kalayumisgna@gmail.com"
          style={{
            color: 'rgba(102, 126, 234, 0.7)',
            textDecoration: 'none',
            marginLeft: '4px',
            transition: 'color 0.2s',
            fontWeight: 400
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(102, 126, 234, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(102, 126, 234, 0.7)';
          }}
        >
          kalayumisgna@gmail.com
        </a>
        
        {/* Divider */}
        <span style={{ 
          margin: '0 8px',
          color: 'rgba(102, 126, 234, 0.3)'
        }}>•</span>
        
        {/* Developer name (subtle) */}
        <span style={{ 
          marginLeft: '8px',
          color: 'rgba(102, 126, 234, 0.5)',
          fontStyle: 'italic',
          fontSize: '10px'
        }}>
          developer contact
        </span>
      </Text>
    </div>
  );
};

export default DeveloperFooter;