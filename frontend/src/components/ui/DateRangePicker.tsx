import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X, ArrowRight, RotateCcw } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange?: (start: string, end: string) => void;
  onApply?: (start: string, end: string) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateChange,
  onApply,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  // Sync local state with props
  React.useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  const handleStartDateChange = (date: string) => {
    setTempStart(date);
    // Clear end date if it's before the new start date
    if (tempEnd && date && new Date(date) > new Date(tempEnd)) {
      setTempEnd('');
    }
  };

  const handleEndDateChange = (date: string) => {
    setTempEnd(date);
  };

  const clearDates = () => {
    setTempStart('');
    setTempEnd('');
  };

  const applyDates = () => {
    if (onApply) onApply(tempStart, tempEnd);
    setIsOpen(false);
  };

  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getQuickRanges = () => {
    const today = new Date();
    const ranges = [
      {
        label: 'Last 7 days',
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'Last 30 days',
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'Last 3 months',
        start: new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'This year',
        start: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    ];
    return ranges;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-white border-2 border-brand-gray-200 rounded-2xl hover:border-brand-blue-400 focus:outline-none focus:ring-4 focus:ring-brand-blue-200 focus:border-brand-blue-400 transition-all duration-300 group"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-blue-100 rounded-xl flex items-center justify-center group-hover:bg-brand-blue-200 transition-colors duration-300">
            <Calendar className="w-4 h-4 text-brand-blue-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-brand-gray-900">
              {startDate && endDate 
                ? `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`
                : startDate
                ? `From ${formatDateForDisplay(startDate)}`
                : endDate
                ? `Until ${formatDateForDisplay(endDate)}`
                : 'Select date range'
              }
            </div>
            <div className="text-xs text-brand-gray-500">
              {startDate || endDate ? 'Custom range' : 'All time'}
            </div>
          </div>
        </div>
        {(startDate || endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearDates();
              if (onApply) onApply('', '');
            }}
            className="text-brand-gray-400 hover:text-brand-gray-600 p-1 rounded-lg hover:bg-brand-gray-100 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </button>

      {isOpen && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[998]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-[999] flex items-start md:items-center justify-center p-4 md:p-8">
            <div className="bg-white border-2 border-brand-gray-200 rounded-3xl shadow-funky-lg w-[520px] max-w-full animate-slide-up">
              <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-heading font-bold text-brand-gray-900">Select Date Range</h3>
                  <p className="text-sm text-brand-gray-500">Choose your analysis period</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-brand-gray-400 hover:text-brand-gray-600 p-2 rounded-xl hover:bg-brand-gray-100 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Ranges */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-brand-gray-700 mb-3">Quick Select</h4>
                <div className="grid grid-cols-2 gap-2">
                  {getQuickRanges().map((range, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setTempStart(range.start);
                        setTempEnd(range.end);
                      }}
                      className="text-left px-3 py-2 text-sm text-brand-gray-700 hover:bg-brand-blue-50 hover:text-brand-blue-700 rounded-xl transition-colors duration-200 border border-transparent hover:border-brand-blue-200"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-brand-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-brand-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-blue-200 focus:border-brand-blue-400 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    min={tempStart || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={!tempStart}
                    className="w-full px-4 py-3 border-2 border-brand-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-blue-200 focus:border-brand-blue-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!tempStart && (
                    <p className="text-xs text-brand-gray-500 mt-1">Please select start date first</p>
                  )}
                </div>
              </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={clearDates}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-brand-gray-600 hover:text-brand-gray-800 hover:bg-brand-gray-100 rounded-xl transition-colors duration-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-2 text-sm font-semibold text-brand-gray-600 hover:text-brand-gray-800 hover:bg-brand-gray-100 rounded-xl transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyDates}
                      className="bg-gradient-blue text-white px-6 py-2 rounded-xl font-semibold text-sm shadow-glow-blue hover:scale-105 active:scale-95 transition-all duration-300 flex items-center space-x-2"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>, document.body)
      }
    </div>
  );
};