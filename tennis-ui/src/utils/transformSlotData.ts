export type TransformedData = {
  [date: string]: {
    [timeInMinutes: number]: {
      totalCourts: number;
    };
  };
};

export function transformSlotData(data: any): TransformedData {
  // Transform the slot data into calendar format
  return data;
} 