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
    <div className="w-full max-w-6xl mx-auto px-4">
      <h1 className="text-2xl font-semibold text-brand-primary text-center mb-8">
        7-Day Tennis Court Availability
      </h1>
      <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
        <table className="min-w-full border-separate border-spacing-0">
          <CalendarHeader dates={dates} />
          <CalendarGrid calendar={calendar} dates={dates} times={times} />
        </table>
      </div>
    </div>
  );
};

export default CalendarTable;