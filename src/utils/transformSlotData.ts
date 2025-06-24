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
    if (!slot.date || typeof slot.startMinutes !== 'number') return;

    if (!transformed[slot.date]) {
      transformed[slot.date] = {};
    }

    if (!transformed[slot.date][slot.startMinutes]) {
      transformed[slot.date][slot.startMinutes] = {
        totalCourts: 0,
        slots: []
      };
    }

    // Add the slot to the array
    transformed[slot.date][slot.startMinutes].slots.push({
      provider: slot.provider,
      location: slot.location,
      bookingUrl: slot.bookingUrl,
      cost: slot.cost,
      sessionId: slot.sessionId,
      slotKey: slot.slotKey
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