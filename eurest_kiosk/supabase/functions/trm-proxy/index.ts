import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const COMPASS_API_BASE_URL = 'https://api.compass-usa.com/stg/v3';
const WT_CLIENT_ID = '8loN9Fntzho1MXaGHmYvQVmksmvRQoaQVIMplYo';
const X_IBM_CLIENT_ID = '1a9632a1-676b-4c3c-9c5a-73de9d2b8621';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { endpoint, businessUnitId } = await req.json();

    console.log('=== EDGE FUNCTION RECEIVED ===');
    console.log('Endpoint:', endpoint);
    console.log('Business Unit ID:', businessUnitId);

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    let url = '';
    if (endpoint === 'business_units') {
      url = `${COMPASS_API_BASE_URL}/business_units`;
    } else if (endpoint === 'locations' && businessUnitId) {
      url = `${COMPASS_API_BASE_URL}/business_units/${businessUnitId}/locations`;
    } else if (endpoint.startsWith('business_units/') && endpoint.includes('/menu_items')) {
      url = `${COMPASS_API_BASE_URL}/${endpoint}`;
    } else {
      console.error('Invalid endpoint:', endpoint);
      return new Response(
        JSON.stringify({ error: 'Invalid endpoint or missing parameters', endpoint }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log('=== CALLING COMPASS API ===');
    console.log('Full URL:', url);
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'WT-Client-Id': WT_CLIENT_ID,
      'X-IBM-Client-Id': X_IBM_CLIENT_ID,
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'WT-Client-Id': WT_CLIENT_ID,
        'X-IBM-Client-Id': X_IBM_CLIENT_ID,
      },
    });

    console.log('=== COMPASS API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Compass API Error Response:', errorText);
      return new Response(
        JSON.stringify({ error: `Compass API request failed: ${response.status}`, details: errorText }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();
    console.log('Response data type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('Response data keys:', Object.keys(data));
    if (Array.isArray(data)) {
      console.log('Array length:', data.length);
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error in Compass API proxy:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
