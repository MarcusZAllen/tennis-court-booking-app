import * as React from "react";
import { textStyles } from '../../branding/typography';
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
          className={`px-4 py-1 rounded-full font-jost font-medium transition-colors text-sm
            ${selected === loc
              ? "text-white shadow border"
              : "bg-[#fcf4ed] text-gray-600 border border-gray-200 hover:bg-gray-100"}
            focus:outline-none`}
          style={{
            letterSpacing: "0.06em",
            minWidth: 0,
            backgroundColor: selected === loc ? '#7cb46b' : undefined,
            borderColor: selected === loc ? '#7cb46b' : undefined,
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
