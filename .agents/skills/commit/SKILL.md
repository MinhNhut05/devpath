---
name: commit
description: Generate a conventional commit message based on staged changes. Use when committing code changes.
---

# Generate Commit Message

Analyze the staged changes and generate a commit message following the Conventional Commits specification.

> **Important:** Follow the Learning Mode guidelines in `_templates/learning-mode.md`

## Instructions

1. Run `git diff --staged` to see what changes are staged
2. Analyze the changes and determine:
   - The type of change (feat, fix, refactor, docs, style, test, chore, perf, ci, build)
   - The scope (optional - which part of codebase: auth, users, api, ui, etc.)
   - A concise description of what was changed

3. Generate a commit message in this format:
   ```
   <type>(<scope>): <short description>

   <optional body explaining WHY the change was made>

   <optional footer for breaking changes or issue references>
   ```

## Commit Types

| Type | When to use |
|------|-------------|
| `feat` | New feature for the user |
| `fix` | Bug fix for the user |
| `refactor` | Code restructuring without changing behavior |
| `docs` | Documentation only changes |
| `style` | Formatting, missing semicolons, etc. (no code change) |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, configs |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration changes |
| `build` | Build system or external dependencies |

## Examples

```
feat(auth): add OTP verification for email login

fix(api): handle null response from external service

refactor(users): extract validation logic to separate module

docs(readme): update installation instructions

chore(deps): upgrade prisma to v5.10
```

## Learning Mode

After generating the commit message:
1. EXPLAIN why you chose that commit type
2. EXPLAIN the scope selection
3. ASK if the user wants to modify anything before committing

## Output

Provide the commit message and ask user to confirm before executing:
```bash
git commit -m "<generated message>"
```

## After Completion

Remind user: "Nhớ update TRACKPAD.md nếu đây là milestone quan trọng!"
