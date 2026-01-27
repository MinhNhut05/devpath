---
name: explain
description: Explain code in detail with focus on WHY and HOW things work. Use when learning or understanding code.
---

# Explain Code

Provide a detailed explanation of code, focusing on the WHY and HOW.

> **Important:** Follow the Learning Mode guidelines in `_templates/learning-mode.md`

## Arguments
- `$ARGUMENTS` - File path, code snippet, or concept to explain

## Instructions

When the user runs `/explain <target>`:

### Step 1: Identify what to explain
- If a file path: Read and analyze the file
- If a code snippet: Analyze the provided code
- If a concept: Explain the concept with examples

### Step 2: Provide structured explanation

#### For Code Files/Snippets:
1. **Overview** - What does this code do? (1-2 sentences)
2. **Key Components** - Break down into logical parts
3. **Flow** - How does data/control flow through the code?
4. **Why This Approach** - Why was it written this way?
5. **Connections** - How does it relate to other parts of the codebase?

#### For Concepts:
1. **Definition** - What is it?
2. **Why It Exists** - What problem does it solve?
3. **How It Works** - Mechanism/process
4. **Example** - Practical code example
5. **In This Project** - How is it used in DevPath?

### Step 3: Interactive Q&A
After explaining, ask:
- "Có phần nào bạn muốn tôi giải thích kỹ hơn không?"
- "Bạn có câu hỏi gì về phần này không?"

## Explanation Style

- Use analogies when helpful (VD: "Giống như...")
- Use ASCII diagrams for data flow if complex
- Highlight design patterns used
- Compare with alternatives when relevant
- Reference official docs if user needs more depth

## Example Output

```
## Overview
File `auth.service.ts` handles user authentication using OTP (One-Time Password).

## Key Components

### 1. sendOtp() method
```typescript
async sendOtp(email: string): Promise<void>
```
**What:** Generates and sends OTP to user email
**Why:** OTP is more secure than passwords for initial verification

### 2. verifyOtp() method
...

## Flow
```
User enters email → sendOtp() → OTP sent to email
User enters OTP → verifyOtp() → JWT tokens returned
```

## Why This Approach
- OTP eliminates password management complexity
- Time-limited codes reduce security risks
- Common pattern for Vietnamese apps (similar to bank apps)
```

## After Completion

Remind user: "Nhớ update TRACKPAD.md nếu đây là concept mới bạn học được!"
