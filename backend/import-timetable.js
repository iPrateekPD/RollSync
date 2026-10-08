const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

async function main() {
  try {
    const csvPath = path.join(__dirname, '../Timetable_A_B.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Read ${records.length} records from CSV.`);

    // Keep track of normalized IDs
    const teacherMap = new Map();
    const subjectMap = new Map();

    for (const record of records) {
      const {
        day, start_time, end_time, subject_code, subject_name,
        teacher_name, section, room, class_type, is_lab
      } = record;

      // Ensure teacher exists (some fields are empty e.g. for PROJECT without teacher, skip or add generic)
      let teacherId = null;
      let tName = teacher_name || 'ECE Faculty';
      if (!teacherMap.has(tName)) {
        let teacher = await prisma.teachers.findUnique({
          where: { name: tName }
        });
        if (!teacher) {
          teacher = await prisma.teachers.create({
            data: {
              name: tName,
              department: 'ECE',
              role: 'teacher'
            }
          });
          console.log(`Created teacher: ${tName}`);
        }
        teacherMap.set(tName, teacher.id);
      }
      teacherId = teacherMap.get(tName);

      // Ensure subject exists
      if (!subjectMap.has(subject_code)) {
        let subject = await prisma.subjects.findUnique({
          where: { subject_code: subject_code }
        });
        if (!subject) {
          subject = await prisma.subjects.create({
            data: {
              subject_code: subject_code,
              subject_name: subject_name || subject_code
            }
          });
          console.log(`Created subject: ${subject_code}`);
        }
        subjectMap.set(subject_code, subject.id);
      }
      const subjectId = subjectMap.get(subject_code);

      // Insert timetable entry
      // section normalization: ECE-A -> SEC A, ECE-B -> SEC B
      const normSection = section.includes('A') ? 'SEC A' : 'SEC B';
      const normRoom = section.includes('A') ? 'RDB-05' : 'RDB-06';

      await prisma.timetable.create({
        data: {
          day,
          start_time,
          end_time,
          subject_id: subjectId,
          teacher_id: teacherId,
          section: normSection,
          room: normRoom,
          class_type,
          is_lab: is_lab.toLowerCase() === 'true'
        }
      });
    }

    console.log('Successfully imported timetable data.');
  } catch (error) {
    console.error('Error importing timetable:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
