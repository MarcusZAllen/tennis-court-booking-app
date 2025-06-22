import * as React from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import WeeklyCalendar from "../components/WeeklyCalendar";

const LOCATIONS = ["All London", "Favourites", "West", "East", "Central"];

type LocationPillsProps = {
  selected: string;
  onSelect: (loc: string) => void;
};

export default function LocationPills({ selected, onSelect }: LocationPillsProps) {
  return (
    <div className="flex flex-row items-center justify-center gap-2 mb-3 md:mb-6 w-full">
      {LOCATIONS.map((loc) => (
        <button
          key={loc}
          type="button"
          className={`px-4 py-1 rounded-full font-jost text-sm font-medium transition
            ${selected === loc
              ? "bg-white text-black shadow border border-gray-300"
              : "bg-[#f5f3ff] text-gray-400 border border-gray-200 hover:bg-[#ebe6f1] hover:text-black"}
            focus:outline-none`}
          style={{
            letterSpacing: "0.06em",
            minWidth: 0,
          }}
          aria-pressed={selected === loc}
          onClick={() => { onSelect(loc); }}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
