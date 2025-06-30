# Mero Enrolment Monorepo

A SaaS-ready monorepo for secure, scalable document enrolment and processing.

## Structure
- `frontend/` — Next.js (App Router), TailwindCSS, shadcn/ui, Zustand, React Hook Form, Zod, pdfjs-dist
- `backend/` — Fastify, BullMQ, ioredis, dotenv, TypeScript

## Shared Infrastructure
- Docker & Docker Compose
- Upstash Redis (external, configure REDIS_URL in backend/.env)

## Getting Started

### 1. Clone and install dependencies
```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

- Frontend: http://localhost:3000 (if you add to docker-compose)
- Backend: http://localhost:3001

## Notes
- Multi-tenant SaaS, Supabase, Vercel, and Render integration coming soon.
- Architecture supports secure, isolated document processing and scalable PDF handling via job queues.
