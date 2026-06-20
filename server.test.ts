// @vitest-environment node
import request from 'supertest';
import { app } from './app';
import { describe, it, expect, vi } from 'vitest';

describe('Server API Routes', () => {
  // === Air Quality ===
  it('GET /api/air-quality returns mocked data', async () => {
    const res = await request(app).get('/api/air-quality');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('aqi');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('pm25');
    expect(res.body).toHaveProperty('pm10');
    expect(res.body.aqi).toBeGreaterThanOrEqual(15);
    expect(res.body.aqi).toBeLessThanOrEqual(65);
  });

  it('GET /api/air-quality returns correct status for AQI ranges', async () => {
    // Run multiple times to increase chance of hitting both Good and Moderate
    const results = await Promise.all(
      Array.from({ length: 10 }, () => request(app).get('/api/air-quality'))
    );
    const statuses = results.map(r => r.body.status);
    // All should be either Good or Moderate
    statuses.forEach(s => expect(['Good', 'Moderate']).toContain(s));
  });

  // === Solar ===
  it('POST /api/solar returns calculations based on roof area', async () => {
    const res = await request(app).post('/api/solar')
      .send({ roofAreaSqM: 100 })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.capacityKw).toBe(15);
    expect(res.body.annualCo2OffsetKg).toBe(9000);
  });

  it('POST /api/solar rejects invalid roof area (negative)', async () => {
    const res = await request(app).post('/api/solar')
      .send({ roofAreaSqM: -10 })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('roofAreaSqM');
  });

  it('POST /api/solar rejects invalid roof area (string)', async () => {
    const res = await request(app).post('/api/solar')
      .send({ roofAreaSqM: 'abc' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('roofAreaSqM');
  });

  it('POST /api/solar rejects missing roof area', async () => {
    const res = await request(app).post('/api/solar')
      .send({})
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('POST /api/solar rejects excessively large roof area', async () => {
    const res = await request(app).post('/api/solar')
      .send({ roofAreaSqM: 200000 })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('between');
  });

  // === Transit ===
  it('POST /api/transit returns calculations based on mode and distance', async () => {
    let res = await request(app).post('/api/transit').send({ distanceKm: 10, mode: 'car' }).set('Content-Type', 'application/json');
    expect(res.body.emissionsKg).toBe(1.92);
    res = await request(app).post('/api/transit').send({ distanceKm: 10, mode: 'bus' }).set('Content-Type', 'application/json');
    expect(res.body.emissionsKg).toBe(0.89);
    res = await request(app).post('/api/transit').send({ distanceKm: 10, mode: 'train' }).set('Content-Type', 'application/json');
    expect(res.body.emissionsKg).toBe(0.41);
    res = await request(app).post('/api/transit').send({ distanceKm: 10, mode: 'bike' }).set('Content-Type', 'application/json');
    expect(res.body.emissionsKg).toBe(0);
    res = await request(app).post('/api/transit').send({ distanceKm: 10, mode: 'unknown' }).set('Content-Type', 'application/json');
    expect(res.body.emissionsKg).toBe(1.92);
  });

  it('POST /api/transit rejects invalid distance (zero)', async () => {
    const res = await request(app).post('/api/transit')
      .send({ distanceKm: 0, mode: 'car' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('distanceKm');
  });

  it('POST /api/transit rejects invalid distance (negative)', async () => {
    const res = await request(app).post('/api/transit')
      .send({ distanceKm: -5, mode: 'car' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('POST /api/transit rejects non-numeric distance', async () => {
    const res = await request(app).post('/api/transit')
      .send({ distanceKm: 'far', mode: 'car' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('POST /api/transit rejects missing distance', async () => {
    const res = await request(app).post('/api/transit')
      .send({ mode: 'car' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('POST /api/transit calculates equivalentTrees', async () => {
    const res = await request(app).post('/api/transit')
      .send({ distanceKm: 100, mode: 'car' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.equivalentTrees).toBeGreaterThan(0);
    expect(res.body.distance).toBe(100);
    expect(res.body.mode).toBe('car');
  });

  // === Eco-Coach ===
  it('POST /api/eco-coach handles mocked requests in test mode', async () => {
    const res = await request(app).post('/api/eco-coach')
      .send({ message: 'Hello' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mocked reply: Hello');
  });
  
  it('POST /api/eco-coach handles error via mocked fail message', async () => {
    const res = await request(app).post('/api/eco-coach')
      .send({ message: 'fail' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to generate coaching response');
  });

  it('POST /api/eco-coach rejects empty message', async () => {
    const res = await request(app).post('/api/eco-coach')
      .send({ message: '' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Message is required');
  });

  it('POST /api/eco-coach rejects missing message', async () => {
    const res = await request(app).post('/api/eco-coach')
      .send({})
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('POST /api/eco-coach rejects non-string message', async () => {
    const res = await request(app).post('/api/eco-coach')
      .send({ message: 12345 })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('POST /api/eco-coach rejects whitespace-only message', async () => {
    const res = await request(app).post('/api/eco-coach')
      .send({ message: '   ' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('POST /api/eco-coach handles message with context', async () => {
    const res = await request(app).post('/api/eco-coach')
      .send({ message: 'Hello', context: { location: 'NYC' } })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mocked reply: Hello');
  });
});
