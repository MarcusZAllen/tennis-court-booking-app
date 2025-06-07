'use client';

import { useEffect, useState } from 'react';
import CalendarTable from './components/CalendarTable';

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
          return `Book at ${hourStr}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`;
        });

        setDates(next7);
        setTimes(fixedTimes);

        // Initialize the tempMap structure
        for (const time of fixedTimes) {
          tempMap[time] = {};
          for (const date of next7) {
            tempMap[time][date] = new Set<string>();
          }
        }

        // Populate the tempMap with unique locations
        for (const loc of locations) {
          for (const slot of loc.slots) {
            const { date, readableTime, location } = slot;
            if (!next7.includes(date)) continue;
            
            if (tempMap[readableTime]?.[date]) {
              tempMap[readableTime][date].add(location);
            }
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
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching location data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-6 max-w-6xl mx-auto bg-[rgba(252,244,237,1)] min-h-screen">
      <h1 className="text-3xl font-bold text-[rgb(124,180,107)] mb-6">7-Day Tennis Court Availability</h1>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <CalendarTable calendar={calendar} dates={dates} times={times} />
      )}
    </main>
  );
}