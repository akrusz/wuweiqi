import { useState } from 'react';

// Yin-Yang piece component
// Orientation: 0=North, 1=East, 2=South, 3=West (where the white/yang "eye" points)

const YinYangPiece = ({
  orientation = 0,
  rotationDegrees = null, // Optional: use this for smooth continuous rotation
  size = 40,
  onClick,
  onRotate,
  interactive = false,
  placed = false,
  result = null, // 'valid', 'invalid', or null
  className = '',
}) => {
  // Use rotationDegrees if provided (for continuous rotation), otherwise compute from orientation
  const rotation = rotationDegrees !== null ? rotationDegrees : orientation * 90;

  // Animation for valid/invalid feedback
  const getResultStyle = () => {
    if (result === 'invalid') {
      return {
        animation: 'shake 0.5s ease-in-out',
        opacity: 0.5,
      };
    }
    if (result === 'valid') {
      return {
        animation: 'pulse 0.3s ease-in-out',
      };
    }
    return {};
  };

  return (
    <div
      className={`yin-yang-piece ${className} ${interactive ? 'interactive' : ''} ${placed ? 'placed' : ''}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.2s ease',
        cursor: interactive ? 'pointer' : 'default',
        ...getResultStyle(),
      }}
      onClick={onClick}
      onContextMenu={(e) => {
        if (onRotate) {
          e.preventDefault();
          onRotate();
        }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
      >
        {/* Outer circle with border */}
        <circle cx="50" cy="50" r="48" fill="#1a1a1a" stroke="#333" strokeWidth="2" />

        {/* White (yang) semicircle - right half of outer circle */}
        <path
          d="M 50 2 A 48 48 0 0 1 50 98"
          fill="#f5f5f0"
        />

        {/* White small circle at bottom (white's "head" bulging left) */}
        <circle cx="50" cy="74" r="24" fill="#f5f5f0" />

        {/* Black small circle at top (black's "head" bulging right) */}
        <circle cx="50" cy="26" r="24" fill="#1a1a1a" />

        {/* White dot in black section (top) */}
        <circle cx="50" cy="26" r="8" fill="#f5f5f0" />

        {/* Black dot in white section (bottom) */}
        <circle cx="50" cy="74" r="8" fill="#1a1a1a" />
      </svg>

      {/* Result indicator */}
      {result && (
        <div className={`result-indicator ${result}`}>
          {result === 'valid' ? '○' : '✕'}
        </div>
      )}
    </div>
  );
};

// Preview piece for placement (shows stones remaining)
export const PlacementPreview = ({ stonesRemaining }) => {
  return (
    <div className="placement-preview">
      <div className="preview-info">
        <span className="stones-remaining">{stonesRemaining} stones</span>
      </div>
    </div>
  );
};

export default YinYangPiece;
