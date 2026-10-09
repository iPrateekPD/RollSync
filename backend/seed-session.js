const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.teachers.findFirst({ where: { name: { contains: 'Dr. Jitendra Kumar' } } });
  if (!teacher) {
    console.log("No teacher found");
    return;
  }

  let timetable = await prisma.timetable.findFirst({
    where: { teacher_id: teacher.id }
  });

  if (!timetable) {
    console.log("No timetable found, creating one");
    const subject = await prisma.subjects.findFirst();
    timetable = await prisma.timetable.create({
      data: {
        day: 'FRI',
        start_time: '00:00',
        end_time: '23:59',
        subject_id: subject.id,
        teacher_id: teacher.id,
        section: 'SEC A',
        room: 'RDB-6'
      }
    });
  }

  const now = new Date();
  
  const existingSession = await prisma.attendance_sessions.findFirst({
    where: {
      timetable_id: timetable.id,
      class_date: new Date(now.setHours(0,0,0,0))
    }
  });

  if (!existingSession) {
    await prisma.attendance_sessions.create({
      data: {
        subject_id: timetable.subject_id,
        timetable_id: timetable.id,
        classroom: 'RDB-6',
        start_time: new Date(Date.now() - 3600000), // 1 hour ago
        end_time: new Date(Date.now() + 3600000), // 1 hour later
        active: true,
        status: 'in_progress',
        class_date: new Date(now.setHours(0,0,0,0))
      }
    });
    console.log("Created active session for RDB-6");
  } else {
    await prisma.attendance_sessions.update({
      where: { id: existingSession.id },
      data: {
        active: true,
        start_time: new Date(Date.now() - 3600000),
        end_time: new Date(Date.now() + 3600000),
        classroom: 'RDB-6'
      }
    });
    console.log("Updated active session for RDB-6");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
