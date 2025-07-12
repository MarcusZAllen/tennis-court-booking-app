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
import { ExternalLink, MapPin } from "lucide-react";
import { textStyles, typography } from '../../branding/typography';

type Slot = {
  provider: string;
  location: string;
  bookingUrl: string;
  cost: string;
  sessionId: string;
  slotKey: string;
};

type SlotBookingModalProps = {
  open: boolean;
  date: string;
  time: string;
  onClose: () => void;
  slots?: Slot[];
};

export default function SlotBookingModal({
  open,
  date,
  time,
  onClose,
  slots = [],
}: SlotBookingModalProps) {
  // Group slots by location and count unique courts (by slotKey)
  const locationGroups = slots.reduce((groups, slot) => {
    const location = slot.location;
    if (!groups[location]) {
      groups[location] = {
        slotKeys: new Set<string>(),
        sampleSlot: slot, // Keep one slot for booking URL
        provider: slot.provider
      };
    }
    groups[location].slotKeys.add(slot.slotKey);
    return groups;
  }, {} as Record<string, { slotKeys: Set<string>; sampleSlot: Slot; provider: string }>);

  const handleBookingClick = (bookingUrl: string) => {
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full px-6 py-6 shadow-xl bg-white max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className={textStyles.modalTitle}>
            {date}, {time}
          </DialogTitle>
          <DialogDescription className={textStyles.modalDescription}>
            Available courts across {Object.keys(locationGroups).length} locations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-y-auto">
          {Object.entries(locationGroups).map(([location, data]) => (
            <div
              key={location}
              className="flex items-center justify-between px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4" style={{ color: '#7cb46b' }} />
                <div>
                  <span className={textStyles.locationName}>
                    {location}
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-gray-600">
                      {data.slotKeys.size} court{data.slotKeys.size !== 1 ? 's' : ''} available
                    </span>
                    <span className="text-xs text-gray-500 font-medium opacity-50">
                      £{data.sampleSlot.cost}
                    </span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => handleBookingClick(data.sampleSlot.bookingUrl)}
                size="sm"
                className="px-4 py-2 font-medium rounded-xl flex items-center space-x-1"
                style={{ 
                  backgroundColor: '#7cb46b',
                  borderColor: '#7cb46b',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6ba55a';
                  e.currentTarget.style.borderColor = '#6ba55a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#7cb46b';
                  e.currentTarget.style.borderColor = '#7cb46b';
                }}
              >
                <span>Book</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {Object.keys(locationGroups).length === 0 && (
            <div className="text-center py-8 text-gray-500 rounded-xl bg-gray-50 border border-gray-200">
              <p className={textStyles.subHeader}>No courts available</p>
              <p className={typography.textSmall}>Try selecting a different time slot</p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-8 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 font-medium rounded-xl"
            style={{ 
              borderColor: '#7cb46b',
              color: '#7cb46b'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7cb46b';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#7cb46b';
            }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
