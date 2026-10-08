import { useState } from 'react';
import { Check } from 'lucide-react';

export const Settings = () => {
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState('teacher@rollsync.com');
  const [password, setPassword] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl animate-in fade-in duration-500 space-y-8">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Settings</h1>
        <p className="mt-1 text-[15px] text-[#667085]">Manage your account and preferences.</p>
      </div>

      <div className="bg-white rounded-[20px] shadow-subtle border border-[#E5E7EB] overflow-hidden">
        <div className="p-6">
          <h2 className="text-[18px] font-semibold text-[#111827] mb-6">Profile Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[14px] font-medium text-[#111827] mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium text-[#111827] mb-2">Change Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none"
              />
            </div>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 h-10 px-4 bg-[#0B65FE] hover:bg-[#004BCC] text-white rounded-[10px] font-medium text-[14px] transition-colors shadow-sm"
            >
              {saved ? <><Check className="w-4 h-4"/> Saved</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
