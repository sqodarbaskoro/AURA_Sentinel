
import React, { useState, useEffect } from 'react';
import { X, Bell, Mail, ShieldAlert, Map, Plus, Trash2 } from 'lucide-react';
import { AlertConfig, DisasterType, SeverityLevel, AlertZone } from '../../types';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDrawing: () => void;
  savedZones?: AlertZone[];
}

const DEFAULT_CONFIG: AlertConfig = {
  email: '',
  enabled: false,
  minSeverity: SeverityLevel.HIGH,
  subscribedTypes: [DisasterType.FLOOD, DisasterType.TYPHOON, DisasterType.EARTHQUAKE, DisasterType.TSUNAMI],
  watchZones: []
};

const AlertsModal: React.FC<AlertsModalProps> = ({ isOpen, onClose, onStartDrawing, savedZones }) => {
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  // Sync with local storage and incoming props (for zones newly created)
  useEffect(() => {
    const stored = localStorage.getItem('aura_alert_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure watchZones exists if loading old config
      if (!parsed.watchZones) parsed.watchZones = [];
      setConfig(parsed);
    }
  }, []);

  // Update local state when parent component passes down new zones (after drawing)
  useEffect(() => {
    if (savedZones) {
      setConfig(prev => ({ ...prev, watchZones: savedZones }));
    }
  }, [savedZones]);

  const handleSave = () => {
    localStorage.setItem('aura_alert_config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        onClose();
    }, 1500);
  };

  const deleteZone = (id: string) => {
    const updatedZones = config.watchZones.filter(z => z.id !== id);
    const newConfig = { ...config, watchZones: updatedZones };
    setConfig(newConfig);
    // Auto save on delete to keep sync
    localStorage.setItem('aura_alert_config', JSON.stringify(newConfig));
  };

  const toggleType = (type: DisasterType) => {
    const current = config.subscribedTypes;
    if (current.includes(type)) {
      setConfig({ ...config, subscribedTypes: current.filter(t => t !== type) });
    } else {
      setConfig({ ...config, subscribedTypes: [...current, type] });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
            <Bell className="text-violet-400 w-5 h-5" />
            Alert Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Email Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-500" />
              Recipient Email
            </label>
            <input 
              type="email" 
              value={config.email}
              onChange={(e) => setConfig({...config, email: e.target.value})}
              placeholder="emergency.contact@agency.gov"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>

          {/* Watch Zones Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800/50">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-500" />
                Custom Watch Zones
                </label>
                <button 
                  onClick={() => { onClose(); onStartDrawing(); }}
                  className="text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 hover:bg-emerald-600/30 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Draw New
                </button>
            </div>
            
            <div className="space-y-2">
              {config.watchZones.length === 0 ? (
                <div className="text-xs text-slate-500 italic bg-slate-800/30 p-2 rounded">
                  No zones defined. Alerts will be based on entire region unless filters are set.
                </div>
              ) : (
                config.watchZones.map(zone => (
                  <div key={zone.id} className="flex justify-between items-center bg-slate-800 p-2 rounded border border-slate-700">
                    <span className="text-sm text-slate-300">{zone.name}</span>
                    <button 
                      onClick={() => deleteZone(zone.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Severity Threshold */}
          <div className="space-y-2 pt-2 border-t border-slate-800/50">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              Minimum Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.values(SeverityLevel).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfig({...config, minSeverity: level})}
                  className={`text-xs py-2 rounded-md border transition-all ${
                    config.minSeverity === level
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Disaster Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Subscribed Event Types
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
              {Object.values(DisasterType).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    config.subscribedTypes.includes(type)
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <input 
              type="checkbox" 
              checked={config.enabled}
              onChange={(e) => setConfig({...config, enabled: e.target.checked})}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-violet-600 focus:ring-violet-500"
            />
            <div className="text-sm">
              <p className="text-slate-200 font-medium">Enable Active Monitoring</p>
              <p className="text-slate-500 text-xs">Send alerts immediately when detected</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button 
            onClick={handleSave}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              saved 
                ? 'bg-green-600 text-white'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {saved ? 'Preferences Saved' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertsModal;
