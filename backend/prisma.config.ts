// prisma.config.ts (backend root)
// Prisma 7 tìm file này ở ROOT của package (cùng cấp package.json)
// Docs: https://pris.ly/d/config-datasource
//
// Dùng require() để tương thích với NestJS TypeScript compiler (CommonJS output)
// File này chỉ dùng cho Prisma CLI, không chạy trong NestJS runtime

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { defineConfig } = require('prisma/config');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = defineConfig({
  schema: path.resolve(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
