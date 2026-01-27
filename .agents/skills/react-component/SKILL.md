---
name: react-component
description: Generate a React component with TypeScript, Tailwind CSS, and proper structure. Use when creating frontend components.
---

# Generate React Component

Create a React component following DevPath frontend architecture.

> **Important:** Follow the Learning Mode guidelines in `_templates/learning-mode.md`

## Arguments
- `$ARGUMENTS` - Component name and optional type (e.g., "Button", "UserCard ui", "LoginForm page")

## Instructions

When the user runs `/react-component <name> [type]`:

### Step 1: Clarify Requirements
Ask user:
1. "Component này thuộc loại nào?"
   - `ui` - Reusable UI component (Button, Card, Modal...)
   - `layout` - Layout component (Header, Sidebar, Footer...)
   - `feature` - Feature-specific (UserProfile, LessonCard...)
   - `page` - Page component (Dashboard, Login...)

2. "Component này cần những props gì?" (if not obvious)

### Step 2: Determine file location
Based on type:
```
frontend/src/components/
├── ui/           ← ui components
├── layout/       ← layout components
├── auth/         ← auth-related features
├── learning/     ← learning-related features
└── chat/         ← chat-related features

frontend/src/pages/  ← page components
```

### Step 3: Create files one by one
For EACH file, explain before creating:

#### File 1: Component file
```
<ComponentName>.tsx
```
- Use functional component with TypeScript
- Define Props interface
- Use Tailwind CSS for styling
- Export as named export

#### File 2: Index file (optional)
```
index.ts
```
- Re-export for cleaner imports

### Step 4: Explain after creation
For each file:
1. Explain the structure and WHY
2. Explain the TypeScript types used
3. Explain Tailwind classes if complex
4. Ask: "Bạn hiểu phần này chưa?"

## Code Standards

1. **TypeScript**:
   - Always define Props interface
   - Use proper types (no `any`)
   - Export types that might be reused

2. **Styling**:
   - Use Tailwind CSS classes
   - Use `cn()` utility for conditional classes
   - Follow project color scheme

3. **Structure**:
   ```tsx
   import { type FC } from 'react';

   interface ComponentNameProps {
     // props here
   }

   export const ComponentName: FC<ComponentNameProps> = ({ prop1, prop2 }) => {
     return (
       <div className="...">
         {/* content */}
       </div>
     );
   };
   ```

4. **Hooks**:
   - Custom hooks in separate file if complex
   - Use React Query for data fetching
   - Use Zustand for global state

## Example Usage

```
/react-component Button ui
/react-component UserCard feature
/react-component Dashboard page
```

## After Completion

Remind user:
- "Nhớ update TRACKPAD.md với component mới!"
- Suggest: "Bạn có muốn tôi tạo thêm stories cho Storybook không?" (if applicable)
- Link to React/Tailwind docs if needed
