/**
 * Location Search Utility
 * Uses Nominatim (OpenStreetMap) API for geocoding searches in Winnipeg
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const WINNIPEG_BOUNDING_BOX = '-97.325,49.766,-96.953,50.015'; // viewbox format: minLon,minLat,maxLon,maxLat

/**
 * Search for locations using Nominatim API
 * @param {string} query - Search query (e.g., "University of Manitoba")
 * @returns {Promise<Array>} Array of location results
 */
export const searchLocation = async (query) => {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      limit: 5,
      countrycodes: 'ca',
      bounded: 1,
      viewbox: WINNIPEG_BOUNDING_BOX,
      addressdetails: 1,
      extratags: 1
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Winnipen/1.0 (Winnipeg Community App)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the results to a more usable format
    return data.map(result => ({
      id: result.place_id,
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      type: result.type,
      importance: result.importance,
      address: result.address || {}
    }));

  } catch (error) {
    console.error('Location search error:', error);
    throw new Error('Failed to search for locations. Please try again.');
  }
};

/**
 * Format location name for display
 * @param {Object} location - Location object from search results
 * @returns {string} Formatted display name
 */
export const formatLocationName = (location) => {
  if (!location) return '';
  
  // Extract the most relevant part of the display name
  const parts = location.name.split(', ');
  
  // For addresses, show street + area
  if (location.type === 'house' || location.type === 'building') {
    return parts.slice(0, 2).join(', ');
  }
  
  // For landmarks/places, show the main name + area
  if (parts.length > 2) {
    return parts.slice(0, 2).join(', ');
  }
  
  return location.name;
};

/**
 * Get a shorter description for the location
 * @param {Object} location - Location object from search results
 * @returns {string} Short description
 */
export const getLocationDescription = (location) => {
  if (!location) return '';
  
  const parts = location.name.split(', ');
  
  // Return the area/neighborhood part
  if (parts.length > 2) {
    return parts.slice(2, 4).join(', ');
  }
  
  return location.type || 'Location';
};



