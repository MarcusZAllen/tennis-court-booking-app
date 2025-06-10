import React from 'react';

type TimeColumnProps = {
  time: string;
};

const TimeColumn: React.FC<TimeColumnProps> = ({ time }) => {
  // Convert "Book at XX:00 - YY:00" to "X - Y" format
  const timeRange = time
    .replace('Book at ', '')
    .replace(':00', '')
    .split(' - ')
    .map(t => parseInt(t).toString()) // Remove leading zeros
    .join(' - ');

  return (
    <td className="sticky left-0 z-20 p-6 w-24 bg-white">
      <div className="rounded-lg flex items-center justify-center h-full">
        <span className="font-bold text-lg text-gray-800 whitespace-nowrap">
          {timeRange}
        </span>
      </div>
    </td>
  );
};

export default TimeColumn; 