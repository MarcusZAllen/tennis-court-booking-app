import React from 'react';

type CalendarHeaderProps = {
  dates: string[];
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ dates }) => {
  return (
    <thead>
      <tr>
        <th className="sticky left-0 z-20 p-6 w-24 bg-white text-lg font-bold text-gray-800 text-center">Hour</th>
        {dates.map(date => {
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
          const dayDate = dateObj.getDate();
          const daySuffix = (d => (d > 3 && d < 21) || d % 10 > 3 ? 'th' : ['th', 'st', 'nd', 'rd'][d % 10])(dayDate);
          return (
            <th 
              key={date} 
              className="p-4 min-w-[120px] text-center"
            >
              <div className="font-bold text-base text-gray-900">
                {dayName}, {dayDate}{daySuffix}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default CalendarHeader; 