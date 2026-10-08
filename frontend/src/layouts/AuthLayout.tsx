import { Outlet } from 'react-router-dom';
import { ScanLine } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-white flex font-sans text-[#111827]">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 bg-[#F8F9FC] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative element - very subtle */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-[#EEEDFA] rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 bg-[#4338CA] rounded-[12px] flex items-center justify-center">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <span className="text-[24px] font-semibold tracking-tight">RollSync</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-[40px] font-semibold tracking-tight leading-[1.1] mb-6">
            Attendance, without the paperwork.
          </h1>
          <p className="text-[18px] text-[#667085] leading-relaxed">
            A reliable attendance platform connecting teachers, students, and smart devices in one place.
          </p>
        </div>

        <div className="relative z-10 text-[14px] text-[#667085]">
          &copy; {new Date().getFullYear()} RollSync System.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-[#4338CA] rounded-[10px] flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-[20px] font-semibold tracking-tight">RollSync</span>
          </div>

          <h2 className="text-[28px] font-semibold tracking-tight mb-2">Welcome back</h2>
          <p className="text-[15px] text-[#667085] mb-8">Enter your credentials to access the platform.</p>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
};
