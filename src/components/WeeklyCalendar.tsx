import * as React from "react";
import SlotBookingModal from "./SlotBookingModal";
import type { TransformedData } from "@/utils/transformSlotData";
import { RotateCcw } from "lucide-react";

import { textStyles } from '../../branding/typography';

// Utility to add "st", "nd", "rd", "th" suffix to date
function formatDaySuffix(day: number) {
  if (day >= 11 && day <= 13) return day + "th";
  const last = day % 10;
  if (last === 1) return day + "st";
  if (last === 2) return day + "nd";
  if (last === 3) return day + "rd";
  return day + "th";
}

// Generate dates for the current week (starting from today)
function getCurrentWeek() {
  const today = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

const TIMES = Array.from({ length: 15 }, (_, i) => 7 + i); // 7am to 21 (9pm)

// DEMO AVAILABILITY: return a number (simulate availability 0-10, 0 means unavailable)
// const sampleAvailability = (dayIdx: number, timeIdx: number) => {
//   if ((timeIdx === 5 && dayIdx === 2) || ((dayIdx + timeIdx) % 7 === 0)) return 0;
//   return 8 - ((dayIdx + timeIdx) % 6); // returns 8-3 (some variety, never negative)
// };

type WeeklyCalendarProps = {
  calendarData: TransformedData;
  selectedLocations: string[];
  sportType?: string;
  hoverColor?: string;
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ 
  calendarData, 
  selectedLocations, 
  sportType = 'tennis',
  hoverColor = '#7cb46b'
}) => {
  const weekDates = getCurrentWeek();
  
  // Debug logging
  console.log('Calendar week dates:', weekDates.map(d => d.toDateString()));
  console.log('Available data dates:', Object.keys(calendarData || {}));
  console.log('Selected locations:', selectedLocations);

  // Helper function to filter slots based on location tags
  const filterSlotsByLocation = (slotData: any) => {
    if (!slotData || !slotData.slots) return slotData;
    
    // If "All London" is selected, show all slots
    if (selectedLocations.includes("All London")) {
      return slotData;
    }
    
    // Define location mappings based on our actual location data
    const locationTagMap: { [key: string]: string[] } = {
      // ClubSpark locations
      "Battersea Park": ["West", "South"],
      "Archbishops Park": ["Central"],
      "Holland Park (Kensington)": ["West"],
      "Tanner Street": ["Central", "East"],
      "Kennington Park": ["South", "Central"],
      "Geraldine Mary Harmsworth": ["South", "Central"],
      "Burgess Park": ["South"],
      "Clapham Common": ["South", "West"],
      "Southwark Park": ["East", "Central"],
      "Vauxhall Park": ["South", "Central"],
      "South Park Fulham": ["West"], // This is the problematic one - it's West, not South!
      "Parliament Hill Fields Tennis Courts": ["North"],
      "Queen's Park Tennis Courts": ["North", "West"],
      "Finsbury Park": ["North"],
      "Northway Gardens": ["North"],
      "Dulwich Park": ["South"],
      "Ravenscourt Park": ["West"],
      "Hurlingham Park": ["West"],
      "Eel Brook Common": ["South"],
      "Belair Park": ["South"],
      "Brunswick Park": ["South", "Central"],
      "Clissold Park": ["North", "East"],
      "Larkhall Park": ["South"],
      "Avondale Park": ["West"],
      "Kensington Memorial Park": ["West"],
      
      // ParkSports locations
      "Regents Park": ["Central", "North"],
      "Hyde Park": ["Central", "West"],
      
      // Better.org.uk locations
      "Highbury Fields": ["North"],
      "Rosemary Gardens": ["North", "East"],
      "Tufnell Park": ["North"],
      
      // Matchi locations
      "Tower Hill Terrace": ["South", "Central"]
    };
    
    // Filter slots based on location tags
    const filteredSlots = slotData.slots.filter((slot: any) => {
      const locationName = slot.location;
      const locationTags = locationTagMap[locationName] || [];
      
      // Check if any of the selected location tags match the location's tags
      return selectedLocations.some(selectedTag => 
        locationTags.includes(selectedTag)
      );
    });
    
    return {
      ...slotData,
      slots: filteredSlots,
      totalCourts: filteredSlots.length
    };
  };
  
  const [selectedSlot, setSelectedSlot] = React.useState<{
    day: number;
    time: number;
    dateStr: string;
    timeInMinutes: number;
    slotData: any;
  } | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [scraping, setScraping] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [hoveredCell, setHoveredCell] = React.useState<{col: number, row: number} | null>(null);

  // Animation for completion
  React.useEffect(() => {
    if (done) {
      const timeout = setTimeout(() => setDone(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [done]);

  const handleReplay = async () => {
    if (scraping) return;
    setScraping(true);
    setDone(false);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (res.ok) {
        setDone(true);
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setScraping(false);
    }
  };

  // On slot click: open modal with date and time details
  const handleSlotClick = (colIdx: number, rowIdx: number, dateStr: string, timeInMinutes: number, slotData: any) => {
    setSelectedSlot({ 
      day: colIdx, 
      time: rowIdx, 
      dateStr, 
      timeInMinutes, 
      slotData 
    });
    setModalOpen(true);
  };

  // Format selected slot info for modal
  let selectedDateStr = "";
  let selectedTimeStr = "";
  let selectedSlots: any[] = [];
  
  if (selectedSlot) {
    const date = weekDates[selectedSlot.day];
    selectedDateStr = date
      ? `${date.toLocaleDateString("en-GB", { weekday: "short" })} ${formatDaySuffix(date.getDate())}`
      : "";
    const hour = TIMES[selectedSlot.time];
    selectedTimeStr = hour < 12 ? `${hour}am` : hour === 12 ? `12pm` : `${hour - 12}pm`;
    selectedSlots = selectedSlot.slotData?.slots || [];
  }

  return (
    <div
      className="bg-white w-full max-w-[900px] calendar-main-area"
      style={{
        boxShadow: "0 2px 12px 0 rgb(60 80 60 / 0.08)",
        padding: "12px",
        margin: 0,
        position: "relative"
      }}
    >
      {/* Mobile: Horizontal scroll container, Desktop: Normal table */}
      <div className="overflow-x-auto md:overflow-x-visible">
        <table className="border-separate border-spacing-0 font-medium select-none w-full md:min-w-full" style={{ minWidth: "600px" }}>
          <thead>
            <tr>
              {/* Empty header cell to align with time column */}
              <th className="w-8 md:w-6 h-12 md:h-14 pr-1 align-middle sticky left-0 bg-white z-10 md:static" style={{ position: 'sticky', minWidth: 32, width: 32, padding: 0 }}>
              </th>
              {weekDates.map((d, idx) => (
                <th
                  key={idx}
                  className={`px-1 md:px-2 py-2 text-center ${textStyles.calendarDayHeader}`}
                  style={{ minWidth: 60, width: 60 }}
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-xs md:text-sm font-normal text-black">
                      {`${d.toLocaleDateString("en-GB", { weekday: "short" })} ${formatDaySuffix(d.getDate())}`}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map((time, rowIdx) => (
              <tr key={time}>
                <th
                  className={`py-0 pr-2 text-center align-middle sticky left-0 bg-white z-10 md:static ${textStyles.calendarTime}`}
                  style={{ width: 32, height: 44, minWidth: 32 }}
                >
                  <span className="text-xs">
                    {time < 12 ? `${time}am` : time === 12 ? `12pm` : `${time - 12}pm`}
                  </span>
                </th>
                {weekDates.map((d, colIdx) => {
                  const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); // Format: YYYY-MM-DD
                  const timeInMinutes = time * 60;
                  const rawSlotData = calendarData?.[dateStr]?.[timeInMinutes];
                  const slotData = filterSlotsByLocation(rawSlotData);
                  
                  // Check if this slot is in the past
                  const now = new Date();
                  const slotDateTime = new Date(d);
                  slotDateTime.setHours(time, 0, 0, 0);
                  const isPastSlot = slotDateTime < now;
                  
                  // If slot is in the past, show as unavailable (0 courts)
                  const availability = isPastSlot ? 0 : (slotData?.totalCourts ?? 0);
                  const isAvailable = availability > 0;
                  
                  // Debug logging for first few slots
                  if (colIdx === 0 && rowIdx < 3) {
                    console.log(`🔍 Slot debug - Date: ${dateStr}, Time: ${time}:00, Minutes: ${timeInMinutes}, Availability: ${availability}, Available: ${isAvailable}`);
                  }
                  
                  // slot style logic updated here
                  const slotBase =
                    "transition-all duration-75 px-0 py-0 cursor-pointer";
                  const slotPadding = "p-1 md:p-2";
                  let slotClass = slotBase + " " + slotPadding;
                  const isHovered = hoveredCell?.col === colIdx && hoveredCell?.row === rowIdx;
                  
                  // More visible unavailable slot color + forced bg override
                  if (!isAvailable) {
                    slotClass += " bg-gray-200 !bg-gray-200 text-gray-400 cursor-not-allowed";
                  } else {
                    slotClass += " bg-white text-black";
                  }

                  return (
                    <td
                      key={colIdx}
                      tabIndex={isAvailable ? 0 : -1}
                      aria-label={`${d.toLocaleDateString("en-GB", { weekday: "short" })} ${
                        time <= 12 ? `${time}am` : time === 12 ? `12pm` : `${time - 12}pm`
                      }, ${availability} courts`}
                      className={slotClass}
                      style={{
                        minWidth: 60,
                        minHeight: 44,
                        width: 60,
                        height: 44,
                        boxShadow: "none",
                        outline: "none",
                        border: "none",
                        margin: 0,
                        verticalAlign: "middle",
                        pointerEvents: isAvailable ? "auto" : "none",
                        backgroundColor: !isAvailable ? "#e5e7eb" : (isHovered && isAvailable ? hoverColor : undefined),
                        color: isHovered && isAvailable ? "white" : undefined,
                        borderRight: colIdx < weekDates.length - 1 ? "1px solid #e5e7eb" : "none", // 1px gray separator line
                        borderBottom: rowIdx < TIMES.length - 1 ? "1px solid #e5e7eb" : "none", // 1px gray separator line
                      }}
                      onMouseEnter={() => isAvailable && setHoveredCell({col: colIdx, row: rowIdx})}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => isAvailable && handleSlotClick(colIdx, rowIdx, dateStr, timeInMinutes, slotData)}
                      onKeyDown={e => {
                        if (isAvailable && (e.key === "Enter" || e.key === " ")) {
                          handleSlotClick(colIdx, rowIdx, dateStr, timeInMinutes, slotData);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <span
                          className={
                            "font-jost text-sm md:text-[1.2rem] leading-none font-medium " +
                            (isAvailable ? "text-black" : "text-gray-400")
                          }
                          style={{
                            marginBottom: "0.1em",
                            letterSpacing: "0.01em",
                            color: !isAvailable ? "#bcbcbc" : (isHovered ? "white" : "#222"),
                          }}
                        >
                          {availability}
                        </span>
                        <span
                          className={
                            "font-jost text-[8px] md:text-[10px] font-medium tracking-tight " +
                            (isAvailable ? "text-[#555]" : "text-gray-400")
                          }
                          style={{
                            marginTop: "-0.15em",
                            color: !isAvailable ? "#bcbcbc" : (isHovered ? "white" : "#555"),
                          }}
                        >
                          courts
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SlotBookingModal
        open={modalOpen}
        date={selectedDateStr}
        time={selectedTimeStr}
        slots={selectedSlots}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default WeeklyCalendar;
