import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Menu, 
  LayoutDashboard, 
  Users, 
  FileText, 
  CalendarOff,
  RadioReceiver,
  Settings,
  Bell,
  Search,
  ScanLine
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: `/${user?.role?.toLowerCase() || 'teacher'}`, icon: LayoutDashboard },
    ];

    if (user?.role === 'ADMIN') {
      baseItems.push(
        { name: 'Students', href: '/admin/students', icon: Users },
        { name: 'Reports', href: '/admin/reports', icon: FileText },
        { name: 'Devices', href: '/admin/devices', icon: RadioReceiver },
        { name: 'Settings', href: '/settings', icon: Settings }
      );
    } else {
      // Default / Teacher view
      baseItems.push(
        { name: 'Students', href: '/teacher/students', icon: Users },
        { name: 'Attendance', href: '/teacher/attendance', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings }
      );
    }
    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex font-sans text-[#111827]">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#E5E7EB] transform transition-transform duration-200 ease-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-[72px] flex items-center px-6 border-b border-transparent shrink-0">
          <div className="flex items-center gap-3 text-[#111827]">
            <img src="/logo.png" alt="RollSync Logo" className="h-10 w-auto object-contain rounded-full shadow-sm" />
            <span className="text-[22px] font-semibold tracking-tight">
              RollSync
            </span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-[4px] overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center px-[12px] py-[10px] text-[14px] font-medium rounded-lg transition-colors group",
                isActive 
                  ? "bg-[#E5F0FF] text-[#0B65FE]" 
                  : "text-[#667085] hover:bg-[#F3F4F6] hover:text-[#111827]"
              )}
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className={cn(
                "w-[20px] h-[20px] mr-3 shrink-0 transition-colors",
                "text-current"
              )} strokeWidth={2} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Device Status */}
        <div className="p-4 mt-auto">
          <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
              <span className="text-[13px] font-semibold text-[#111827]">Device Online</span>
            </div>
            <div className="text-[12px] text-[#667085] space-y-1">
              <div className="flex justify-between">
                <span>ESP32-S3</span>
                <span className="font-medium text-[#111827]">CSB-5</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Wi-Fi</span>
                <span className="text-[#10B981]">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>MQTT</span>
                <span className="text-[#10B981]">Connected</span>
              </div>
              <div className="pt-2 mt-2 border-t border-[#E5E7EB] text-[11px]">
                Last Sync: 28 Aug 2025, 9:02 AM
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-[72px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 lg:px-[40px] shrink-0 sticky top-0 z-30">
          
          <div className="flex items-center flex-1 gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#667085] hover:text-[#111827] rounded-lg focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search */}
            <div className="hidden sm:flex items-center relative max-w-md w-full">
              <Search className="w-5 h-5 text-[#667085] absolute left-3" />
              <input 
                type="text" 
                placeholder="Search students, roll number..." 
                className="w-full h-10 pl-10 pr-4 bg-[#F3F4F6] border-none rounded-[10px] text-[14px] text-[#111827] placeholder:text-[#667085] focus:ring-2 focus:ring-[#0B65FE] focus:outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <button 
              onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
              className="text-[#667085] hover:text-[#111827] relative transition-colors focus:outline-none"
            >
              <Bell className="w-5 h-5" strokeWidth={2} />
              <span className="absolute top-0 right-0 block w-[8px] h-[8px] bg-[#EF4444] rounded-full ring-2 ring-white" />
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute top-12 right-12 w-[320px] bg-white border border-[#E5E7EB] rounded-[16px] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <h3 className="font-semibold text-[#111827] mb-2">Notifications</h3>
                <div className="text-[14px] text-[#667085] p-4 text-center bg-[#FFFFFF] rounded-[10px]">No new notifications.</div>
              </div>
            )}
            
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
            >
              <div className="flex flex-col items-end">
                <span className="text-[14px] font-medium text-[#111827] group-hover:text-[#0B65FE] transition-colors">
                  {user?.role === 'ADMIN' ? 'Admin' : 'Dr. Ami Kumar Parida'}
                </span>
                <span className="text-[12px] text-[#667085]">{user?.role || 'Teacher'}</span>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-[#E5F0FF] text-[#0B65FE] flex items-center justify-center font-medium text-[14px] group-hover:bg-[#0B65FE] group-hover:text-white transition-colors">
                {user?.role === 'ADMIN' ? 'A' : 'A'}
              </div>
            </div>

            {isProfileOpen && (
              <div className="absolute top-14 right-0 w-[200px] bg-white border border-[#E5E7EB] rounded-[16px] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[14px] font-medium text-[#111827] hover:bg-[#F3F4F6] rounded-[10px]">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <div className="h-[1px] bg-[#E5E7EB] my-1" />
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-[14px] font-medium text-[#EF4444] hover:bg-[#FEF2F2] rounded-[10px]">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto p-6 lg:p-[40px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
