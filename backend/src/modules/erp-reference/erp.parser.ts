export function parseAttendanceData(rawData: any[], rollno: string) {
  if (!rawData || rawData.length === 0 || (rawData.length === 1 && rawData[0].data === 'No data available in table')) {
    return {
      student: {
        rollno,
      },
      overallAttendance: 0,
      subjects: [],
      daywise: []
    };
  }

  const subjectsMap: Record<string, { attended: number, total: number }> = {};
  let totalAttended = 0;
  let totalHeld = 0;

  rawData.forEach(day => {
    Object.keys(day).forEach(key => {
      if (key !== 'AttendanceDate' && key !== 'Total') {
        const val = day[key];
        if (typeof val === 'string' && val.includes('/')) {
          const [attendedStr, heldStr] = val.split('/');
          const attended = parseInt(attendedStr, 10) || 0;
          const held = parseInt(heldStr, 10) || 0;

          if (!subjectsMap[key]) {
            subjectsMap[key] = { attended: 0, total: 0 };
          }
          subjectsMap[key].attended += attended;
          subjectsMap[key].total += held;
          
          totalAttended += attended;
          totalHeld += held;
        }
      }
    });
  });

  const subjects = Object.keys(subjectsMap).map(code => {
    const data = subjectsMap[code];
    return {
      code,
      name: code, // Assuming name is same as code unless we have a mapping
      attended: data.attended,
      total: data.total,
      percentage: data.total > 0 ? parseFloat(((data.attended / data.total) * 100).toFixed(2)) : 0
    };
  });

  const overallAttendance = totalHeld > 0 ? parseFloat(((totalAttended / totalHeld) * 100).toFixed(2)) : 0;

  return {
    student: {
      rollno,
      // We do not have name/branch from this unauthenticated endpoint directly
    },
    overallAttendance,
    subjects,
    daywise: rawData
  };
}
