
import React, { useState, useEffect } from 'react';
import { DisasterEvent, RiskAnalysisResult } from '../../types';
import { geminiService } from '../../services/geminiService';
import { Loader2, BrainCircuit, AlertOctagon, TrendingUp, ShieldAlert, FileDown, Printer } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsProps {
  selectedEvent: DisasterEvent | null;
}

const Analytics: React.FC<AnalyticsProps> = ({ selectedEvent }) => {
  const [analysis, setAnalysis] = useState<RiskAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedEvent) {
      setLoading(true);
      geminiService.analyzeDisasterRisk(selectedEvent)
        .then(setAnalysis)
        .finally(() => setLoading(false));
    } else {
      setAnalysis(null);
    }
  }, [selectedEvent]);

  // Mock data for charts
  const chartData = [
    { time: '00:00', intensity: 30 },
    { time: '04:00', intensity: 45 },
    { time: '08:00', intensity: 60 },
    { time: '12:00', intensity: 55 },
    { time: '16:00', intensity: 80 },
    { time: '20:00', intensity: 75 },
    { time: '24:00', intensity: 65 },
  ];

  const handlePrintReport = () => {
    if (!analysis || !selectedEvent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AURA Sentinel - Risk Analysis Report</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
          .header { border-bottom: 2px solid #4b5563; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; }
          .meta { text-align: right; font-size: 12px; color: #6b7280; }
          h1 { font-size: 28px; margin-bottom: 10px; color: #111827; }
          h2 { font-size: 18px; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; color: #374151; }
          .incident-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 5px solid #4f46e5; }
          .risk-score { font-size: 48px; font-weight: bold; color: ${analysis.riskScore > 75 ? '#dc2626' : '#ea580c'}; }
          .score-label { font-size: 14px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
          .section { margin-bottom: 20px; }
          .recommendations ul { list-style-type: none; padding: 0; }
          .recommendations li { background: #fff; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 8px; border-radius: 4px; }
          .recommendations li::before { content: "►"; color: #4f46e5; margin-right: 10px; }
          .footer { margin-top: 50px; font-size: 11px; text-align: center; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          @media print {
            button { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">AURA Sentinel</div>
          <div class="meta">
            REPORT ID: ${selectedEvent.id.substring(0,8).toUpperCase()}<br/>
            GENERATED: ${dateStr}<br/>
            CLASSIFICATION: OFFICIAL USE ONLY
          </div>
        </div>

        <div class="incident-box">
          <div style="font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 5px;">Incident Report</div>
          <h1 style="margin: 0;">${selectedEvent.title}</h1>
          <p style="margin: 5px 0 0 0; color: #4b5563;">
            <strong>Type:</strong> ${selectedEvent.type} | 
            <strong>Location:</strong> ${selectedEvent.location.lat.toFixed(4)}, ${selectedEvent.location.lng.toFixed(4)} | 
            <strong>Source:</strong> ${selectedEvent.source}
          </p>
        </div>

        <div style="display: flex; gap: 40px; margin-bottom: 30px;">
          <div style="flex: 1;">
            <div class="score-label">Risk Analysis Score</div>
            <div class="risk-score">${analysis.riskScore} <span style="font-size: 20px; color: #9ca3af; font-weight: normal;">/ 100</span></div>
            <p style="font-size: 14px; color: #4b5563;">Based on automated analysis of terrain, population density, and event severity.</p>
          </div>
          <div style="flex: 2;">
            <h2>Situation Summary</h2>
            <p>${analysis.summary}</p>
          </div>
        </div>

        <div class="section">
          <h2>Predicted Impact (48h Forecast)</h2>
          <p>${analysis.predictedImpact}</p>
        </div>

        <div class="section recommendations">
          <h2>Strategic Recommendations</h2>
          <ul>
            ${analysis.recommendedActions.map(action => `<li>${action}</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          Generated by AURA Sentinel (Automated Universal Risk Analysis). This report is generated by AI and should be verified by local authorities.
        </div>
        
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!selectedEvent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-slate-900 border-l border-slate-700">
        <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-slate-300">Predictive Analytics</h3>
        <p className="text-sm mt-2 max-w-xs">Select a disaster event from the map or list to generate AI-powered risk assessment.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 border-l border-slate-700 flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-slate-700 bg-slate-900 sticky top-0 z-10 flex justify-between items-center">
        <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="text-purple-400 w-5 h-5" />
            AI Risk Assessment
            </h2>
            <p className="text-xs text-slate-400 mt-1">Powered by Gemini 2.5 Flash</p>
        </div>
        {!loading && analysis && (
            <button 
                onClick={handlePrintReport}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 transition-colors"
                title="Generate Professional Report"
            >
                <Printer className="w-4 h-4" />
            </button>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* Risk Score */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400 animate-pulse">Analyzing terrain and data...</p>
          </div>
        ) : analysis ? (
          <>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertOctagon className="w-24 h-24" />
               </div>
               <div className="relative z-10">
                 <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Risk Score</span>
                 <div className="flex items-end gap-2 mt-1">
                   <span className={`text-4xl font-bold ${
                     analysis.riskScore > 75 ? 'text-red-400' : 
                     analysis.riskScore > 50 ? 'text-orange-400' : 'text-blue-400'
                   }`}>
                     {analysis.riskScore}
                   </span>
                   <span className="text-slate-500 mb-1">/ 100</span>
                 </div>
                 <div className="w-full bg-slate-700 h-2 rounded-full mt-3">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ${
                        analysis.riskScore > 75 ? 'bg-red-500' : 
                        analysis.riskScore > 50 ? 'bg-orange-500' : 'bg-blue-500'
                     }`} 
                     style={{ width: `${analysis.riskScore}%` }}
                   />
                 </div>
               </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  Situation Summary
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  {analysis.summary}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Predicted Impact (48h)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                  {analysis.predictedImpact}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-2">Recommended Actions</h3>
                <ul className="space-y-2">
                  {analysis.recommendedActions.map((action, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2 bg-slate-800/30 p-2 rounded">
                      <span className="text-blue-500 font-bold">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="h-48 mt-4 bg-slate-800/50 rounded-lg p-2 border border-slate-700">
               <h4 className="text-xs text-slate-400 mb-2 pl-2">Projected Intensity Trend</h4>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                   <defs>
                     <linearGradient id="colorIntensity" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                   <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} />
                   <YAxis stroke="#94a3b8" fontSize={10} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                     itemStyle={{ color: '#8884d8' }}
                   />
                   <Area type="monotone" dataKey="intensity" stroke="#8884d8" fillOpacity={1} fill="url(#colorIntensity)" />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
            
            <button 
                onClick={handlePrintReport}
                className="w-full mt-4 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg flex items-center justify-center gap-2 font-medium transition-all"
            >
                <FileDown className="w-4 h-4" />
                Export Official Report (PDF)
            </button>
          </>
        ) : (
          <div className="text-red-400 text-sm">Failed to load analysis.</div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
