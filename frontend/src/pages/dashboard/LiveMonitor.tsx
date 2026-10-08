import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { CheckCircle2, User, Clock, RefreshCcw } from 'lucide-react';

interface AttendanceEvent {
  studentId: string;
  studentName: string;
  status: string;
  timestamp: string;
  classroom?: string;
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const LiveMonitor = () => {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [classroom, setClassroom] = useState('RDB-6');

  useEffect(() => {
    // Connect to WebSocket server
    const socket: Socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('Connected to Live Attendance WebSocket');
      setIsConnected(true);
      socket.emit('join_classroom', classroom);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Listen for new attendance records
    socket.on('attendance_update', (data: AttendanceEvent) => {
      console.log('Received attendance:', data);
      setEvents((prev) => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [classroom]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Live Monitor</h1>
          <p className="text-muted-foreground mt-1">Real-time attendance stream from ESP32 & Cameras</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-card border border-border px-4 py-2 rounded-lg shadow-sm">
            <span className="text-sm text-muted-foreground font-medium">Classroom</span>
            <select 
              value={classroom} 
              onChange={(e) => setClassroom(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold outline-none focus:ring-0 cursor-pointer"
            >
              <option value="RDB-6">RDB-6</option>
              <option value="CSB-5">CSB-5</option>
              <option value="LT-1">LT-1</option>
            </select>
          </div>
          <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real-time Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-border bg-zinc-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-foreground uppercase tracking-wider text-sm flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-muted-foreground" />
                Live Feed
              </h2>
              <span className="text-xs text-muted-foreground font-medium bg-zinc-200/50 px-2 py-1 rounded-md">{events.length} scanned today</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-zinc-50/30">
              {events.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center animate-pulse">
                    <User className="w-8 h-8 text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium">Waiting for students to tap RFID...</p>
                </div>
              ) : (
                events.map((event, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-background rounded-xl border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {event.studentName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{event.studentName}</h3>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">UID: {event.studentId || 'UNKNOWN'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Present
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stats Panel */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center justify-center py-10">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Present</h3>
            <div className="text-6xl font-black text-foreground tracking-tighter tabular-nums">{events.length}</div>
            <p className="text-xs text-muted-foreground mt-4 font-medium bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
              Classroom: {classroom}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">System Status</h3>
            <ul className="space-y-3 mt-4 text-sm font-medium text-indigo-800/80">
              <li className="flex items-center justify-between">
                <span>RFID Scanner</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Online</span>
              </li>
              <li className="flex items-center justify-between">
                <span>MQTT Broker</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Connected</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Database</span>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>Supabase Sync</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
