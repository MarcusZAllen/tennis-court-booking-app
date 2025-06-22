import { transformSlotData } from '@/utils/transformSlotData';
import slotData from '@/data/multi-date-output.json';

export function useCalendarData() {
  const calendarData = transformSlotData(slotData);
  return { calendarData };
}