// components/layout/HoverFooter.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const HoverFooter = () => {
  const [isVisible, setIsVisible] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 1000); // Hide after 1 second
  };

  return (
    <>
      {/* Invisible hover area at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20px', // Area to trigger hover
          zIndex: 998,
          backgroundColor: 'transparent',
          cursor: 'pointer'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Actual footer */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '28px',
          background: 'rgba(22, 72, 99, 0.95)',
          backdropFilter: 'blur(6px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Text style={{ 
          fontSize: '10.5px',
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 300,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontFamily: "'Nunito', sans-serif"
        }}>
          <a 
            href="https://misgnakalayu18.github.io/kalayu-portfolio"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              textDecoration: 'none',
              fontWeight: 300
            }}
          >
           Developed by Kalayu Misgna
          </a>
          
          <span style={{ opacity: 0.3, fontSize: '9px' }}>•</span>
          <a 
            href="tel:+251927776614"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              textDecoration: 'none',
              fontWeight: 300
            }}
          >
            +251 927 776 614
          </a>
          
          <span style={{ opacity: 0.3, fontSize: '9px' }}>•</span>
          
          <a 
            href="mailto:kalayumisgna@gmail.com"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              textDecoration: 'none',
              fontWeight: 300
            }}
          >
            kalayumisgna@gmail.com
          </a>
        </Text>
      </div>
    </>
  );
};

export default HoverFooter;