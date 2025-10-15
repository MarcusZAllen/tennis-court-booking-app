# Distance Calculation Feature

## Overview

This feature allows users to set their UK address and see the distance and direction to each tennis/padel court in the booking modal. The feature is optional and enhances the user experience by helping them find the closest courts.

## Features Implemented

### 1. User Address Input
- **Location**: Navbar (top-right, before Share button)
- **UI**: Popover component with location pin icon
- **Functionality**:
  - Google Places Autocomplete for UK addresses
  - Manual address entry with geocoding
  - "Use Current Location" button (geolocation API)
  - Clear location option
  - Address saved to localStorage for persistence

### 2. Distance Calculation
- **Algorithm**: Haversine formula for accurate great-circle distance
- **Unit**: Miles (can be easily changed to kilometers)
- **Precision**: 1 decimal place

### 3. Direction Display
- **Visual**: Rotated arrow icon (Navigation component from Lucide)
- **Direction**: Arrow points toward the court from user's location
- **Calculation**: Bearing calculation (0-360 degrees)

### 4. UI Integration
- **Booking Modal**: Distance and direction shown next to each location name
- **Format**: `→ 2.3 mi` (arrow rotates based on bearing)
- **Visibility**: Only shown when user has set their location

## Technical Architecture

### Components Created

#### 1. `AddressLocationPopover.tsx`
- Main UI for address input
- Integrates Google Places Autocomplete
- Handles geolocation API
- Manages localStorage persistence

#### 2. Utility Files

**`distanceCalculation.ts`**
- `calculateDistance()` - Haversine formula implementation
- `calculateBearing()` - Direction calculation
- `getArrowRotation()` - Converts bearing to CSS rotation
- `formatDistance()` - Formats distance for display

**`geocoding.ts`**
- `geocodeAddress()` - Converts address to coordinates using Google Maps API
- `loadGoogleMapsScript()` - Dynamically loads Google Maps SDK

**`locationCoordinates.ts`**
- `getLocationCoordinates()` - Looks up coordinates by location name
- Aggregates all location configs for quick lookup

### Data Flow

1. User enters address in navbar popover
2. Google Places Autocomplete suggests addresses
3. Selected address is geocoded to coordinates
4. Coordinates + address saved to localStorage
5. User location state propagates from index/padel pages → WeeklyCalendar → SlotBookingModal
6. Modal calculates distance/bearing for each location
7. Results displayed with rotated arrow and distance text

### Location Data Enhancement

All location config files now include coordinates:

```javascript
{
  name: "Hyde Park",
  url: "...",
  bookingWindow: 8,
  tags: ["Central", "West"],
  lat: 51.5074,    // Added
  lng: -0.1657     // Added
}
```

**Files Updated:**
- `locations/clubspark.js` (25 locations)
- `locations/parksports.js` (2 locations)
- `locations/better.js` (3 locations)
- `locations/matchi.js` (1 location)

## Google Maps API Integration

### Required APIs
1. **Geocoding API** - Address → Coordinates conversion
2. **Places API** - Address autocomplete
3. **Maps JavaScript API** - Places Autocomplete widget

### Environment Variable
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Free Tier
- 40,000 geocoding requests/month
- 17,000 autocomplete requests/month
- Should be sufficient for low-traffic apps

See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for setup instructions.

## User Experience

### Setting Location

1. Click location button in navbar
2. Choose one of:
   - Enter address manually (with autocomplete)
   - Click "Use Current Location" (requires permission)
3. Click "Set Location"
4. Toast notification confirms success
5. Button shows abbreviated address

### Viewing Distances

1. Click any time slot in calendar
2. Modal opens showing available courts
3. Each location shows:
   - Location name
   - Distance (e.g., "2.3 mi")
   - Directional arrow (→ ↗ ↑ ↖ ← etc.)
   - Number of courts available
   - Price

### Clearing Location

1. Click location button in navbar
2. Click "Clear" button
3. Distance information no longer shown in modals

## Browser Compatibility

- **Google Maps API**: All modern browsers
- **Geolocation API**: Requires HTTPS (works on localhost)
- **localStorage**: All modern browsers
- **Arrow rotation**: CSS transforms (IE11+)

## Privacy & Data

- **Storage**: User location stored only in browser's localStorage
- **No server storage**: Location data never sent to backend
- **User control**: Can clear location anytime
- **Geolocation**: Requires explicit user permission

## Performance

### Optimizations
- Location coordinates pre-loaded at build time
- Distance calculations memoized in React
- Google Maps script loaded on-demand (only when popover opens)
- Autocomplete only initialized when needed

### Metrics
- Distance calculation: <1ms per location
- Modal rendering: No perceptible delay
- Google API calls: Only on address selection

## Future Enhancements

Potential improvements:
1. **Sort by distance**: Automatically sort locations by proximity
2. **Distance filter**: Show only courts within X miles
3. **Map view**: Visual map showing user location and courts
4. **Cycling/walking time**: Show estimated travel time
5. **Public transport**: Integration with TfL API for journey planning
6. **Favorite locations**: Save preferred courts
7. **Offline support**: Cache coordinates for offline distance calculation

## Testing

### Manual Testing Checklist

- [ ] Address autocomplete works
- [ ] Manual address entry works
- [ ] Geolocation works (requires HTTPS)
- [ ] Distance displays correctly in modal
- [ ] Arrow rotates correctly for different directions
- [ ] Location persists across page refreshes
- [ ] Clear location works
- [ ] Works on both tennis and padel pages
- [ ] Mobile responsive

### Edge Cases Handled

- Invalid address entered → Error message shown
- Google Maps API key missing → Graceful degradation
- Location without coordinates → Distance not shown
- Geolocation denied → Fallback to manual entry
- Network error → Error toast notification

## Code Quality

- **TypeScript**: Fully typed with interfaces
- **No linting errors**: All files pass ESLint
- **Consistent naming**: Follows project conventions
- **Comments**: Key functions documented
- **Error handling**: All API calls have try/catch
- **Accessibility**: ARIA labels where needed

## Files Changed

### New Files (8)
1. `src/components/AddressLocationPopover.tsx`
2. `src/lib/utils/distanceCalculation.ts`
3. `src/lib/utils/geocoding.ts`
4. `src/lib/utils/locationCoordinates.ts`
5. `src/types/google-maps.d.ts`
6. `GOOGLE_MAPS_SETUP.md`
7. `DISTANCE_FEATURE.md` (this file)

### Modified Files (11)
1. `locations/clubspark.js` - Added coordinates
2. `locations/parksports.js` - Added coordinates
3. `locations/better.js` - Added coordinates
4. `locations/matchi.js` - Added coordinates
5. `src/components/Navbar.tsx` - Added location popover
6. `src/components/SlotBookingModal.tsx` - Added distance display
7. `src/components/WeeklyCalendar.tsx` - Pass user location to modal
8. `src/pages/index.tsx` - User location state management
9. `src/pages/padel.tsx` - User location state management
10. `env.example` - Added Google Maps API key
11. `README.md` - Updated documentation

## Deployment Notes

### Environment Variables
Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in production environment (Vercel, etc.)

### API Key Security
- Restrict API key to your domain(s)
- Enable only required APIs
- Monitor usage in Google Cloud Console
- Set billing alerts to avoid unexpected charges

### Build Process
No changes to build process required. All location coordinates are bundled at build time.

## Support

For issues or questions:
1. Check [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for API setup
2. Verify environment variables are set correctly
3. Check browser console for error messages
4. Ensure location coordinates are accurate in config files

