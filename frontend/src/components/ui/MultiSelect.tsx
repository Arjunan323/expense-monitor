import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check, Building2 } from 'lucide-react';

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

  const selectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(options.map(opt => opt.value));
  };

  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === options.length) return 'All Banks';
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
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-brand-gray-200 rounded-2xl hover:border-brand-green-400 focus:outline-none focus:ring-4 focus:ring-brand-green-200 focus:border-brand-green-400 transition-all duration-300 group"
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-brand-green-100 rounded-xl flex items-center justify-center group-hover:bg-brand-green-200 transition-colors duration-300">
            <Building2 className="w-4 h-4 text-brand-green-600" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-sm font-semibold text-brand-gray-900 truncate">
              {getDisplayText()}
            </div>
            <div className="text-xs text-brand-gray-500">
              {selected.length === 0 ? 'No banks selected' : 
               selected.length === options.length ? 'All banks' :
               `${selected.length} of ${options.length} banks`}
            </div>
          </div>
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className="text-brand-gray-400 hover:text-brand-gray-600 p-1 rounded-lg hover:bg-brand-gray-100 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-brand-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected Banks Pills */}
      {selected.length > 0 && selected.length < options.length && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selected.slice(0, 3).map(value => {
            const option = options.find(opt => opt.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-green-100 text-brand-green-800 border border-brand-green-200"
              >
                <Building2 className="w-3 h-3 mr-1" />
                {option?.label || value}
                <button
                  onClick={(e) => removeOption(value, e)}
                  className="ml-2 text-brand-green-600 hover:text-brand-green-800 transition-colors duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {selected.length > 3 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-gray-100 text-brand-gray-600">
              +{selected.length - 3} more
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-brand-gray-200 rounded-3xl shadow-funky-lg z-50 max-h-80 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="p-4 border-b border-brand-gray-100 bg-brand-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-brand-gray-900">Select Banks</h4>
                  <p className="text-xs text-brand-gray-500">Choose which banks to include</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAll}
                    className="text-xs font-medium text-brand-green-600 hover:text-brand-green-700 px-2 py-1 rounded-lg hover:bg-brand-green-50 transition-colors duration-200"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs font-medium text-brand-gray-600 hover:text-brand-gray-700 px-2 py-1 rounded-lg hover:bg-brand-gray-100 transition-colors duration-200"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="max-h-60 overflow-y-auto">
              {options.length === 0 ? (
                <div className="px-4 py-8 text-center text-brand-gray-500">
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-brand-gray-300" />
                  <p className="text-sm">No banks available</p>
                </div>
              ) : (
                options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-green-50 transition-colors duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                        selected.includes(option.value)
                          ? 'bg-brand-green-500 border-brand-green-500'
                          : 'border-brand-gray-300 group-hover:border-brand-green-400'
                      }`}>
                        {selected.includes(option.value) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-brand-gray-900">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-brand-gray-500 ml-2">({option.count} transactions)</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-brand-gray-100 bg-brand-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-gray-600">
                  {selected.length} of {options.length} banks selected
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-green text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-glow-green hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};