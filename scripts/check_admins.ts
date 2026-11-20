import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmins() {
  const users = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('Existing Admin users:', users);
}

checkAdmins().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
