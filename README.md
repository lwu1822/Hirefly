# HireIQ — AI Recruiting Intelligence

An intelligence layer on top of your ATS. Ranks candidates with AI rubrics, surfaces evidence from resumes, and re-ranks live as you edit criteria.

## Quick Start (5 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your API key
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and add your Groq API key:
- Get one free at https://console.groq.com (takes 60 seconds)
- Paste it as `GROQ_API_KEY=gsk_...`

### 3. Run the dev server
```bash
npm run dev
```

Open http://localhost:3000

---

## What's included

- **Landing page** at `/`
- **Dashboard** at `/dashboard` — 3 open roles
- **Candidate pipeline** at `/dashboard/r1` — 10 pre-ranked candidates
- **Live rubric editor** — drag weight sliders, list re-ranks in real time
- **Candidate detail** — evidence, score breakdown, resume text
- **AI outreach drafts** — personalized vs. generic comparison (requires Groq key)
- **Rubric generation** — describe a role in plain English, get a structured rubric (requires Groq key)

## Without a Groq key

The dashboard, candidate list, scoring, and live re-ranking all work without any API key.
Only these features need Groq:
- AI rubric generation (Create Role page)
- AI outreach drafting (candidate detail panel)

## Stack

- Next.js 15 (App Router)
- TypeScript
- In-memory data store (no database needed for demo)
- Groq Llama 3.3 70B for LLM features

## Deploying to Vercel

```bash
npm i -g vercel
vercel
```
Add `GROQ_API_KEY` in the Vercel dashboard under Environment Variables.
