
export enum DisasterType {
  FLOOD = 'Flood',
  EARTHQUAKE = 'Earthquake',
  TYPHOON = 'Typhoon',
  VOLCANO = 'Volcano',
  DISEASE = 'Disease',
  WILDFIRE = 'Wildfire',
  DROUGHT = 'Drought',
  LANDSLIDE = 'Landslide',
  TSUNAMI = 'Tsunami',
  STORM = 'Severe Storm'
}

export enum SeverityLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AlertZone {
  id: string;
  name: string;
  coordinates: Coordinates[]; // Polygon points
}

export interface DisasterEvent {
  id: string;
  title: string;
  type: DisasterType;
  severity: SeverityLevel;
  location: Coordinates;
  country: string;
  description: string;
  affectedPopulation?: number;
  timestamp: string; // ISO date string
  source?: string;
  isPrediction?: boolean;
}

export interface CountryData {
  name: string;
  code: string;
  center: Coordinates;
  zoom: number;
}

export interface RiskAnalysisResult {
  riskScore: number;
  summary: string;
  predictedImpact: string;
  recommendedActions: string[];
}

export interface UserPreferences {
  notificationsEnabled: boolean;
  email: string;
  emailVerified: boolean;
  minSeverity: SeverityLevel;
  subscribedTypes: DisasterType[];
  watchZones: AlertZone[];
}

export interface PendingUpdate {
  newEmail?: string;
  newPasswordHash?: string;
  verificationToken: string;
  requestedAt: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  preferences: UserPreferences;
  pendingUpdate?: PendingUpdate;
  createdAt: string;
}

// Keeping AlertConfig for backward compatibility if needed, but primarily using UserPreferences now
export interface AlertConfig extends UserPreferences {}
