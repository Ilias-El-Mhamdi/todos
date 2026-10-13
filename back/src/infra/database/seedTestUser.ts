import { AppDataSource } from './dataSource';
import { UserEntity } from '../../core/repos/user/user.entity';
import { hashPassword } from '../../core/utils/password';

// Crée (ou réinitialise) le compte de test défini par TEST_USERNAME / TEST_PASSWORD. Base locale uniquement.
async function main() {
  const { DATABASE_URL, TEST_USERNAME, TEST_PASSWORD } = process.env;
  const host = DATABASE_URL ? new URL(DATABASE_URL).hostname : '';
  if (!['localhost', '127.0.0.1'].includes(host)) throw new Error(`Refusé : base non locale (${host || 'DATABASE_URL absent'})`);
  if (!TEST_USERNAME || !TEST_PASSWORD) throw new Error('TEST_USERNAME et TEST_PASSWORD requis dans .env');

  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  const repo = AppDataSource.getRepository(UserEntity);
  const passwordHash = await hashPassword(TEST_PASSWORD);
  const existing = await repo.findOne({ where: { username: TEST_USERNAME } });
  await repo.save(existing ? { ...existing, passwordHash } : repo.create({ username: TEST_USERNAME, passwordHash }));
  console.log(`Compte de test prêt : ${TEST_USERNAME}`);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
