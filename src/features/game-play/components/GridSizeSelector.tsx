'use client';

import React from 'react';

export interface GridSizeSelectorFormProps {
  value: 'small' | 'medium' | 'large';
  onChange: (value: 'small' | 'medium' | 'large') => void;
  disabled?: boolean;
  className?: string;
}

export const GridSizeSelector: React.FC<GridSizeSelectorFormProps> = ({ 
  value, 
  onChange, 
  disabled = false,
  className = ''
}) => {
  const gridSizes: Array<{ value: 'small' | 'medium' | 'large'; label: string; description: string }> = [
    { value: 'small', label: '4×4', description: 'Small grid - easier, faster games' },
    { value: 'medium', label: '6×6', description: 'Medium grid - balanced challenge' },
    { value: 'large', label: '8×8', description: 'Large grid - maximum challenge' }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <label id="grid-size-label" className="form-label">
        Grid Size
      </label>
      <div 
        role="radiogroup"
        aria-labelledby="grid-size-label"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {gridSizes.map(({ value: sizeValue, label, description }) => (
          <button
            key={sizeValue}
            type="button"
            onClick={() => value !== sizeValue && onChange(sizeValue)}
            disabled={disabled}
            role="radio"
            aria-checked={value === sizeValue}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200 text-left text-sm
              ${value === sizeValue
                ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            aria-describedby={`${sizeValue}-description`}
          >
            <div className="font-semibold text-base mb-1">{label}</div>
            <div 
              id={`${sizeValue}-description`}
              className="text-xs opacity-75"
            >
              {description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

