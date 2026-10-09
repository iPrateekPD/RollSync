import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Lock, ScanFace, Bell, LogOut, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'privacy' | 'notifications'>('profile');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'profile', label: 'Profile Settings', icon: User, desc: 'Manage your personal details' },
    { id: 'security', label: 'Account Security', icon: Lock, desc: 'Update password and security' },
    { id: 'privacy', label: 'Face Privacy', icon: ScanFace, desc: 'Manage your biometric data' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Configure email and app alerts' },
  ] as const;

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Settings</h1>
        <p className="mt-1 text-[15px] text-[#667085]">Manage your account preferences, security, and privacy.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center p-3 rounded-xl transition-colors text-left ${
                  activeSection === item.id 
                    ? 'bg-[#E5F0FF] text-[#0B65FE]' 
                    : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                <div>
                  <div className="text-[14px] font-medium">{item.label}</div>
                  <div className={`text-[12px] ${activeSection === item.id ? 'text-[#0B65FE]/80' : 'text-[#667085]'}`}>
                    {item.desc}
                  </div>
                </div>
                {activeSection === item.id && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
              </button>
            ))}
            
            <div className="my-4 border-t border-[#E5E7EB]"></div>
            
            <button
              onClick={handleLogout}
              className="flex items-center p-3 rounded-xl transition-colors text-left text-[#EF4444] hover:bg-[#FEF2F2]"
            >
              <LogOut className="w-5 h-5 mr-3 shrink-0" />
              <div>
                <div className="text-[14px] font-medium">Sign Out</div>
                <div className="text-[12px] text-[#EF4444]/80">Log out of your account</div>
              </div>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E7EB] p-8 min-h-[500px]">
            
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 mb-6">
                  <h2 className="text-[20px] font-semibold text-[#111827]">Profile Settings</h2>
                  <p className="text-[14px] text-[#667085] mt-1">Update your display information and contact details.</p>
                </div>
                
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">First Name</label>
                    <input type="text" defaultValue={user?.firstName} disabled className="w-full h-10 px-3 bg-[#F3F4F6] border border-[#E5E7EB] rounded-lg text-[14px] text-[#667085] cursor-not-allowed" />
                    <p className="text-[12px] text-[#667085] mt-1">Names must be updated through the administration office.</p>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">Contact Email</label>
                    <input type="email" defaultValue={user?.email} className="w-full h-10 px-3 bg-white border border-[#D1D5DB] rounded-lg text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:border-[#0B65FE] outline-none transition-shadow" />
                  </div>
                  <div className="pt-4">
                    <button className="px-5 py-2 bg-[#0B65FE] text-white text-[14px] font-medium rounded-lg hover:bg-[#004BCC] transition-colors shadow-sm">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 mb-6">
                  <h2 className="text-[20px] font-semibold text-[#111827]">Account Security</h2>
                  <p className="text-[14px] text-[#667085] mt-1">Manage your password and authentication methods.</p>
                </div>
                
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full h-10 px-3 bg-white border border-[#D1D5DB] rounded-lg text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:border-[#0B65FE] outline-none transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full h-10 px-3 bg-white border border-[#D1D5DB] rounded-lg text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:border-[#0B65FE] outline-none transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[#4B5563] mb-1.5">Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full h-10 px-3 bg-white border border-[#D1D5DB] rounded-lg text-[14px] text-[#111827] focus:ring-2 focus:ring-[#0B65FE] focus:border-[#0B65FE] outline-none transition-shadow" />
                  </div>
                  <div className="pt-4">
                    <button className="px-5 py-2 bg-[#111827] text-white text-[14px] font-medium rounded-lg hover:bg-black transition-colors shadow-sm">
                      Update Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 mb-6">
                  <h2 className="text-[20px] font-semibold text-[#111827]">Face Privacy & Biometrics</h2>
                  <p className="text-[14px] text-[#667085] mt-1">Control how your biometric data is stored and used.</p>
                </div>
                
                <div className="max-w-xl">
                  <div className="bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl p-5 flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-[#EF4444] shrink-0" />
                    <div>
                      <h3 className="text-[15px] font-medium text-[#991B1B]">Delete Face Profile</h3>
                      <p className="text-[13px] text-[#B91C1C] mt-1 mb-4 leading-relaxed">
                        Permanently delete your face registration from RollSync. If you do this, you will no longer be able to use the camera-based attendance system until you register again.
                      </p>
                      <button className="px-4 py-2 bg-white border border-[#EF4444] text-[#EF4444] text-[13px] font-medium rounded-lg hover:bg-[#FEF2F2] transition-colors">
                        Delete Biometric Data
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-[15px] font-medium text-[#111827] mb-3">Data Usage Policy</h3>
                    <p className="text-[14px] text-[#667085] leading-relaxed mb-3">
                      RollSync uses InsightFace AI to generate a mathematical vector representation (embedding) of your face. 
                      Your original photos are not permanently stored on the server after the embedding is created.
                    </p>
                    <p className="text-[14px] text-[#667085] leading-relaxed">
                      This data is exclusively used for automated attendance matching within the registered classrooms and is never shared with third parties.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="border-b border-[#E5E7EB] pb-4 mb-6">
                  <h2 className="text-[20px] font-semibold text-[#111827]">Notification Preferences</h2>
                  <p className="text-[14px] text-[#667085] mt-1">Choose how and when you want to be alerted.</p>
                </div>
                
                <div className="space-y-5 max-w-lg">
                  {[
                    { id: 'att-alerts', label: 'Low Attendance Alerts', desc: 'Get notified when attendance drops below 75%' },
                    { id: 'att-daily', label: 'Daily Summary', desc: 'Receive a daily email of your marked attendance' },
                    { id: 'class-reminders', label: 'Class Reminders', desc: 'App notifications 15 minutes before class' },
                    { id: 'sys-updates', label: 'System Updates', desc: 'Important announcements and maintenance' }
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-start justify-between gap-4 py-1">
                      <div>
                        <div className="text-[14px] font-medium text-[#111827]">{pref.label}</div>
                        <div className="text-[13px] text-[#667085] mt-0.5">{pref.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer mt-1">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-[#E5E7EB] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0B65FE]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B65FE]"></div>
                      </label>
                    </div>
                  ))}
                  
                  <div className="pt-6 border-t border-[#E5E7EB]">
                    <button className="px-5 py-2 bg-[#0B65FE] text-white text-[14px] font-medium rounded-lg hover:bg-[#004BCC] transition-colors shadow-sm">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
