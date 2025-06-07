import React from 'react';
import CalendarCell from './CalendarCell';
import TimeColumn from './TimeColumn';

type CalendarGridProps = {
  calendar: Record<string, Record<string, number>>;
  dates: string[];
  times: string[];
};

const CalendarGrid: React.FC<CalendarGridProps> = ({ calendar, dates, times }) => {
  return (
    <tbody>
      {times.map(time => (
        <tr key={time}>
          <TimeColumn time={time} />
          {dates.map(date => (
            <CalendarCell
              key={`${time}-${date}`}
              count={calendar[time]?.[date] ?? 0}
            />
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default CalendarGrid; 