import { Calendar, MapPin, Users } from 'lucide-react';

const TIMETABLE = {
  classroom: 'RDB-06',
  semester: 'V',
  section: 'B',
  department: 'ECE',
  effectiveDate: '24-Aug-2026',
  schedule: {
    MON: [
      { period: 'I', time: '08:00 AM - 09:00 AM', code: 'OB' },
      { period: 'II', time: '09:00 AM - 10:00 AM', code: 'VLSI' },
      { period: 'BREAK', time: '10:00 AM - 10:20 AM', code: 'BREAK' },
      { period: 'III', time: '10:20 AM - 11:20 AM', code: 'DSP' },
      { period: 'IV & V', time: '11:20 AM - 01:20 PM', code: 'GR1: VLSI LAB, GR2: DSP LAB' }
    ],
    TUE: [
      { period: 'I', time: '08:00 AM - 09:00 AM', code: 'MCA' },
      { period: 'II', time: '09:00 AM - 10:00 AM', code: 'EMW' },
      { period: 'BREAK', time: '10:00 AM - 10:20 AM', code: 'BREAK' },
      { period: 'III', time: '10:20 AM - 11:20 AM', code: 'FOC' },
      { period: 'IV', time: '11:20 AM - 12:20 PM', code: 'FOC' },
      { period: 'V', time: '12:20 PM - 01:20 PM', code: 'PROJECT' }
    ],
    WED: [
      { period: 'I & II', time: '08:00 AM - 10:00 AM', code: 'GR1: MC LAB, GR2: VLSI LAB' },
      { period: 'BREAK', time: '10:00 AM - 10:20 AM', code: 'BREAK' },
      { period: 'III', time: '10:20 AM - 11:20 AM', code: 'MCA' },
      { period: 'IV', time: '11:20 AM - 12:20 PM', code: 'MCA' },
      { period: 'V', time: '12:20 PM - 01:20 PM', code: 'EMW' }
    ],
    THU: [
      { period: 'I', time: '08:00 AM - 09:00 AM', code: 'DSP' },
      { period: 'II', time: '09:00 AM - 10:00 AM', code: 'VLSI' },
      { period: 'BREAK', time: '10:00 AM - 10:20 AM', code: 'BREAK' },
      { period: 'III', time: '10:20 AM - 11:20 AM', code: 'FOC' },
      { period: 'IV', time: '11:20 AM - 12:20 PM', code: 'FOC' },
      { period: 'V', time: '12:20 PM - 01:20 PM', code: 'EMW' }
    ],
    FRI: [
      { period: 'I & II', time: '08:00 AM - 10:00 AM', code: 'GR1: DSP LAB, GR2: MC LAB' },
      { period: 'BREAK', time: '10:00 AM - 10:20 AM', code: 'BREAK' },
      { period: 'III', time: '10:20 AM - 11:20 AM', code: 'DSP' },
      { period: 'IV', time: '11:20 AM - 12:20 PM', code: 'DSP' },
      { period: 'V', time: '12:20 PM - 01:20 PM', code: 'VLSI' }
    ],
    SAT: [
      { period: 'I', time: '08:00 AM - 09:00 AM', code: 'EMW' },
      { period: 'II', time: '09:00 AM - 10:00 AM', code: 'OB' },
      { period: 'BREAK', time: '10:00 AM - 10:20 AM', code: 'BREAK' },
      { period: 'III', time: '10:20 AM - 11:20 AM', code: 'VLSI' },
      { period: 'IV', time: '11:20 AM - 12:20 PM', code: 'MCA' },
      { period: 'V', time: '12:20 PM - 01:20 PM', code: 'PROJECT' }
    ]
  },
  subjects: {
    'MCA': { name: 'Microcontrollers and Applications', faculty: 'Dr. Ami Kumar Parida' },
    'DSP': { name: 'Digital Signal Processing', faculty: 'Dr. Bibhu Prasad' },
    'VLSI': { name: 'Digital VLSI Design', faculty: 'Dr. Jitendra Kumar' },
    'EMW': { name: 'Electromagnetic Waves', faculty: 'Dr. Saran Srihari Sripada Panda' },
    'FOC': { name: 'Fiber Optic Communications', faculty: 'Dr. Bandana Mallick' },
    'OB': { name: 'Organizational Behaviour', faculty: 'Mrs. Swapna Mayee Sahoo' },
    'MC LAB': { name: 'Microcontrollers Laboratory', faculty: 'Dr. Radhanath Patra' },
    'DSP LAB': { name: 'Digital Signal Processing Laboratory', faculty: 'Dr. Ranjita Rout' },
    'VLSI LAB': { name: 'Digital VLSI Design Laboratory', faculty: 'Dr. Jitendra Kumar' },
    'PROJECT': { name: 'Project Work', faculty: 'ECE Faculty' },
    'GR1: MC LAB, GR2: VLSI LAB': { name: 'MC & VLSI Labs', faculty: 'Dr. Patra / Dr. Kumar' },
    'GR1: VLSI LAB, GR2: DSP LAB': { name: 'VLSI & DSP Labs', faculty: 'Dr. Kumar / Dr. Rout' },
    'GR1: DSP LAB, GR2: MC LAB': { name: 'DSP & MC Labs', faculty: 'Dr. Rout / Dr. Patra' }
  }
};

