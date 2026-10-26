import { z } from 'zod';
import type { Coordinate, Weather } from '../core/model';
const responseSchema = z.object({ hourly: z.object({ time: z.array(z.number()), temperature_2m: z.array(z.number().nullable()), precipitation_probability: z.array(z.number().nullable()), wind_speed_10m: z.array(z.number().nullable()), wind_gusts_10m: z.array(z.number().nullable()) }) });
export function weatherFromResponse(data: unknown, point: Coordinate, validAt: number, retrievedAt: number): Weather {
  const { hourly: h } = responseSchema.parse(data);
  const lengths = [h.time, h.temperature_2m, h.precipitation_probability, h.wind_speed_10m, h.wind_gusts_10m].map(a => a.length);
  if (!lengths[0] || lengths.some(n => n !== lengths[0])) throw new Error('The weather provider returned incomplete data.');
  const i = h.time.reduce((best, t, idx) => Math.abs(t * 1000 - validAt) < Math.abs(h.time[best] * 1000 - validAt) ? idx : best, 0);
  if (Math.abs(h.time[i] * 1000 - validAt) > 3600000) throw new Error('No forecast is available for the requested time.');
  return { provider: 'Open-Meteo', location: point, retrievedAt, validAt: h.time[i] * 1000, temperature: h.temperature_2m[i], precipitationProbability: h.precipitation_probability[i], wind: h.wind_speed_10m[i], gusts: h.wind_gusts_10m[i] };
}
export async function fetchWeather(point: Coordinate, validAt: number, now: number): Promise<Weather> {
  // Area coordinates reduce precision; this is not an anonymity guarantee.
  const area = { latitude: Math.round(point.latitude * 100) / 100, longitude: Math.round(point.longitude * 100) / 100 };
  const params = new URLSearchParams({ latitude: String(area.latitude), longitude: String(area.longitude), hourly: 'temperature_2m,precipitation_probability,wind_speed_10m,wind_gusts_10m', forecast_days: '7', timezone: 'UTC', timeformat: 'unixtime', temperature_unit: 'celsius', wind_speed_unit: 'kmh' });
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal, credentials: 'omit' });
    if (!response.ok) throw new Error('The weather provider is unavailable. Try again later.');
    return weatherFromResponse(await response.json(), area, validAt, Date.now());
  } catch { throw new Error('Could not retrieve the forecast. Saved information has been kept.'); }
  finally { clearTimeout(timeout); }
}
