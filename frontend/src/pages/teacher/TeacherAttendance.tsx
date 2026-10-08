import { useState, useEffect } from 'react';
import { Wifi, Radio, CheckCircle2 } from 'lucide-react';
import { fetchStudentsFromDB } from '../../api/supabase';

export const TeacherAttendance = () => {
  const [scanning, setScanning] = useState(true);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await fetchStudentsFromDB(5);
      if (data) setStudents(data);
    };
    fetchStudents();
  }, []);

  // Simulating an RFID scan event purely for demo feel
  useEffect(() => {
    if (!manualEntryOpen) {
      const timer = setTimeout(() => {
        setScanning(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [manualEntryOpen]);

  return (
    <div className="max-w-[800px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold text-[#111827] tracking-tight">Take Attendance</h1>
          <p className="mt-1 text-[15px] text-[#667085]">Class ECE A · 28 Aug 2025</p>
        </div>
        <button 
          onClick={() => setManualEntryOpen(true)}
          className="h-10 px-4 bg-white border border-[#E5E7EB] rounded-[10px] text-[14px] font-medium text-[#111827] hover:bg-[#FFFFFF] transition-colors self-start sm:self-auto"
        >
          Manual Entry
        </button>
      </div>

      {manualEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h2 className="text-[20px] font-semibold text-[#111827] mb-4">Manual Entry</h2>
            <input type="text" placeholder="Enter student roll number..." className="w-full h-10 px-3 border border-[#E5E7EB] rounded-[10px] text-[14px] mb-4 focus:ring-2 focus:ring-[#0B65FE] focus:outline-none" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setManualEntryOpen(false)} className="h-10 px-4 rounded-[10px] text-[14px] font-medium text-[#111827] hover:bg-[#F3F4F6]">Cancel</button>
              <button onClick={() => { setManualEntryOpen(false); setScanning(false); }} className="h-10 px-4 bg-[#0B65FE] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#004BCC]">Mark Present</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Scan Area */}
      <div className="bg-white rounded-[20px] p-10 border border-[#E5E7EB] shadow-subtle flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
        
        {/* Device Status Corner */}
        <div className="absolute top-6 left-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E5F0FF] flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-[#0B65FE]" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[#111827]">ESP32-S3 (CSB-5)</div>
            <div className="flex items-center gap-3 mt-1 text-[12px] text-[#667085]">
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-[#10B981]" /> Wi-Fi Connected</span>
              <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[#10B981]" /> MQTT</span>
            </div>
          </div>
        </div>

        {/* Scan UI */}
        <div className="mt-12 flex flex-col items-center text-center">
          {scanning ? (
            <>
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-[#0B65FE] opacity-10 rounded-full animate-ping"></div>
                <div className="absolute inset-2 bg-[#0B65FE] opacity-20 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="absolute inset-4 bg-[#0B65FE] text-white rounded-full flex items-center justify-center shadow-lg">
                  <Radio className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-[24px] font-semibold text-[#111827] tracking-tight">READY TO SCAN</h2>
              <p className="mt-2 text-[15px] text-[#667085]">Tap RFID card on the device</p>
            </>
          ) : (
            <div className="animate-in zoom-in duration-300">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#D1FAE5] text-[#10B981] rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-[24px] font-semibold text-[#111827] tracking-tight">{students[0]?.name || 'Loading...'}</h2>
              <div className="flex items-center justify-center gap-2 mt-2 text-[15px]">
                <span className="text-[#667085]">Roll No. {students[0]?.roll_number || '--'}</span>
                <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
                <span className="font-medium text-[#065F46]">Present</span>
                <span className="w-1 h-1 rounded-full bg-[#E5E7EB]"></span>
                <span className="text-[#667085]">9:02 AM</span>
              </div>
              
              <button 
                onClick={() => setScanning(true)}
                className="mt-8 text-[14px] font-medium text-[#0B65FE] hover:text-[#004BCC]"
              >
                Scan Next Student
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[18px] font-semibold text-[#111827]">Live Activity</h3>
          <span className="text-[13px] text-[#667085]">4 recorded today</span>
        </div>
        
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-subtle divide-y divide-[#E5E7EB]">
          
          {students.slice(0, 4).map((student, i) => {
            const statuses = ['Present', 'Present', 'Absent', 'Present'];
            const colors = ['bg-[#D1FAE5] text-[#065F46]', 'bg-[#D1FAE5] text-[#065F46]', 'bg-[#FEE2E2] text-[#991B1B]', 'bg-[#D1FAE5] text-[#065F46]'];
            const times = ['9:02 AM', '9:01 AM', '8:58 AM', '8:57 AM'];
            
            const status = statuses[i % 4];
            const color = colors[i % 4];
            const time = times[i % 4];
            
            // Get initials from first and last name (or second word)
            const nameParts = student.name.split(' ');
            const initials = nameParts.length > 1 
              ? `${nameParts[0][0]}${nameParts[1][0]}`
              : student.name.substring(0, 2).toUpperCase();

            return (
              <div key={student.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-medium ${color}`}>
                    {initials}
                  </div>
                  <div>
                    <div className="text-[15px] font-medium text-[#111827]">{student.name}</div>
                    <div className="text-[13px] text-[#667085]">Roll No. {student.roll_number}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[14px] font-medium ${color.split(' ')[1]}`}>{status}</div>
                  <div className="text-[12px] text-[#667085]">{time}</div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
      
    </div>
  );
};
