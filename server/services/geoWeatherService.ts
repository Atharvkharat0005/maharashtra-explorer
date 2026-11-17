// Real-time Weather (Open-Meteo), Road Routing (OSRM), and Nearby Safety/POI Discovery (OSM Overpass)

export interface WeatherResult {
  lat: number;
  lng: number;
  current: {
    temperatureC: number;
    feelsLikeC: number;
    humidityPct: number;
    windKmh: number;
    precipitationMm: number;
    weatherCode: number;
    conditionLabel: string;
  };
  daily: Array<{
    date: string;
    tempMaxC: number;
    tempMinC: number;
    precipitationProbPct: number;
    weatherCode: number;
    conditionLabel: string;
  }>;
  travelAdvisory: {
    suitability: 'Ideal' | 'Caution' | 'Unsafe / Monsoon Alert';
    advisories: string[];
  };
  source: string;
}

const WMO_LABELS: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy / Misty',
  48: 'Dense Mist',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  80: 'Rain Showers',
  81: 'Heavy Showers',
  82: 'Violent Rain Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Hail'
};

const weatherCache = new Map<string, { expires: number; data: WeatherResult }>();

function mapMetNoSymbolToWmo(symbolCode: string): { code: number; label: string } {
  const s = (symbolCode || '').toLowerCase();
  if (s.includes('thunder')) return { code: 95, label: 'Thunderstorm' };
  if (s.includes('heavyrain')) return { code: 65, label: 'Heavy Rain' };
  if (s.includes('rain')) return { code: 63, label: 'Rain' };
  if (s.includes('sleet') || s.includes('drizzle')) return { code: 53, label: 'Drizzle' };
  if (s.includes('fog')) return { code: 45, label: 'Foggy / Misty' };
  if (s.includes('cloudy')) return { code: 3, label: 'Cloudy' };
  if (s.includes('partlycloudy') || s.includes('fair')) return { code: 2, label: 'Partly Cloudy' };
  return { code: 0, label: 'Clear Sky' };
}

function buildAdvisory(
  temp: number,
  wind: number,
  code: number,
  precip: number,
  precipProb: number,
  category?: string
): { suitability: 'Ideal' | 'Caution' | 'Unsafe / Monsoon Alert'; advisories: string[] } {
  const advisories: string[] = [];
  let suitability: 'Ideal' | 'Caution' | 'Unsafe / Monsoon Alert' = 'Ideal';

  if (code >= 80 || precip >= 10) {
    suitability = 'Unsafe / Monsoon Alert';
    advisories.push(
      'Heavy rainfall or thunderstorms detected—avoid steep cliff treks, canyon gorges (Sandhan/Devkund), and waterfall plunge zones.'
    );
  } else if (code >= 51 || precipProb >= 60) {
    suitability = 'Caution';
    advisories.push(
      'Rain showers expected—carry waterproof footwear and check local ghat visibility before driving.'
    );
  }

  if (temp >= 38) {
    if (suitability === 'Ideal') suitability = 'Caution';
    advisories.push(
      'High daytime heat (>=38°C)—plan outdoor forts/caves before 10:30 AM and carry oral hydration.'
    );
  }

  if (wind >= 35 && (category === 'Forts' || category === 'Beaches')) {
    suitability = 'Caution';
    advisories.push(
      'Strong winds—stay away from unprotected cliff edges and check coastal ferry advisories.'
    );
  }

  if (advisories.length === 0) {
    advisories.push('Favorable weather conditions for sightseeing and road travel.');
  }

  return { suitability, advisories };
}

