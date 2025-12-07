
import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void;
}

const SimpleCaptcha: React.FC<SimpleCaptchaProps> = ({ onVerify }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    generateChallenge();
  }, []);

  const generateChallenge = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer('');
    setIsVerified(false);
    onVerify(false);
    setError(false);
  };

  const handleCheck = () => {
    const sum = num1 + num2;
    if (parseInt(userAnswer) === sum) {
      setIsVerified(true);
      setError(false);
      onVerify(true);
    } else {
      setError(true);
      setIsVerified(false);
      onVerify(false);
      // Reset after error to prevent brute force
      setTimeout(generateChallenge, 500);
    }
  };

  return (
    <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
         <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
           <ShieldCheck size={14} className="text-emerald-500" /> Human Verification
         </label>
         {!isVerified && (
           <button onClick={generateChallenge} className="text-slate-500 hover:text-slate-300" title="Refresh Challenge">
             <RefreshCw size={12} />
           </button>
         )}
      </div>

      {isVerified ? (
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-900/20 p-2 rounded border border-emerald-900/50">
          <Check size={16} />
          <span className="text-sm font-medium">Verification Complete</span>
        </div>
      ) : (
        <div className="flex gap-2 items-center">
           <div className="bg-slate-800 px-3 py-2 rounded text-slate-300 text-sm font-mono tracking-wider border border-slate-600 select-none">
             {num1} + {num2} = ?
           </div>
           <input 
             type="number"
             value={userAnswer}
             onChange={(e) => setUserAnswer(e.target.value)}
             className={`w-16 bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-600'} rounded px-2 py-2 text-sm text-center text-white outline-none focus:border-violet-500 transition-colors`}
             placeholder="?"
           />
           <button 
             type="button"
             onClick={handleCheck}
             className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium transition-colors"
           >
             Verify
           </button>
        </div>
      )}
      {error && <p className="text-[10px] text-red-400 mt-1">Incorrect, please try again.</p>}
    </div>
  );
};

export default SimpleCaptcha;
