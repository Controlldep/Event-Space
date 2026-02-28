import { DataSource } from 'typeorm';

export const cleanDatabase = async (dataSource: DataSource) => {
  const entities = dataSource.entityMetadatas;
  const tableNames = entities.map((entity) => `"${entity.tableName}"`).join(', ');

  if (!tableNames) return;

  try {
    await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
    throw new Error('Database cleanup failed');
  }
};
