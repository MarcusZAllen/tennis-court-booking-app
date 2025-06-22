import * as React from "react";
import SlotBookingModal from "./SlotBookingModal";
import type { TransformedData } from "@/utils/transformSlotData";

// Utility to add "st", "nd", "rd", "th" suffix to date
function formatDaySuffix(day: number) {
  if (day >= 11 && day <= 13) return day + "th";
  const last = day % 10;
  if (last === 1) return day + "st";
  if (last === 2) return day + "nd";
  if (last === 3) return day + "rd";
  return day + "th";
}

// Generate dates for the current week (Mon–Sun)
function getCurrentWeek() {
  const curr = new Date();
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - ((curr.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
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
  selectedLocation: string;
};

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ calendarData, selectedLocation }) => {
  const weekDates = getCurrentWeek();
  const [selectedSlot, setSelectedSlot] = React.useState<{
    day: number;
    time: number;
  } | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // On slot click: open modal with date and time details
  const handleSlotClick = (colIdx: number, rowIdx: number) => {
    setSelectedSlot({ day: colIdx, time: rowIdx });
    setModalOpen(true);
  };

  // Format selected slot info for modal
  let selectedDateStr = "";
  let selectedTimeStr = "";
  if (selectedSlot) {
    const date = weekDates[selectedSlot.day];
    selectedDateStr = date
      ? `${date.toLocaleDateString("en-GB", { weekday: "short" })} ${formatDaySuffix(date.getDate())}`
      : "";
    const hour = TIMES[selectedSlot.time];
    selectedTimeStr = hour < 12 ? `${hour}am` : hour === 12 ? `12pm` : `${hour - 12}pm`;
  }

  return (
    <div
      className="rounded-[8px] bg-white border border-black w-full max-w-[900px] calendar-main-area"
      style={{
        boxShadow: "0 2px 12px 0 rgb(60 80 60 / 0.08)",
        padding: "16px",
        margin: 0,
      }}
    >
      <table className="min-w-full border-separate border-spacing-1 font-medium select-none">
        <thead>
          <tr>
            <th className="w-6 h-14 pr-1 align-middle"></th>
            {weekDates.map((d, idx) => (
              <th
                key={idx}
                className="px-2 py-2 text-base font-jost font-medium text-black text-center"
                style={{ minWidth: 40 }}
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
                className="py-0 pr-2 text-center align-middle text-base font-jost font-normal text-black"
                style={{ width: 24, height: 44 }}
              >
                {time < 12 ? `${time}am` : time === 12 ? `12pm` : `${time - 12}pm`}
              </th>
              {weekDates.map((d, colIdx) => {
                const dateStr = d.toISOString().split("T")[0]; // Format: YYYY-MM-DD
                const timeInMinutes = time * 60;
                const slotData = calendarData?.[dateStr]?.[timeInMinutes];
                const availability = slotData?.totalCourts ?? 0;
                const isAvailable = availability > 0;
                // slot style logic updated here
                const slotBase =
                  "transition-all duration-75 rounded-[8px] px-0 py-0 cursor-pointer";
                const slotPadding = "p-2";
                let slotClass = slotBase + " " + slotPadding;
                // More visible unavailable slot color + forced bg override
                if (!isAvailable) {
                  slotClass += " bg-gray-300 !bg-gray-300 text-gray-400 cursor-not-allowed";
                } else {
                  slotClass += " bg-white text-black hover:bg-[#7cb46b] hover:text-white";
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
                      minWidth: 40,
                      minHeight: 44,
                      width: 48,
                      height: 48,
                      boxShadow: "none",
                      outline: "none",
                      border: "none",
                      margin: 0,
                      verticalAlign: "middle",
                      pointerEvents: isAvailable ? "auto" : "none",
                      backgroundColor: !isAvailable ? "#e5e7eb" : undefined, // Tailwind gray-300
                    }}
                    onClick={() => isAvailable && handleSlotClick(colIdx, rowIdx)}
                    onKeyDown={e => {
                      if (isAvailable && (e.key === "Enter" || e.key === " ")) {
                        handleSlotClick(colIdx, rowIdx);
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      <span
                        className={
                          "font-jost text-[1.5rem] leading-none font-medium " +
                          (isAvailable ? "text-black" : "text-gray-400")
                        }
                        style={{
                          marginBottom: "0.15em",
                          letterSpacing: "0.01em",
                          color: !isAvailable ? "#bcbcbc" : "#222",
                        }}
                      >
                        {availability}
                      </span>
                      <span
                        className={
                          "font-jost text-[10px] font-medium tracking-tight " +
                          (isAvailable ? "text-[#555]" : "text-gray-400")
                        }
                        style={{
                          marginTop: "-0.20em",
                          color: !isAvailable ? "#bcbcbc" : "#555",
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
      <SlotBookingModal
        open={modalOpen}
        date={selectedDateStr}
        time={selectedTimeStr}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default WeeklyCalendar;
