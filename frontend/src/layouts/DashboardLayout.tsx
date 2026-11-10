import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut,
  Menu,
  LayoutDashboard,
  FileText,
  CalendarDays,
  Clock3,
  Settings,
  Bell,
  PlayCircle,
  ClipboardCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DemoModal } from '../components/DemoModal';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Overview', href: '/teacher', icon: LayoutDashboard, end: true },
  { name: 'My Classes', href: '/teacher/classes', icon: CalendarDays },
  { name: 'Attendance', href: '/teacher/attendance', icon: ClipboardCheck },
  { name: 'Live Monitor', href: '/teacher/live', icon: Clock3 },
  { name: 'Timetable', href: '/teacher/timetable', icon: CalendarDays },
  { name: 'Reports', href: '/teacher/reports', icon: FileText },
  { name: 'Leave Requests', href: '/teacher/leaves', icon: Bell },
  { name: 'Settings', href: '/teacher/settings', icon: Settings }
];

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-[#111827]">
      {isSidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[252px] bg-white border-r border-[#E5E7EB] transform transition-transform duration-200 ease-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Link to="/teacher" className="h-[76px] flex items-center px-6 border-b border-[#F1F5F9] shrink-0">
          <img src="/logo.png" alt="" className="h-10 w-10 object-contain rounded-full" />
          <span className="ml-3 text-[21px] font-semibold tracking-tight">RollSync</span>
        </Link>

        <div className="px-5 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">
          Teacher workspace
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2.5 text-[14px] font-medium rounded-lg transition-colors",
                isActive ? "bg-[#EAF2FF] text-[#145EEF]" : "text-[#667085] hover:bg-[#F8FAFC] hover:text-[#111827]"
              )}
            >
              <item.icon className="w-[19px] h-[19px] mr-3 shrink-0" strokeWidth={1.9} />
              {item.name}
            </NavLink>
          ))}
          <button
            onClick={() => setDemoModalOpen(true)}
            className="w-full mt-3 flex items-center px-3 py-2.5 text-[14px] font-semibold rounded-lg text-[#145EEF] bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-colors"
          >
            <PlayCircle className="w-[19px] h-[19px] mr-3 shrink-0" strokeWidth={1.9} />
            Start Camera Demo
          </button>
        </nav>

        <div className="p-4 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-[#EAF2FF] text-[#145EEF] flex items-center justify-center font-semibold text-sm">
              {user?.firstName?.charAt(0) || 'T'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-[#111827] truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Teacher'}
              </div>
              <div className="text-[11px] text-[#667085] truncate">{user?.email}</div>
            </div>
            <button onClick={logout} aria-label="Sign out" title="Sign out" className="p-2 text-[#98A2B3] hover:text-red-600 rounded-lg">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[76px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-5 lg:px-9 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 -ml-2 text-[#667085] hover:text-[#111827] rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[15px] font-semibold text-[#111827]">Teacher Portal</div>
              <div className="text-[12px] text-[#98A2B3]">Attendance & classroom management</div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <div className="hidden sm:block text-right">
              <div className="text-[13px] font-medium text-[#344054]">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Teacher'}
              </div>
              <div className="text-[11px] text-[#98A2B3]">Teacher</div>
            </div>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Open profile menu"
              className="w-9 h-9 rounded-full bg-[#EAF2FF] text-[#145EEF] flex items-center justify-center font-semibold text-sm"
            >
              {user?.firstName?.charAt(0) || 'T'}
            </button>
            {isProfileOpen && (
              <div className="absolute top-12 right-0 w-[190px] bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-2 z-50">
                <Link to="/teacher/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-[#344054] hover:bg-[#F8FAFC] rounded-lg">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1480px] mx-auto p-5 lg:p-9">
            <Outlet />
          </div>
        </main>
      </div>

      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </div>
  );
};
