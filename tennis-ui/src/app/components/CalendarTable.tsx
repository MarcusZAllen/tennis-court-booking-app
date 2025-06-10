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
    <div className="relative bg-white rounded-3xl shadow-lg border-4 border-black">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <CalendarHeader dates={dates} />
          <CalendarGrid calendar={calendar} dates={dates} times={times} />
        </table>
      </div>
    </div>
  );
};

export default CalendarTable;