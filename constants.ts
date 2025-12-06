import { CountryData, Coordinates, DisasterType, SeverityLevel, DisasterEvent } from './types';

export const SEA_COUNTRIES: CountryData[] = [
  { name: 'Indonesia', code: 'ID', center: { lat: -0.7893, lng: 113.9213 }, zoom: 5 },
  { name: 'Philippines', code: 'PH', center: { lat: 12.8797, lng: 121.7740 }, zoom: 6 },
  { name: 'Vietnam', code: 'VN', center: { lat: 14.0583, lng: 108.2772 }, zoom: 6 },
  { name: 'Thailand', code: 'TH', center: { lat: 15.8700, lng: 100.9925 }, zoom: 6 },
  { name: 'Myanmar', code: 'MM', center: { lat: 21.9162, lng: 95.9560 }, zoom: 5 },
  { name: 'Malaysia', code: 'MY', center: { lat: 4.2105, lng: 101.9758 }, zoom: 6 },
  { name: 'Cambodia', code: 'KH', center: { lat: 12.5657, lng: 104.9910 }, zoom: 7 },
  { name: 'Laos', code: 'LA', center: { lat: 19.8563, lng: 102.4955 }, zoom: 6 },
  { name: 'Singapore', code: 'SG', center: { lat: 1.3521, lng: 103.8198 }, zoom: 10 },
  { name: 'Brunei', code: 'BN', center: { lat: 4.5353, lng: 114.7277 }, zoom: 9 },
  { name: 'Timor-Leste', code: 'TL', center: { lat: -8.8742, lng: 125.7275 }, zoom: 8 },
];

export const INITIAL_MAP_CENTER: Coordinates = { lat: 10.0, lng: 110.0 };
export const INITIAL_ZOOM = 5;

// Mock data to initialize the app before APIs load
export const MOCK_DISASTERS: DisasterEvent[] = [
  {
    id: 'mock-1',
    title: 'Tropical Depression 04W',
    type: DisasterType.TYPHOON,
    severity: SeverityLevel.MODERATE,
    location: { lat: 13.5, lng: 125.0 },
    country: 'Philippines',
    description: 'Developing tropical depression approaching Eastern Samar.',
    affectedPopulation: 50000,
    timestamp: new Date().toISOString(),
    source: 'Simulated News Stream'
  },
  {
    id: 'mock-2',
    title: 'Mount Merapi Activity',
    type: DisasterType.VOLCANO,
    severity: SeverityLevel.HIGH,
    location: { lat: -7.5407, lng: 110.4457 },
    country: 'Indonesia',
    description: 'Increased seismic activity and ash plumes detected.',
    affectedPopulation: 120000,
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    source: 'Global Volcanism Feed'
  }
];
