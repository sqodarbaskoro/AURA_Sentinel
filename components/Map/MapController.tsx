
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Polygon, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DisasterEvent, SeverityLevel, DisasterType, AlertZone, Coordinates } from '../../types';
import { INITIAL_MAP_CENTER, INITIAL_ZOOM } from '../../constants';
import { Check, X as XIcon, Save } from 'lucide-react';

// Fix for Leaflet default icon not appearing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapControllerProps {
  disasters: DisasterEvent[];
  selectedDisaster: DisasterEvent | null;
  onSelectDisaster: (event: DisasterEvent) => void;
  isDrawingMode: boolean;
  onFinishDrawing: (points: Coordinates[], name: string) => void;
  onCancelDrawing: () => void;
  savedZones: AlertZone[];
}

// Component to handle flying to selected location
const MapFlyTo = ({ location }: { location: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo(location, 8, { duration: 1.5 });
    }
  }, [location, map]);
  return null;
};

// Component to handle drawing events
const DrawingLayer = ({ isDrawing, points, setPoints }: { isDrawing: boolean, points: Coordinates[], setPoints: React.Dispatch<React.SetStateAction<Coordinates[]>> }) => {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        // Use functional update to ensure we always have the latest state
        setPoints(prev => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
      }
    }
  });

  if (!isDrawing && points.length === 0) return null;

  return (
    <>
      {points.length > 0 && (
        <>
          {/* Show the path while drawing */}
          <Polyline 
            key={`line-${points.length}`} 
            positions={points.map(p => [p.lat, p.lng])} 
            pathOptions={{ color: '#10b981', dashArray: '5, 10', weight: 2 }} 
          />
          
          {/* Show points as CircleMarkers (radius in pixels) so they are visible at any zoom */}
          {points.map((p, idx) => (
             <CircleMarker 
                key={`point-${idx}`} 
                center={[p.lat, p.lng]} 
                radius={6} 
                pathOptions={{ color: '#fff', fillColor: '#10b981', fillOpacity: 1, weight: 2 }} 
             />
          ))}
          
          {/* Preview polygon if enough points */}
          {points.length > 2 && (
             <Polygon 
                key={`poly-${points.length}`}
                positions={points.map(p => [p.lat, p.lng])} 
                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2, stroke: false }} 
             />
          )}
        </>
      )}
    </>
  );
};

