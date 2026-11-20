import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123', 10);
  
  const sara = await prisma.user.findUnique({ where: { email: 'sara@portfoliobuilders.in' } });
  const raj = await prisma.user.findUnique({ where: { email: 'raj@portfoliobuilders.in' } });
  
  let targetAdminId = '';
  if (sara) {
    const updated = await prisma.user.update({
      where: { id: sara.id },
      data: {
        email: 'admin@gmail.com',
        name: 'Super Admin',
        passwordHash: hash,
        role: 'SUPER_ADMIN'
      }
    });
    targetAdminId = updated.id;
    console.log('Updated sara to admin@gmail.com:', targetAdminId);
  } else {
    const existing = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: hash, role: 'SUPER_ADMIN', name: 'Super Admin' }
      });
      targetAdminId = existing.id;
      console.log('Updated existing admin@gmail.com:', targetAdminId);
    } else {
      const created = await prisma.user.create({
        data: {
          email: 'admin@gmail.com',
          name: 'Super Admin',
          passwordHash: hash,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE'
        }
      });
      targetAdminId = created.id;
      console.log('Created admin@gmail.com:', targetAdminId);
    }
  }

  if (raj && raj.id !== targetAdminId) {
    await prisma.auditLog.updateMany({
      where: { adminId: raj.id },
      data: { adminId: targetAdminId, adminName: 'Super Admin' }
    });
    await prisma.user.delete({ where: { id: raj.id } });
    console.log('Deleted second admin raj@portfoliobuilders.in and reassigned logs');
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
  });
  console.log('Total admins in database:', admins.length);
  admins.forEach(a => console.log('Admin in DB:', a.email, a.role));
}

main().catch(console.error).finally(() => prisma.$disconnect());
