import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "../hooks/use-toast";
import { geocodeAddress, loadGoogleMapsScript } from "@/lib/utils/geocoding";
import { Coordinates } from "@/lib/utils/distanceCalculation";

export interface UserLocation {
  address: string;
  coordinates: Coordinates;
}

interface AddressLocationPopoverProps {
  onLocationChange: (location: UserLocation | null) => void;
  currentLocation: UserLocation | null;
}

export default function AddressLocationPopover({
  onLocationChange,
  currentLocation,
}: AddressLocationPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [address, setAddress] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Initialize Google Places Autocomplete
  React.useEffect(() => {
    if (open && inputRef.current && !autocompleteRef.current) {
      loadGoogleMapsScript()
        .then(() => {
          if (inputRef.current) {
            autocompleteRef.current = new google.maps.places.Autocomplete(
              inputRef.current,
              {
                componentRestrictions: { country: "gb" },
                fields: ["formatted_address", "geometry"],
              }
            );

            autocompleteRef.current.addListener("place_changed", () => {
              const place = autocompleteRef.current?.getPlace();
              if (place?.formatted_address) {
                setAddress(place.formatted_address);
              }
            });
          }
        })
        .catch((error) => {
          console.error("Error loading Google Maps:", error);
        });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      toast({
        title: "Address required",
        description: "Please enter your address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await geocodeAddress(address);
      
      if (result) {
        const location: UserLocation = {
          address: result.address,
          coordinates: result.coordinates,
        };
        
        // Save to localStorage
        localStorage.setItem("userLocation", JSON.stringify(location));
        
        onLocationChange(location);
        setOpen(false);
        
        toast({
          title: "Location set!",
          description: "Distances will now be shown for each court",
        });
      } else {
        toast({
          title: "Location not found",
          description: "Please check your address and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error setting location:", error);
      toast({
        title: "Error",
        description: "Failed to set location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem("userLocation");
    onLocationChange(null);
    setAddress("");
    setOpen(false);
    
    toast({
      title: "Location cleared",
      description: "Distance information has been removed",
    });
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          // Reverse geocode to get address
          try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${apiKey}`
            );
            const data = await response.json();
            
            if (data.status === "OK" && data.results[0]) {
              const location: UserLocation = {
                address: data.results[0].formatted_address,
                coordinates: coords,
              };
              
              localStorage.setItem("userLocation", JSON.stringify(location));
              onLocationChange(location);
              setOpen(false);
              
              toast({
                title: "Location set!",
                description: "Using your current location",
              });
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLoading(false);
          toast({
            title: "Location access denied",
            description: "Please enable location access or enter your address manually",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  };

  const displayText = currentLocation
    ? currentLocation.address.split(",")[0] // Show first part of address
    : "Set location";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-white text-black rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 shadow-sm border-0 transition-all duration-150 hover:bg-gray-100 focus:bg-gray-100 text-xs sm:text-sm max-w-[120px] sm:max-w-[200px]"
          style={{ letterSpacing: "0.05em" }}
        >
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">Your Location</h4>
            <p className="text-xs text-gray-500">
              Set your address to see distances to courts
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter your UK address or postcode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading}
              className="text-sm"
            />
            
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={isLoading}
                className="flex-1"
                style={{ backgroundColor: '#7cb46b', color: 'white' }}
              >
                {isLoading ? "Setting..." : "Set Location"}
              </Button>
              
              {currentLocation && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>
          
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Use Current Location
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

