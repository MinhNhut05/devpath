// prisma.config.ts (backend root)
// Prisma 7 tìm file này ở ROOT của package (cùng cấp package.json)
// Docs: https://pris.ly/d/config-datasource

import path from 'node:path';
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

// Load .env từ cùng thư mục (backend/.env)
dotenv.config({ path: path.resolve(import.meta.dirname, '.env') });

export default defineConfig({
  schema: path.resolve(import.meta.dirname, 'prisma/schema.prisma'),

  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
