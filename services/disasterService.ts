
import { DisasterEvent, DisasterType, SeverityLevel, Coordinates, AlertZone } from "../types";
import { MOCK_DISASTERS, SEA_COUNTRIES } from "../constants";

// Helper to determine severity based on magnitude
const getEarthquakeSeverity = (mag: number): SeverityLevel => {
  if (mag >= 7.0) return SeverityLevel.CRITICAL;
  if (mag >= 6.0) return SeverityLevel.HIGH;
  if (mag >= 5.0) return SeverityLevel.MODERATE;
  return SeverityLevel.LOW;
};

// Helper to map USGS type to our enum
const mapUSGSType = (type: string): DisasterType => {
  return DisasterType.EARTHQUAKE;
};

// Helper to map NASA Categories
const mapNASACategory = (id: string): DisasterType | null => {
  switch (id) {
    case '8': return DisasterType.WILDFIRE;
    case '10': return DisasterType.STORM;
    case '12': return DisasterType.VOLCANO;
    case '15': return DisasterType.FLOOD; // Sea and Lake Ice? Sometimes used for floods
    default: return null;
  }
};

// Helper to determine country from coordinates using simple distance heuristic to SEA country centers
const getCountryFromCoordinates = (lat: number, lng: number): string => {
  let closestCountry = 'International Waters'; // Default if too far
  let minDistance = Infinity;

  for (const country of SEA_COUNTRIES) {
    // Simple Euclidean distance (sufficient for this scale/purpose)
    const dist = Math.sqrt(
      Math.pow(lat - country.center.lat, 2) + 
      Math.pow(lng - country.center.lng, 2)
    );

    // Rough radius check (approx 10-15 degrees)
    if (dist < minDistance) {
      minDistance = dist;
      closestCountry = country.name;
    }
  }

  // If the closest is reasonably close (e.g., within ~12 degrees ~1300km), assign it.
  // Otherwise default to generic Region.
  return minDistance < 12 ? closestCountry : 'Region';
};

export const disasterService = {
  /**
   * Checks if a point is inside a polygon using Ray-Casting algorithm
   */
  isPointInPolygon(point: Coordinates, zone: AlertZone): boolean {
    const { lat: x, lng: y } = point;
    const poly = zone.coordinates;
    
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].lat, yi = poly[i].lng;
      const xj = poly[j].lat, yj = poly[j].lng;
      
      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  },

  /**
   * Checks if an event triggers a custom zone alert
   */
  checkEventInZones(event: DisasterEvent, zones: AlertZone[]): string | null {
    if (!zones || zones.length === 0) return null;
    
    for (const zone of zones) {
      if (this.isPointInPolygon(event.location, zone)) {
        return zone.name;
      }
    }
    return null;
  },

  /**
   * Fetches recent earthquakes from USGS
   */
  async fetchEarthquakes(): Promise<DisasterEvent[]> {
    try {
      // Last 7 days, min magnitude 4.5, roughly SEA region
      const end = new Date().toISOString();
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&endtime=${end}&minmagnitude=4.5&minlatitude=-11&maxlatitude=28&minlongitude=92&maxlongitude=142`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.features) return [];

      return data.features.map((feature: any) => {
        const lat = feature.geometry.coordinates[1];
        const lng = feature.geometry.coordinates[0];
        
        return {
          id: feature.id,
          title: `M ${feature.properties.mag} Earthquake - ${feature.properties.place}`,
          type: mapUSGSType(feature.properties.type),
          severity: getEarthquakeSeverity(feature.properties.mag),
          location: { lat, lng },
          country: getCountryFromCoordinates(lat, lng),
          description: `Depth: ${feature.geometry.coordinates[2]}km. Status: ${feature.properties.status}.`,
          affectedPopulation: 0,
          timestamp: new Date(feature.properties.time).toISOString(),
          source: 'USGS'
        };
      });
    } catch (error) {
      console.error("Failed to fetch earthquakes:", error);
      return [];
    }
  },

  /**
   * Fetches data from NASA EONET (Earth Observatory Natural Event Tracker)
   */
  async fetchNASAEONET(): Promise<DisasterEvent[]> {
    try {
      // Fetch open events
      const response = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20');
      const data = await response.json();
      
      if (!data.events) return [];

      const seaBounds = {
        minLat: -11, maxLat: 28,
        minLng: 92, maxLng: 142
      };

      const events: DisasterEvent[] = [];

      data.events.forEach((event: any) => {
        // Check if category is relevant
        const type = mapNASACategory(event.categories[0].id);
        if (!type) return;

        // Get latest geometry
        const geometry = event.geometry[event.geometry.length - 1];
        const lat = geometry.coordinates[1];
        const lng = geometry.coordinates[0];

        // Simple bounding box filter for SEA region
        if (lat >= seaBounds.minLat && lat <= seaBounds.maxLat && 
            lng >= seaBounds.minLng && lng <= seaBounds.maxLng) {
              
          events.push({
            id: event.id,
            title: event.title,
            type: type,
            severity: SeverityLevel.MODERATE, // Default, as EONET doesn't provide severity scores
            location: { lat, lng },
            country: getCountryFromCoordinates(lat, lng),
            description: event.description || `Active ${type} detected by NASA satellites.`,
            affectedPopulation: 0,
            timestamp: geometry.date,
            source: 'NASA EONET'
          });
        }
      });

      return events;

    } catch (error) {
      console.error("Failed to fetch NASA data:", error);
      return [];
    }
  },

  /**
   * Combines mock data with real data sources
   */
  async getAllDisasters(): Promise<DisasterEvent[]> {
    const [earthquakes, nasaEvents] = await Promise.all([
      this.fetchEarthquakes(),
      this.fetchNASAEONET()
    ]);
    
    // Sort by date descending
    const combined = [...MOCK_DISASTERS, ...earthquakes, ...nasaEvents];
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};
