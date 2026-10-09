const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.rfid_events.findMany();
  console.log('RFID Events:', events);

  const records = await prisma.attendance_records.findMany();
  console.log('Attendance Records:', records);
}

main().catch(console.error).finally(() => prisma.$disconnect());
