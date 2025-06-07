import React from 'react';

type TimeColumnProps = {
  time: string;
};

const TimeColumn: React.FC<TimeColumnProps> = ({ time }) => {
  return (
    <td className="border border-black px-3 py-2 font-medium text-left bg-brand-background1">
      {time}
    </td>
  );
};

export default TimeColumn; 