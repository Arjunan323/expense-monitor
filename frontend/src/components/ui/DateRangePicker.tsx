import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

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
  };

  const handleEndDateChange = (date: string) => {
    setTempEnd(date);
  };

  const clearDates = () => {
    setTempStart('');
    setTempEnd('');
    if (onDateChange) onDateChange('', '');
  };

  const formatDateForDisplay = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">
          {startDate && endDate 
            ? `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`
            : 'Select date range'
          }
        </span>
        {(startDate || endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearDates();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 min-w-[300px]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={tempStart}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={clearDates}
                className="btn-secondary text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (onApply) onApply(tempStart, tempEnd);
                  setIsOpen(false);
                }}
                className="btn-primary text-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};