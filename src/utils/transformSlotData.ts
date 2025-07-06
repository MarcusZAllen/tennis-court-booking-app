export type TransformedData = {
  [date: string]: {
    [timeInMinutes: number]: {
      totalCourts: number;
      slots: Array<{
        provider: string;
        location: string;
        bookingUrl: string;
        cost: string;
        sessionId: string;
        slotKey: string;
      }>;
    };
  };
};

export function transformSlotData(data: any[]): TransformedData {
  const transformed: TransformedData = {};

  // Group slots by date and time
  data.forEach(slot => {
    // Handle both camelCase (JSON files) and snake_case (database) property names
    const date = slot.date || slot.date;
    const startMinutes = slot.startMinutes || slot.start_minutes;
    const provider = slot.provider;
    const location = slot.location;
    const bookingUrl = slot.bookingUrl || slot.booking_url;
    const cost = slot.cost;
    const sessionId = slot.sessionId || slot.session_id;
    const slotKey = slot.slotKey || slot.slot_key;

    if (!date || typeof startMinutes !== 'number') return;

    if (!transformed[date]) {
      transformed[date] = {};
    }

    if (!transformed[date][startMinutes]) {
      transformed[date][startMinutes] = {
        totalCourts: 0,
        slots: []
      };
    }

    // Add the slot to the array
    transformed[date][startMinutes].slots.push({
      provider,
      location,
      bookingUrl,
      cost,
      sessionId,
      slotKey
    });
  });

  // After adding all slots, count unique courts for each time slot
  Object.keys(transformed).forEach(date => {
    Object.keys(transformed[date]).forEach(timeInMinutes => {
      const timeSlot = transformed[date][parseInt(timeInMinutes)];
      const uniqueSlotKeys = new Set(timeSlot.slots.map(slot => slot.slotKey));
      timeSlot.totalCourts = uniqueSlotKeys.size;
    });
  });

  return transformed;
} 