# NovaSphere — AI Agent Demo
### Novartis WEC Omnichannel Transformation · University of St. Gallen, Spring 2026

> A working prototype of a 4-agent AI system that demonstrates how Novartis marketeers, field reps, and managers could be supported by AI in their daily work — built for the HSG case study on strategy communication and implementation.

---

## What it does

The prototype simulates a **"day in the life"** of a Novartis commercial team using AI agents. Each agent runs on the real Claude API with streaming responses and visible reasoning steps.

| Time | Agent | Persona | What it does |
|------|-------|---------|-------------|
| 08:00 | **Morning Briefing** | Senior Marketeer | Reads overnight inbox, flags urgent items, surfaces today's campaign deadlines |
| 09:30 | **Pre-Call Intel** | Field Rep | Pulls CRM history, digital engagement, and Rx trends to generate a pre-call briefing for a specific HCP |
| 11:00 | **Content + MLR Loop** | Junior Marketeer | Generates HCP email content, runs a compliance check, auto-revises if issues are found, re-checks until cleared |
| 15:00 | **Performance Coach** | Marketing Manager | Analyzes weekly campaign KPIs across the WEC cluster, diagnoses underperforming channels, writes a coaching note and next week's adjusted plan |

---

## Repository structure

```
Novartis_CaseStudy/
├── README.md
├── .gitignore
├── content/
│   └── scenarios/
└── prototype/
    ├── server.js              ← Express server, proxies Claude API calls via SSE
    ├── package.json
    ├── app.js                 ← UI wiring: navigation, step updates, markdown rendering
    ├── index.html             ← 4-agent interface
    ├── styles.css             ← Dark UI design system
    ├── .env.example           ← API key template
    ├── api/
    │   └── claude.js          ← Streaming fetch wrapper
    ├── agents/
    │   ├── briefing.js        ← Agent 1: Morning Briefing
    │   ├── precall.js         ← Agent 2: Rep Pre-Call Intel
    │   ├── content_mlr.js     ← Agent 3: Content + MLR compliance loop
    │   └── coaching.js        ← Agent 4: Campaign Performance Coach
    └── mock_data/
        ├── emails.json        ← Simulated overnight inbox (5 emails)
        ├── crm.json           ← CRM data for Dr. Anna Müller (Zurich, cardiologist)
        ├── campaigns.json     ← WEC cluster campaign KPIs (4 campaigns, W14 2026)
        └── hcp_profiles.json  ← HCP profile data
```

---

## How to run

**Prerequisites:** Node.js 18+, an [Anthropic API key](https://console.anthropic.com)

```bash
# 1. Clone and install
git clone https://github.com/YVYX04/Novartis_CaseStudy.git
cd Novartis_CaseStudy/prototype
npm install

# 2. Add your API key
cp .env.example .env
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env

# 3. Start
npm start
```

Then open **http://localhost:3000** in your browser.

---

## Architecture

```
Browser (index.html + agents/*.js)
        │
        │  POST /api/chat  (SSE stream)
        ▼
Express server (server.js)
        │
        │  Anthropic SDK streaming
        ▼
Claude claude-opus-4-6
```

All mock data (emails, CRM, campaigns, HCP profiles) is injected as context into each Claude API call. No real Novartis data is used — everything is simulated for demonstration purposes.

**Agent 3 (Content + MLR)** is architecturally the most interesting: it makes 3–4 sequential API calls in a loop — generate → compliance check → revise → re-check — with each step visible in the UI. This demonstrates genuine agentic loop behavior.

---

## Demo context

This prototype was built as part of a consulting pitch for the Novartis WEC cluster (Switzerland, Belgium, Netherlands, Austria, Portugal, Ireland, Nordics). The case challenge: design an internal communications campaign and AI toolkit to embed new omnichannel marketing practices across commercial teams.

The agents cover the full persona stack from the case:
- **Field rep** → Pre-Call Intel Agent
- **Junior marketeer** → Content + MLR Agent
- **Senior marketeer** → Morning Briefing Agent
- **Marketing manager** → Performance Coach Agent

---

## Notes

- All outputs are generated live by Claude — responses will vary between runs
- No real Novartis data is used anywhere
- The `.env` file is gitignored — never commit your API key
- For presentation use, run locally on a machine with a stable internet connection
