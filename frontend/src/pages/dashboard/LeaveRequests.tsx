import { CalendarOff } from 'lucide-react';

export const LeaveRequests = () => {
  return (
    <div className="space-y-[32px] animate-in fade-in duration-500">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Leave Requests</h1>
        <p className="mt-1 text-[15px] text-[#667085]">Review and approve student leave requests.</p>
      </div>

      <div className="bg-white rounded-[20px] shadow-subtle border border-[#E5E7EB] overflow-hidden min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <CalendarOff className="w-12 h-12 text-[#E5E7EB] mx-auto mb-4" />
          <h3 className="text-[16px] font-medium text-[#111827]">No Pending Requests</h3>
          <p className="text-[14px] text-[#667085] mt-1">All leave requests have been resolved.</p>
        </div>
      </div>
    </div>
  );
};
