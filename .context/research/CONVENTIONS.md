# CONVENTIONS - Naming, Imports, Error Handling

> Coding conventions for this project. Updated as patterns emerge.

---

## Naming

### Files
- **NestJS modules**: kebab-case (`auth.module.ts`, `learning-paths.controller.ts`)
- **React components**: PascalCase (`LoginPage.tsx`, `ChatWindow.tsx`)
- **Utils/hooks**: camelCase (`useAuth.ts`, `formatDate.ts`)
- **Types**: camelCase file, PascalCase exports (`auth.ts` → `export interface LoginDto`)

### Variables
- **Constants**: UPPER_SNAKE_CASE (`MAX_OTP_ATTEMPTS`)
- **Functions/variables**: camelCase (`getUserById`, `isAuthenticated`)
- **Classes/interfaces**: PascalCase (`UserService`, `CreateUserDto`)
- **Enums**: PascalCase with UPPER_SNAKE values (`enum UserRole { ADMIN, USER }`)

### Database
- **Tables**: snake_case plural (`users`, `learning_paths`, `otp_codes`)
- **Columns**: snake_case (`created_at`, `learning_path_id`)
- **Prisma models**: PascalCase (`User`, `LearningPath`) with `@@map()` for table names

## Imports

### NestJS
```typescript
// 1. NestJS core
import { Controller, Get, Post } from '@nestjs/common';
// 2. Third-party
import { PrismaService } from '../prisma/prisma.service';
// 3. Local
import { CreateUserDto } from './dto/create-user.dto';
```

### React
```typescript
// 1. React
import { useState, useEffect } from 'react';
// 2. Third-party
import { useQuery } from '@tanstack/react-query';
// 3. Components
import { Button } from '@/components/ui/button';
// 4. Local
import { useAuth } from '@/hooks/useAuth';
```

## Error Handling

### Backend
- Use NestJS built-in exceptions (`BadRequestException`, `UnauthorizedException`, etc.)
- Custom exception filters for consistent error format
- Standardized response: `{ success: false, error: { code, message, details } }`

### Frontend
- React Query error handling via `onError` callbacks
- Toast notifications for user-facing errors
- Error boundaries for unexpected crashes

## API Response Format

```typescript
// Success
{ success: true, data: {...}, meta: { timestamp, requestId } }

// Error
{ success: false, error: { code: 'VALIDATION_ERROR', message: '...' }, meta: {...} }
```

## Comments

- Only add comments where logic isn't self-evident
- Use English for all code comments
- JSDoc for public API methods in services
