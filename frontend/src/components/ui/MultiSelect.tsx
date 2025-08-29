import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  title: string;
  desc: string;
  deferCommit?: boolean; // if true, only call onChange when user clicks Done
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  className = '',
  title,
  desc,
  deferCommit = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  // Track when we programmatically closed so the underlying toggle button doesn't immediately re-open via click-through
  const lastClosedRef = useRef<number>(0);
  // temp selection when deferring commits
  const [tempSelected, setTempSelected] = useState<string[]>(selected);

  // Sync temp with committed when selection changes externally and dropdown closed
  useEffect(()=>{ if(!isOpen) setTempSelected(selected); }, [selected, isOpen]);

  const closeDropdown = () => {
    if (!isOpen) return;
    lastClosedRef.current = Date.now();
    setIsClosing(true);
    setIsOpen(false);
    // allow any stray click/pointerup events to finish before re-enabling
    setTimeout(() => setIsClosing(false), 250);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return; // click on trigger region
      if (popupRef.current?.contains(target)) return; // click inside popup -> ignore
      // otherwise close
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const working = deferCommit ? tempSelected : selected;

  const toggleOption = (value: string) => {
    if(deferCommit){
      setTempSelected(prev => prev.includes(value) ? prev.filter(v=>v!==value) : [...prev, value]);
    } else {
      if (selected.includes(value)) {
        onChange(selected.filter(item => item !== value));
      } else {
        onChange([...selected, value]);
      }
    }
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(deferCommit){
      setTempSelected(prev => prev.filter(v=>v!==value));
    } else {
      onChange(selected.filter(item => item !== value));
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(deferCommit){ setTempSelected([]); } else { onChange([]); }
  };

  const selectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    const all = options.map(opt => opt.value);
    if(deferCommit){ setTempSelected(all); } else { onChange(all); }
  };

  const getDisplayText = () => {
    const base = selected; // show committed selection in collapsed state
    if (base.length === 0) return placeholder;
    if (base.length === options.length) return 'All Banks';
    if (base.length === 1) {
      const option = options.find(opt => opt.value === base[0]);
      return option?.label || base[0];
    }
    return `${base.length} selected`;
  };

  return (
  <div ref={containerRef} className={`relative ${className}`} style={isClosing ? { pointerEvents: 'none' } : undefined}>
      <button
        onClick={(e) => {
          // If we just closed within 300ms (e.g. clicking Done), ignore the bubbled click
      if (isClosing || Date.now() - lastClosedRef.current < 300) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setIsOpen(o => !o);
        }}
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
              {working.length === 0 ? 'No banks selected' : 
               working.length === options.length ? 'All banks' :
               `${working.length} of ${options.length} banks`}
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

    {isOpen && createPortal(
      (() => {
        const rect = containerRef.current?.getBoundingClientRect();
        const width = rect?.width || 320;
        const gap = 8;
        const desiredLeft = rect?.left || 0;
        const maxLeft = window.innerWidth - width - 16;
        const style: React.CSSProperties = {
          top: (rect?.bottom || 0) + gap,
          left: Math.min(desiredLeft, maxLeft),
          width,
          position: 'fixed'
        };
        return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]" 
          onClick={() => closeDropdown()} 
        />
        {/* Popup positioned relative to trigger */}
    <div ref={popupRef} className="z-[999]" style={style}>
      <div className="bg-white border-2 border-brand-gray-200 rounded-3xl shadow-funky-lg max-h-[480px] overflow-hidden animate-slide-up w-max">
            {/* Header */}
            <div className="p-4 border-b border-brand-gray-100 bg-brand-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-brand-gray-900">{title}</h4>
                  <p className="text-xs text-brand-gray-500">{desc}</p>
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
      working.includes(option.value)
                          ? 'bg-brand-green-500 border-brand-green-500'
                          : 'border-brand-gray-300 group-hover:border-brand-green-400'
                      }`}>
      {working.includes(option.value) && (
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
            <div className="p-4 border-t border-brand-gray-100 bg-brand-gray-50 rounded-b-3xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-brand-gray-600">
                  {working.length} of {options.length} banks selected
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); if(deferCommit){ onChange(working); } closeDropdown(); }}
                  className="bg-gradient-green text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-glow-green hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </>);
      })(), document.body)
      }
    </div>
  );
};