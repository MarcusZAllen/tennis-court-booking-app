import React from 'react';

type CalendarCellProps = {
  count: number;
};

const CalendarCell: React.FC<CalendarCellProps> = ({ count }) => {
  return (
    <td className="p-2 sm:p-3 lg:p-4">
      <div 
        className={`
          flex items-center justify-center
          rounded-lg p-2 sm:p-3
          shadow-sm transition-all duration-200
          ${count > 0 
            ? 'bg-brand-background2 text-brand-primary font-semibold hover:bg-brand-background2/80 hover:shadow-md cursor-pointer' 
            : 'bg-gray-50 text-gray-400'
          }
        `}
      >
        <span className="min-w-[24px] text-center">{count}</span>
      </div>
    </td>
  );
};

export default CalendarCell; 