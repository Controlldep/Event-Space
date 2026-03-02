import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(__dirname, '../.env.development');

if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('✅ Конфиг загружен из:', envPath);
} else {
  console.error(' Не удалось найти .env файл по пути:', envPath);
}

process.env.NODE_ENV = 'test';
