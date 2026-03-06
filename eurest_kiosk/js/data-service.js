import { trmApiService } from './trm-api-service.js';

// In-memory cache for menu data
let cachedMenuData = null;
let cacheMetadata = {
  locationId: null,
  date: null,
  timestamp: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid(locationId, date) {
  if (!cachedMenuData) return false;

  const now = Date.now();
  const cacheAge = now - cacheMetadata.timestamp;

  return (
    cacheMetadata.locationId === locationId &&
    cacheMetadata.date === date &&
    cacheAge < CACHE_DURATION
  );
}

// TRM Menu data management
export async function fetchAndStoreMenuItems(businessUnitId, locationId, date = null) {
  try {
    // Check cache first
    if (isCacheValid(locationId, date)) {
      console.log('Using cached menu data');
      return cachedMenuData;
    }

    // Fetch menu items from TRM API
    const result = await trmApiService.fetchMenuItems(businessUnitId, locationId, date);

    if (!result || !result.menuItems || result.menuItems.length === 0) {
      throw new Error('No menu items found for the selected date and location');
    }

    // Cache the result
    cachedMenuData = result;
    cacheMetadata = {
      locationId,
      date: result.date,
      timestamp: Date.now()
    };

    console.log('Menu data fetched and cached:', {
      items: result.menuItems.length,
      stations: result.stations.length
    });

    return result;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}

export async function getAllStations() {
  try {
    if (!cachedMenuData || !cachedMenuData.stations) {
      return [];
    }

    return cachedMenuData.stations.map((name, index) => ({
      id: name,
      name: name,
      display_order: index,
      is_active: true
    }));
  } catch (error) {
    console.error('Error fetching stations:', error);
    throw new Error('Failed to load stations. Please try again.');
  }
}

export async function getStationWithItems(stationId) {
  try {
    if (!cachedMenuData || !cachedMenuData.menuItems) {
      throw new Error('Menu data not loaded');
    }

    // Filter items for this station
    const items = cachedMenuData.menuItems.filter(item => item.mealStation === stationId);

    if (!items || items.length === 0) {
      throw new Error('No items found for this station');
    }

    return {
      id: stationId,
      name: stationId,
      is_active: true,
      items: items
    };
  } catch (error) {
    console.error('Error fetching station with items:', error);
    throw new Error('Failed to load menu items. Please try again.');
  }
}

export async function getItemIcons(itemId) {
  try {
    if (!cachedMenuData || !cachedMenuData.menuItems) {
      return [];
    }

    const item = cachedMenuData.menuItems.find(item => item.id === itemId);
    return item?.icons || [];
  } catch (error) {
    console.error('Error fetching item icons:', error);
    return [];
  }
}

export async function getItemWithNutrition(itemId) {
  try {
    if (!cachedMenuData || !cachedMenuData.menuItems) {
      throw new Error('Menu data not loaded');
    }

    const item = cachedMenuData.menuItems.find(item => item.id == itemId);

    if (!item) {
      throw new Error('Item not found');
    }

    // Map nutrients array to nutrition object
    const nutrition = {};
    if (item.nutrients && Array.isArray(item.nutrients)) {
      item.nutrients.forEach(nutrient => {
        const name = (nutrient.name || '').toLowerCase();
        const value = nutrient.rawValue || 0;

        // Map nutrient names to expected field names
        if (name.includes('calorie') || name.includes('energy')) {
          nutrition.calories = Math.round(value);
        } else if (name.includes('total fat') || name === 'fat') {
          nutrition.total_fat_g = value;
        } else if (name.includes('saturated fat')) {
          nutrition.saturated_fat_g = value;
        } else if (name.includes('trans fat')) {
          nutrition.trans_fat_g = value;
        } else if (name.includes('cholesterol')) {
          nutrition.cholesterol_mg = value;
        } else if (name.includes('sodium')) {
          nutrition.sodium_mg = value;
        } else if (name.includes('total carbohydrate') || name === 'carbohydrate') {
          nutrition.total_carbs_g = value;
        } else if (name.includes('dietary fiber') || name.includes('fiber')) {
          nutrition.dietary_fiber_g = value;
        } else if (name.includes('total sugar') || name.includes('sugars')) {
          nutrition.total_sugars_g = value;
        } else if (name.includes('protein')) {
          nutrition.protein_g = value;
        } else if (name.includes('vitamin d')) {
          nutrition.vitamin_d_mcg = value;
        } else if (name.includes('calcium')) {
          nutrition.calcium_mg = value;
        } else if (name.includes('iron')) {
          nutrition.iron_mg = value;
        } else if (name.includes('potassium')) {
          nutrition.potassium_mg = value;
        }
      });
    }

    // Default calories if not in nutrients
    if (!nutrition.calories) {
      nutrition.calories = item.calories || 0;
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      enticingDescription: item.enticingDescription || item.description,
      price: item.price,
      calories: item.calories || nutrition.calories,
      icons: item.icons || [],
      allergens: item.allergens || [],
      ingredients: item.ingredients || [],
      serving_size: item.serving_size || 'Per serving',
      nutrition: nutrition,
      rawNutrients: item.nutrients || []
    };
  } catch (error) {
    console.error('Error fetching item with nutrition:', error);
    throw new Error('Failed to load nutritional information. Please try again.');
  }
}

export async function getAllDietaryIcons() {
  try {
    // Standard icon set with known mappings
    const standardIcons = [
      { id: 'vegan', name: 'Vegan', display_name: 'Vegan', file_path: 'media/icon_vegan.png', icon_url: 'media/icon_vegan.png' },
      { id: 'vegetarian', name: 'Vegetarian', display_name: 'Vegetarian', file_path: 'media/icon_vegetarian.png', icon_url: 'media/icon_vegetarian.png' },
      { id: 'gluten_free', name: 'Gluten Free', display_name: 'Gluten Free', file_path: 'media/icon_withoutgluten.png', icon_url: 'media/icon_withoutgluten.png' },
      { id: 'dairy_free', name: 'Dairy Free', display_name: 'Dairy Free', file_path: 'media/icon_withoutdairy.png', icon_url: 'media/icon_withoutdairy.png' },
      { id: 'halal', name: 'Halal', display_name: 'Halal', file_path: 'media/icon_halal.png', icon_url: 'media/icon_halal.png' },
      { id: 'spicy', name: 'Spicy', display_name: 'Spicy', file_path: 'media/icon_spicy.png', icon_url: 'media/icon_spicy.png' }
    ];

    // If menu data is loaded, collect all unique icons from menu items
    if (cachedMenuData && cachedMenuData.menuItems) {
      const allIcons = new Map();

      // Add standard icons first
      standardIcons.forEach(icon => {
        const key = (icon.name || icon.display_name).toLowerCase().replace(/\s+/g, '');
        allIcons.set(key, icon);
      });

      // Collect icons from menu items
      cachedMenuData.menuItems.forEach(item => {
        if (item.icons && Array.isArray(item.icons)) {
          item.icons.forEach(icon => {
            const key = (icon.name || icon.display_name).toLowerCase().replace(/\s+/g, '');

            // Only add if not already in the map
            if (!allIcons.has(key)) {
              allIcons.set(key, {
                id: key,
                name: icon.name || icon.display_name,
                display_name: icon.display_name || icon.name,
                file_path: icon.file_path || icon.fileName || icon.icon_url,
                icon_url: icon.icon_url || icon.file_path || icon.fileName
              });
            }
          });
        }
      });

      return Array.from(allIcons.values());
    }

    // Return standard icons if no menu data is available yet
    return standardIcons;
  } catch (error) {
    console.error('Error fetching dietary icons:', error);
    throw new Error('Failed to load dietary icons. Please try again.');
  }
}

export function calculateDailyValue(nutrient, amount) {
  const dailyValues = {
    total_fat_g: 78,
    saturated_fat_g: 20,
    cholesterol_mg: 300,
    sodium_mg: 2300,
    total_carbs_g: 275,
    dietary_fiber_g: 28,
    vitamin_d_mcg: 20,
    calcium_mg: 1300,
    iron_mg: 18,
    potassium_mg: 4700
  };

  const dv = dailyValues[nutrient];
  if (!dv) return 0;

  return Math.round((amount / dv) * 100);
}
