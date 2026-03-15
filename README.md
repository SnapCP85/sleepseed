# 🌙 SleepSeed

Personalised AI bedtime picture books starring your child — generated in ~15 seconds.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` and fill in your keys.

### 3. Run locally
```bash
npx vercel dev
```
Opens at http://localhost:3000

### 4. Deploy
Push to GitHub, then import to [vercel.com](https://vercel.com).

Add these environment variables in Vercel → Settings → Environment Variables:
- `ANTHROPIC_KEY`
- `ELEVENLABS_KEY`
- `ELEVENLABS_VOICE_ID`
- `VITE_NARRATOR_VOICE_ID`

## Tech Stack
- React + TypeScript + Vite
- Claude Sonnet 4.6 (story generation)
- ElevenLabs (voice narration)
- Web Audio API (ambient soundscapes)
- Vercel (hosting + serverless functions)
