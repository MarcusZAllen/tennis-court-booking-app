-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  provider_id INTEGER REFERENCES providers(id),
  booking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tennis_slots table
CREATE TABLE IF NOT EXISTS tennis_slots (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  location VARCHAR(200) NOT NULL,
  court VARCHAR(100), -- NULL for ParkSports (they don't specify courts)
  booking_url TEXT NOT NULL,
  date DATE NOT NULL,
  readable_time VARCHAR(50) NOT NULL,
  cost VARCHAR(20) NOT NULL,
  start_minutes INTEGER NOT NULL,
  end_minutes INTEGER NOT NULL,
  session_id VARCHAR(255),
  slot_key VARCHAR(255) UNIQUE NOT NULL,
  sport_type VARCHAR(20) DEFAULT 'tennis' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tennis_slots_date ON tennis_slots(date);
CREATE INDEX IF NOT EXISTS idx_tennis_slots_location ON tennis_slots(location);
CREATE INDEX IF NOT EXISTS idx_tennis_slots_provider ON tennis_slots(provider);
CREATE INDEX IF NOT EXISTS idx_tennis_slots_slot_key ON tennis_slots(slot_key);
CREATE INDEX IF NOT EXISTS idx_tennis_slots_sport_type ON tennis_slots(sport_type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_tennis_slots_location_date ON tennis_slots(location, date);
CREATE INDEX IF NOT EXISTS idx_tennis_slots_sport_date ON tennis_slots(sport_type, date);

-- Insert default providers
INSERT INTO providers (name, display_name) VALUES 
  ('clubspark', 'ClubSpark'),
  ('parksports', 'ParkSports')
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tennis_slots_updated_at 
  BEFORE UPDATE ON tennis_slots 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (optional - for future auth)
ALTER TABLE tennis_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to tennis_slots" ON tennis_slots
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to locations" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to providers" ON providers
  FOR SELECT USING (true);

-- Create policy for inserting slots (for scrapers)
CREATE POLICY "Allow insert to tennis_slots" ON tennis_slots
  FOR INSERT WITH CHECK (true);

-- Create policy for updating slots (for scrapers)
CREATE POLICY "Allow update to tennis_slots" ON tennis_slots
  FOR UPDATE USING (true); 