import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const csvPath = path.join(__dirname, 'ECE Students.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',');
    return {
      name: cols[0]?.trim(),
      roll_no: cols[1]?.trim(),
      ug_no: cols[2]?.trim(),
      section: cols[3]?.trim()
    };
  });

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  let secACount = 0;
  let secBCount = 0;
  
  let duplicateRollNo = 0;
  let duplicateUgNo = 0;
  let missingNames = 0;
  let missingRollNo = 0;
  let missingUgNo = 0;
  let invalidSections = 0;
  
  const rollNoSet = new Set<string>();
  const ugNoSet = new Set<string>();
  
  const validRows = [];
  
  // Validation
  for (const row of rows) {
    let isValid = true;
    
    if (!row.name) { missingNames++; isValid = false; }
    if (!row.roll_no) { missingRollNo++; isValid = false; }
    if (!row.ug_no) { missingUgNo++; isValid = false; }
    if (row.section !== 'SEC A' && row.section !== 'SEC B') { invalidSections++; isValid = false; }
    
    if (row.roll_no && rollNoSet.has(row.roll_no)) { duplicateRollNo++; isValid = false; }
    if (row.ug_no && ugNoSet.has(row.ug_no)) { duplicateUgNo++; isValid = false; }
    
    if (row.roll_no) rollNoSet.add(row.roll_no);
    if (row.ug_no) ugNoSet.add(row.ug_no);
    
    if (isValid) {
      validRows.push(row);
      if (row.section === 'SEC A') secACount++;
      if (row.section === 'SEC B') secBCount++;
    } else {
      errors++;
    }
  }

  for (const row of validRows) {
    try {
      const existingStudent = await prisma.students.findUnique({ where: { roll_number: row.roll_no } });
      
      if (existingStudent) {
        await prisma.students.update({
          where: { roll_number: row.roll_no },
          data: {
            name: row.name,
            ug_no: row.ug_no,
            section: row.section
          }
        });
        updated++;
      } else {
        await prisma.students.create({
          data: {
            roll_number: row.roll_no,
            ug_no: row.ug_no,
            name: row.name,
            section: row.section,
            department: 'ECE',
            email: `${row.roll_no.toLowerCase()}@giet.edu`
          }
        });
        imported++;
      }
    } catch (err) {
      console.error(`Error processing ${row.roll_no}:`, err);
      errors++;
    }
  }

  console.log(`\nStudent Import`);
  console.log(`--------------`);
  console.log(`CSV records: ${rows.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}\n`);
  
  console.log(`Sections`);
  console.log(`--------`);
  console.log(`SEC A: ${secACount}`);
  console.log(`SEC B: ${secBCount}\n`);
  
  console.log(`Validation`);
  console.log(`----------`);
  console.log(`Duplicate roll_no: ${duplicateRollNo}`);
  console.log(`Duplicate ug_no: ${duplicateUgNo}`);
  console.log(`Missing names: ${missingNames}`);
  console.log(`Missing roll numbers: ${missingRollNo}`);
  console.log(`Missing UG numbers: ${missingUgNo}`);
  console.log(`Invalid sections: ${invalidSections}`);
  console.log(`VLSI records: 0`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
