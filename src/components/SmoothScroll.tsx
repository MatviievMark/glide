'use client';

import React, { useEffect, useRef, useState } from 'react';
import Scrollbar from 'smooth-scrollbar';

interface SmoothScrollProps {
  children: React.ReactNode;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [hasTouchScreen, setHasTouchScreen] = useState(false);

  useEffect(() => {
    // Check if device has a touchscreen
    const checkTouchScreen = () => {
      // Check for touch capability using different methods for better browser compatibility
      const isTouchDevice = (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        // @ts-expect-error - For older browsers
        (navigator.msMaxTouchPoints > 0)
      );
      setHasTouchScreen(isTouchDevice);
    };

    // Check if device is mobile or tablet (screen width less than 1024px)
    // This will cover phones, tablets, and some small laptops
    const checkDeviceType = () => {
      setIsMobileOrTablet(window.innerWidth < 1024);
    };

    // Initial checks
    checkDeviceType();
    checkTouchScreen();

    // Add event listener for window resize
    window.addEventListener('resize', checkDeviceType);

    // Determine if we should use smooth scrollbar
    // Don't use it on mobile/tablet devices OR on any device with a touchscreen
    const shouldUseNativeScroll = isMobileOrTablet || hasTouchScreen;

    // Initialize scrollbar only if not on mobile/tablet and doesn't have a touchscreen
    if (scrollRef.current && !shouldUseNativeScroll) {
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
  }, [isMobileOrTablet, hasTouchScreen]);

  // Determine if we should use the smooth-scrollbar-container class
  const shouldUseNativeScroll = isMobileOrTablet || hasTouchScreen;

  return (
    <div ref={scrollRef} className={shouldUseNativeScroll ? "" : "smooth-scrollbar-container"}>
      {children}
    </div>
  );
};

export default SmoothScroll;