// Custom icons based on severity
const getIcon = (type: DisasterType, severity: SeverityLevel) => {
  let color = 'blue';
  if (severity === SeverityLevel.CRITICAL) color = 'red';
  else if (severity === SeverityLevel.HIGH) color = 'orange';
  else if (severity === SeverityLevel.MODERATE) color = 'gold';

  // Using a simple HTML div icon for performance and customization
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const MapController: React.FC<MapControllerProps> = ({
  disasters,
  selectedDisaster,
  onSelectDisaster,
  isDrawingMode,
  onFinishDrawing,
  onCancelDrawing,
  savedZones
}) => {
  const [currentPoints, setCurrentPoints] = useState<Coordinates[]>([]);
  const [showNameInput, setShowNameInput] = useState(false);
  const [zoneName, setZoneName] = useState('');

  // Reset local points when drawing mode changes
  useEffect(() => {
    if (!isDrawingMode) {
      setCurrentPoints([]);
      setShowNameInput(false);
      setZoneName('');
    }
  }, [isDrawingMode]);

  const handleInitialSave = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent map click
    if (currentPoints.length < 3) {
      alert("Please select at least 3 points to define a zone.");
      return;
    }
    setShowNameInput(true);
  };

  const handleFinalConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!zoneName.trim()) return;
    onFinishDrawing(currentPoints, zoneName);
  };

  const preventProp = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="h-full w-full relative bg-slate-900">
      
      {/* Drawing Controls Overlay */}
      {isDrawingMode && (
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-lg shadow-2xl flex flex-col items-center animate-in fade-in slide-in-from-top-4 min-w-[300px]"
          onMouseDown={preventProp}
          onClick={preventProp}
          onDoubleClick={preventProp}
        >
          <p className="text-emerald-400 font-bold mb-2 text-sm uppercase tracking-wide">Drawing Watch Zone</p>
          
          {!showNameInput ? (
            <>
              <p className="text-slate-300 text-xs mb-4">Click on map to define points ({currentPoints.length} points selected)</p>
              <div className="flex gap-2 w-full justify-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); onCancelDrawing(); }}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  <XIcon className="w-3 h-3" /> Cancel
                </button>
                <button 
                  onClick={handleInitialSave}
                  disabled={currentPoints.length < 3}
                  className={`px-4 py-2 rounded text-white border text-xs font-medium flex items-center gap-2 transition-colors ${
                    currentPoints.length >= 3 
                    ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-900/20' 
                    : 'bg-slate-700 text-slate-500 border-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3 h-3" /> Save Zone
                </button>
              </div>
            </>
          ) : (
            <div className="w-full space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Zone Name</label>
                <input 
                  type="text" 
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. My Neighborhood"
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none"
                  autoFocus
                  onClick={preventProp}
                />
              </div>
              <div className="flex gap-2 w-full">
                 <button 
                  onClick={() => setShowNameInput(false)}
                  className="flex-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs"
                >
                  Back
                </button>
                <button 
                  onClick={handleFinalConfirm}
                  disabled={!zoneName.trim()}
                  className={`flex-1 px-3 py-1.5 rounded text-white border text-xs font-medium flex items-center justify-center gap-1 ${
                    zoneName.trim()
                    ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500' 
                    : 'bg-slate-700 text-slate-500 border-slate-600'
                  }`}
                >
                  <Save className="w-3 h-3" /> Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <MapContainer 
        center={INITIAL_MAP_CENTER} 
        zoom={INITIAL_ZOOM} 
        scrollWheelZoom={true} 
        className={`h-full w-full z-0 ${isDrawingMode ? 'cursor-crosshair' : ''}`}
        style={{ background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapFlyTo location={selectedDisaster ? selectedDisaster.location : null} />
        
        <DrawingLayer isDrawing={isDrawingMode} points={currentPoints} setPoints={setCurrentPoints} />

        {/* Render Saved Zones */}
        {savedZones && savedZones.map(zone => (
          <Polygon 
            key={zone.id}
            positions={zone.coordinates.map(p => [p.lat, p.lng])}
            pathOptions={{ 
              color: '#34d399', 
              fillColor: '#34d399', 
              fillOpacity: 0.1, 
              weight: 1, 
              dashArray: '5, 5' 
            }}
          >
             {/* Optional: Add tooltip to zone */}
             <Popup>{zone.name} (Watch Zone)</Popup>
          </Polygon>
        ))}

        {disasters.map((event) => (
          <React.Fragment key={event.id}>
             {/* Pulse effect for high severity */}
             {(event.severity === SeverityLevel.CRITICAL || event.severity === SeverityLevel.HIGH) && (
               <Circle
                 center={event.location}
                 radius={event.severity === SeverityLevel.CRITICAL ? 50000 : 25000}
                 pathOptions={{ 
                   color: event.severity === SeverityLevel.CRITICAL ? '#ef4444' : '#f97316', 
                   fillColor: event.severity === SeverityLevel.CRITICAL ? '#ef4444' : '#f97316', 
                   fillOpacity: 0.2,
                   weight: 1
                 }}
               />
             )}
             
            <Marker 
              position={event.location}
              icon={getIcon(event.type, event.severity)}
              eventHandlers={{
                click: () => !isDrawingMode && onSelectDisaster(event),
              }}
            >
              <Popup className="custom-popup">
                <div className="text-slate-900">
                  <h3 className="font-bold text-sm">{event.title}</h3>
                  <p className="text-xs m-0">{event.type} • {event.severity}</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>
      
      {/* Legend Overlay */}
      {!isDrawingMode && (
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded text-xs text-slate-200">
          <h4 className="font-bold mb-2 text-slate-400 uppercase tracking-wider">Severity</h4>
          <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div> Critical</div>
          <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-orange-500 border border-white"></div> High</div>
          <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-yellow-400 border border-white"></div> Moderate</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div> Low</div>
        </div>
      )}
    </div>
  );
};

export default MapController;
