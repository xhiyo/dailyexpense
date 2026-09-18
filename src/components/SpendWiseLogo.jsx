import React from 'react';

/**
 * SpendWise Simple Flat Logo Component
 * Clean, minimalist, human-designed 'S' monogram.
 * Pure vector path with NO background box (transparent background).
 */
export const SpendWiseLogo = ({ size = 34, className = '', color = '#2563EB', strokeWidth = 3.8 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`spendwise-logo-svg ${className}`}
      style={{
        flexShrink: 0,
        display: 'block'
      }}
    >
      {/* Clean Minimalist 'S' Monogram - No background box */}
      <path
        d="M 26.5 14.5 C 26.5 12 23.8 10.5 20 10.5 C 16.2 10.5 13.5 12 13.5 14.5 C 13.5 18.5 26.5 17.5 26.5 23.5 C 26.5 27 23.8 29.5 20 29.5 C 15.8 29.5 13.5 27 13.5 24.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SpendWiseLogo;
