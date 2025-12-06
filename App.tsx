
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Dashboard/Sidebar';
import MapController from './components/Map/MapController';
import Analytics from './components/Dashboard/Analytics';
import AlertsModal from './components/Dashboard/AlertsModal';
import { DisasterEvent, DisasterType, SeverityLevel, AlertZone, Coordinates } from './types';
import { disasterService } from './services/disasterService';
import { Menu, X, Bell } from 'lucide-react';

function App() {
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [filteredDisasters, setFilteredDisasters] = useState<DisasterEvent[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterEvent | null>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<DisasterType | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'ALL'>('ALL');
  const [filterLocation, setFilterLocation] = useState<string | 'ALL'>('ALL');
  
  // UI State
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Watch Zones State
  const [watchZones, setWatchZones] = useState<AlertZone[]>([]);

  // Initialize Data
  useEffect(() => {
    const loadData = async () => {
      const data = await disasterService.getAllDisasters();
      setDisasters(data);
    };
    loadData();

    // Load saved zones from local storage for map visualization
    const storedConfig = localStorage.getItem('aura_alert_config');
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      if (parsed.watchZones) setWatchZones(parsed.watchZones);
    }

    // Auto-refresh interval (simulated real-time)
    const interval = setInterval(loadData, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = disasters;
    
    // Type Filter
    if (filterType !== 'ALL') {
      result = result.filter(d => d.type === filterType);
    }
    
    // Severity Filter
    if (filterSeverity !== 'ALL') {
      result = result.filter(d => d.severity === filterSeverity);
    }

    // Location Filter
    if (filterLocation !== 'ALL') {
      result = result.filter(d => d.country === filterLocation);
    }

    setFilteredDisasters(result);
  }, [disasters, filterType, filterSeverity, filterLocation]);

  // Handle auto-closing sidebar on mobile when loaded first time
  useEffect(() => {
    if (window.innerWidth < 768) {
      setShowLeftPanel(false);
    }
  }, []);

  const handleSelectDisaster = (event: DisasterEvent) => {
    setSelectedDisaster(event);
    setShowRightPanel(true); 
    if (window.innerWidth < 1024) {
      setShowLeftPanel(false);
    }
  };

  const handleFinishDrawing = (points: Coordinates[], name: string) => {
    const newZone: AlertZone = {
      id: Date.now().toString(),
      name,
      coordinates: points
    };
    const updatedZones = [...watchZones, newZone];
    setWatchZones(updatedZones);
    
    // Update local storage via the modal's expected format (managed in modal usually, but we sync here)
    const storedConfig = localStorage.getItem('aura_alert_config');
    let config = storedConfig ? JSON.parse(storedConfig) : {};
    config.watchZones = updatedZones;
    localStorage.setItem('aura_alert_config', JSON.stringify(config));
    
    setIsDrawingMode(false);
    setShowAlertsModal(true);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden relative font-sans">
      
      {/* Mobile/Tablet Header & Controls */}
      <div className="absolute top-4 left-4 z-[50] flex gap-2">
        <button 
          onClick={() => setShowLeftPanel(!showLeftPanel)}
          className="bg-slate-900/90 backdrop-blur p-2.5 rounded-lg border border-slate-700 text-white shadow-xl hover:bg-slate-800 transition-colors"
          title="Toggle List"
        >
          {showLeftPanel ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="absolute top-4 right-4 z-[50] flex gap-2">
         <button 
          onClick={() => setShowAlertsModal(true)}
          className="bg-slate-900/90 backdrop-blur p-2.5 rounded-lg border border-slate-700 text-white shadow-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
          title="Alert Settings"
        >
          <Bell size={20} className={showAlertsModal ? "text-violet-400" : ""} />
        </button>
      </div>

      {/* Left Sidebar - Disaster List */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-full sm:w-80 bg-slate-900 border-r border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Padding top for mobile close button clearance */}
        <div className="h-full pt-16 sm:pt-0">
             <Sidebar 
                disasters={filteredDisasters}
                selectedDisaster={selectedDisaster}
                onSelectDisaster={handleSelectDisaster}
                filterType={filterType}
                setFilterType={setFilterType}
                filterSeverity={filterSeverity}
                setFilterSeverity={setFilterSeverity}
                filterLocation={filterLocation}
                setFilterLocation={setFilterLocation}
                />
        </div>
      </div>

      {/* Main Content (Map) */}
      <div className="flex-1 relative h-full w-full">
        <MapController 
          disasters={filteredDisasters}
          selectedDisaster={selectedDisaster}
          onSelectDisaster={handleSelectDisaster}
          isDrawingMode={isDrawingMode}
          onFinishDrawing={handleFinishDrawing}
          onCancelDrawing={() => { setIsDrawingMode(false); setShowAlertsModal(true); }}
          savedZones={watchZones}
        />
      </div>

      {/* Right Analytics Panel */}
      <div className={`
        fixed inset-y-0 right-0 z-[60] w-full sm:w-[450px] transform transition-transform duration-300 ease-in-out bg-slate-900 border-l border-slate-800 shadow-2xl
        ${showRightPanel ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="absolute top-3 right-3 z-[70]">
          <button 
             onClick={() => setShowRightPanel(false)}
             className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="h-full pt-4">
             <Analytics selectedEvent={selectedDisaster} />
        </div>
      </div>

      {/* Modals */}
      <AlertsModal 
        isOpen={showAlertsModal} 
        onClose={() => setShowAlertsModal(false)} 
        onStartDrawing={() => setIsDrawingMode(true)}
        savedZones={watchZones}
      />

    </div>
  );
}

export default App;
