'use client';

import React, { useEffect, useRef } from 'react';
import Scrollbar from 'smooth-scrollbar';

interface SmoothScrollProps {
  children: React.ReactNode;
}

const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
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
      };
    }
  }, []);

  return (
    <div ref={scrollRef} className="smooth-scrollbar-container">
      {children}
    </div>
  );
};

export default SmoothScroll;
