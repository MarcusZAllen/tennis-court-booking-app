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
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { textStyles, typography } from '../../branding/typography';
import { UserLocation } from "./AddressLocationPopover";
import { getLocationCoordinates } from "@/lib/utils/locationCoordinates";
import { calculateDistance, calculateBearing, getArrowRotation, formatDistance } from "@/lib/utils/distanceCalculation";

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
  userLocation?: UserLocation | null;
};

export default function SlotBookingModal({
  open,
  date,
  time,
  onClose,
  slots = [],
  userLocation = null,
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

  // Calculate distance and bearing for each location
  const locationDistances = React.useMemo(() => {
    if (!userLocation) return {};
    
    const distances: Record<string, { distance: number; bearing: number }> = {};
    
    Object.keys(locationGroups).forEach((locationName) => {
      const locationCoords = getLocationCoordinates(locationName);
      if (locationCoords) {
        const distance = calculateDistance(userLocation.coordinates, locationCoords);
        const bearing = calculateBearing(userLocation.coordinates, locationCoords);
        distances[locationName] = { distance, bearing };
      }
    });
    
    return distances;
  }, [userLocation, locationGroups]);

  const handleBookingClick = (bookingUrl: string) => {
    // Ensure the URL has the correct date parameter
    let finalUrl = bookingUrl;
    if (!bookingUrl.includes('date=')) {
      const separator = bookingUrl.includes('?') ? '&' : '?';
      finalUrl = `${bookingUrl}${separator}date=${date}`;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full px-4 sm:px-6 py-4 sm:py-6 shadow-xl bg-white max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className={textStyles.modalTitle}>
            {date}, {time}
          </DialogTitle>
          <DialogDescription className={textStyles.modalDescription}>
            Available courts across {Object.keys(locationGroups).length} locations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
          {Object.entries(locationGroups).map(([location, data]) => {
            const distanceInfo = locationDistances[location];
            
            return (
              <div
                key={location}
                className="flex items-center justify-between pl-3 pr-4 sm:pl-4 sm:pr-5 py-3 sm:py-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-9 sm:w-10 flex items-center justify-center flex-shrink-0">
                    {distanceInfo ? (
                      // Show directional arrow with distance when user location is set
                      <div className="flex flex-col items-center gap-1">
                        <Navigation 
                          className="h-5 w-5" 
                          style={{ 
                            color: '#7cb46b',
                            transform: `rotate(${getArrowRotation(distanceInfo.bearing)}deg)`,
                            transition: 'transform 0.3s ease'
                          }}
                        />
                        <span className="text-xs font-medium" style={{ color: '#7cb46b' }}>{formatDistance(distanceInfo.distance)}</span>
                      </div>
                    ) : (
                      // Show regular pin when no user location
                      <MapPin className="h-4 w-4" style={{ color: '#7cb46b' }} />
                    )}
                  </div>
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
            );
          })}
          
          {Object.keys(locationGroups).length === 0 && (
            <div className="text-center py-8 text-gray-500 rounded-xl bg-gray-50 border border-gray-200">
              <p className={textStyles.noCourtsMessage}>No courts available</p>
                              <p className={textStyles.tryAgainMessage}>Try selecting a different time slot</p>
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
