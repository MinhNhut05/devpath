---
name: debug
description: Analyze bugs and suggest fixes with step-by-step debugging approach. Use when encountering errors or unexpected behavior.
---

# Debug Helper

Analyze bugs systematically and suggest fixes with explanations.

> **Important:** Follow the Learning Mode guidelines in `_templates/learning-mode.md`

## Arguments
- `$ARGUMENTS` - Error message, file path, or description of the bug

## Instructions

When the user runs `/debug <problem>`:

### Step 1: Gather information
Ask if not provided:
1. "Error message chính xác là gì?"
2. "Bug xảy ra ở file/endpoint nào?"
3. "Có reproduce được không? Steps?"
4. "Gần đây có thay đổi gì liên quan không?"

### Step 2: Analyze the problem

#### For Runtime Errors:
1. Read the error message and stack trace
2. Identify the failing line/file
3. Trace back to find root cause
4. Check related files

#### For Logic Bugs:
1. Understand expected vs actual behavior
2. Trace the data flow
3. Identify where logic diverges
4. Check edge cases

#### For API Errors:
1. Check request/response format
2. Verify authentication/authorization
3. Check database queries
4. Verify external service calls

### Step 3: Report analysis

```
## 🐛 Bug Analysis

### Problem Summary
[1-2 sentence description]

### Root Cause
**What:** [What's wrong]
**Where:** [File:line or component]
**Why:** [Why it happens]

### Evidence
```code
// The problematic code
```

### Suggested Fix
```code
// The fixed code
```

### Explanation
[Why this fix works - teaching moment]

### Prevention
[How to avoid similar bugs in future]
```

### Step 4: Interactive debugging
After analysis, ask:
- "Bạn có muốn tôi apply fix này không?"
- "Bạn có muốn tôi giải thích kỹ hơn phần nào không?"
- "Bạn hiểu tại sao bug xảy ra chưa?"

## Common Bug Patterns

### NestJS
- Missing `@Injectable()` decorator
- Circular dependency
- Wrong module imports
- Async/await missing

### Prisma
- Missing `await` on queries
- Wrong relation in `include`
- Type mismatch in data

### React
- Missing dependency in useEffect
- State update on unmounted component
- Wrong key in lists

### TypeScript
- Null/undefined not handled
- Type assertion hiding real issue
- Generic type mismatch

## Debugging Strategies

1. **Binary Search**: Comment out half the code, narrow down
2. **Console.log**: Strategic logging at key points
3. **Rubber Duck**: Explain the code line by line
4. **Read Error Carefully**: Error messages often point to solution
5. **Check Recent Changes**: `git diff` to see what changed

## Example Usage

```
/debug "Cannot read property 'id' of undefined"
/debug backend/src/modules/auth/auth.service.ts
/debug "API returns 401 but user is logged in"
```

## After Completion

Remind user:
- "Nhớ update TRACKPAD.md với debugging lesson học được!"
- Suggest: "Có muốn tôi tạo test case để prevent regression không?"
- Share relevant debugging resources
