// utils/transformSlotData.ts

export type RawSlot = {
  provider: string;
  location: string;
  bookingUrl: string;
  date: string; // "2025-06-11"
  readableTime: string;
  cost: string;
  startMinutes: number;
  endMinutes: number;
  sessionId: string;
  slotKey: string;
};

export type CalendarSlot = {
  totalCourts: number;
  locations: Array<{
    location: string;
    bookingUrl: string;
    cost: string;
    provider: string;
  }>;
};

export type TransformedData = {
  [date: string]: {
    [startMinutes: number]: CalendarSlot;
  };
};

export function transformSlotData(slots: RawSlot[]): TransformedData {
  const calendarMap: TransformedData = {};

  for (const slot of slots) {
    const { date, startMinutes, location, bookingUrl, cost, provider } = slot;

    if (!calendarMap[date]) {
      calendarMap[date] = {};
    }

    if (!calendarMap[date][startMinutes]) {
      calendarMap[date][startMinutes] = {
        totalCourts: 0,
        locations: []
      };
    }

    calendarMap[date][startMinutes].totalCourts += 1;
    calendarMap[date][startMinutes].locations.push({
      location,
      bookingUrl,
      cost,
      provider,
    });
  }

  return calendarMap;
}