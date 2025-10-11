# Padel Court Booking Feature

## Overview

This document describes the padel court booking feature that has been added to the tennis court booking app. The app now supports both tennis and padel court bookings, with separate pages and color themes for each sport.

## What's New

### User-Facing Features

1. **New Padel Page** (`/padel`)
   - Dedicated page for padel court bookings
   - Blue color scheme (background: #caf0f8, primary: #00b4d8)
   - Same familiar booking interface as tennis
   - Filters to show only padel courts

2. **Navigation Update**
   - "Courts" button in navbar changed to "Padel"
   - Click to navigate between tennis (home) and padel pages

### Technical Changes

#### Database Schema

- Added `sport_type` column to `tennis_slots` table (VARCHAR(20), default 'tennis')
- Added indexes on `sport_type` for query performance
- Supports values: 'tennis' and 'padel'

#### Backend (Scrapers)

**ParkSports Scraper** (`scrapers/parksports.js`)
- Automatically detects sport type from court name
- Courts with "padel" in the name are tagged as padel
- All other courts default to tennis
- Adds `sportType` field to scraped slot data

**Database Service** (`lib/database.js`)
- Maps `sportType` from scraped data to `sport_type` in database
- Defaults to 'tennis' if not specified

#### Frontend

**Data Hook** (`src/hooks/useSupabaseData.ts`)
- Now accepts optional `sportType` parameter
- Filters database queries by sport type
- Backwards compatible (defaults to 'tennis')

**New Padel Page** (`src/pages/padel.tsx`)
- Fetches only padel court data
- Uses blue color scheme throughout
- Identical layout to tennis page for consistency

**Calendar Component** (`src/components/WeeklyCalendar.tsx`)
- Accepts optional `sportType` and `hoverColor` props
- Dynamic hover colors based on sport (green for tennis, blue for padel)
- Maintains all existing functionality

## Database Migration

### For Existing Deployments

If you have an existing database, run the migration script:

```sql
-- Run this in your Supabase SQL Editor
\i supabase/migration-add-sport-type.sql
```

Or manually execute:

```sql
-- Add sport_type column
ALTER TABLE tennis_slots 
ADD COLUMN sport_type VARCHAR(20) DEFAULT 'tennis' NOT NULL;

-- Add indexes
CREATE INDEX idx_tennis_slots_sport_type ON tennis_slots(sport_type);
CREATE INDEX idx_tennis_slots_sport_date ON tennis_slots(sport_type, date);

-- Update existing data
UPDATE tennis_slots SET sport_type = 'tennis' WHERE sport_type IS NULL;
```

### For New Deployments

The main schema file (`supabase/schema.sql`) already includes the `sport_type` column, so no migration is needed.

## Current Padel Locations

Based on ParkSports data, the following locations have padel courts:

1. **Hyde Park** - 1 outdoor floodlit padel court
2. **Regent's Park** - 2 outdoor floodlit padel courts

The scraper automatically detects these courts and tags them as padel.

## Testing

### Verify Scraper Detection

Run the ParkSports scraper:

```bash
node runner/scrape-parksports-only.js
```

Check the output for padel courts being detected and saved with `sport_type: 'padel'`.

### Verify Frontend

1. Visit `http://localhost:3000` - should show tennis courts only
2. Visit `http://localhost:3000/padel` - should show padel courts only
3. Check that:
   - Tennis page has green hover color (#7cb46b)
   - Padel page has blue hover color (#00b4d8)
   - Both pages load data correctly

### Verify Database

```sql
-- Check sport type distribution
SELECT sport_type, COUNT(*) as count 
FROM tennis_slots 
GROUP BY sport_type;

-- Check padel courts
SELECT location, court, COUNT(*) as slots
FROM tennis_slots 
WHERE sport_type = 'padel'
GROUP BY location, court;
```

## Future Enhancements

Potential improvements for the padel feature:

1. **Additional Providers**
   - Integrate Playtomic API (6+ additional padel locations)
   - Add dedicated padel venues (Rocket Padel, Padium, etc.)

2. **UI Improvements**
   - Sport toggle/switcher in navbar
   - Combined calendar view showing both sports
   - Sport preference saved in user profile

3. **Notifications**
   - Sport-specific booking notifications
   - Alert when new padel courts become available

4. **Analytics**
   - Track padel vs tennis booking patterns
   - Popular times for each sport

## Color Schemes

### Tennis (Default)
- Background: #fcf4ed (warm beige)
- Primary/Hover: #7cb46b (green)

### Padel
- Background: #a9d6e5 (soft blue)
- Primary/Hover: #61a5c2 (teal blue)

## Files Modified

- `supabase/schema.sql` - Added sport_type column and indexes
- `scrapers/parksports.js` - Added sport type detection
- `lib/database.js` - Added sport_type field mapping
- `src/hooks/useSupabaseData.ts` - Added sport type filtering
- `src/pages/padel.tsx` - New padel page
- `src/components/WeeklyCalendar.tsx` - Added dynamic color support
- `src/components/Navbar.tsx` - Changed Courts to Padel button

## Files Created

- `supabase/migration-add-sport-type.sql` - Migration script
- `PADEL_FEATURE.md` - This documentation file