export async function getRealWeather(lat: number, lng: number, category?: string): Promise<WeatherResult> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${category || 'any'}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Primary: MET Norway official live global forecast (fast, reliable, CC-BY)
  try {
    const metUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`;
    const res = await fetch(metUrl, {
      headers: { 'User-Agent': 'MaharashtraExplorer/1.0 github.com/maharashtra-explorer' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const json: any = await res.json();
      const series: any[] = json?.properties?.timeseries || [];
      if (series.length > 0) {
        const first = series[0];
        const details = first.data?.instant?.details || {};
        const next1h = first.data?.next_1_hours || first.data?.next_6_hours || {};
        const symbol = next1h?.summary?.symbol_code || 'clearsky_day';
        const mapped = mapMetNoSymbolToWmo(symbol);
        const temp = Math.round(Number(details.air_temperature ?? 27) * 10) / 10;
        const humidity = Math.round(Number(details.relative_humidity ?? 60));
        const wind = Math.round(Number(details.wind_speed ?? 3) * 3.6 * 10) / 10;
        const precip = Number(next1h?.details?.precipitation_amount ?? 0);

        const dailyMap = new Map<
          string,
          { temps: number[]; precipMax: number; code: number; label: string }
        >();
        for (const item of series) {
          const day = String(item.time || '').slice(0, 10);
          if (!day) continue;
          const t = Number(item.data?.instant?.details?.air_temperature ?? temp);
          const sym =
            item.data?.next_6_hours?.summary?.symbol_code ||
            item.data?.next_1_hours?.summary?.symbol_code ||
            symbol;
          const m = mapMetNoSymbolToWmo(sym);
          const p = Number(
            item.data?.next_6_hours?.details?.precipitation_amount ??
              item.data?.next_1_hours?.details?.precipitation_amount ??
              0
          );
          const curDay = dailyMap.get(day) || {
            temps: [],
            precipMax: 0,
            code: m.code,
            label: m.label
          };
          curDay.temps.push(t);
          curDay.precipMax = Math.max(curDay.precipMax, p);
          if (m.code > curDay.code) {
            curDay.code = m.code;
            curDay.label = m.label;
          }
          dailyMap.set(day, curDay);
        }

        const daily = Array.from(dailyMap.entries())
          .slice(0, 5)
          .map(([date, info]) => ({
            date,
            tempMaxC: Math.round(Math.max(...info.temps) * 10) / 10,
            tempMinC: Math.round(Math.min(...info.temps) * 10) / 10,
            precipitationProbPct: info.precipMax > 2 ? 75 : info.precipMax > 0.2 ? 40 : 10,
            weatherCode: info.code,
            conditionLabel: info.label
          }));

        const result: WeatherResult = {
          lat,
          lng,
          current: {
            temperatureC: temp,
            feelsLikeC: temp,
            humidityPct: humidity,
            windKmh: wind,
            precipitationMm: precip,
            weatherCode: mapped.code,
            conditionLabel: mapped.label
          },
          daily,
          travelAdvisory: buildAdvisory(
            temp,
            wind,
            mapped.code,
            precip,
            daily[0]?.precipitationProbPct ?? 10,
            category
          ),
          source: 'MET Norway Live Forecast (api.met.no)'
        };
        weatherCache.set(cacheKey, { expires: Date.now() + 15 * 60_000, data: result });
        return result;
      }
    }
  } catch {
    // Fall through to Open-Meteo
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('timezone', 'Asia/Kolkata');
  url.searchParams.set('forecast_days', '5');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    throw new Error(`Weather API HTTP ${res.status}`);
  }
  const data: any = await res.json();

  const cur = data.current || {};
  const code = Number(cur.weather_code ?? 0);
  const precip = Number(cur.precipitation ?? 0);
  const temp = Number(cur.temperature_2m ?? 26);
  const wind = Number(cur.wind_speed_10m ?? 10);

  const daily = (data.daily?.time || []).map((date: string, i: number) => {
    const dc = Number(data.daily.weather_code?.[i] ?? 0);
    return {
      date,
      tempMaxC: Number(data.daily.temperature_2m_max?.[i] ?? temp),
      tempMinC: Number(data.daily.temperature_2m_min?.[i] ?? temp - 6),
      precipitationProbPct: Number(data.daily.precipitation_probability_max?.[i] ?? 0),
      weatherCode: dc,
      conditionLabel: WMO_LABELS[dc] || 'Fair Weather'
    };
  });

  const result: WeatherResult = {
    lat,
    lng,
    current: {
      temperatureC: temp,
      feelsLikeC: Number(cur.apparent_temperature ?? temp),
      humidityPct: Number(cur.relative_humidity_2m ?? 60),
      windKmh: wind,
      precipitationMm: precip,
      weatherCode: code,
      conditionLabel: WMO_LABELS[code] || 'Fair'
    },
    daily,
    travelAdvisory: buildAdvisory(temp, wind, code, precip, daily[0]?.precipitationProbPct ?? 0, category),
    source: 'Open-Meteo Live Forecast (Asia/Kolkata)'
  };
  weatherCache.set(cacheKey, { expires: Date.now() + 15 * 60_000, data: result });
  return result;
}

export interface OsrmRouteResult {
  distanceKm: number;
  durationMinutes: number;
  durationLabel: string;
  geometry: Array<[number, number]>; // [lat, lng] pairs for Leaflet polyline
  legs: Array<{ distanceKm: number; durationMinutes: number; summary: string }>;
  attribution: string;
}

export async function getOsrmRoadRoute(waypoints: Array<{ lat: number; lng: number }>): Promise<OsrmRouteResult> {
  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required for road routing.');
  }

  const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`OSRM routing service returned HTTP ${res.status}`);
  }
  const data: any = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(data.message || 'No drivable road route found between waypoints.');
  }

  const route = data.routes[0];
  const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
  const durationMinutes = Math.round(route.duration / 60);
  const hrs = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationLabel = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;

  const geometry: Array<[number, number]> = (route.geometry?.coordinates || []).map(
    ([lng, lat]: [number, number]) => [lat, lng]
  );

  const legs = (route.legs || []).map((leg: any) => ({
    distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
    durationMinutes: Math.round(leg.duration / 60),
    summary: leg.summary || 'Road segment'
  }));

  return {
    distanceKm,
    durationMinutes,
    durationLabel,
    geometry,
    legs,
    attribution: 'Road routing by OSRM / OpenStreetMap data (driving estimate; not train or bus timetable)'
  };
}

export interface NearbyOsmPlace {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'pharmacy' | 'hotel' | 'restaurant' | 'fuel';
  lat: number;
  lng: number;
  distanceKm: number;
  address?: string;
  phone?: string;
  openingHours?: string;
  cuisine?: string;
  source: 'OpenStreetMap Overpass' | 'OpenStreetMap Nominatim';
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

const nearbyOsmCache = new Map<string, { expires: number; data: NearbyOsmPlace[] }>();

export async function queryNearbyOsmPlaces(
  lat: number,
  lng: number,
  type: 'hospital' | 'police' | 'pharmacy' | 'hotel' | 'restaurant' | 'fuel',
  radiusMeters = 12000
): Promise<NearbyOsmPlace[]> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)},${type}`;
  const cached = nearbyOsmCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const tagMap: Record<string, string> = {
    hospital: '["amenity"="hospital"]',
    police: '["amenity"="police"]',
    pharmacy: '["amenity"="pharmacy"]',
    fuel: '["amenity"="fuel"]',
    hotel: '["tourism"~"hotel|guest_house|resort|hostel"]',
    restaurant: '["amenity"~"restaurant|cafe"]'
  };

  const tagFilter = tagMap[type] || '["amenity"="hospital"]';
  const query = `[out:json][timeout:8];node${tagFilter}(around:${radiusMeters},${lat},${lng});out 20;`;

  const endpoints = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter'
  ];

  let elements: any[] = [];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MaharashtraExplorer/1.0'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data: any = await res.json();
        if (Array.isArray(data.elements) && data.elements.length > 0) {
          elements = data.elements;
          break;
        }
      }
    } catch {
      // Try next mirror
    }
  }

  const places: NearbyOsmPlace[] = [];
  for (const el of elements) {
    const pLat = el.lat ?? el.center?.lat;
    const pLng = el.lon ?? el.center?.lon;
    const name = el.tags?.name || el.tags?.['name:en'];
    if (!pLat || !pLng || !name) continue;
    places.push({
      id: `${el.type}-${el.id}`,
      name,
      type,
      lat: pLat,
      lng: pLng,
      distanceKm: haversineKm(lat, lng, pLat, pLng),
      address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || undefined,
      phone: el.tags?.phone || el.tags?.['contact:phone'] || undefined,
      openingHours: el.tags?.opening_hours || undefined,
      cuisine: el.tags?.cuisine || undefined,
      source: 'OpenStreetMap Overpass'
    });
  }

  // Fallback to OSM Nominatim bounded search if Overpass mirrors rate-limit
  if (places.length === 0) {
    try {
      const delta = 0.14;
      const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
      nomUrl.searchParams.set('q', `${type}`);
      nomUrl.searchParams.set('format', 'jsonv2');
      nomUrl.searchParams.set('bounded', '1');
      nomUrl.searchParams.set(
        'viewbox',
        `${(lng - delta).toFixed(4)},${(lat + delta).toFixed(4)},${(lng + delta).toFixed(4)},${(lat - delta).toFixed(4)}`
      );
      nomUrl.searchParams.set('limit', '12');

      const res = await fetch(nomUrl.toString(), {
        headers: { 'User-Agent': 'MaharashtraExplorer/1.0' },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const rows: any[] = await res.json();
        for (const r of rows) {
          const pLat = Number(r.lat);
          const pLng = Number(r.lon);
          const name = r.name || String(r.display_name || '').split(',')[0];
          if (!pLat || !pLng || !name) continue;
          places.push({
            id: `nom-${r.place_id}`,
            name,
            type,
            lat: pLat,
            lng: pLng,
            distanceKm: haversineKm(lat, lng, pLat, pLng),
            address: r.display_name,
            source: 'OpenStreetMap Nominatim'
          });
        }
      }
    } catch {
      // Return whatever was collected
    }
  }

  places.sort((a, b) => a.distanceKm - b.distanceKm);
  const top = places.slice(0, 12);
  if (top.length > 0) {
    nearbyOsmCache.set(cacheKey, { expires: Date.now() + 15 * 60_000, data: top });
  }
  return top;
}

export async function geocodeMaharashtraLocation(query: string): Promise<{ name: string; lat: number; lng: number } | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', `${query}, Maharashtra, India`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'MaharashtraExplorer/1.0' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return {
      name: data[0].display_name,
      lat: Number(data[0].lat),
      lng: Number(data[0].lon)
    };
  } catch {
    return null;
  }
}
