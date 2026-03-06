const SUPABASE_URL = 'https://zwrtswsoymkekpjgnnmf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3cnRzd3NveW1rZWtwamdubm1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxOTgzNjksImV4cCI6MjA4Nzc3NDM2OX0.uO5WLkJh5-755wlm18_bd9LLcNbKAh-jT6NUBDTVv0M';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/trm-proxy`;

class TrmApiService {
  constructor() {
    this.cache = {
      sapCodes: null,
      venues: {}
    };
  }

  async callCompassApi(endpoint, businessUnitId = null) {
    const payload = {
      endpoint,
      businessUnitId
    };

    console.log('=== API REQUEST TO EDGE FUNCTION ===');
    console.log('Edge Function URL:', EDGE_FUNCTION_URL);
    console.log('Endpoint (with query params):', endpoint);
    console.log('Business Unit ID:', businessUnitId);
    console.log('Full Payload:', JSON.stringify(payload, null, 2));
    console.log('Expected Final Compass API URL:', `https://api.compass-usa.com/stg/v3/${endpoint}`);

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    console.log('Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    return await response.json();
  }

  async fetchSapCodes() {
    if (this.cache.sapCodes) {
      return this.cache.sapCodes;
    }

    try {
      const response = await this.callCompassApi('business_units');
      console.log('Business units raw response:', response);

      // Handle different response structures
      let businessUnits = [];
      if (Array.isArray(response)) {
        businessUnits = response;
      } else if (response.business_units && Array.isArray(response.business_units)) {
        businessUnits = response.business_units;
      } else if (response.data?.businessUnits) {
        businessUnits = response.data.businessUnits;
      } else if (response.data?.business_units) {
        businessUnits = response.data.business_units;
      }

      console.log('Extracted business units:', businessUnits.length, 'items');

      const transformedData = {
        sapCodes: businessUnits.map(bu => ({
          businessUnitId: bu.businessUnitId || bu.business_unit_id || bu.id,
          name: bu.businessUnitName || bu.business_unit_name || bu.name || 'Unknown',
          id: bu.businessUnitId || bu.business_unit_id || bu.id
        }))
      };

      console.log('Transformed SAP codes:', transformedData.sapCodes.length, 'items');
      this.cache.sapCodes = transformedData;
      return transformedData;
    } catch (error) {
      console.error('Error fetching business units:', error);
      throw error;
    }
  }

  async fetchVenuesBySapCode(businessUnitId) {
    if (this.cache.venues[businessUnitId]) {
      return this.cache.venues[businessUnitId];
    }

    try {
      const response = await this.callCompassApi('locations', businessUnitId);
      console.log('Locations raw response:', response);

      // Handle different response structures
      let locations = [];
      if (Array.isArray(response)) {
        locations = response;
      } else if (response.locations && Array.isArray(response.locations)) {
        locations = response.locations;
      } else if (response.data?.locations) {
        locations = response.data.locations;
      }

      console.log('Extracted locations:', locations.length, 'items');

      const transformedData = {
        venues: locations.map(loc => ({
          id: loc.location_id || loc.locationId || loc.id,
          name: loc.location_name || loc.locationName || loc.name || 'Unknown Venue',
          locationId: loc.location_id || loc.locationId || loc.id,
          sapCode: businessUnitId,
          address: loc.address
        }))
      };

      console.log('Transformed venues:', transformedData.venues.length, 'items');
      this.cache.venues[businessUnitId] = transformedData;
      return transformedData;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  clearCache() {
    this.cache = {
      sapCodes: null,
      venues: {}
    };
  }

  clearVenuesCache(sapCode = null) {
    if (sapCode) {
      delete this.cache.venues[sapCode];
    } else {
      this.cache.venues = {};
    }
  }

  async fetchMenuItems(businessUnitId, locationId, date = null) {
    try {
      // Default to today if no date provided
      const menuDate = date || new Date().toISOString().split('T')[0];

      // Build the options object as per TRM API requirements
      const options = {
        filter: {
          locationId: locationId,
          startDate: menuDate,
          days: 1
        },
        include: {
          ingredients: true,
          icons: true,
          allergens: true,
          nutrientTypes: ['Standard']
        },
        page: {
          limit: 10000
        }
      };

      // Encode options and build the endpoint
      const encodedOptions = encodeURIComponent(JSON.stringify(options));
      const endpoint = `business_units/${businessUnitId}/menu_items?options=${encodedOptions}`;

      console.log('Fetching menu items:', { businessUnitId, locationId, date: menuDate });
      console.log('Full endpoint:', endpoint);
      console.log('Options being sent:', JSON.stringify(options, null, 2));

      const response = await this.callCompassApi(endpoint, businessUnitId);
      console.log('Menu items raw response:', response);

      // Handle different response structures
      let menuItems = [];
      if (Array.isArray(response)) {
        menuItems = response;
      } else if (response.data?.menuItems && Array.isArray(response.data.menuItems)) {
        menuItems = response.data.menuItems;
      } else if (response.menuItems && Array.isArray(response.menuItems)) {
        menuItems = response.menuItems;
      } else if (response.menu_items && Array.isArray(response.menu_items)) {
        menuItems = response.menu_items;
      } else if (response.data?.menu_items) {
        menuItems = response.data.menu_items;
      }

      console.log('Extracted menu items:', menuItems.length, 'items');

      // Transform and enrich the menu items data
      const transformedItems = menuItems.map(item => {
        // Extract meal station and meal period from itemGroupings
        let mealStation = 'Other';
        let mealPeriod = '';

        if (item.itemGroupings && Array.isArray(item.itemGroupings)) {
          const stationGrouping = item.itemGroupings.find(g => g.type === 'Station');
          const periodGrouping = item.itemGroupings.find(g => g.type === 'MealPeriod');

          if (stationGrouping && stationGrouping.name) {
            mealStation = stationGrouping.name;
          }
          if (periodGrouping && periodGrouping.name) {
            mealPeriod = periodGrouping.name;
          }
        }

        // Extract calories from nutrients array
        let calories = 0;
        if (item.nutrients && Array.isArray(item.nutrients)) {
          const calorieNutrient = item.nutrients.find(n =>
            n.name && (n.name.toLowerCase().includes('calorie') || n.name.toLowerCase().includes('energy'))
          );
          if (calorieNutrient && calorieNutrient.rawValue) {
            calories = Math.round(calorieNutrient.rawValue);
          }
        }

        // Transform icons to expected format
        const transformedIcons = (item.icons || []).map(icon => {
          const iconName = (icon.name || '').replace(/\s+/g, '').toLowerCase();
          return {
            name: icon.name,
            file_path: `media/icon_${iconName}.png`,
            display_name: icon.name,
            fileName: `media/icon_${iconName}.png`,
            icon_url: icon.iconUrl || icon.icon_url || icon.url || null
          };
        });

        return {
          id: item.id || item.menuItemId,
          name: item.name || item.menuItemName || 'Unknown Item',
          description: item.description || '',
          enticingDescription: item.enticingDescription || item.enticing_description || item.description || '',
          price: item.price || item.sellPrice || 0,
          calories: calories,
          mealStation: mealStation,
          mealPeriod: mealPeriod,
          ingredients: item.ingredients || [],
          allergens: item.allergens || [],
          icons: transformedIcons,
          nutrients: item.nutrients || [],
          itemGroupings: item.itemGroupings || [],
          date: menuDate,
          locationId: locationId,
          businessUnitId: businessUnitId
        };
      });

      // Extract unique meal stations
      const stations = [...new Set(transformedItems.map(item => item.mealStation))].sort();

      return {
        menuItems: transformedItems,
        stations: stations,
        date: menuDate,
        locationId: locationId,
        businessUnitId: businessUnitId
      };
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }
}

export const trmApiService = new TrmApiService();
