import React from 'react';

type CalendarHeaderProps = {
  dates: string[];
};

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ dates }) => {
  return (
    <thead>
      <tr>
        <th className="sticky left-0 z-20 p-2 sm:p-3 lg:p-4 w-24 sm:w-32">
          <div className="bg-brand-background1 rounded-lg p-2 sm:p-3 shadow-sm">
            <span className="font-medium text-sm sm:text-base text-gray-700">
              Time
            </span>
          </div>
        </th>
        {dates.map(date => {
          const dateObj = new Date(date);
          const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
          const dayDate = dateObj.getDate();
          
          return (
            <th 
              key={date} 
              className="p-2 sm:p-3 lg:p-4 min-w-[100px] sm:min-w-[120px]"
            >
              <div className="bg-brand-background1 rounded-lg p-2 sm:p-3 shadow-sm">
                <div className="font-semibold text-sm sm:text-base">{dayName}</div>
                <div className="text-xs sm:text-sm text-gray-600">{dayDate}</div>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
};

export default CalendarHeader; 