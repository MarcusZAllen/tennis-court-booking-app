export interface Slot {
  provider: 'clubspark' | 'parksports';
  location: string;
  bookingUrl: string;
  date: string;
  readableTime: string;
  cost: string;
  startMinutes: number;
  endMinutes: number;
  sessionId: string;
  slotKey: string;
}

export interface Location {
  name: string;
  url: string;
}

export interface LocationData {
  location: string;
  provider: string | null;
  slots: Slot[];
}

export interface ScrapingStats {
  totalTasks: number;
  successful: number;
  failed: number;
  totalSlots: number;
  errors: string[];
}

export interface ScrapingResult {
  success: boolean;
  slots: Slot[];
  location: string;
  date: string;
  error?: string;
}

export interface TransformedSlot {
  provider: string;
  location: string;
  bookingUrl: string;
  cost: string;
  sessionId: string;
  slotKey: string;
}

export interface TimeSlot {
  totalCourts: number;
  slots: TransformedSlot[];
}

export interface CalendarData {
  [date: string]: {
    [timeInMinutes: number]: TimeSlot;
  };
} 