export const Timetable = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Class Schedule</h1>
          <p className="text-muted-foreground mt-1">Semester {TIMETABLE.semester} • Section {TIMETABLE.section} • {TIMETABLE.department}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm text-sm font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            Classroom: {TIMETABLE.classroom}
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm text-sm font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            W.E.F: {TIMETABLE.effectiveDate}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 border-b border-border text-xs uppercase text-muted-foreground font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4 w-24 text-center border-r border-border">Day</th>
                <th className="px-6 py-4 text-center border-r border-border">08:00 AM - 09:00 AM</th>
                <th className="px-6 py-4 text-center border-r border-border">09:00 AM - 10:00 AM</th>
                <th className="px-3 py-4 text-center bg-zinc-100/50 border-r border-border w-16">Break</th>
                <th className="px-6 py-4 text-center border-r border-border">10:20 AM - 11:20 AM</th>
                <th className="px-6 py-4 text-center border-r border-border">11:20 AM - 12:20 PM</th>
                <th className="px-6 py-4 text-center">12:20 PM - 01:20 PM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(TIMETABLE.schedule).map(([day, classes]) => (
                <tr key={day} className="hover:bg-zinc-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground text-center border-r border-border bg-zinc-50/30 uppercase tracking-widest">{day}</td>
                  
                  {classes.map((cls, idx) => {
                    if (cls.code === 'BREAK') {
                      if (day === 'MON') {
                        return <td key={idx} rowSpan={6} className="px-2 py-4 text-center font-bold text-muted-foreground bg-zinc-100/50 border-r border-border rotate-180" style={{ writingMode: 'vertical-rl' }}>BREAK (10:00 - 10:20)</td>;
                      }
                      return null;
                    }
                    
                    const isLab = cls.code.includes('LAB');
                    const isColSpan2 = cls.period.includes('&');
                    
                    return (
                      <td 
                        key={idx} 
                        colSpan={isColSpan2 ? 2 : 1} 
                        className={`px-4 py-3 text-center border-r border-border last:border-r-0 ${isLab ? 'bg-indigo-50/30' : ''}`}
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`font-bold ${cls.code === 'OB' || cls.code === 'VLSI' || cls.code === 'FOC' || cls.code === 'EMW' ? 'text-red-600' : 'text-foreground'}`}>
                            {cls.code}
                          </span>
                          <span className="text-[10px] text-muted-foreground max-w-[120px] leading-tight truncate">
                            {(TIMETABLE.subjects as any)[cls.code]?.faculty || ''}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Subject & Faculty Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(TIMETABLE.subjects).filter(([code]) => !code.includes('GR')).map(([code, details]) => (
            <div key={code} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50/50 border border-transparent hover:border-border transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {code}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate" title={details.name}>{details.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{details.faculty}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
