<div align="center">

# 🌍 ECOS — Environmental Carbon Optimization System

**Understand, track, and reduce your carbon footprint through simple actions and personalized AI-powered insights.**

[![Tests](https://img.shields.io/badge/tests-67%20passed-brightgreen)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-92%25%20lines-brightgreen)](#testing)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](#license)

</div>

---

## 📋 Problem Statement

> *Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.*

ECOS tackles this by combining **real-time environmental data**, **emissions calculators**, **persistent tracking**, and a **Gemini AI-powered sustainability coach** into a single, elegant interface.

---

## ✨ Key Features

### 🚗 Transit Emissions Tracking
- Calculate CO₂ emissions across **4 transport modes** (Car, Bus, Train, Bike)
- Compare your trip against ICE vehicle baselines using the **Travel Impact Model (TIM)**
- Visual emission offset percentage with interactive progress bars

### ☀️ Solar Offset Analysis
- Estimate rooftop solar panel capacity based on available roof area
- Project annual energy generation (kWh) and CO₂ offset (tons/year)
- Inspired by **Google Maps Solar API** geometry analysis

### 🌬️ Real-Time Air Quality Monitoring
- Live AQI polling with **color-coded status badges** (Good / Moderate / Poor)
- PM2.5 and PM10 particulate tracking
- Smart polling — automatically pauses when the browser tab is inactive

### 🤖 AI Eco-Coach (Gemini 1.5 Flash + Search Grounding)
- **Gemini-powered** conversational sustainability advisor
- Uses **Google Search Grounding** for real-time, factual responses
- **Quick action chips** for common sustainability questions (cycling, composting, recycling, AC reduction)
- Markdown-rendered responses for structured advice

### 📊 Carbon Footprint Tracker
- **Persistent tracking** via localStorage — your calculations survive page refreshes
- Aggregated dashboard showing total emissions, solar offsets, and calculation history
- Clear history with one click

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │   Transit     │ │    Solar     │ │  Air Quality │ │
│  │  Footprint    │ │   Insight    │ │  (Polling)   │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │
│         │                │                │         │
│  ┌──────┴────────────────┴────────────────┴───────┐ │
│  │         useTrackingHistory (localStorage)       │ │
│  └─────────────────────┬──────────────────────────┘ │
│  ┌─────────────────────┴──────────────────────────┐ │
│  │              CarbonSummary Banner               │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │     EcoCoach (Chat UI + Quick Action Chips)     │ │
│  └──────────────────────┬─────────────────────────┘ │
└─────────────────────────┼───────────────────────────┘
                          │ REST API
┌─────────────────────────┼───────────────────────────┐
│                 Backend (Express.js)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Helmet   │ │  CORS    │ │  Rate    │ │ Input  │ │
│  │ Security │ │  Config  │ │  Limiter │ │ Valid. │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │  /api/transit  │  /api/solar  │  /api/air-quality│
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │    /api/eco-coach → Gemini 1.5 Flash API       │ │
│  │    (Search Grounding + System Instructions)     │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion) |
| **Backend** | Express.js, Node.js |
| **AI** | Google Gemini 1.5 Flash via `@google/genai` SDK |
| **Search** | Google Search Grounding (real-time factual AI responses) |
| **Security** | Helmet, CORS, express-rate-limit, input validation |
| **Testing** | Vitest, React Testing Library, Supertest |
| **Build** | Vite |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A **Gemini API Key** from [Google AI Studio](https://ai.studio)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/ecos.git
cd ecos

# 2. Install dependencies
npm install

# 3. Set your Gemini API key
#    Create or edit .env.local and add:
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage report
npx vitest run --coverage
```

### Test Results

```
Test Files  9 passed (9)
     Tests  67 passed (67)

Coverage:
  Statements : 90.55%
  Branches   : 78.47%
  Functions  : 95.00%
  Lines      : 92.00%
```

| Test Suite | Tests | Coverage |
|-----------|-------|----------|
| Server API Routes | 20 | Input validation, error handling, all endpoints |
| Transit Footprint | 7 | Form submission, error states, a11y, radiogroup |
| Solar Insight | 6 | Calculations, error states, form semantics |
| Air Quality | 5 | Polling, status colors, error handling, aria-live |
| Eco Coach | 8 | Chat flow, quick actions, error handling, a11y |
| Carbon Summary | 4 | Empty state, populated state, clear history |
| Tracking History Hook | 10 | CRUD, localStorage, edge cases, corruption |
| Card Component | 4 | Rendering, a11y attributes, React.memo |
| App Integration | 3 | Layout, skip-nav, landmarks |

---

## ♿ Accessibility

ECOS is built with accessibility as a first-class concern:

- **Skip Navigation** — keyboard shortcut to jump to main content
- **ARIA Live Regions** — real-time updates announced to screen readers (`aria-live="polite"`)
- **Form Semantics** — proper `<form>`, `<fieldset>`, `<legend>`, `role="radiogroup"` with `aria-checked`
- **Error Announcements** — `role="alert"` with `aria-live="assertive"` on all error states
- **Focus Management** — results auto-focus after form submission via `useRef`
- **Screen Reader Text** — `.sr-only` utility for context-only text
- **Semantic HTML** — `<main>`, `<header>`, `<section>` with `aria-labelledby`
- **Decorative Isolation** — icons marked `aria-hidden="true"`

---

## 🔒 Security

- **Helmet** — secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
- **CORS** — configurable origin whitelist (permissive in dev, restrictive in production)
- **Rate Limiting** — 100 req/15min general, 20 req/15min for AI endpoint
- **Input Validation** — server-side type checking, range validation, and descriptive 400 errors
- **Prompt Sanitization** — user input truncated and sanitized before Gemini API interpolation
- **No Hardcoded Secrets** — API keys loaded exclusively from environment variables

---

## 📁 Project Structure

```
ecos/
├── app.ts                          # Express backend (API routes + security middleware)
├── server.ts                       # Server entry point
├── server.test.ts                  # Backend API tests (20 tests)
├── index.html                      # HTML entry with SEO meta tags
├── metadata.json                   # Project metadata
├── package.json                    # Dependencies and scripts
├── src/
│   ├── App.tsx                     # Main layout with CarbonSummary + 2x2 grid
│   ├── App.test.tsx                # App integration tests
│   ├── index.css                   # Global styles + sr-only utility
│   ├── components/
│   │   ├── Card.tsx                # Reusable card (React.memo + aria-labelledby)
│   │   ├── Card.test.tsx
│   │   ├── TransitFootprint.tsx    # Transit emissions calculator
│   │   ├── TransitFootprint.test.tsx
│   │   ├── SolarInsight.tsx        # Solar offset projector
│   │   ├── SolarInsight.test.tsx
│   │   ├── AirQuality.tsx          # Real-time AQI monitor
│   │   ├── AirQuality.test.tsx
│   │   ├── EcoCoach.tsx            # Gemini AI chat + quick actions
│   │   ├── EcoCoach.test.tsx
│   │   ├── CarbonSummary.tsx       # Tracking dashboard banner
│   │   └── CarbonSummary.test.tsx
│   └── hooks/
│       ├── useTrackingHistory.ts   # localStorage tracking persistence
│       └── useTrackingHistory.test.ts
```

---

## 🌱 How It Addresses the Problem Statement

| Requirement | Implementation |
|-------------|---------------|
| **Understand** carbon footprint | Transit calculator with emission comparisons, Solar offset projections, Real-time AQI data |
| **Track** carbon footprint | localStorage-based tracking history, CarbonSummary dashboard with aggregated metrics |
| **Reduce** carbon footprint | AI Eco-Coach with personalized advice, Quick action chips for immediate lifestyle changes |
| **Simple actions** | One-tap quick action chips: "🚲 Switch to cycling", "☀️ Reduce AC usage", "🌱 Start composting", "♻️ Recycling tips" |
| **Personalized insights** | Gemini 1.5 Flash with Search Grounding provides context-aware, real-time sustainability coaching |

---

## 📜 License

This project is licensed under the Apache 2.0 License.
