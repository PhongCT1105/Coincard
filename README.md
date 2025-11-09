# CoinCard AI Trading Lab

## Members
- [Phong Cao](https://www.linkedin.com/in/phong-cao/)
- [Doanh Phung](https://www.linkedin.com/in/doanh-phung-21583a1b2/)
- [Truong Dang](https://www.linkedin.com/in/2dt/)

## Inspiration
Traditional trading dashboards dump charts, news, and tickers onto one page and leave the user to stitch the story together. We wanted CoinCard to feel like an AI-native version of Coinbase: the app should understand the news it pulls, reason about sentiment, know how a specific user trades, and proactively draft trades the user can accept or ignore.

## What it does
CoinCard consists of two core experiences:
- **Strategic Lab** – an orchestration canvas where Grok decides which internal agents (news, reasoning, behavioral) to call, logs every step in real time, and returns a structured scenario with citations and a trade plan.
- **Live Trading Desk** – a real-time assistant that streams price charts, auto-curated news with sentiment, aggregate mood, and a BUY/HOLD suggestion that can be accepted in one click.

Supporting agents and tools:
- News agent fetches up to date X/Twitter posts, cleans them, and tags sentiment.
- Reasoning agent condenses the doc cache into precise answers with citations.
- Behavioral agent profiles a wallet’s historical trades and ranks coins that match a user’s style.
- Execution shim accepts structured orders; in development it logs them and shows instant feedback.

## How we built it
- **Backend:** FastAPI, Snowflake, Grok (xAI). Each agent exposes its own router (news, behavioral, live_trade, orchestrator) so the frontend can compose flows freely.
- **Frontend:** React + Vite + Tailwind, split between a protected dashboard shell and multiple views (Home, Live Trading, Strategic Lab). We stream orchestration steps via SSE so users see Grok’s thought process as it happens.
- **Data/AI:** Grok handles summarization, reasoning, orchestration, and the live trade agent. CoinGecko supplies historical prices. Sentiment scores come from the news agent’s per-doc inference.

## Challenges
- Designing prompts so Grok emits strict JSON for trade plans without hallucinating missing fields.
- Keeping streaming UI responsive while FastAPI streamed SSE; we had to build JSONL and SSE branches to satisfy both Strategic Lab and Live Desk.
- Aligning behavioral analysis (Snowflake transactions) with recommended coins, then merging those results into the Strategic Lab orchestration without coupling it to the live trade agent.

## Accomplishments
- Built a transparent orchestration log that shows every tool call, candidate tool scores, and final trade plan.
- Created a live trading flow where sentiment, price action, and structured deals update automatically on token change.
- Delivered consistent UX patterns (sentiment tags, deal cards, action buttons) across pages so AI suggestions feel native to the app.

## What we learned
- Streaming LLM decisions makes users trust the agent more than a single final answer dump.
- Structured JSON prompts and strict fallback plans are essential when wiring AI output to downstream actions.
- Building multiple agents (news, behavioral, live-deal) is easier if each has a thin router and shared utility layer; orchestration just becomes calling them in different sequences.

## What’s next
- Connect `/orchestrate/execute` to real brokerage/order rails with safety checks and paper-trading first.
- Extend the behavioral agent to learn user preferences over time and auto-adjust the live trade agent’s risk levels.
- Add portfolio hedging simulations and “what-if” toggles inside Strategic Lab.
- Polish authentication and multi-user tenancy so each trader can save plans, live decisions, and execution logs.

## Running locally
1. **Backend**
   ```bash
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn src.main:app --reload
   ```
   Configure `.env` with `XAI_API_KEY`, Snowflake credentials, CoinGecko (optional), etc.

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Visit `http://localhost:3000`, log in with a test user, and explore Home, Live Trading, and Strategic Lab.

## Built with
- FastAPI, Python, Snowflake
- React, Vite, TailwindCSS
- Grok (xAI), CoinGecko API
- Server-Sent Events, TypeScript, Vercel icons
