import React from 'react';

type CalendarCellProps = {
  count: number;
};

const CalendarCell: React.FC<CalendarCellProps> = ({ count }) => {
  return (
    <td className="p-4">
      <div 
        className={`
          flex items-center justify-center
          aspect-square w-full
          rounded-lg p-4
          shadow-sm transition-all duration-200
          ${count > 0 
            ? 'bg-brand-background2 text-brand-primary font-semibold hover:bg-brand-background2/80 hover:shadow-md cursor-pointer' 
            : 'bg-gray-100 text-gray-400'
          }
        `}
      >
        <span className="text-lg">{count}</span>
      </div>
    </td>
  );
};

export default CalendarCell; 