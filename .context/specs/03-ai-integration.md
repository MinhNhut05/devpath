# AI Integration

---

## AI Provider

| Item | Value |
|------|-------|
| API URL | `https://manager.devteamos.me` |
| Format | Anthropic-compatible API |
| Auth | API key (sk-xxx) |
| SDK | Anthropic SDK hoac HTTP client |

> **Note:** Khong dung LangChain.js. Goi truc tiep API vi format da tuong thich Anthropic.

---

## Models by Tier

### Free Tier
| Model | Type |
|-------|------|
| gemini-2.5-flash | Fast, basic |
| gemini-2.5-flash-thinking | Fast with reasoning |

### Pro Tier (+ all Free models)
| Model | Type |
|-------|------|
| claude-sonnet-4-5 | High quality |
| gemini-3-pro-low | Pro quality |
| gemini-3-pro-high | Pro quality, higher capacity |

### Ultra Tier (+ all Pro models)
| Model | Type |
|-------|------|
| claude-opus-4-6-thinking | Highest quality with deep reasoning |

---

## Token Quotas (per day)

> Con so cu the se duoc xac dinh khi implement. Day la draft:

| Tier | Tokens/day | Models |
|------|-----------|--------|
| Free | TBD (e.g. 50,000) | Free models only |
| Pro | TBD (e.g. 500,000) | Free + Pro models |
| Ultra | TBD (e.g. 2,000,000) | All models |

---

## Context Injection Strategy

Khi user chat, backend se build context tu database roi gui kem trong system prompt.

```typescript
interface AIContext {
  user: {
    learningPath: string;
    currentTrack: string;
    currentLesson: string;
    completedLessons: string[];
    recentQuizScores: { lesson: string; score: number }[];
  };
  lesson: {
    title: string;
    summary: string;
    keyTopics: string[];
  };
  previousLessons: {
    title: string;
    summary: string;
  }[];
}
```

### System Prompt Template

```
You are a helpful learning assistant for DevPath, an IT learning platform.

CONTEXT:
- User is learning: {{learningPath}}
- Current track: {{currentTrack}}
- Current lesson: {{currentLesson}}

LESSON CONTENT:
{{lessonSummary}}

KEY TOPICS:
{{keyTopics}}

PREVIOUS LESSONS USER COMPLETED:
{{previousLessons}}

RULES:
1. Only answer questions related to the current lesson and previous lessons
2. If asked about topics not yet covered, politely redirect
3. Provide examples when explaining concepts
4. Keep responses concise but helpful
5. Respond in the same language the user uses (Vietnamese or English)

If the user asks something completely unrelated to programming/IT,
politely remind them this is a learning assistant.
```

---

## AI Use Cases

### 1. Lesson Chatbot
- User hoi ve noi dung bai hoc
- Context: current lesson + completed lessons
- Model: tuy theo tier

### 2. Essay Grading
- User nop cau tra loi tu luan
- AI cham diem va giai thich
- System prompt rieng cho grading

### 3. Onboarding Recommendation
- Phan tich cau tra loi onboarding
- Goi y learning path phu hop
- 1-time call, khong tinh vao daily quota

### 4. Content Generation (Admin)
- AI generate lesson summary, quiz questions
- Bulk generate cho nhieu bai cung luc
- Chi admin su dung

---

## Fallback Strategy

```typescript
try {
  const response = await aiProvider.chat(prompt);
  return response;
} catch (error) {
  if (error.code === 'TIMEOUT' || error.code === 'RATE_LIMIT') {
    return {
      type: 'fallback',
      message: 'He thong AI dang ban. Vui long thu lai sau.',
      suggestedActions: [
        'Xem lai noi dung bai hoc',
        'Thu lam quiz',
        'Doc tai lieu tham khao'
      ]
    };
  }
  throw error;
}
```

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/ai/chat` | Send message to AI | Yes |
| GET | `/ai/chat/history` | Get chat history | Yes |
| GET | `/ai/quota` | Get remaining daily quota | Yes |
| GET | `/ai/models` | Get available models for user tier | Yes |
