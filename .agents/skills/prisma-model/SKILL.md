---
name: prisma-model
description: Generate Prisma model with proper relations and run migration. Use when adding new database models.
---

# Generate Prisma Model

Create a Prisma model with proper TypeScript types, relations, and migration.

> **Important:** Follow the Learning Mode guidelines in `_templates/learning-mode.md`

## Arguments
- `$ARGUMENTS` - Model name (e.g., "Lesson", "Quiz", "UserProgress")

## Instructions

When the user runs `/prisma-model <ModelName>`:

### Step 1: Gather requirements
Ask user:
1. "Model này cần những fields nào?" (nếu không rõ từ context)
2. "Có relations với models khác không?" (User, LearningPath, etc.)

### Step 2: Show plan before creating
```
📋 Plan for model: <ModelName>

Fields:
- id: String @id @default(cuid())
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt
- [other fields...]

Relations:
- belongsTo User
- hasMany QuizQuestion

Location: prisma/schema.prisma
```

Ask: "Bạn có muốn thêm/bớt field nào không?"

### Step 3: Add model to schema
Edit `prisma/schema.prisma` with:
- Model definition
- Proper field types
- Relations with other models
- Indexes if needed

### Step 4: Explain the model
After adding, explain:
1. **Fields** - What each field is for
2. **Relations** - How it connects to other models
3. **Decorators** - @id, @default, @relation, etc.

### Step 5: Run migration
Ask: "Bạn muốn tôi chạy migration luôn không?"

If yes:
```bash
npx prisma migrate dev --name add_<model_name>
```

## Prisma Best Practices

1. **Naming**:
   - Model names: PascalCase (User, LearningPath)
   - Field names: camelCase (createdAt, userId)
   - Relation fields: descriptive (author, lessons)

2. **Common field patterns**:
   ```prisma
   id        String   @id @default(cuid())
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   ```

3. **Relations**:
   ```prisma
   // One-to-Many
   user   User   @relation(fields: [userId], references: [id])
   userId String

   // Many-to-Many (junction table)
   @@id([lessonId, trackId])
   ```

4. **Indexes**:
   ```prisma
   @@index([userId])
   @@unique([email])
   ```

## Existing Models Reference

Check `prisma/schema.prisma` for existing models:
- User, OTPCode, RefreshToken
- LearningPath, Track, Lesson
- Quiz, QuizQuestion
- UserProgress, QuizResult
- AIInteractionLog, AIUsageQuota

## Example Usage

```
/prisma-model Bookmark
/prisma-model Certificate
/prisma-model Notification
```

## After Completion

Remind user:
- "Nhớ update TRACKPAD.md với model mới!"
- Suggest: "Bạn có muốn tôi tạo NestJS module cho model này không? (`/nest-module`)"
- Run `npx prisma studio` to view in GUI
