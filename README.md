# VedaAI – AI Assessment Creator

> Full Stack Engineering Assignment | Role: Full Stack Engineer

A pixel-perfect implementation of the VedaAI Figma designs — an AI-powered question paper generator for teachers, built with a real-time processing pipeline.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                    │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ Zustand  │  │  WebSocket  │  │  React Components    │   │
│  │  Store   │  │ (Socket.IO) │  │  (Figma pixel-perf)  │   │
│  └────┬─────┘  └──────┬──────┘  └──────────────────────┘   │
└───────┼───────────────┼─────────────────────────────────────┘
        │ REST API       │ WS Events
        ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express + TS)            │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │   REST API   │  │  Socket.IO    │  │  Redis Pub/Sub  │  │
│  │  /api/...    │  │  Server       │  │  (job updates)  │  │
│  └──────┬───────┘  └───────────────┘  └─────────────────┘  │
│         │ enqueue                                             │
│         ▼                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │    BullMQ    │  │    Worker     │  │   Groq API      │  │
│  │    Queue     │─▶│  (separate    │─▶│ llama-3.3-70b   │  │
│  │    Redis     │  │   process)    │  │  -versatile     │  │
│  └──────────────┘  └──────┬────────┘  └─────────────────┘  │
│                            │ publish result                   │
│  ┌──────────────┐  ┌───────▼────────┐                       │
│  │   MongoDB    │  │     Redis      │                        │
│  │  (storage)   │  │    (cache)     │                        │
│  └──────────────┘  └────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow
1. Teacher fills Create Assignment form → submits
2. `POST /api/assignments` → saves to MongoDB → enqueues BullMQ job
3. Worker picks up job → calls **Groq `llama-3.3-70b-versatile`** with structured prompt
4. Worker parses + validates JSON response into typed `QuestionPaper` object
5. Saves result to MongoDB → publishes update to Redis channel
6. Main server receives Redis message → emits `job:update` via Socket.IO
7. Frontend receives WS event → updates Zustand store → renders question paper

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| State | Zustand |
| Real-time | Socket.IO client |
| Styling | Tailwind CSS + Inter font |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Mongoose) |
| Cache | Redis (ioredis) |
| Queue | BullMQ |
| WebSocket | Socket.IO |
| AI | **Groq – llama-3.3-70b-versatile (free)** |

---

## Project Structure

```
vedaai/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (sidebar + mobile nav + toaster)
│   │   ├── page.tsx                    # Redirects → /assignments
│   │   ├── error.tsx                   # Global error boundary
│   │   ├── not-found.tsx               # 404 page
│   │   ├── assignments/
│   │   │   ├── page.tsx                # List: empty state + filled grid
│   │   │   ├── loading.tsx             # Skeleton loading state
│   │   │   ├── create/page.tsx         # 2-step create form
│   │   │   └── [id]/page.tsx           # Output: processing + result view
│   │   ├── groups/ library/ toolkit/ settings/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             # Desktop sidebar with badge count
│   │   │   ├── Header.tsx              # Desktop top bar
│   │   │   ├── MobileHeader.tsx        # Mobile top bar
│   │   │   └── MobileNav.tsx           # Mobile bottom navigation
│   │   ├── assignments/
│   │   │   ├── AssignmentCard.tsx      # Desktop grid card + 3-dot menu
│   │   │   ├── MobileAssignmentItem.tsx
│   │   │   ├── EmptyStateIllustration.tsx
│   │   │   └── QuestionTypeRow.tsx     # ± counters for questions/marks
│   │   ├── output/
│   │   │   └── QuestionPaperView.tsx   # Full exam paper render
│   │   └── ui/
│   │       ├── Logo.tsx
│   │       ├── StepProgress.tsx
│   │       └── FileUploadZone.tsx      # Drag & drop upload
│   ├── hooks/useWebSocket.ts
│   ├── store/assignmentStore.ts        # Zustand store
│   ├── lib/ api.ts utils.ts
│   └── types/index.ts
│
└── backend/
    └── src/
        ├── index.ts                    # Server + Socket.IO + Redis subscriber
        ├── models/Assignment.ts        # Mongoose schema
        ├── routes/assignments.ts       # CRUD + regenerate endpoints
        ├── services/
        │   ├── aiService.ts            # Groq API call
        │   └── promptBuilder.ts       # Prompt construction + JSON parser
        ├── workers/questionWorker.ts   # BullMQ worker process
        └── lib/queue.ts               # Redis + BullMQ + cache helpers
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local: `mongod` | cloud: MongoDB Atlas)
- Redis (local: `redis-server` | cloud: Upstash)
- **Groq API key** (free at [console.groq.com](https://console.groq.com))

### 1. Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Environment variables

**`backend/.env`** (copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`** (copy from `.env.local.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### 3. Start all services (5 terminals)

```bash
# Terminal 1
mongod

# Terminal 2
redis-server

# Terminal 3 – API server
cd backend && npm run dev

# Terminal 4 – BullMQ worker
cd backend && npm run worker

# Terminal 5 – Frontend
cd frontend && npm run dev
```

Open **http://localhost:3000** → you're live.

---

## Key Design Decisions

**Prompt Engineering** — The prompt forces Groq to return `json_object` format with `response_format: { type: 'json_object' }`. The `parseAIResponse` function validates every field, assigns UUIDs, and falls back to a generated paper if parsing fails — raw AI output is never exposed to the frontend.

**Real-time Pipeline** — Worker → Redis pub/sub → Socket.IO room emit. The HTTP server and the worker are decoupled processes; Redis is the bridge. Frontend subscribes to a specific assignment room and gets progress + completion events.

**Caching** — Assignments list: 60s TTL. Individual completed assignments: 1hr TTL. Both are invalidated on create, delete, and regenerate.

**Mobile-first** — Every screen has a dedicated mobile layout matching the Figma mobile designs: bottom nav bar, mobile header with back button, single-column card list, and responsive question paper.

---

## Features Implemented

| Feature | Status |
|---|---|
| Empty state (Figma screen 1) | ✅ |
| Filled state grid + 3-dot menu (Figma screen 2) | ✅ |
| 2-step create form with file upload (Figma screen 3) | ✅ |
| Question paper output view (Figma screen 4) | ✅ |
| Mobile responsive (all screens) | ✅ |
| Real-time generation with progress bar | ✅ |
| Download as PDF | ✅ |
| Regenerate question paper | ✅ |
| Difficulty badges (Easy / Medium / Hard) | ✅ |
| Answer key (collapsible, teacher-only) | ✅ |
| Assignment count badge on sidebar | ✅ |
| Error boundary + 404 page | ✅ |
| Loading skeletons | ✅ |
| Redis caching | ✅ |
| BullMQ job retries (3 attempts, exponential backoff) | ✅ |
