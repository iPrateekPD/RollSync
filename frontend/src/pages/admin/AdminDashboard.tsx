import { Users, BookOpen, RadioReceiver } from 'lucide-react';

export const AdminDashboard = () => {
  return (
    <div className="space-y-[48px] animate-in fade-in duration-500">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Admin Overview</h1>
        <p className="mt-1 text-[15px] text-[#667085]">Manage your institution's key metrics and devices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
          <div className="flex items-center gap-2 text-[#667085]">
            <Users className="w-4 h-4 text-[#0B65FE]" />
            <h3 className="text-[14px] font-medium">Total Students</h3>
          </div>
          <p className="text-[40px] font-semibold text-[#111827] tracking-tight">1,240</p>
        </div>
        
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
          <div className="flex items-center gap-2 text-[#667085]">
            <BookOpen className="w-4 h-4 text-[#0B65FE]" />
            <h3 className="text-[14px] font-medium">Total Teachers</h3>
          </div>
          <p className="text-[40px] font-semibold text-[#111827] tracking-tight">84</p>
        </div>
        
        <div className="bg-white p-6 rounded-[16px] border border-[#E5E7EB] shadow-subtle flex flex-col justify-between h-[140px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#667085]">
              <RadioReceiver className="w-4 h-4 text-[#0B65FE]" />
              <h3 className="text-[14px] font-medium">Active Devices</h3>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-[40px] font-semibold text-[#111827] tracking-tight">12</p>
            <span className="text-[15px] text-[#667085]">/ 15 online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
