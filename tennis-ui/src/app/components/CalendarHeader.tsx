import React from 'react';

type CalendarHeaderProps = {
  dates: string[];
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ dates }) => {
  return (
    <thead>
      <tr>
        <th className="sticky left-0 z-10 bg-brand-background1 p-4 border-b-2 border-gray-200 w-24">
          Time
        </th>
        {dates.map(date => {
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
          const dayDate = dateObj.getDate();
          
          return (
            <th 
              key={date} 
              className="p-4 border-b-2 border-gray-200 bg-brand-background1 min-w-[120px]"
            >
              <div className="font-semibold">{dayName}</div>
              <div className="text-sm text-gray-600">{dayDate}</div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default CalendarHeader; 