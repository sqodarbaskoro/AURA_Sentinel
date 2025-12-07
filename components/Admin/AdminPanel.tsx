
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { authService } from '../../services/authService';
import { Users, Trash2, X, Shield, Search } from 'lucide-react';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUsers(authService.getAllUsers());
        }
    }, [isOpen]);

    const handleDelete = (id: string) => {
        if (id === currentUser.id) {
            alert("You cannot delete your own account.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this user?")) {
            authService.deleteUser(id);
            setUsers(authService.getAllUsers());
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) || 
        u.preferences.email.toLowerCase().includes(search.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl h-[80vh] flex flex-col">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Shield className="text-red-500" /> 
                            Admin Control Panel
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">User Management & System Overview</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-slate-200 focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-500 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Notifications</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                                                <Users size={14} />
                                            </div>
                                            <span className="font-medium text-slate-200">{user.username}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded border ${
                                            user.role === 'ADMIN' 
                                            ? 'bg-red-900/20 border-red-800 text-red-400' 
                                            : 'bg-blue-900/20 border-blue-800 text-blue-400'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">{user.preferences.email || '-'}</td>
                                    <td className="p-4">
                                        <div className={`w-2 h-2 rounded-full ${user.preferences.notificationsEnabled ? 'bg-green-500' : 'bg-slate-600'}`} />
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(user.id)}
                                            disabled={user.role === 'ADMIN'} // Prevent deleting other admins for safety in this demo
                                            className={`p-2 rounded hover:bg-red-900/20 hover:text-red-400 transition-colors ${
                                                user.role === 'ADMIN' ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500'
                                            }`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
