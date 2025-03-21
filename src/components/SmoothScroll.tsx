'use client';

import React, { useEffect, useRef, useState } from 'react';
import Scrollbar from 'smooth-scrollbar';

interface SmoothScrollProps {
  children: React.ReactNode;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    // Check if device is mobile or tablet (screen width less than 1024px)
    // This will cover phones, tablets, and some small laptops
    const checkDeviceType = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };

    // Initial check
    checkDeviceType();

    // Add event listener for window resize
    window.addEventListener('resize', checkDeviceType);

    // Initialize scrollbar only if not on mobile or tablet
    if (scrollRef.current && !isMobileOrTablet) {
      const scrollbar = Scrollbar.init(scrollRef.current, {
        damping: 0.1, // Lower value = smoother scrolling
        thumbMinSize: 20,
        renderByPixels: true,
        alwaysShowTracks: false,
        continuousScrolling: true,
      });

      // Clean up scrollbar when component unmounts
      return () => {
        if (scrollbar) {
          scrollbar.destroy();
        }
        window.removeEventListener('resize', checkDeviceType);
      };
    } else {
      // Clean up event listener when component unmounts
      return () => {
        window.removeEventListener('resize', checkDeviceType);
      };
    }
  }, [isMobileOrTablet]);

  return (
    <div ref={scrollRef} className={isMobileOrTablet ? "" : "smooth-scrollbar-container"}>
      {children}
    </div>
  );
};

export default SmoothScroll;
