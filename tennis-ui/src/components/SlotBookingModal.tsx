import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";

// Example locations for the modal; in real app, pass locations as props.
const LOCATION_LIST = [
  { name: "Wimbledon", courts: 5 },
  { name: "Regent’s Park", courts: 4 },
  { name: "Battersea", courts: 3 },
  { name: "Hackney Downs", courts: 2 },
  { name: "Ealing", courts: 1 },
];

type SlotBookingModalProps = {
  open: boolean;
  date: string;
  time: string;
  onClose: () => void;
  locations?: { name: string; courts: number }[];
};

export default function SlotBookingModal({
  open,
  date,
  time,
  onClose,
  locations = LOCATION_LIST,
}: SlotBookingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full px-6 py-6 rounded-2xl shadow-xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-jost text-center mb-1">
            {date}, {time}
          </DialogTitle>
          <DialogDescription className="text-center mb-3">
            Available Locations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {locations.map((loc, idx) => (
            <div
              key={loc.name}
              className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50 border border-gray-200"
            >
              <span className="font-jost text-base text-gray-900">{loc.name}</span>
              <span className="text-xs text-gray-500 font-jost mr-2">
                {loc.courts} court{loc.courts !== 1 ? "s" : ""}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="ml-2 px-4 py-1 rounded-full font-jost text-sm"
              >
                Book Now
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
