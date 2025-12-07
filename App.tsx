
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Dashboard/Sidebar';
import MapController from './components/Map/MapController';
import Analytics from './components/Dashboard/Analytics';
import UserProfileModal from './components/Dashboard/UserProfileModal';
import AdminPanel from './components/Admin/AdminPanel';
import AuthPage from './components/Auth/AuthPage';
import { Toast } from './components/UI/Toast';

import { DisasterEvent, DisasterType, SeverityLevel, AlertZone, Coordinates, User } from './types';
import { disasterService } from './services/disasterService';
import { authService } from './services/authService';
import { notificationService } from './services/notificationService';

import { Menu, X, User as UserIcon, Shield, LogIn } from 'lucide-react';

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // App Data State
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  
  // Notification Toast State
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Initialize Auth & Handle Verification Param
  useEffect(() => {
    authService.init(); // Init admin if needed
    const user = authService.getCurrentUser();
    if (user) setCurrentUser(user);

    // Check for verification params
    const urlParams = new URLSearchParams(window.location.search);
    const verifyId = urlParams.get('verify_user');
    const updateToken = urlParams.get('confirm_update');
    
    // Scenario 1: Activation
    if (verifyId) {
        const success = authService.verifyUserEmail(verifyId);
        if (success) {
            setToastMsg('Email Verified Successfully! You can now receive alerts.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
            
            // Refresh user if it's the current user
            if (user && user.id === verifyId) {
                const refreshed = authService.getCurrentUser();
                setCurrentUser(refreshed);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // Scenario 2: Change Confirmation
    if (updateToken) {
        const success = authService.confirmPendingUpdate(updateToken);
        if (success) {
            setToastMsg('Account Changes Confirmed and Applied.');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
            
            // Refresh user data
            const refreshed = authService.getCurrentUser();
            if (refreshed) setCurrentUser(refreshed);
            
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
  }, []);

  // Initialize Data Loop
  useEffect(() => {
    const loadData = async () => {
      const data = await disasterService.getAllDisasters();
      setDisasters(data);
      
      // Check for notifications only if user is logged in
      if (currentUser) {
        const sentAlerts = notificationService.checkAndSendAlerts(data, currentUser);
        if (sentAlerts.length > 0) {
          setToastMsg(`${sentAlerts.length} alert(s) sent to ${currentUser.preferences.email}`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
        }
      }
    };
    
    loadData();
    const interval = setInterval(loadData, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentUser]); // Re-run if user changes (e.g. preferences update or login)

  // Filter Logic
  useEffect(() => {
    let result = disasters;
    if (filterType !== 'ALL') result = result.filter(d => d.type === filterType);
    if (filterSeverity !== 'ALL') result = result.filter(d => d.severity === filterSeverity);
    if (filterLocation !== 'ALL') result = result.filter(d => d.country === filterLocation);
    setFilteredDisasters(result);
  }, [disasters, filterType, filterSeverity, filterLocation]);

  // Mobile check
  useEffect(() => {
    if (window.innerWidth < 768) setShowLeftPanel(false);
  }, []);

  const handleSelectDisaster = (event: DisasterEvent) => {
    setSelectedDisaster(event);
    setShowRightPanel(true); 
    if (window.innerWidth < 1024) setShowLeftPanel(false);
  };

  const handleFinishDrawing = (points: Coordinates[], name: string) => {
    if (!currentUser) {
        setIsDrawingMode(false);
        setShowAuthModal(true);
        setToastMsg("Please login to save Watch Zones");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
    }

    const newZone: AlertZone = {
      id: Date.now().toString(),
      name,
      coordinates: points
    };
    
    const updatedUser = { 
        ...currentUser, 
        preferences: {
            ...currentUser.preferences,
            watchZones: [...currentUser.preferences.watchZones, newZone]
        }
    };
    
    // Auth Service handles persistence and checking if specific fields changed
    authService.updateProfile(updatedUser);
    
    // Fetch fresh to ensure we have any side-effects (though here it's just zones)
    setCurrentUser(updatedUser); 
    
    setIsDrawingMode(false);
    setShowProfileModal(true);
  };

  const handleProfileClick = () => {
      if (currentUser) {
          setShowProfileModal(true);
      } else {
          setShowAuthModal(true);
      }
  };

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      setShowAuthModal(false);
      setToastMsg(`Welcome back, ${user.username}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogout = () => {
      authService.logout();
      setCurrentUser(null);
      // We don't clear disasters, guest can still see them
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden relative font-sans">
      
      {/* Toast Notification */}
      <Toast message={toastMsg} visible={showToast} />

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm">
            <AuthPage 
                onLogin={handleLoginSuccess} 
                onClose={() => setShowAuthModal(false)}
            />
        </div>
      )}

      {/* Header Controls */}
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
         {currentUser?.role === 'ADMIN' && (
             <button 
             onClick={() => setShowAdminPanel(true)}
             className="bg-red-900/80 backdrop-blur px-3 py-2 rounded-lg border border-red-700 text-red-100 shadow-xl hover:bg-red-800 transition-colors flex items-center gap-2"
             title="Admin Panel"
           >
             <Shield size={16} /> <span className="text-xs font-bold hidden sm:inline">ADMIN</span>
           </button>
         )}
         <button 
          onClick={handleProfileClick}
          className="bg-slate-900/90 backdrop-blur p-2.5 rounded-lg border border-slate-700 text-white shadow-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
          title={currentUser ? "User Profile" : "Login / Register"}
        >
          {currentUser ? <UserIcon size={20} /> : <LogIn size={20} />}
        </button>
      </div>

      {/* Left Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-full sm:w-80 bg-slate-900 border-r border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out
        ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full pt-16 sm:pt-0 flex flex-col">
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
             <div className="p-4 border-t border-slate-800 bg-slate-900">
                 {currentUser ? (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Logged in as <span className="text-slate-300 font-medium">{currentUser.username}</span></span>
                        <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">Logout</button>
                    </div>
                 ) : (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 italic">Guest Mode</span>
                        <button 
                            onClick={() => setShowAuthModal(true)} 
                            className="text-xs bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 px-3 py-1.5 rounded transition-colors"
                        >
                            Login / Register
                        </button>
                    </div>
                 )}
             </div>
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
          onCancelDrawing={() => { setIsDrawingMode(false); }}
          savedZones={currentUser?.preferences.watchZones || []}
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
      {currentUser && (
        <UserProfileModal 
            isOpen={showProfileModal} 
            onClose={() => setShowProfileModal(false)} 
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onStartDrawing={() => setIsDrawingMode(true)}
        />
      )}

      {currentUser && (
          <AdminPanel 
            isOpen={showAdminPanel}
            onClose={() => setShowAdminPanel(false)}
            currentUser={currentUser}
          />
      )}

    </div>
  );
}

export default App;
