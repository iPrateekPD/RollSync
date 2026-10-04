import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  Menu, 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Settings,
  Bell
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getNavItems = () => {
    const baseItems = [
      { name: 'Overview', href: `/${user?.role.toLowerCase()}`, icon: LayoutDashboard },
    ];

    if (user?.role === 'ADMIN') {
      baseItems.push(
        { name: 'Students', href: '/admin/students', icon: GraduationCap },
        { name: 'Teachers', href: '/admin/teachers', icon: Users },
        { name: 'Academic', href: '/admin/academic', icon: BookOpen },
        { name: 'Timetable', href: '/admin/timetable', icon: Calendar },
        { name: 'Settings', href: '/admin/settings', icon: Settings }
      );
    } else if (user?.role === 'TEACHER') {
      baseItems.push(
        { name: 'Classes', href: '/teacher/classes', icon: BookOpen },
        { name: 'Attendance', href: '/teacher/attendance', icon: Users },
        { name: 'Timetable', href: '/teacher/timetable', icon: Calendar }
      );
    } else if (user?.role === 'STUDENT') {
      baseItems.push(
        { name: 'Attendance', href: '/student/attendance', icon: Calendar },
        { name: 'Courses', href: '/student/courses', icon: BookOpen },
        { name: 'Leaves', href: '/student/leaves', icon: Users }
      );
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background flex font-sans text-foreground">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm lg:hidden transition-all"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] bg-card border-r border-border transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-8">
            <span className="text-xl font-display font-semibold tracking-tight text-foreground">
              RollSync.
            </span>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="px-4 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Menu
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground"
                )}
                end={item.href === `/${user?.role.toLowerCase()}`}
              >
                <item.icon className={cn(
                  "w-[18px] h-[18px] mr-3 shrink-0 transition-colors",
                  "text-current"
                )} strokeWidth={2} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-muted-foreground rounded-xl hover:bg-zinc-100 hover:text-foreground transition-all duration-200"
            >
              <LogOut className="w-[18px] h-[18px] mr-3" strokeWidth={2} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header */}
        <header className="h-20 bg-background/80 backdrop-blur-md sticky top-0 z-30 border-b border-border flex items-center justify-between px-6 lg:px-12 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-muted-foreground hover:text-foreground relative transition-colors">
              <Bell className="w-5 h-5" strokeWidth={2} />
              <span className="absolute top-0 right-0 block w-2 h-2 bg-foreground rounded-full ring-2 ring-background" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                </span>
                <span className="text-xs text-muted-foreground tracking-wide">{user?.role}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-100 border border-border flex items-center justify-center text-foreground font-medium text-sm">
                {user?.firstName?.[0] || user?.email?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
