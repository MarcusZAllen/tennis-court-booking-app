
import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const locations = [
  "All London",
  "Favourites",
  "West",
  "East",
  "Central",
];

export default function CourtsLocationPopover({
  triggerRef,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="secondary"
          className="bg-white text-black rounded-xl px-4 py-2 font-jost font-semibold text-sm uppercase shadow-sm border-0 hover:bg-gray-100 transition"
          style={{ letterSpacing: "0.08em" }}
          type="button"
        >
          Courts
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="mt-2 px-4 py-3 flex gap-2 z-50 bg-white border shadow-lg rounded-lg"
        style={{
          minWidth: 0,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        {locations.map((loc) => (
          <span
            key={loc}
            className="px-3 py-1 rounded-full bg-[#f5f3ff] text-black text-xs font-jost font-semibold border border-gray-200 hover:bg-[#ebe6f1] select-none cursor-pointer transition-all"
            tabIndex={0}
            role="button"
            style={{
              whiteSpace: "nowrap",
              borderWidth: 1,
              borderColor: "rgba(40,40,40,0.13)",
            }}
            // This should trigger location select in a real app
          >
            {loc}
          </span>
        ))}
      </PopoverContent>
    </Popover>
  );
}
