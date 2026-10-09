import { useState } from 'react';
import { Bell, Check, Trash2, Calendar, AlertCircle, Info, Clock } from 'lucide-react';
import { format, subDays, subHours } from 'date-fns';

export const StudentNotifications = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  
  // Mock notifications
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'alert',
      title: 'Low Attendance Warning',
      message: 'Your attendance in Database Systems has fallen below 75%. Please ensure you attend the upcoming classes.',
      timestamp: subHours(new Date(), 2),
      read: false,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      id: '2',
      type: 'info',
      title: 'Class Rescheduled',
      message: 'Computer Networks lecture today has been moved to Room 402 at 2:00 PM.',
      timestamp: subHours(new Date(), 5),
      read: false,
      icon: Calendar,
      color: 'text-[#0B65FE]',
      bgColor: 'bg-[#E5F0FF]'
    },
    {
      id: '3',
      type: 'success',
      title: 'Face Profile Approved',
      message: 'Your biometric registration was successful. You can now use camera attendance.',
      timestamp: subDays(new Date(), 1),
      read: true,
      icon: Check,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      id: '4',
      type: 'info',
      title: 'System Maintenance',
      message: 'RollSync will undergo scheduled maintenance this Sunday from 2 AM to 4 AM.',
      timestamp: subDays(new Date(), 2),
      read: true,
      icon: Info,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100'
    }
  ]);

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-tight text-[#111827]">Notifications</h1>
          <p className="mt-1 text-[15px] text-[#667085]">Stay updated with your attendance alerts and system notices.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            disabled={notifications.every(n => n.read)}
            className="text-[14px] font-medium text-[#0B65FE] hover:text-[#004BCC] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Mark all read
          </button>
          <div className="w-px h-4 bg-[#E5E7EB]"></div>
          <button 
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="text-[14px] font-medium text-[#EF4444] hover:text-[#DC2626] disabled:opacity-50 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Clear all
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col min-h-[500px]">
        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-[#E5E7EB]">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 text-[14px] font-medium relative ${activeTab === 'all' ? 'text-[#0B65FE]' : 'text-[#667085] hover:text-[#111827]'}`}
          >
            All Notifications
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0B65FE] rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`py-4 text-[14px] font-medium relative flex items-center gap-2 ${activeTab === 'unread' ? 'text-[#0B65FE]' : 'text-[#667085] hover:text-[#111827]'}`}
          >
            Unread
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-[#EF4444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
            {activeTab === 'unread' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0B65FE] rounded-t-full"></span>
            )}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 bg-white">
          {filteredNotifications.length > 0 ? (
            <ul className="divide-y divide-[#E5E7EB]">
              {filteredNotifications.map((notif) => (
                <li 
                  key={notif.id} 
                  className={`p-6 hover:bg-[#F9FAFB] transition-colors ${!notif.read ? 'bg-[#F9FAFB]/50' : ''}`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.bgColor}`}>
                      <notif.icon className={`w-5 h-5 ${notif.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <h4 className={`text-[15px] font-medium ${!notif.read ? 'text-[#111827]' : 'text-[#4B5563]'}`}>
                          {notif.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF] shrink-0 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {format(notif.timestamp, 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <p className={`text-[14px] leading-relaxed ${!notif.read ? 'text-[#4B5563]' : 'text-[#667085]'}`}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0B65FE] shrink-0 mt-1.5"></div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-[#9CA3AF]" />
              </div>
              <h3 className="text-[16px] font-medium text-[#111827] mb-1">You're all caught up!</h3>
              <p className="text-[14px] text-[#667085]">No {activeTab === 'unread' ? 'unread ' : ''}notifications right now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
