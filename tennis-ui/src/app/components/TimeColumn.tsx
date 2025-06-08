import React from 'react';

type TimeColumnProps = {
  time: string;
};

const TimeColumn: React.FC<TimeColumnProps> = ({ time }) => {
  // Convert "Book at XX:00 - YY:00" to "XX - YY"
  const timeRange = time
    .replace('Book at ', '')
    .replace(':00', '')
    .replace(' - ', ' - ')
    .split(' - ')
    .map(t => t.padStart(2, '0'))
    .join(' - ');

  return (
    <td className="sticky left-0 z-20 p-2 sm:p-3 lg:p-4">
      <div className="bg-brand-background1 rounded-lg p-2 sm:p-3 shadow-sm">
        <span className="font-medium text-sm sm:text-base text-gray-700 whitespace-nowrap">
          {timeRange}
        </span>
      </div>
    </td>
  );
};

export default TimeColumn; 