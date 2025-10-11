-- Migration: Add sport_type column to tennis_slots table
-- This migration can be run on existing databases to add padel support

-- Add sport_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tennis_slots' AND column_name='sport_type'
  ) THEN
    ALTER TABLE tennis_slots 
    ADD COLUMN sport_type VARCHAR(20) DEFAULT 'tennis' NOT NULL;
  END IF;
END $$;

-- Create index on sport_type if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_tennis_slots_sport_type ON tennis_slots(sport_type);

-- Create composite index for sport_type and date queries
CREATE INDEX IF NOT EXISTS idx_tennis_slots_sport_date ON tennis_slots(sport_type, date);

-- Update all existing rows to have sport_type='tennis' if they're NULL
UPDATE tennis_slots 
SET sport_type = 'tennis' 
WHERE sport_type IS NULL;

-- Verify the migration
SELECT 
  COUNT(*) as total_slots,
  sport_type,
  COUNT(DISTINCT location) as unique_locations
FROM tennis_slots 
GROUP BY sport_type;

