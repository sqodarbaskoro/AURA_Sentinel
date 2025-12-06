import React from 'react';
import { 
  CloudRain, 
  Activity, 
  Wind, 
  Mountain, 
  Skull, 
  Flame, 
  ThermometerSun,
  AlertTriangle,
  Waves
} from 'lucide-react';
import { DisasterType } from '../../types';

export const DisasterIcon = ({ type, className = "w-5 h-5" }: { type: DisasterType, className?: string }) => {
  switch (type) {
    case DisasterType.FLOOD: return <CloudRain className={className} />;
    case DisasterType.EARTHQUAKE: return <Activity className={className} />;
    case DisasterType.TYPHOON: return <Wind className={className} />;
    case DisasterType.VOLCANO: return <Mountain className={className} />;
    case DisasterType.DISEASE: return <Skull className={className} />;
    case DisasterType.WILDFIRE: return <Flame className={className} />;
    case DisasterType.DROUGHT: return <ThermometerSun className={className} />;
    case DisasterType.TSUNAMI: return <Waves className={className} />;
    default: return <AlertTriangle className={className} />;
  }
};
