import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRelations() {
  const auditLogsRaj = await prisma.auditLog.count({ where: { adminId: 'cmwnnpw15000110le7rlpfepv' } });
  const auditLogsSara = await prisma.auditLog.count({ where: { adminId: 'cmwnnpvz3000010ledzcu37w0' } });
  console.log('Audit logs for Raj:', auditLogsRaj);
  console.log('Audit logs for Sara:', auditLogsSara);
}

checkRelations().then(() => prisma.$disconnect());
