'use client';

import { useEffect, useState } from 'react';

type Slot = {
  date: string;
  readableTime: string;
  location: string;
};

type LocationData = {
  location: string;
  slots: Slot[];
};

export default function Home() {
  const [calendar, setCalendar] = useState<Record<string, Record<string, number>>>({});
  const [dates, setDates] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/locations.json')
      .then(res => res.json())
      .then((locations: LocationData[]) => {
        const tempMap: Record<string, Record<string, Set<string>>> = {};

        const today = new Date();
        const next7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          return d.toISOString().split('T')[0];
        });

        const fixedTimes = Array.from({ length: 15 }, (_, i) => {
          const hour = i + 7;
          const hourStr = hour.toString().padStart(2, '0');
          return `Book at ${hourStr}:00 - ${hourStr === '21' ? '22' : (hour + 1).toString().padStart(2, '0')}:00`;
        });

        setDates(next7);

        for (const loc of locations) {
          for (const slot of loc.slots) {
            const { date, readableTime } = slot;
            if (!next7.includes(date)) continue;

            if (!tempMap[readableTime]) tempMap[readableTime] = {};
            if (!tempMap[readableTime][date]) tempMap[readableTime][date] = new Set();

            tempMap[readableTime][date].add(loc.location);
          }
        }

        // Convert Sets to counts
        const result: Record<string, Record<string, number>> = {};
        for (const [time, dateMap] of Object.entries(tempMap)) {
          result[time] = {};
          for (const [date, locations] of Object.entries(dateMap)) {
            result[time][date] = locations.size;
          }
        }

        setCalendar(result);
        setTimes(fixedTimes);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">7-Day Tennis Court Availability</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left bg-gray-100">Time</th>
                {dates.map(date => (
                  <th key={date} className="p-2 bg-gray-100 text-center">
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map(time => {
                const counts = calendar[time] || {};
                return (
                  <tr key={time} className="border-t">
                    <td className="p-2 font-medium">{time.replace('Book at ', '')}</td>
                    {dates.map(date => (
                      <td key={date} className="p-2 text-center">
                        {counts[date] ?? 0}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}