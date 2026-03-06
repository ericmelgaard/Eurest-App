/*
  # Create Menu System Schema

  ## Overview
  Creates a comprehensive schema for a modern meal station menu system with full nutritional information.

  ## New Tables

  ### 1. stations
  - `id` (uuid, primary key) - Unique identifier for each meal station
  - `name` (text) - Station name (e.g., "A La Minute", "Grill Station")
  - `description` (text) - Detailed description of the station
  - `display_order` (integer) - Order for displaying stations
  - `is_active` (boolean) - Whether the station is currently active
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. dietary_icons
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Icon identifier (e.g., "vegan", "halal")
  - `display_name` (text) - User-friendly name
  - `description` (text) - Full description for legend
  - `file_path` (text) - Path to icon image
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. menu_items
  - `id` (uuid, primary key) - Unique identifier
  - `station_id` (uuid, foreign key) - Reference to stations table
  - `name` (text) - Item name
  - `description` (text) - Item description
  - `price` (numeric) - Item price
  - `calories` (integer) - Calorie count
  - `serving_size` (text) - Serving size description
  - `ingredients` (text) - Comma-separated ingredients list
  - `is_available` (boolean) - Current availability
  - `display_order` (integer) - Order within station
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. nutrition_facts
  - `id` (uuid, primary key) - Unique identifier
  - `menu_item_id` (uuid, foreign key) - Reference to menu_items table
  - `total_fat_g` (numeric) - Total fat in grams
  - `saturated_fat_g` (numeric) - Saturated fat in grams
  - `trans_fat_g` (numeric) - Trans fat in grams
  - `cholesterol_mg` (numeric) - Cholesterol in milligrams
  - `sodium_mg` (numeric) - Sodium in milligrams
  - `total_carbs_g` (numeric) - Total carbohydrates in grams
  - `dietary_fiber_g` (numeric) - Dietary fiber in grams
  - `total_sugars_g` (numeric) - Total sugars in grams
  - `protein_g` (numeric) - Protein in grams
  - `vitamin_d_mcg` (numeric) - Vitamin D in micrograms
  - `calcium_mg` (numeric) - Calcium in milligrams
  - `iron_mg` (numeric) - Iron in milligrams
  - `potassium_mg` (numeric) - Potassium in milligrams
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. item_dietary_icons
  - `id` (uuid, primary key) - Unique identifier
  - `menu_item_id` (uuid, foreign key) - Reference to menu_items
  - `dietary_icon_id` (uuid, foreign key) - Reference to dietary_icons
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for public read access (suitable for menu display)

  ## Indexes
  - Add indexes on foreign keys for optimal query performance
  - Add index on station display_order for sorted queries
  - Add index on item display_order within stations
*/

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dietary_icons table
CREATE TABLE IF NOT EXISTS dietary_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text DEFAULT '',
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10, 2) DEFAULT 0,
  calories integer DEFAULT 0,
  serving_size text DEFAULT '',
  ingredients text DEFAULT '',
  is_available boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create nutrition_facts table
CREATE TABLE IF NOT EXISTS nutrition_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid UNIQUE NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  total_fat_g numeric(10, 2) DEFAULT 0,
  saturated_fat_g numeric(10, 2) DEFAULT 0,
  trans_fat_g numeric(10, 2) DEFAULT 0,
  cholesterol_mg numeric(10, 2) DEFAULT 0,
  sodium_mg numeric(10, 2) DEFAULT 0,
  total_carbs_g numeric(10, 2) DEFAULT 0,
  dietary_fiber_g numeric(10, 2) DEFAULT 0,
  total_sugars_g numeric(10, 2) DEFAULT 0,
  protein_g numeric(10, 2) DEFAULT 0,
  vitamin_d_mcg numeric(10, 2) DEFAULT 0,
  calcium_mg numeric(10, 2) DEFAULT 0,
  iron_mg numeric(10, 2) DEFAULT 0,
  potassium_mg numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS item_dietary_icons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  dietary_icon_id uuid NOT NULL REFERENCES dietary_icons(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(menu_item_id, dietary_icon_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stations_display_order ON stations(display_order);
CREATE INDEX IF NOT EXISTS idx_stations_is_active ON stations(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_station_id ON menu_items(station_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_display_order ON menu_items(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_nutrition_facts_menu_item_id ON nutrition_facts(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_dietary_icons_menu_item_id ON item_dietary_icons(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_item_dietary_icons_dietary_icon_id ON item_dietary_icons(dietary_icon_id);

-- Enable Row Level Security
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietary_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_dietary_icons ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to stations"
  ON stations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to dietary icons"
  ON dietary_icons FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to menu items"
  ON menu_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to nutrition facts"
  ON nutrition_facts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to item dietary icons"
  ON item_dietary_icons FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_stations_updated_at ON stations;
CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();