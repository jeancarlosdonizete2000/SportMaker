import 'dotenv/config';
import mongoose from 'mongoose';
import { hashPassword, verifyPassword, signJwtToken, verifyJwtToken } from './security.js';

async function testConnectionAndCrypto() {
  console.log('1. Testando criptografia de senha (scrypt + salt + timingSafeEqual)...');
  const plain = 'MinhaSenhaForte2026!';
  const hashed = await hashPassword(plain);
  const validMatch = await verifyPassword(plain, hashed);
  const invalidMatch = await verifyPassword('SenhaErrada123', hashed);

  console.log('   Hash gerado:', hashed.slice(0, 42) + '...');
  console.log('   Verificação senha correta:', validMatch);
  console.log('   Rejeição senha incorreta:', !invalidMatch);

  const token = signJwtToken({ sub: '6733b9f1e4b0a1c2d3e4f5b2', role: 'player' });
  const decoded = verifyJwtToken(token);
  console.log('   JWT assinado e verificado:', !!decoded && decoded.role === 'player');

  console.log('\n2. Conectando ao cluster MongoDB Atlas (footplus.yliizzy.mongodb.net)...');
  const rawUri = process.env.MONGODB_URI;
  const cleanUri = rawUri.replace(/:<([^>]+)>@/, ':$1@');

  await mongoose.connect(cleanUri, { serverSelectionTimeoutMS: 10000 });
  console.log('   ✅ Conectado com sucesso ao MongoDB Atlas! Database:', mongoose.connection.name);

  await mongoose.disconnect();
  process.exit(0);
}

testConnectionAndCrypto().catch((err) => {
  console.error('   ❌ Erro durante o teste:', err.message);
  process.exit(1);
});

