import * as React from "react";
import { textStyles } from '../../branding/typography';

const LOCATIONS = ["All London", "North", "South", "East", "West", "Central"];

type LocationPillsProps = {
  selected: string[];
  onSelect: (locations: string[]) => void;
};

export default function LocationPills({ selected, onSelect }: LocationPillsProps) {
  const handleLocationClick = (location: string) => {
    if (location === "All London") {
      // If "All London" is clicked, clear all other selections
      onSelect(["All London"]);
    } else {
      // If a cardinal direction is clicked
      if (selected.includes("All London")) {
        // If "All London" was selected, replace it with the new location
        onSelect([location]);
      } else {
        // If cardinal directions are already selected, toggle the clicked one
        if (selected.includes(location)) {
          // Remove the location if it's already selected
          const newSelection = selected.filter(loc => loc !== location);
          // If no locations left, default to "All London"
          onSelect(newSelection.length > 0 ? newSelection : ["All London"]);
        } else {
          // Add the location to the selection
          onSelect([...selected, location]);
        }
      }
    }
  };

  return (
    <div className="flex flex-row items-center justify-center gap-2 mb-3 md:mb-6 w-full">
      {LOCATIONS.map((loc) => (
        <button
          key={loc}
          type="button"
          className={`px-4 py-1 rounded-full font-jost font-medium transition-colors text-sm
            ${selected.includes(loc)
              ? "text-white shadow border"
              : "bg-[#fcf4ed] text-gray-600 border border-gray-200 hover:bg-gray-100"}
            focus:outline-none`}
          style={{
            letterSpacing: "0.06em",
            minWidth: 0,
            backgroundColor: selected.includes(loc) ? '#7cb46b' : undefined,
            borderColor: selected.includes(loc) ? '#7cb46b' : undefined,
          }}
          aria-pressed={selected.includes(loc)}
          onClick={() => handleLocationClick(loc)}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
