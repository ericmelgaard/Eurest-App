/*
  # Add TRM Location and Date Support

  ## Overview
  Adds support for location-based and date-based menu data from TRM API

  ## Changes to Existing Tables

  ### stations
  - Add `location_id` (text) - TRM location identifier
  - Add `date` (date) - Menu date
  - Add unique constraint on (name, location_id, date)

  ### menu_items
  - Add `location_id` (text) - TRM location identifier
  - Add `date` (date) - Menu date
  - Add `allergens` (text[]) - Array of allergen information
  - Add `meal_station` (text) - TRM meal station name
  - Add `external_id` (text) - TRM item ID
  - Add unique constraint on (external_id, location_id, date)

  ## Indexes
  - Add indexes on location_id and date columns for both tables

  ## Notes
  - This allows the same station/item names to exist for different locations/dates
  - External_id tracks the original TRM item ID
*/

-- Add location and date columns to stations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stations' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE stations ADD COLUMN location_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stations' AND column_name = 'date'
  ) THEN
    ALTER TABLE stations ADD COLUMN date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Add location, date, and TRM-specific columns to menu_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN location_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'date'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'allergens'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN allergens text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'meal_station'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN meal_station text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN external_id text DEFAULT '';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stations_location_id ON stations(location_id);
CREATE INDEX IF NOT EXISTS idx_stations_date ON stations(date);
CREATE INDEX IF NOT EXISTS idx_stations_location_date ON stations(location_id, date);
CREATE INDEX IF NOT EXISTS idx_menu_items_location_id ON menu_items(location_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_date ON menu_items(date);
CREATE INDEX IF NOT EXISTS idx_menu_items_location_date ON menu_items(location_id, date);
CREATE INDEX IF NOT EXISTS idx_menu_items_external_id ON menu_items(external_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_meal_station ON menu_items(meal_station);

-- Add unique constraints (drop first if exists)
DO $$
BEGIN
  -- For stations: unique combination of name, location_id, and date
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stations_name_location_date_unique'
  ) THEN
    ALTER TABLE stations ADD CONSTRAINT stations_name_location_date_unique
      UNIQUE (name, location_id, date);
  END IF;

  -- For menu_items: unique combination of external_id, location_id, and date
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'menu_items_external_location_date_unique'
  ) THEN
    ALTER TABLE menu_items ADD CONSTRAINT menu_items_external_location_date_unique
      UNIQUE (external_id, location_id, date);
  END IF;
END $$;