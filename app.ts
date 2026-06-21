import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

// ── Constants ──────────────────────────────────────────────────────────
/** CO₂ emission factors in kg per km, sourced from the Travel Impact Model (TIM). */
const EMISSION_FACTORS: Record<string, number> = {
  car: 0.192,
  bus: 0.089,
  train: 0.041,
  bike: 0,
} as const;

/** Solar panel heuristic constants for offset estimation. */
const SOLAR = {
  /** kW capacity per square meter of roof area */
  KW_PER_SQM: 0.15,
  /** kWh generated per kW capacity per year */
  KWH_PER_KW_YEAR: 1500,
  /** kg CO₂ offset per kWh of solar energy */
  KG_CO2_PER_KWH: 0.4,
} as const;

/** AQI status threshold — values above this are "Moderate". */
const AQI_MODERATE_THRESHOLD = 50;

/** Approximate kg CO₂ absorbed by one tree per year. */
const KG_CO2_PER_TREE_YEAR = 21;

const VALID_TRANSIT_MODES = ['car', 'bus', 'train', 'bike'] as const;
type TransitMode = typeof VALID_TRANSIT_MODES[number];

// ── API Response Interfaces ────────────────────────────────────────────
/** Response from the /api/transit endpoint. */
export interface TransitResponse {
  distance: number;
  mode: string;
  emissionsKg: number;
  equivalentTrees: number;
}

/** Response from the /api/solar endpoint. */
export interface SolarResponse {
  roofArea: number;
  capacityKw: number;
  estimatedAnnualEnergyKwh: number;
  annualCo2OffsetKg: number;
}

/** Response from the /api/air-quality endpoint. */
export interface AirQualityResponse {
  aqi: number;
  status: string;
  pm25: number;
  pm10: number;
}

// ── AI Client ──────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

// ── Express App Setup ──────────────────────────────────────────────────
export const app = express();

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.APP_URL || true
    : true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting (disabled in test for deterministic assertions)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI coaching rate limit reached. Please try again later.' },
});

if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', generalLimiter);
  app.use('/api/eco-coach', aiLimiter);
}

// ── Validation Helpers ─────────────────────────────────────────────────
interface ValidationSuccess {
  valid: true;
  parsed: number;
}

interface ValidationError {
  valid: false;
  error: string;
}

type ValidationResult = ValidationSuccess | ValidationError;

/** Validates that a value is a number within the given range. */
function validateNumber(value: unknown, name: string, min: number, max: number): ValidationResult {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, error: `${name} must be a valid number.` };
  }
  if (num < min || num > max) {
    return { valid: false, error: `${name} must be between ${min} and ${max}.` };
  }
  return { valid: true, parsed: num };
}

/** Sanitizes a value to a safe string, stripping control characters. */
function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, maxLength).replace(/[\x00-\x1f]/g, '');
}

// ── API Routes ─────────────────────────────────────────────────────────

/**
 * POST /api/eco-coach
 * Gemini-powered sustainability advisor with Search Grounding.
 */
app.post("/api/eco-coach", async (req, res) => {
  try {
    const rawMessage = req.body?.message;
    const context = req.body?.context;

    const message = sanitizeString(rawMessage, 2000);
    if (!message.trim()) {
      return res.status(400).json({
        error: 'Message is required and must be a non-empty string (max 2000 characters).',
      });
    }

    // Test stubs — only active when NODE_ENV=test to avoid hitting the real API
    if (process.env.NODE_ENV === 'test') {
      if (message === 'fail') throw new Error('Test Error');
      if (message === 'Hello') return res.json({ reply: 'Mocked reply: Hello' });
    }

    const sanitizedContext = sanitizeString(JSON.stringify(context || {}), 500);

    const systemInstruction = [
      'You are a helpful, expert AI Eco-Coach part of a Carbon Footprint Awareness platform.',
      'Provide concise, highly relevant, and practical sustainability insights, lifestyle changes, or energy-saving recommendations.',
      `User's context: ${sanitizedContext}.`,
      'Focus on actionable advice based on standard sustainability guidelines. Keep answers short and structured.',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    res.json({ reply: response.text });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (process.env.NODE_ENV !== 'test') {
      console.error('Gemini API Error:', errorMessage);
    }
    res.status(500).json({ error: "Failed to generate coaching response" });
  }
});

/**
 * POST /api/transit
 * Calculates CO₂ emissions for a given distance and transport mode.
 * Emission factors sourced from the Travel Impact Model (TIM).
 */
app.post("/api/transit", (req, res) => {
  const distanceResult = validateNumber(req.body?.distanceKm, 'distanceKm', 0.1, 50000);
  if (!distanceResult.valid) {
    return res.status(400).json({ error: (distanceResult as ValidationError).error });
  }
  const { parsed: distanceKm } = distanceResult as ValidationSuccess;

  const rawMode = req.body?.mode;
  const mode: TransitMode = VALID_TRANSIT_MODES.includes(rawMode) ? rawMode : 'car';
  const emissionFactor = EMISSION_FACTORS[mode] ?? EMISSION_FACTORS.car;

  const emissionsKg = +(distanceKm * emissionFactor).toFixed(2);
  const timeout = process.env.NODE_ENV === 'test' ? 0 : 600;

  setTimeout(() => {
    res.json({
      distance: distanceKm,
      mode,
      emissionsKg,
      equivalentTrees: +(emissionsKg / KG_CO2_PER_TREE_YEAR).toFixed(2),
    } satisfies TransitResponse);
  }, timeout);
});

/**
 * POST /api/solar
 * Estimates solar panel capacity and annual CO₂ offset from roof area.
 */
app.post("/api/solar", (req, res) => {
  const areaResult = validateNumber(req.body?.roofAreaSqM, 'roofAreaSqM', 1, 100000);
  if (!areaResult.valid) {
    return res.status(400).json({ error: (areaResult as ValidationError).error });
  }
  const { parsed: roofAreaSqM } = areaResult as ValidationSuccess;

  const capacityKw = roofAreaSqM * SOLAR.KW_PER_SQM;
  const energyKwhYear = capacityKw * SOLAR.KWH_PER_KW_YEAR;
  const co2OffsetKgYear = energyKwhYear * SOLAR.KG_CO2_PER_KWH;

  const timeout = process.env.NODE_ENV === 'test' ? 0 : 800;

  setTimeout(() => {
    res.json({
      roofArea: roofAreaSqM,
      capacityKw: +capacityKw.toFixed(2),
      estimatedAnnualEnergyKwh: +energyKwhYear.toFixed(0),
      annualCo2OffsetKg: +co2OffsetKgYear.toFixed(0),
    } satisfies SolarResponse);
  }, timeout);
});

/**
 * GET /api/air-quality
 * Returns simulated real-time air quality data (AQI, PM2.5, PM10).
 */
app.get("/api/air-quality", (_req, res) => {
  const aqi = Math.floor(Math.random() * 50) + 15;
  const status = aqi > AQI_MODERATE_THRESHOLD ? "Moderate" : "Good";

  const timeout = process.env.NODE_ENV === 'test' ? 0 : 400;

  setTimeout(() => {
    res.json({
      aqi,
      status,
      pm25: +(aqi * 0.25).toFixed(1),
      pm10: +(aqi * 0.4).toFixed(1),
    } satisfies AirQualityResponse);
  }, timeout);
});

// ── Frontend Setup ─────────────────────────────────────────────────────

/** Configures Vite dev server (development) or static serving (production). */
export async function setupFrontend(appInstance: express.Express) {
  if (process.env.NODE_ENV === 'test') return;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    appInstance.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    appInstance.use(express.static(distPath));
    appInstance.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}
