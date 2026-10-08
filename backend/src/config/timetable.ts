export const TIMETABLE = {
  classroom: 'RDB-6',
  semester: 'V',
  section: 'B',
  department: 'ECE',
  schedule: {
    MON: [
      { period: 1, startTime: '08:00', endTime: '09:00', code: 'OB' },
      { period: 2, startTime: '09:00', endTime: '10:00', code: 'VLSI' },
      { period: 3, startTime: '10:20', endTime: '11:20', code: 'DSP' },
      { period: 4, startTime: '11:20', endTime: '13:20', code: 'GR1: VLSI LAB, GR2: DSP LAB' }
    ],
    TUE: [
      { period: 1, startTime: '08:00', endTime: '09:00', code: 'MCA' },
      { period: 2, startTime: '09:00', endTime: '10:00', code: 'EMW' },
      { period: 3, startTime: '10:20', endTime: '11:20', code: 'FOC' },
      { period: 4, startTime: '11:20', endTime: '12:20', code: 'FOC' },
      { period: 5, startTime: '12:20', endTime: '13:20', code: 'PROJECT' }
    ],
    WED: [
      { period: 1, startTime: '08:00', endTime: '10:00', code: 'GR1: MC LAB, GR2: VLSI LAB' },
      { period: 3, startTime: '10:20', endTime: '11:20', code: 'MCA' },
      { period: 4, startTime: '11:20', endTime: '12:20', code: 'MCA' },
      { period: 5, startTime: '12:20', endTime: '13:20', code: 'EMW' }
    ],
    THU: [
      { period: 1, startTime: '08:00', endTime: '09:00', code: 'DSP' },
      { period: 2, startTime: '09:00', endTime: '10:00', code: 'VLSI' },
      { period: 3, startTime: '10:20', endTime: '11:20', code: 'FOC' },
      { period: 4, startTime: '11:20', endTime: '12:20', code: 'FOC' },
      { period: 5, startTime: '12:20', endTime: '13:20', code: 'EMW' }
    ],
    FRI: [
      { period: 1, startTime: '08:00', endTime: '10:00', code: 'GR1: DSP LAB, GR2: MC LAB' },
      { period: 3, startTime: '10:20', endTime: '11:20', code: 'DSP' },
      { period: 4, startTime: '11:20', endTime: '12:20', code: 'DSP' },
      { period: 5, startTime: '12:20', endTime: '13:20', code: 'VLSI' }
    ],
    SAT: [
      { period: 1, startTime: '08:00', endTime: '09:00', code: 'EMW' },
      { period: 2, startTime: '09:00', endTime: '10:00', code: 'OB' },
      { period: 3, startTime: '10:20', endTime: '11:20', code: 'VLSI' },
      { period: 4, startTime: '11:20', endTime: '12:20', code: 'MCA' },
      { period: 5, startTime: '12:20', endTime: '13:20', code: 'PROJECT' }
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
