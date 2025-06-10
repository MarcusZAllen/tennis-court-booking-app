import React from 'react';

type CalendarCellProps = {
  count: number;
};

const CalendarCell: React.FC<CalendarCellProps> = ({ count }) => {
  const available = count > 0;
  return (
    <td className="p-2">
      <div 
        className={`
          flex flex-col items-center justify-center
          aspect-square min-w-[100px] min-h-[100px] md:min-w-[120px] md:min-h-[120px]
          rounded-lg
          shadow-sm transition-all duration-200
          ${available 
            ? 'bg-white text-gray-900 font-bold hover:bg-gray-100 hover:shadow-md cursor-pointer' 
            : 'bg-gray-100 text-gray-400'
          }
        `}
      >
        <span className="text-2xl font-bold leading-tight">{count}</span>
        <span className="text-xs font-medium mt-1">courts</span>
      </div>
    </td>
  );
};

export default CalendarCell; 