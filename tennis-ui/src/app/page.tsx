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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/data/locations')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch locations');
        return res.json();
      })
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
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen w-full bg-brand-background2 flex items-center justify-center">
        <div className="w-full max-w-6xl p-6">
          <h1 className="text-2xl font-semibold text-center mb-8">
            Tennis Court Availability
          </h1>
          <p className="text-red-600 text-center">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-brand-background2 flex items-center justify-center">
      <div className="w-full max-w-6xl p-6">
        <h1 className="text-2xl font-semibold text-center mb-8">
          Tennis Court Availability
        </h1>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-gray-600">Loading...</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <CalendarTable calendar={calendar} dates={dates} times={times} />
          </div>
        )}
      </div>
    </div>
  );
}