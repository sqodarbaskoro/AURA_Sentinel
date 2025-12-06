
import React from 'react';
import { DisasterEvent, DisasterType, SeverityLevel } from '../../types';
import { DisasterIcon } from '../UI/Icons';
import { Search, Radar, MapPin } from 'lucide-react';
import { SEA_COUNTRIES } from '../../constants';

interface SidebarProps {
  disasters: DisasterEvent[];
  selectedDisaster: DisasterEvent | null;
  onSelectDisaster: (event: DisasterEvent) => void;
  filterType: DisasterType | 'ALL';
  setFilterType: (type: DisasterType | 'ALL') => void;
  filterSeverity: SeverityLevel | 'ALL';
  setFilterSeverity: (level: SeverityLevel | 'ALL') => void;
  filterLocation: string | 'ALL';
  setFilterLocation: (location: string | 'ALL') => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  disasters,
  selectedDisaster,
  onSelectDisaster,
  filterType,
  setFilterType,
  filterSeverity,
  setFilterSeverity,
  filterLocation,
  setFilterLocation
}) => {
  return (
    <div className="w-full h-full bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900 sticky top-0 z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
          <Radar className="text-cyan-400" />
          AURA Sentinel
        </h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide leading-tight">
          Automated Risk Analysis and Spread Prediction for the South East Asia Region
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-3 bg-slate-800/50 border-b border-slate-800">
        {/* Search Input */}
        <div className="relative">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
             <input 
               type="text" 
               placeholder="Search events..." 
               className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
             />
        </div>

        {/* Location Filter */}
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <select 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 appearance-none cursor-pointer"
          >
            <option value="ALL">All Locations</option>
            {SEA_COUNTRIES.map(country => (
              <option key={country.code} value={country.name}>{country.name}</option>
            ))}
            <option value="Region">Region / Other</option>
          </select>
          <div className="absolute right-3 top-3 pointer-events-none">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-1">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              filterType === 'ALL' 
                ? 'bg-violet-600/20 border-violet-500 text-violet-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            All Types
          </button>
          {Object.values(DisasterType).map(type => (
             <button
             key={type}
             onClick={() => setFilterType(type)}
             className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
               filterType === type 
                ? 'bg-violet-600/20 border-violet-500 text-violet-300' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
             }`}
           >
             {type}
           </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {disasters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 px-8 text-center">
            <Radar className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No active alerts matching your filters.</p>
          </div>
        ) : (
          disasters.map(event => (
            <div
              key={event.id}
              onClick={() => onSelectDisaster(event)}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg relative overflow-hidden group ${
                selectedDisaster?.id === event.id
                  ? 'bg-slate-800 border-violet-500 shadow-md ring-1 ring-violet-500/50'
                  : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    event.severity === SeverityLevel.CRITICAL ? 'bg-red-500/10 text-red-500' :
                    event.severity === SeverityLevel.HIGH ? 'bg-orange-500/10 text-orange-500' :
                    event.severity === SeverityLevel.MODERATE ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    <DisasterIcon type={event.type} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-200 line-clamp-1 group-hover:text-violet-300 transition-colors">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.country}
                      </span>
                      <span className="text-slate-600 text-[10px]">•</span>
                      <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-3 relative z-10 pl-11">
                 <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    event.severity === SeverityLevel.CRITICAL ? 'border-red-900/50 bg-red-900/20 text-red-400' :
                    event.severity === SeverityLevel.HIGH ? 'border-orange-900/50 bg-orange-900/20 text-orange-400' :
                    event.severity === SeverityLevel.MODERATE ? 'border-yellow-900/50 bg-yellow-900/20 text-yellow-400' :
                    'border-blue-900/50 bg-blue-900/20 text-blue-400'
                 }`}>
                   {event.severity}
                 </span>
                 {event.isPrediction && (
                   <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-purple-900/50 bg-purple-900/20 text-purple-400">
                     Forecast
                   </span>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
