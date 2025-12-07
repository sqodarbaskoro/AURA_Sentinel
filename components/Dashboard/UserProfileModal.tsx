
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, ShieldAlert, Map, Plus, Trash2, Save, CheckCircle, AlertTriangle, Send, Lock, RefreshCw } from 'lucide-react';
import { User, DisasterType, SeverityLevel, AlertZone } from '../../types';
import { authService } from '../../services/authService';
import SimpleCaptcha from '../Auth/SimpleCaptcha';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (user: User) => void;
  onStartDrawing: () => void;
  tempZones?: AlertZone[]; 
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ 
  isOpen, onClose, user, onUpdateUser, onStartDrawing, tempZones 
}) => {
  const [formData, setFormData] = useState<User>(user);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [isResending, setIsResending] = useState(false);
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Security Check State
  const [isSensitiveEdit, setIsSensitiveEdit] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

  useEffect(() => {
    setFormData(user);
    // If pending update exists, user is viewing fresh data from parent
  }, [user]);

  useEffect(() => {
    if (tempZones) {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                watchZones: tempZones
            }
        }));
    }
  }, [tempZones]);

  // Detect sensitive changes
  useEffect(() => {
    const emailChanged = formData.preferences.email !== user.preferences.email;
    const passwordEntered = newPassword.length > 0;
    setIsSensitiveEdit(emailChanged || passwordEntered);
  }, [formData.preferences.email, newPassword, user.preferences.email]);

  const handleSave = () => {
    setStatusMsg('');

    // Validate Password if entered
    if (newPassword) {
        if (newPassword.length < 6) {
            setStatusType('error');
            setStatusMsg('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setStatusType('error');
            setStatusMsg('Passwords do not match.');
            return;
        }
    }

    // Security Check
    if (isSensitiveEdit && !isHuman) {
        setStatusType('error');
        setStatusMsg('Please complete the security check to update sensitive information.');
        return;
    }

    // Call Auth Service
    // Pass undefined for password if empty so it doesn't trigger logic
    const passwordToUpdate = newPassword || undefined;
    
    const result = authService.updateProfile(formData, passwordToUpdate);

    if (result.success) {
        // Refresh local user data from storage to reflect changes (or pending reverts)
        const updatedUser = authService.getCurrentUser();
        if (updatedUser) {
            onUpdateUser(updatedUser);
            setFormData(updatedUser);
        }

        setStatusType(result.pending ? 'info' : 'success');
        setStatusMsg(result.message || 'Saved successfully');
        
        // Clear sensitive fields
        setNewPassword('');
        setConfirmPassword('');
        
        if (!result.pending) {
            setTimeout(() => setStatusMsg(''), 2000);
        }
    } else {
        setStatusType('error');
        setStatusMsg(result.message || 'Update failed');
    }
  };

  const handleResendVerification = () => {
    if (!formData.preferences.email) return;
    setIsResending(true);
    authService.sendVerificationEmail(formData.id, formData.preferences.email);
    setTimeout(() => {
        setIsResending(false);
        setStatusType('success');
        setStatusMsg('Verification email sent!');
        setTimeout(() => setStatusMsg(''), 2000);
    }, 1000);
  };

  const deleteZone = (id: string) => {
    const updatedZones = formData.preferences.watchZones.filter(z => z.id !== id);
    setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, watchZones: updatedZones }
    }));
  };

  const toggleType = (type: DisasterType) => {
    const current = formData.preferences.subscribedTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    
    setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, subscribedTypes: updated }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900 rounded-t-xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-violet-600/20 rounded-lg border border-violet-500/30">
               <UserIcon className="text-violet-400 w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-100">User Profile</h2>
                <p className="text-xs text-slate-400">Manage your account and notification preferences</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
            
            {/* Account Info */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">Username</label>
                        <div className="px-3 py-2 bg-slate-800 rounded border border-slate-700 text-slate-300 cursor-not-allowed opacity-70">
                            {formData.username} <span className="text-xs text-slate-500 ml-2">({formData.role})</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 flex justify-between">
                            Email Address
                            {formData.preferences.emailVerified ? (
                                <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Verified</span>
                            ) : (
                                <span className="text-xs text-orange-400 flex items-center gap-1"><AlertTriangle size={12} /> Unverified</span>
                            )}
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input 
                                type="email" 
                                value={formData.preferences.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, email: e.target.value } }))}
                                className={`w-full bg-slate-950 border rounded px-3 py-2 pl-9 text-slate-200 outline-none focus:ring-1 focus:ring-violet-500 ${
                                    formData.preferences.emailVerified ? 'border-slate-700' : 'border-orange-500/30'
                                }`}
                                placeholder="name@example.com"
                            />
                            {!formData.preferences.emailVerified && formData.preferences.email && !formData.pendingUpdate && (
                                <button 
                                    onClick={handleResendVerification}
                                    disabled={isResending}
                                    className="absolute right-2 top-1.5 text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 px-2 py-1 rounded border border-orange-500/30 flex items-center gap-1 transition-all"
                                >
                                   <Send size={10} /> {isResending ? 'Sending...' : 'Verify'}
                                </button>
                            )}
                        </div>
                        {formData.pendingUpdate?.newEmail && (
                            <div className="bg-blue-900/20 border border-blue-900/50 p-2 rounded text-xs text-blue-300 flex gap-2 items-start mt-2">
                                <RefreshCw size={14} className="mt-0.5" />
                                <div>
                                    <p className="font-bold">Change Pending</p>
                                    <p>We sent a confirmation link to <span className="text-white">{formData.pendingUpdate.newEmail}</span>.</p>
                                    <p className="opacity-70 mt-1">Your current email ({formData.preferences.email}) remains active until confirmed.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Lock size={14} /> Security Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">New Password</label>
                        <input 
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:border-violet-500 outline-none placeholder-slate-600"
                            placeholder="Leave blank to keep current"
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">Confirm New Password</label>
                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={!newPassword}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:border-violet-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-600"
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                        />
                    </div>
                </div>
                
                {/* Security Captcha - Only if editing sensitive fields */}
                {isSensitiveEdit && (
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs text-orange-400 mb-2 flex items-center gap-1">
                            <ShieldAlert size={12} /> Security Check Required for Account Changes
                        </p>
                        <SimpleCaptcha onVerify={setIsHuman} />
                    </div>
                )}
            </div>

            {/* Notification Config */}
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                   <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Alert Configuration</h3>
                   <div className="flex items-center gap-2">
                      <label className="text-sm text-slate-300 mr-2">Enable Notifications</label>
                      <input 
                         type="checkbox"
                         disabled={!formData.preferences.emailVerified}
                         checked={formData.preferences.notificationsEnabled}
                         onChange={(e) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, notificationsEnabled: e.target.checked } }))}
                         className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Severity */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-slate-500" />
                            Minimum Severity
                        </label>
                        <div className="grid grid-cols-4 gap-1">
                        {Object.values(SeverityLevel).map((level) => (
                            <button
                            key={level}
                            onClick={() => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, minSeverity: level } }))}
                            className={`text-[10px] py-2 rounded border transition-all ${
                                formData.preferences.minSeverity === level
                                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                            }`}
                            >
                            {level}
                            </button>
                        ))}
                        </div>
                    </div>

                    {/* Subscriptions */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                        Interest Areas
                        </label>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                        {Object.values(DisasterType).map((type) => (
                            <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                                formData.preferences.subscribedTypes.includes(type)
                                ? 'bg-cyan-900/30 border-cyan-500 text-cyan-300'
                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                            }`}
                            >
                            {type}
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Watch Zones */}
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Map className="w-4 h-4" /> Custom Watch Zones
                    </h3>
                    <button 
                        onClick={() => { onClose(); onStartDrawing(); }}
                        className="text-xs bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 hover:bg-emerald-600/30 px-3 py-1.5 rounded flex items-center gap-1 transition-colors font-medium"
                    >
                        <Plus className="w-3 h-3" />
                        Draw New Zone
                    </button>
                </div>
                
                {formData.preferences.watchZones.length === 0 ? (
                    <div className="text-center py-6 bg-slate-800/30 rounded border border-dashed border-slate-700">
                        <Map className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No watch zones defined.</p>
                        <p className="text-xs text-slate-600">Draw a zone on the map to receive specific alerts for that area.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {formData.preferences.watchZones.map(zone => (
                            <div key={zone.id} className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700 hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm text-slate-200">{zone.name}</span>
                                </div>
                                <button 
                                    onClick={() => deleteZone(zone.id)}
                                    className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-700 transition-colors"
                                    title="Delete Zone"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 rounded-b-xl flex justify-between items-center">
             <div className={`text-sm font-medium ${
                 statusType === 'error' ? 'text-red-400' : 
                 statusType === 'success' ? 'text-emerald-400' : 'text-slate-400'
             }`}>
                 {statusMsg}
             </div>
             <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium shadow-lg shadow-violet-900/20 flex items-center gap-2 transition-all"
             >
                <Save className="w-4 h-4" />
                {isSensitiveEdit ? 'Update & Verify' : 'Save Changes'}
             </button>
        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
