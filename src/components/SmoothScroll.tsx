'use client';

import React, { useEffect, useRef, useState } from 'react';
import Scrollbar from 'smooth-scrollbar';

interface SmoothScrollProps {
  children: React.ReactNode;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile (screen width less than 768px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Initialize scrollbar only if not on mobile
    if (scrollRef.current && !isMobile) {
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
        window.removeEventListener('resize', checkMobile);
      };
    } else {
      // Clean up event listener when component unmounts
      return () => {
        window.removeEventListener('resize', checkMobile);
      };
    }
  }, [isMobile]);

  return (
    <div ref={scrollRef} className={isMobile ? "" : "smooth-scrollbar-container"}>
      {children}
    </div>
  );
};

export default SmoothScroll;
