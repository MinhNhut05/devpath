// prisma.config.ts
// Prisma 7 configuration file for migrations
// Docs: https://pris.ly/d/config-datasource

import path from 'node:path';
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

// ESM không có __dirname → dùng import.meta.dirname (Node 21.2+)
// Hoặc fallback về process.cwd() (thư mục backend/ khi chạy pnpm prisma)
const envPath = path.resolve(
  (import.meta.dirname ?? process.cwd()),
  '../.env',
);
dotenv.config({ path: envPath });

export default defineConfig({
  schema: path.resolve(
    (import.meta.dirname ?? process.cwd()),
    'schema.prisma',
  ),

  datasource: {
    url: process.env.DATABASE_URL!,
  },

  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
});
