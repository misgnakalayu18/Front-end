// components/layout/AutoHideFooter.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const AutoHideFooter = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const footerRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check if user is at the bottom of the page
  const isAtBottom = useCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Show footer when within 100px of bottom or at bottom
    return documentHeight - (scrollTop + windowHeight) <= 100;
  }, []);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollingDown = currentScrollY > lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      if (isAtBottom()) {
        // Always show at bottom of page
        setIsVisible(true);
        // Clear any hide timeout
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      } else if (scrollingDown && isVisible && !isHovered) {
        // Hide when scrolling down and not hovering
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 1000);
      } else if (!scrollingDown && !isHovered) {
        // Show when scrolling up
        setIsVisible(true);
        // Auto hide after 3 seconds if not hovering
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      }
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isVisible, isHovered, isAtBottom]);

  // Auto-hide on mouse leave (with delay)
  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsVisible(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Hide after 2 seconds when mouse leaves
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (!isAtBottom()) {
        setIsVisible(false);
      }
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={footerRef}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '32px',
        background: 'linear-gradient(90deg, rgba(22, 72, 99, 0.9), rgba(54, 140, 197, 0.9))',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Text style={{ 
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: 300,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontFamily: "'Nunito', sans-serif"
      }}>
        <a 
          href="tel:+251927776614"
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            textDecoration: 'none',
            fontWeight: 300,
            padding: '3px 10px',
            borderRadius: '4px',
            transition: 'all 0.2s',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '0.5px solid rgba(255, 255, 255, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
          }}
        >
          📱 +251 927 776 614
        </a>
        
        <span style={{ 
          opacity: 0.4, 
          fontSize: '10px'
        }}>|</span>
        
        <a 
          href="mailto:kalayumisgna@gmail.com"
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            textDecoration: 'none',
            fontWeight: 300,
            padding: '3px 10px',
            borderRadius: '4px',
            transition: 'all 0.2s',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '0.5px solid rgba(255, 255, 255, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
          }}
        >
          ✉️ kalayumisgna@gmail.com
        </a>
      </Text>
      
      {/* Show/hide indicator */}
      <div 
        style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '2px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
        }}
      />
    </div>
  );
};

export default AutoHideFooter;