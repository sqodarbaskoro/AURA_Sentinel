
import React, { useState } from 'react';
import { Radar, ShieldCheck, UserPlus, LogIn, X } from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types';
import SimpleCaptcha from './SimpleCaptcha';

interface AuthPageProps {
  onLogin: (user: User) => void;
  onClose?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isHuman, setIsHuman] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = authService.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials');
      }
    } else {
      if (!email || !username || !password) {
        setError('All fields are required');
        return;
      }
      
      if (!isHuman) {
        setError('Please complete the human verification');
        return;
      }

      const user = authService.register(username, password, email);
      if (user) {
        onLogin(user);
      } else {
        setError('Username already taken');
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setIsHuman(false); // Reset captcha on mode switch
  };

  return (
    <div className="min-h-screen bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 relative overflow-hidden z-[100]">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
            <Radar className="w-8 h-8 text-violet-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AURA Sentinel</h1>
          <p className="text-slate-400 text-sm mt-1">Automated Universal Risk Analysis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              placeholder="Enter your username"
            />
          </div>

          {!isLogin && (
             <div>
             <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Email</label>
             <input
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
               placeholder="Enter your email"
             />
           </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <SimpleCaptcha onVerify={setIsHuman} />
          )}

          {error && <div className="text-red-400 text-sm text-center py-1 bg-red-900/10 rounded border border-red-900/20">{error}</div>}

          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 rounded-lg transition-all shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2"
          >
            {isLogin ? <><LogIn size={18} /> Sign In</> : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-slate-400 text-sm hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
