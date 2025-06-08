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
    <td className="sticky left-0 z-10 bg-brand-background1 p-4 border-b border-gray-200 font-medium text-left whitespace-nowrap">
      {timeRange}
    </td>
  );
};

export default TimeColumn; 