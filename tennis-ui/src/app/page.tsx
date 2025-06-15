'use client';

import WeeklyCalendar from '../components/WeeklyCalendar';

export default function Home() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-brand-background2 px-4">
      <div className="max-w-[1200px] max-h-[90vh] w-full h-full overflow-auto p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-xl font-medium text-center mb-6">
          Tennis Court Availability
        </h1>
        <WeeklyCalendar />
      </div>
    </div>
  );
}