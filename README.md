# Defend — IT Asset & Loan Management System

Defend is a full-stack IT Asset and Loan Management system built with Node.js, Express, React, Tailwind CSS, and MySQL.

---

## 🤖 AI Architecture

The AI assistant follows a secure, server-side architecture to enforce data privacy, cost control, rate limiting, and role-based access control.

```
Frontend (React / AIChatWidget)
  │
  │  POST /api/ai/chat  (Headers: Authorization: Bearer <JWT>)
  │  Body: { message: string, context: object }
  ▼
Backend Express Server
  │
  ├── 1. JWT Authentication (authenticateToken) → 401 if missing/invalid
  ├── 2. Input Validation (message 1-500 chars, context object) → 400 if invalid
  ├── 3. Rate Limiter (20 msgs/hour per user ID) → 429 if exceeded
  ├── 4. Server-Side System Prompt Construction (Role-based rules)
  │
  ▼
OpenRouter API (model: google/gemini-2.0-flash-001)
  │
  ▼
Response returned to Frontend ({ reply: string, usage: { prompt_tokens, completion_tokens } })
```

### Key Security Features
* **Zero Client-Side API Keys:** OpenRouter API key resides solely in `backend/.env`.
* **JWT Protected:** `POST /api/ai/chat` requires a valid Bearer token.
* **Rate Limiting:** Enforces `AI_RATE_LIMIT_PER_HOUR=20` per user ID.
* **Role-Based Scope:** Prompt rules ensure admins see full data while regular users only access their own assets/loans.
