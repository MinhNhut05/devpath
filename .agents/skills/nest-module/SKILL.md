---
name: nest-module
description: Generate a complete NestJS module with controller, service, and DTOs following DevPath architecture. Use when creating new backend modules.
---

# Generate NestJS Module

Generate a complete NestJS module following the DevPath project architecture.

> **Important:** Follow the Learning Mode guidelines in `_templates/learning-mode.md`

## Arguments
- `$ARGUMENTS` - Module name (e.g., "users", "lessons", "quizzes")

## Instructions

When the user runs `/nest-module <module-name>`:

### Step 1: Plan & Confirm
First, show the user what will be created:
```
backend/src/modules/<module-name>/
├── <module-name>.module.ts
├── <module-name>.controller.ts
├── <module-name>.service.ts
├── dto/
│   ├── create-<module-name>.dto.ts
│   └── update-<module-name>.dto.ts
```

Ask: "Bạn muốn bắt đầu từ file nào? Recommend: Service (chứa core logic)"

### Step 2: Create files one by one
For EACH file:
1. Write the code (max 50 lines)
2. Explain what it does and WHY
3. Ask: "Bạn hiểu phần này chưa? Có câu hỏi gì không?"
4. Wait for confirmation before next file

## Code Standards

1. **Controller**:
   - Use `@Controller('api/v1/<module-name>')` for versioned API
   - Include decorators: `@Get`, `@Post`, `@Patch`, `@Delete`
   - Use `@ApiTags` for Swagger documentation

2. **Service**:
   - Inject `PrismaService` for database operations
   - Use async/await pattern
   - Throw proper NestJS exceptions

3. **DTOs**:
   - Use `class-validator` decorators
   - Use `class-transformer` for transformation

4. **Module**:
   - Import required modules (PrismaModule, etc.)
   - Export service if needed by other modules

## After Completion

Remind user:
- "Nhớ update TRACKPAD.md với những gì đã học!"
- Suggest next steps (register in AppModule, create Prisma model, etc.)
- Link to NestJS docs if user needs more info
