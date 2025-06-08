// Main Calendar Table Component
import React from 'react';
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';

type CalendarTableProps = {
  calendar: Record<string, Record<string, number>>;
  dates: string[];
  times: string[];
};

const CalendarTable: React.FC<CalendarTableProps> = ({ calendar, dates, times }) => {
  return (
    <div className="relative bg-white rounded-xl shadow-lg">
      <div className="p-6">
        <table className="w-full border-separate border-spacing-0">
          <CalendarHeader dates={dates} />
          <CalendarGrid calendar={calendar} dates={dates} times={times} />
        </table>
      </div>
    </div>
  );
};

export default CalendarTable;