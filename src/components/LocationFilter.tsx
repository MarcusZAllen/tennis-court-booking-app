
import * as React from "react";
import { textStyles } from '../../branding/typography';

const LOCATIONS = [
  "All London",
  "Central London",
  "East London",
  "West London",
  "North London",
  "South London",
];

interface LocationFilterProps {
  value: string;
  onChange: (loc: string) => void;
}

const LocationFilter: React.FC<LocationFilterProps> = ({ value, onChange }) => {
  // Use segmented control (horizontal buttons) for md+, fallback to dropdown for mobile
  return (
    <div className="w-full flex justify-center mb-4">
      {/* Desktop segmented control */}
      <div className="hidden md:flex bg-card-warm border-4 border-black rounded-2xl overflow-hidden shadow-card">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => onChange(loc)}
            className={`px-5 py-2 font-medium border-r-4 border-black last:border-r-0 text-lg md:text-xl
              ${value === loc
                ? "bg-tennis-green text-white"
                : "bg-card-warm text-tennis-green hover:bg-warm-accent hover:text-black transition-colors"
              }`}
            style={{ minWidth: 120 }}
            aria-pressed={value === loc}
          >
            {loc}
          </button>
        ))}
      </div>
      {/* Mobile dropdown */}
      <div className="w-full max-w-xs flex md:hidden relative">
        <select
          aria-label="Select location"
          className={`block w-full py-2 px-4 rounded-xl border-4 border-black text-tennis-green font-medium bg-card-warm shadow-card appearance-none text-lg md:text-xl`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LocationFilter;
