import React from 'react';

type CalendarCellProps = {
  count: number;
};

const CalendarCell: React.FC<CalendarCellProps> = ({ count }) => {
  return (
    <td className="p-4 border-b border-gray-200">
      <div 
        className={`
          flex items-center justify-center
          rounded-lg p-2 transition-colors
          ${count > 0 
            ? 'bg-brand-background2 text-brand-primary font-semibold hover:bg-brand-background2/80 cursor-pointer' 
            : 'bg-gray-50 text-gray-400'
          }
        `}
      >
        {count}
      </div>
    </td>
  );
};

export default CalendarCell; 