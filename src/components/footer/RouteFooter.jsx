// components/RouteFooter.jsx
import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const RouteFooter = () => {
  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      height: '36px',
      background: 'rgba(255, 255, 255, 0.98)',
      borderTop: '0.5px solid rgba(102, 126, 234, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      backdropFilter: 'blur(3px)',
      opacity: 0.9,
      transition: 'opacity 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.opacity = '0.9';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.98)';
    }}>
      <Text style={{ 
        color: 'rgba(102, 126, 234, 0.5)', 
        fontSize: '10.5px',
        fontWeight: 300,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ opacity: 0.3, fontSize: '9px' }}>⎯⎯⎯</span>
        
        <span style={{ 
          padding: '1px 8px',
          border: '0.5px solid rgba(102, 126, 234, 0.1)',
          borderRadius: '2px',
          background: 'rgba(255, 255, 255, 0.5)'
        }}>
          <a 
            href="tel:+251927776614"
            style={{
              color: 'rgba(102, 126, 234, 0.5)',
              textDecoration: 'none',
              fontWeight: 300,
              letterSpacing: '0.2px'
            }}
          >
            +251 927 776 614
          </a>
        </span>
        
        <span style={{ opacity: 0.3, fontSize: '8px' }}>∕∕</span>
        
        <span style={{ 
          padding: '1px 8px',
          border: '0.5px solid rgba(102, 126, 234, 0.1)',
          borderRadius: '2px',
          background: 'rgba(255, 255, 255, 0.5)'
        }}>
          <a 
            href="mailto:kalayumisgna@gmail.com"
            style={{
              color: 'rgba(102, 126, 234, 0.5)',
              textDecoration: 'none',
              fontWeight: 300,
              letterSpacing: '0.2px'
            }}
          >
            kalayumisgna@gmail.com
          </a>
        </span>
        
        <span style={{ opacity: 0.3, fontSize: '9px' }}>⎯⎯⎯</span>
      </Text>
    </div>
  );
};

export default RouteFooter;