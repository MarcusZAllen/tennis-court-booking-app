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
    <div className="overflow-x-auto rounded-md border border-black shadow-lg bg-white">
      <table className="min-w-full text-sm text-center border-collapse">
        <CalendarHeader dates={dates} />
        <CalendarGrid calendar={calendar} dates={dates} times={times} />
      </table>
    </div>
  );
};

export default CalendarTable;