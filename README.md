# VedaAI – AI Assessment & Grading Pipeline

> Full Stack Engineering Architecture | Role: Full Stack Engineer

A professional, production-ready implementation of the VedaAI platform. This application features an autonomous AI-powered question paper generator for teachers, and a fully integrated **Computer Vision-based Exam Grading** system leveraging Google Gemini's advanced multimodal API.

---

## 🚀 Key Features

*   **Automated Question Generation:** Define subject, grade, and question configurations, and watch the AI dynamically generate JSON-structured assignments.
*   **Multimodal Exam Grading (New):** Upload a handwritten student answer sheet alongside a question paper. The system uses advanced OCR and LLM reasoning to map answers to questions and automatically grade them with feedback.
*   **Real-time Processing Pipeline:** Powered by Upstash Redis and BullMQ. Background workers process heavy AI tasks asynchronously while WebSocket keeps the frontend UI buttery smooth.
*   **Cloud Native:** Actively deployed utilizing Vercel (Frontend), Render (Backend), MongoDB Atlas (Database), and Upstash (Redis Message Broker).

---

## 🏗️ Architecture Overview

The system uses an asynchronous worker pattern to ensure the main Express HTTP thread is never blocked by heavy prompt engineering or image inference latency.

```text
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                    │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ Zustand  │  │  WebSocket  │  │   UI Dashboard       │   │
│  │  Store   │  │ (Socket.IO) │  │  (Figma pixel-perf)  │   │
│  └────┬─────┘  └──────┬──────┘  └───────┬──────────────┘   │
└───────┼───────────────┼─────────────────┼───────────────────┘
        │ REST API       │ WS Events      │ Multipart Form
        ▼               ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)                 │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ Assignments  │  │  Exam Upload  │  │  Socket.IO      │  │
│  │  Endpoints   │  │   Endpoints   │  │  Broadcaster    │  │
│  └──────┬───────┘  └───────┬───────┘  └─────────▲───────┘  │
│         │ enqueue          │ enqueue            │ polling       
│         ▼                  ▼                    │              
│  ┌──────────────┐  ┌───────────────┐  ┌─────────┴───────┐  │
│  │  BullMQ      │  │  Assignment   │  │   Exam Vision   │  │
│  │  Redis       │─▶│  Worker       │  │   Worker        │  │
│  │  Broker      │  │ (Generation)  │  │ (OCR + Grading) │  │
│  └──────────────┘  └──────┬────────┘  └─────────┬───────┘  │
│                           │                     │          │
│                    ┌──────▼─────────────────────▼───────┐  │
│                    │     Gemini 3.6 Flash API           │  │
│                    │    (Text & Multimodal Vision)      │  │
│                    └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack & Infrastructure

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| **State** | Zustand |
| **Real-time** | Socket.IO |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | MongoDB Atlas (Mongoose) |
| **Message Broker / Cache** | Upstash Redis |
| **Job Queue** | BullMQ |
| **Artificial Intelligence** | **Google Gemini `gemini-3.6-flash` (Multimodal/Text)** |
| **Hosting Deployment** | Vercel (Front) + Render (Back) |

---

## 📂 Project Structure

```text
vedaai/
├── frontend/
│   ├── app/
│   │   ├── assignments/            # Question Paper Generation flow
│   │   └── exams/                  # New: AI Grading & OCR extraction flow
│   ├── components/                 # Reusable Radix/Tailwind building blocks
│   └── hooks/useWebSocket.ts       # Live socket subscriber
│
└── backend/
    ├── src/
    │   ├── index.ts                # Express setup + Rate Limiting 
    │   ├── routes/
    │   │   ├── assignments.ts      # Assignment CRUD
    │   │   └── exams.ts            # New: Multipart PDF/Image uploads
    │   ├── services/
    │   │   ├── aiService.ts        # Gemini text prompt engineering
    │   │   └── examAiService.ts    # New: Gemini Multimodal Vision orchestration
    │   └── workers/
    │       ├── questionWorker.ts   # BullMQ processor for assignments
    │       └── examWorker.ts       # New: BullMQ processor for grading pipeline
    └── uploads/                    # Local storage (or cloud mounted) for PDF parsing
```

---

## 🚀 Setup & Run Locally

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- Redis instance (local or Upstash)
- **Google Gemini API Key** (from Google AI Studio)

### 1. Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure Environment Variables

**`backend/.env`**:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster...
REDIS_URL=rediss://default:<password>@<domain>...
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**`frontend/.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### 3. Start Development Servers

```bash
# Terminal 1 – Backend Server & Workers
cd backend && npm run dev

# Terminal 2 – Frontend App
cd frontend && npm run dev
```

The app will be successfully running on **http://localhost:3000**.

---

## ✅ Features Implemented

| Feature | Status |
|---|---|
| **AI Assessment Creation** (Configurable JSON generation) | ✅ |
| **AI Exam Auto-Grading (Vision/OCR)** | ✅ |
| Cloud MongoDB & Upstash Redis Integration | ✅ |
| Render Reverse-Proxy Rate Limiting configurations | ✅ |
| BullMQ background processing & exponential backoffs | ✅ |
| Live generation UI polling / websockets | ✅ |
| Mobile-first responsive grids & UI components | ✅ |
| Strict TypeScript typing across front/back layers | ✅ |
