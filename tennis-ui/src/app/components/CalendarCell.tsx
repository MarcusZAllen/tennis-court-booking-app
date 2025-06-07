import React from 'react';

type CalendarCellProps = {
  count: number;
  isHeader?: boolean;
};

const CalendarCell: React.FC<CalendarCellProps> = ({ count, isHeader = false }) => {
  return (
    <td
      className={`
        border border-black px-3 py-2
        ${isHeader ? 'bg-brand-background1 font-semibold' : 'bg-brand-background2'}
        ${count > 0 ? 'text-brand-primary' : 'text-gray-400'}
      `}
    >
      {count}
    </td>
  );
};

export default CalendarCell; 