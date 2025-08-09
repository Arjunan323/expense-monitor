import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const option = options.find(opt => opt.value === selected[0]);
      return option?.label || selected[0];
    }
    return `${selected.length} selected`;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-left"
      >
        <div className="flex items-center space-x-1 flex-1 min-w-0">
          <span className="text-sm text-gray-700 truncate">
            {getDisplayText()}
          </span>
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className="text-gray-400 hover:text-gray-600 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {selected.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.slice(0, 3).map(value => {
            const option = options.find(opt => opt.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800"
              >
                {option?.label || value}
                <button
                  onClick={(e) => removeOption(value, e)}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {selected.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
              +{selected.length - 3} more
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            options.map(option => (
              <button
                key={option.value}
                onClick={() => toggleOption(option.value)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-500">({option.count})</span>
                  )}
                </div>
                {selected.includes(option.value) && (
                  <Check className="w-4 h-4 text-primary-600" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};