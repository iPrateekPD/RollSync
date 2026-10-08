import { RadioReceiver } from 'lucide-react';

export const DevicesList = () => {
  return (
    <div className="space-y-[32px] animate-in fade-in duration-500">
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Hardware Devices</h1>
        <p className="mt-1 text-[15px] text-[#667085]">Manage ESP32 and RFID scanner endpoints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[20px] shadow-subtle border border-[#E5E7EB]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EEEDFA] flex items-center justify-center">
                <RadioReceiver className="w-5 h-5 text-[#4338CA]" />
              </div>
              <div>
                <h3 className="text-[16px] font-medium text-[#111827]">ESP32-S3 (CSB-5)</h3>
                <p className="text-[13px] text-[#667085]">Classroom 101 Scanner</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#ECFDF5] text-[#059669] text-[12px] font-medium rounded-full">
              Online
            </span>
          </div>
          
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-[14px]">
              <span className="text-[#667085]">IP Address</span>
              <span className="text-[#111827] font-mono">192.168.1.105</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[#667085]">Firmware</span>
              <span className="text-[#111827]">v2.4.1</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[#667085]">Last Ping</span>
              <span className="text-[#111827]">2 seconds ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
