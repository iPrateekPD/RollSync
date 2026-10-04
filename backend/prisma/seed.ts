import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  // Clean DB
  await prisma.user.deleteMany();
  
  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@giet.edu',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  
  console.log(`Created admin user with id: ${adminUser.id}`);
  
  // Later we can add seeding for Teachers and Students when those models are fully utilized
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
