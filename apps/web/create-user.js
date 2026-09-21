const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const hash = fs.readFileSync('./hash.txt', 'utf-8').trim();
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.usuario.upsert({
      where: { email_escritorioId: { email: 'davi@test.com', escritorioId: '3febc184-7363-4564-b782-3198c3dd0163' } },
      update: { senhaHash: hash },
      create: {
        email: 'davi@test.com',
        nome: 'Davi Teste',
        funcao: 'ADVOGADO',
        perfil: 'ADMIN',
        ativo: true,
        escritorioId: '3febc184-7363-4564-b782-3198c3dd0163',
        senhaHash: hash,
      },
    });
    console.log('User ready:', user.id, user.email);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
