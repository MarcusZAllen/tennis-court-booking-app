import React from 'react';

type CalendarHeaderProps = {
  dates: string[];
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ dates }) => {
  return (
    <thead className="bg-brand-background1 text-black">
      <tr>
        <th className="border border-black p-2">Time</th>
        {dates.map(date => (
          <th key={date} className="border border-black p-2">
            {new Date(date).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default CalendarHeader; 