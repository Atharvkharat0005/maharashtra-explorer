import { MAHARASHTRA_ATTRACTIONS } from '../data/attractions.js';
import { MAHARASHTRA_DISTRICTS } from '../data/districts.js';
import { CURATED_HOTELS, CURATED_RESTAURANTS, OFFICIAL_BOOKING_LINKS } from '../data/hospitality.js';
import { Attraction, TripPlanInput } from '../types.js';
import { calculateGroupBudget } from './budgetEngine.js';
import {
  geocodeMaharashtraLocation,
  getOsrmRoadRoute,
  getRealWeather,
  NearbyOsmPlace,
  queryNearbyOsmPlaces
} from './geoWeatherService.js';
import {
  buildTransportComparison,
  compareMaharashtraRoutes,
  findHiddenGemsAlongRoute
} from './routeDiscoveryService.js';

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || process.env.GROK_MODEL || 'openai/gpt-oss-120b';

function getGroqClientConfig() {
  const apiKey =
    process.env.GROQ_API_KEY ||
    process.env.GROK_API_KEY ||
    '';

  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    throw new Error('GROQ_API_KEY is not configured on the server. Please add your Groq/Grok API key in .env');
  }

  const isXai = apiKey.startsWith('xai-');
  const endpoint = isXai
    ? 'https://api.x.ai/v1/chat/completions'
    : (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions');
  const model = isXai
    ? (process.env.GROK_MODEL || 'grok-2-latest')
    : DEFAULT_GROQ_MODEL;

  return { apiKey, endpoint, model };
}

function extractJsonPayload<T = any>(rawText: string, fallback: T): T {
  if (!rawText) return fallback;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        // fallback
      }
    }
    return fallback;
  }
}

async function generateWithGroq(params: {
  systemPrompt?: string;
  userPrompt: string;
  jsonMode?: boolean;
  temperature?: number;
  model?: string;
}): Promise<string> {
  const { apiKey, endpoint, model } = getGroqClientConfig();
  const modelsToTry = [params.model || model, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const activeModel = modelsToTry[i];
    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (params.systemPrompt) {
        messages.push({ role: 'system', content: params.systemPrompt });
      }
      messages.push({ role: 'user', content: params.userPrompt });

      const requestBody: any = {
        model: activeModel,
        messages,
        temperature: typeof params.temperature === 'number' ? params.temperature : 0.2
      };

      if (params.jsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Groq API returned ${res.status}: ${errText}`);
      }

      const data = (await res.json()) as any;
      const content = data?.choices?.[0]?.message?.content ?? '';
      return content;
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err || '');
      const isTransient =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('rate_limit') ||
        msg.includes('overloaded');
      if (!isTransient || i === modelsToTry.length - 1) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }

  throw lastError;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getSeasonFromDate(dateStr: string): 'Monsoon' | 'Winter' | 'Summer' | 'Post-Monsoon' {
  const month = dateStr ? new Date(dateStr).getMonth() + 1 : new Date().getMonth() + 1;
  if (month >= 6 && month <= 9) return 'Monsoon';
  if (month === 10 || month === 11) return 'Post-Monsoon';
  if (month === 12 || month <= 2) return 'Winter';
  return 'Summer';
}

function formatMinutesLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} hr ${m} min` : `${m} min`;
}

export async function resolveStartingCoords(startingLocation: string, lat?: number, lng?: number) {
  if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { name: startingLocation, lat, lng };
  }
  const q = (startingLocation || 'Pune').toLowerCase();
  const matchedDistrict = MAHARASHTRA_DISTRICTS.find(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.headquarters.toLowerCase().includes(q) ||
      d.aliases.some((a) => a.toLowerCase().includes(q))
  );
  if (matchedDistrict) {
    return { name: matchedDistrict.name, lat: matchedDistrict.lat, lng: matchedDistrict.lng };
  }
  const geo = await geocodeMaharashtraLocation(startingLocation);
  if (geo) return { name: startingLocation, lat: geo.lat, lng: geo.lng };
  return { name: startingLocation || 'Pune', lat: 18.5204, lng: 73.8567 };
}

function evaluateOneDayFeasibility(
  oneWayRoadKm: number,
  oneWayMinutes: number,
  mode: TripPlanInput['preferredTransport']
): {
  isPractical: boolean;
  maxComfortableOneWayKm: number;
  adjustedOneWayMinutes: number;
  reason: string;
  departureWindow: string;
  expectedReturnWindow: string;
} {
  let maxKm = 185;
  let speedFactor = 1.0;

  if (mode === 'Bike / Motorcycle') {
    maxKm = 165;
    speedFactor = 1.12;
  } else if (mode === 'Walking') {
    maxKm = 14;
    speedFactor = 12; // approx walking minutes
  } else if (mode === 'Bus' || mode === 'Bus (MSRTC)' || mode === 'Train' || mode === 'Public transport') {
    maxKm = 150;
    speedFactor = 1.28;
  }

  const adjustedMins =
    mode === 'Walking'
      ? Math.round((oneWayRoadKm / 4.5) * 60)
      : Math.round(oneWayMinutes * speedFactor);

  const isPractical = oneWayRoadKm <= maxKm && adjustedMins <= 240;

  // Daylight window estimate: leave ~6:30 AM, return evening before 9 PM
  const arrivalOutMins = 6 * 60 + 30 + adjustedMins;
  const startReturnMins = 16 * 60 + 45; // 4:45 PM before dark
  const arriveHomeMins = startReturnMins + adjustedMins;

  const fmtTime = (totalMins: number) => {
    const wrapped = totalMins % (24 * 60);
    const hh24 = Math.floor(wrapped / 60);
    const mm = wrapped % 60;
    const ampm = hh24 >= 12 ? 'PM' : 'AM';
    const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
    return `${hh12}:${mm.toString().padStart(2, '0')} ${ampm}`;
  };

  const reason = isPractical
    ? `Practical for a same-day return (${oneWayRoadKm} km one-way, ~${formatMinutesLabel(adjustedMins)} via ${mode}), allowing ~${Math.max(3, Math.round((startReturnMins - arrivalOutMins) / 60))} hours of relaxed daytime sightseeing before starting the return before dark.`
    : `Not practical for a safe same-day return: ${oneWayRoadKm} km one-way (~${formatMinutesLabel(adjustedMins)} each way) leaves under 2 hours at the destination or forces unsafe night travel. Choose a multi-day trip or pick a closer destination within ${maxKm} km.`;

  return {
    isPractical,
    maxComfortableOneWayKm: maxKm,
    adjustedOneWayMinutes: adjustedMins,
    reason,
    departureWindow: `06:30 AM (est. arrival ~${fmtTime(arrivalOutMins)})`,
    expectedReturnWindow: `${fmtTime(arriveHomeMins)} same evening (start back by 4:45 PM)`
  };
}

export function rankDestinationsForTrip(
  input: TripPlanInput,
  startLat: number,
  startLng: number
) {
  const isOneDay = input.tripType === 'one-day' || Number(input.days || 1) <= 1;
  const season = getSeasonFromDate(input.startDate);
  const pref = (input.destinationPreference || '').trim().toLowerCase();

  const scored = MAHARASHTRA_ATTRACTIONS.map((attr) => {
    let score = 0;
    const straightKm = haversineKm(startLat, startLng, attr.lat, attr.lng);
    const approxOneWayRoadKm = Math.max(8, Math.round(straightKm * 1.24));
    const roundTripRoadKm = approxOneWayRoadKm * 2;
    const estMinsOneWay = Math.round((approxOneWayRoadKm / 48) * 60);

    const budgetEst = calculateGroupBudget(
      { ...input, tripType: isOneDay ? 'one-day' : 'multi-day', days: isOneDay ? 1 : input.days },
      approxOneWayRoadKm,
      2,
      'Corridor Road Estimate'
    );
    const oneDayCheck = evaluateOneDayFeasibility(approxOneWayRoadKm, estMinsOneWay, input.preferredTransport);

    // Explicit preference match
    const explicitMatch =
      pref &&
      pref !== 'ai_recommend' &&
      pref !== 'recommend for me' &&
      (attr.name.toLowerCase().includes(pref) ||
        attr.districtName.toLowerCase().includes(pref) ||
        attr.slug.includes(pref) ||
        attr.division.toLowerCase().includes(pref));

    if (explicitMatch) {
      score += 180;
    }

    // Budget fit is weighted heavily so practical affordable places rise to the top
    if (!budgetEst.isOverBudget) score += 60;
    else score -= Math.min(80, Math.round(budgetEst.overBudgetBy / 50));

    // One-Day distance practicality
    if (isOneDay) {
      if (oneDayCheck.isPractical) score += 75;
      else score -= 90;
    } else {
      const maxMultiKm = input.days === 2 ? 320 : input.days === 3 ? 500 : 850;
      if (approxOneWayRoadKm <= maxMultiKm) score += 25;
      else score -= 20;
    }

    // Interest matching
    for (const interest of input.interests || []) {
      const il = interest.toLowerCase();
      if (attr.category.toLowerCase().includes(il)) score += 24;
      if (attr.tags.some((t) => t.toLowerCase().includes(il))) score += 18;
      if ((il.includes('offbeat') || il.includes('hidden')) && attr.isHiddenGem) score += 24;
    }

    // Season suitability
    if (attr.suitableSeasons.includes(season) || attr.suitableSeasons.includes('Year-Round')) {
      score += 20;
    } else {
      score -= 15;
    }

    // Accessibility & Seniors check
    if ((input.seniors || 0) > 0 || (input.accessibilityNeeds || '').trim().length > 0) {
      if (attr.accessibilityInfo.toLowerCase().includes('strenuous') || attr.slug === 'sandhan-valley') {
        score -= 40;
      } else if (
        attr.accessibilityInfo.toLowerCase().includes('wheelchair') ||
        attr.accessibilityInfo.toLowerCase().includes('flat') ||
        attr.accessibilityInfo.toLowerCase().includes('motorable')
      ) {
        score += 18;
      }
    }

    if (input.adventureLevel === 'Relaxed' && attr.category === 'Trekking') score -= 18;
    if (input.adventureLevel === 'High Adventure / Trekking' && (attr.category === 'Forts' || attr.category === 'Trekking')) {
      score += 16;
    }

    score += attr.rating * 3;

    return {
      ...attr,
      score,
      approxDistanceKm: approxOneWayRoadKm,
      roundTripRoadKm,
      estimatedOneWayDuration: formatMinutesLabel(oneDayCheck.adjustedOneWayMinutes),
      estimatedGroupCostInr: budgetEst.estimatedTotalCost,
      withinBudget: !budgetEst.isOverBudget,
      practicalForOneDay: oneDayCheck.isPractical,
      departureReturnWindow: `${oneDayCheck.departureWindow} → ${oneDayCheck.expectedReturnWindow}`,
      suitabilitySummary: !budgetEst.isOverBudget
        ? `Fits within ₹${input.totalGroupBudget.toLocaleString('en-IN')} group budget (est. ₹${budgetEst.estimatedTotalCost.toLocaleString('en-IN')}, ${roundTripRoadKm} km round trip).`
        : `Estimated cost ₹${budgetEst.estimatedTotalCost.toLocaleString('en-IN')} exceeds ₹${input.totalGroupBudget.toLocaleString('en-IN')} budget.`
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export async function parseNaturalLanguageTripPrompt(prompt: string) {
  const systemPrompt = `You are MAHATRIP AI, an expert Maharashtra travel planning assistant.
Extract structured trip planning parameters from the traveler request and output ONLY a valid JSON object.

Rules:
- Interpret the stated budget as the TOTAL GROUP BUDGET in INR (e.g., "₹2,000" -> 2000, "₹25,000" -> 25000).
- Detect whether it is a one-day / same-day return trip ("one-day" vs "multi-day"); if one-day, set days=1 and tripType="one-day".
- Detect travel mode cleanly from ['Bike / Motorcycle', 'Car', 'Public transport', 'Bus', 'Train', 'Walking'].
- Extract bikeMileageKmPerL if bike mileage (km/l) is mentioned.
- Identify startingLocation, destinationPreference (district/city/attraction or "AI_RECOMMEND"), days, adults, children, seniors, totalGroupBudget, rooms (0 if one-day, else 1 per 2 adults), foodPreference, adventureLevel, accommodationPreference, and interests.

Output format (JSON object):
{
  "tripType": "one-day" | "multi-day",
  "startingLocation": string,
  "destinationPreference": string,
  "days": number,
  "adults": number,
  "children": number,
  "seniors": number,
  "rooms": number,
  "totalGroupBudget": number,
  "preferredTransport": string,
  "bikeMileageKmPerL": number,
  "accommodationPreference": string,
  "foodPreference": string,
  "adventureLevel": string,
  "travelStyle": string,
  "interests": string[],
  "discoverAlongRoute": boolean,
  "missingQuestions": string[]
}`;

  let parsed: any = null;
  try {
    const raw = await generateWithGroq({
      systemPrompt,
      userPrompt: `Extract structured trip parameters from this traveler prompt:\n"${prompt}"`,
      jsonMode: true,
      temperature: 0.1
    });
    parsed = extractJsonPayload(raw, null);
  } catch (err: any) {
    console.warn('[MAHATRIP AI Groq Parse Warning]', err?.message);
  }

  return parsed || {
    tripType: 'multi-day',
    startingLocation: 'Mumbai',
    destinationPreference: 'AI_RECOMMEND',
    days: 2,
    adults: 2,
    children: 0,
    seniors: 0,
    rooms: 1,
    totalGroupBudget: 8000,
    preferredTransport: 'Car',
    accommodationPreference: 'Standard Hotel / Resort',
    foodPreference: 'Local Maharashtrian & Multi-Cuisine',
    adventureLevel: 'Moderate',
    travelStyle: 'Balanced',
    interests: ['Heritage', 'Nature'],
    discoverAlongRoute: true,
    missingQuestions: []
  };
}

function buildDeterministicFallbackItinerary(params: {
  input: TripPlanInput;
  isOneDay: boolean;
  startPoint: { name: string; lat: number; lng: number };
  selectedAttractions: any[];
  topCandidates: any[];
  budgetBreakdown: any;
  feasibility: any;
  roundTripRoadKm: number;
  fallbackHotels: any[];
  enRouteHiddenGems: any[];
}) {
  const { input, isOneDay, selectedAttractions, topCandidates, budgetBreakdown, feasibility, roundTripRoadKm, fallbackHotels } = params;
  const primary = selectedAttractions[0] || topCandidates[0] || { name: 'Lonavala & Khandala', districtName: 'Pune' };
  const numDays = isOneDay ? 1 : Math.max(1, input.days || 2);

  const days = [];
  for (let d = 1; d <= numDays; d++) {
    const isFirst = d === 1;
    const isLast = d === numDays;
    const spot = selectedAttractions[(d - 1) % selectedAttractions.length] || primary;

    days.push({
      dayNumber: d,
      title: isOneDay
        ? `Day 1: Complete Same-Day Exploration of ${spot.name}`
        : isFirst
          ? `Day 1: Departure from ${input.startingLocation} & Arrival at ${spot.name}`
          : isLast
            ? `Day ${d}: Morning Exploration & Return Journey to ${input.startingLocation}`
            : `Day ${d}: Scenic Highlights of ${spot.name} (${spot.districtName})`,
      baseLocation: spot.districtName || input.startingLocation,
      departureOrCheckinNote: isOneDay
        ? `Early start (${feasibility.departureWindow}) to avoid highway traffic.`
        : isFirst
          ? `Depart at 7:00 AM, scenic drive, afternoon check-in.`
          : isLast
            ? `Checkout, shopping, and drive back to ${input.startingLocation}.`
            : `Stay in ${spot.districtName}, explore surrounding spots.`,
      morningActivities: `Scenic drive to ${spot.name}, enjoy morning viewpoints and photo stops.`,
      afternoonActivities: `Local lunch, explore key heritage landmarks and cultural highlights.`,
      eveningActivities: isOneDay
        ? `Sunset viewpoint, evening tea, return to ${input.startingLocation} before dark (${feasibility.expectedReturnWindow}).`
        : isLast
          ? `Scenic highway return drive back to ${input.startingLocation}.`
          : `Sunset point walk, local market visit, and authentic dinner.`,
      placesToVisit: [spot.name, ...(spot.popularAttractions || spot.thingsToDo || []).slice(0, 2)],
      estimatedTravelDistanceKm: Math.round(roundTripRoadKm / numDays),
      estimatedTravelTime: isOneDay ? feasibility.estimatedTravelTime : '2 - 3 hrs daily',
      breakfast: 'Poha / Misal Pav & Hot Chai',
      lunch: `Authentic Maharashtrian Thali in ${spot.districtName}`,
      eveningSnacks: 'Vada Pav / Bhaji & Tea',
      dinner: isOneDay ? `Dinner back in ${input.startingLocation}` : `Local Pithla Bhakri & specialties`,
      hotelRecommendation: isOneDay ? 'None (Same-Day Return)' : (fallbackHotels[0]?.name || 'MTDC Resort / Verified Stay'),
      activitySuggestions: ['Viewpoint photography', 'Short nature walk', 'Local shopping'],
      estimatedDayCostInr: Math.round(budgetBreakdown.estimatedTotalCost / numDays),
      returnJourneySummary: isOneDay
        ? `Depart by 5:00 PM; return to ${input.startingLocation} by ${feasibility.expectedReturnWindow}.`
        : isLast
          ? `Smooth return drive back to ${input.startingLocation}.`
          : 'Overnight stay at destination.',
      safetyNotes: input.preferredTransport === 'Bike / Motorcycle'
        ? 'No two-wheelers on Mumbai–Pune/Samruddhi expressways (use NH48). Wear helmets; avoid night ghat riding.'
        : 'Safe distance on ghat curves; keep cash for toll & fuel.'
    });
  }

  return {
    tripSummary: `${isOneDay ? '1-Day Same-Day Return' : `${numDays}-Day`} custom Maharashtra trip from ${input.startingLocation} to ${primary.name} (${primary.districtName}) optimized for ₹${budgetBreakdown.totalGroupBudget.toLocaleString('en-IN')} group budget.`,
    startingLocation: input.startingLocation,
    destinationRecommendations: selectedAttractions.map((a: any) => ({
      attractionId: a.id,
      name: a.name,
      district: a.districtName,
      whyRecommended: `Matches your travel style with great seasonal appeal, rated ${a.rating || 4.5}/5.`,
      estimatedDistanceKm: a.estimatedDistanceKm || Math.round(roundTripRoadKm / 2),
      recommendedVisitDuration: isOneDay ? 'Same-day excursion' : '1-2 Days',
      suitableSeason: a.suitableSeasons?.join(', ') || 'All year'
    })),
    days,
    attractions: selectedAttractions.map((a: any) => a.name),
    activities: selectedAttractions.map((a: any) => ({
      name: `Explore ${a.name}`,
      location: a.districtName,
      timing: '9:00 AM - 5:00 PM',
      estimatedCostInr: a.ticketPriceInr || 50,
      bookingNote: 'On-spot entry or MTDC counter'
    })),
    accommodation: isOneDay ? [] : fallbackHotels.slice(0, 3).map((h: any) => ({
      propertyName: h.name,
      location: h.location || primary.districtName,
      priceRangeInr: h.priceRange || '₹1,800 - ₹3,500/night',
      amenities: h.amenities || ['Parking', 'Wi-Fi', 'Restaurant'],
      bookingUrl: h.bookingUrl || 'https://www.mtdc.co',
      bookingNote: 'Official MTDC / verified partner reservation'
    })),
    transport: [
      {
        mode: input.preferredTransport || 'Car / Bike',
        from: input.startingLocation,
        to: primary.name,
        estimatedDistanceKm: Math.round(roundTripRoadKm / 2),
        estimatedDuration: feasibility.estimatedTravelTime,
        approximateCostInr: budgetBreakdown.fuelOrFareCost,
        bookingSource: input.preferredTransport === 'Bus' ? 'MSRTC' : input.preferredTransport === 'Train' ? 'IRCTC' : 'Direct Driving',
        bookingUrl: input.preferredTransport === 'Bus' ? 'https://msrtc.maharashtra.gov.in' : input.preferredTransport === 'Train' ? 'https://www.irctc.co.in' : ''
      }
    ],
    restaurants: [
      {
        name: `Authentic ${primary.districtName} Bhojanalaya`,
        cuisine: 'Maharashtrian & North Indian',
        location: primary.districtName,
        priceRange: '₹200 - ₹400 per person',
        mustTryDishes: ['Misal Pav', 'Pithla Bhakri', 'Solkadhi', 'Puran Poli']
      }
    ],
    safetyInformation: [
      'Emergency Helpline in Maharashtra is 112 (Police / Ambulance / Fire).',
      'For highway assistance on state highways, dial 1033.',
      'Check weather advisories in monsoon for ghat landslide warnings.',
      'Always carry water and wear comfortable footwear.'
    ],
    assumptions: [
      `Travel group consists of ${input.adults} adults${input.children ? `, ${input.children} children` : ''}.`,
      `Preferred transit mode is ${input.preferredTransport}.`
    ],
    warnings: feasibility.isPractical
      ? []
      : [`Driving time is tight for a same-day trip. Departure before ${feasibility.departureWindow} is highly recommended.`],
    sourceReferences: [
      'Maharashtra Tourism Development Corporation (MTDC)',
      'OpenStreetMap & OSRM Routing Engine',
      'Open-Meteo Meteorological Service'
    ]
  };
}

export async function generateStructuredTripPlan(rawInput: TripPlanInput) {
  const isOneDay = rawInput.tripType === 'one-day' || Number(rawInput.days || 1) <= 1;
  const input: TripPlanInput = {
    ...rawInput,
    tripType: isOneDay ? 'one-day' : 'multi-day',
    days: isOneDay ? 1 : Math.max(1, Math.min(10, Number(rawInput.days || 2))),
    returnDate: isOneDay ? rawInput.startDate : rawInput.returnDate,
    rooms: isOneDay ? 0 : Math.max(1, Number(rawInput.rooms || 1)),
    accommodationPreference: isOneDay ? 'None (Same-Day Return)' : rawInput.accommodationPreference
  };

  const startPoint = await resolveStartingCoords(input.startingLocation, input.startingLat, input.startingLng);
  const ranked = rankDestinationsForTrip(input, startPoint.lat, startPoint.lng);
  const topCandidates = ranked.slice(0, 6);
  const primary = topCandidates[0];
  const secondary = isOneDay ? [] : topCandidates.slice(1, 3);
  const selectedAttractions = [primary, ...secondary].filter(Boolean);

  // Real OSRM road route between starting point & primary destination
  let osrmRoute = null;
  try {
    osrmRoute = await getOsrmRoadRoute([
      { lat: startPoint.lat, lng: startPoint.lng },
      { lat: primary.lat, lng: primary.lng }
    ]);
  } catch {
    osrmRoute = null;
  }

  // Real live weather + Bike fuel stations along destination if riding
  const isBikeOrCar =
    input.preferredTransport === 'Bike / Motorcycle' ||
    input.preferredTransport === 'Car' ||
    input.preferredTransport === 'Self-Drive';

  let weather = null;
  let fuelStations: NearbyOsmPlace[] = [];
  await Promise.all([
    getRealWeather(primary.lat, primary.lng, primary.category)
      .then((w) => {
        weather = w;
      })
      .catch(() => {
        weather = null;
      }),
    isBikeOrCar
      ? queryNearbyOsmPlaces(primary.lat, primary.lng, 'fuel', 15000)
          .then((list) => {
            fuelStations = list.slice(0, 6);
          })
          .catch(() => {
            fuelStations = [];
          })
      : Promise.resolve()
  ]);

  const roadKm = osrmRoute?.distanceKm || primary.approxDistanceKm || 68;
  const roundTripRoadKm = Math.round(roadKm * 2);
  const driveMins = osrmRoute?.durationMinutes || Math.round((roadKm / 48) * 60);
  const distanceLabel = osrmRoute
    ? `OSRM Live Road Network (${Math.round(roadKm)} km one-way)`
    : `Estimated Road Corridor (~${Math.round(roadKm)} km one-way)`;

  const feasibility = evaluateOneDayFeasibility(Math.round(roadKm), driveMins, input.preferredTransport);

  // Safer & cheaper closer alternatives if impractical in 1 day or over budget
  const budgetBreakdown = calculateGroupBudget(
    input,
    roadKm,
    isOneDay ? 2 : Math.min(4, input.days + 1),
    distanceLabel
  );

  const closerPracticalOptions = ranked
    .filter((c) => c.id !== primary.id && c.withinBudget && (!isOneDay || c.practicalForOneDay))
    .slice(0, 3)
    .map((c) => ({
      name: c.name,
      district: c.districtName,
      oneWayKm: c.approxDistanceKm,
      roundTripKm: c.roundTripRoadKm,
      estimatedGroupCostInr: c.estimatedGroupCostInr,
      whyPractical: c.suitabilitySummary
    }));

  // Discover Along My Route
  const discoverEnRoute = input.discoverAlongRoute !== false && !budgetBreakdown.isOverBudget;
  const enRouteHiddenGems = discoverEnRoute
    ? findHiddenGemsAlongRoute(
        startPoint.lat,
        startPoint.lng,
        primary.lat,
        primary.lng,
        selectedAttractions.map((a) => a.id),
        input
      ).slice(0, isOneDay ? 2 : 5)
    : [];

  const routeOptions = await compareMaharashtraRoutes(
    startPoint,
    primary,
    enRouteHiddenGems,
    osrmRoute,
    input
  );

  const transportComparison = buildTransportComparison(
    startPoint.name,
    primary,
    roadKm,
    driveMins,
    input
  );

  const relevantDistrictIds = new Set(topCandidates.slice(0, 3).map((d) => d.districtId));
  const verifiedHotels = isOneDay
    ? []
    : CURATED_HOTELS.filter((h) => relevantDistrictIds.has(h.districtId));
  const fallbackHotels = isOneDay
    ? []
    : verifiedHotels.length > 0
    ? verifiedHotels
    : CURATED_HOTELS.slice(0, 3);
  const verifiedRestaurants = CURATED_RESTAURANTS.filter((r) => relevantDistrictIds.has(r.districtId));
  const fallbackRestaurants =
    verifiedRestaurants.length > 0 ? verifiedRestaurants : CURATED_RESTAURANTS.slice(0, 4);

  const sameDaySummary = {
    isOneDayTrip: isOneDay,
    isPractical: isOneDay ? feasibility.isPractical : true,
    feasibilityReason: isOneDay
      ? feasibility.reason
      : `Multi-day (${input.days}-day) itinerary from ${startPoint.name} to ${primary.name} returning on ${input.returnDate || 'final day'}.`,
    departureTime: feasibility.departureWindow,
    expectedReturnTime: isOneDay
      ? feasibility.expectedReturnWindow
      : `Evening return to ${startPoint.name} on Day ${input.days}`,
    oneWayRoadKm: Math.round(roadKm),
    roundTripRoadKm: Math.round(roadKm * 2),
    sightseeingDetourKm: budgetBreakdown.fuelCalculation?.sightseeingDetourKm || 0,
    totalRidingOrDrivingKm:
      budgetBreakdown.fuelCalculation?.totalDistanceKm || Math.round(roadKm * 2),
    estimatedOneWayDuration: formatMinutesLabel(feasibility.adjustedOneWayMinutes),
    saferCloserAlternatives: closerPracticalOptions
  };

  const contextPayload = {
    travelerRequest: input,
    sameDayFeasibilityCheck: sameDaySummary,
    startingCoordinates: startPoint,
    osrmRoadEstimate: osrmRoute
      ? { distanceKm: osrmRoute.distanceKm, durationLabel: osrmRoute.durationLabel }
      : { approxRoadKm: roadKm, note: 'Estimated road distance (OSRM offline).' },
    fuelStationsNearDestination: fuelStations.map((f) => ({
      name: f.name,
      distanceKm: f.distanceKm,
      address: f.address
    })),
    liveWeather: weather
      ? {
          current: (weather as any).current,
          suitability: (weather as any).travelAdvisory?.suitability,
          advisories: (weather as any).travelAdvisory?.advisories
        }
      : 'Weather unavailable; advise checking forecast before departure.',
    verifiedDatabaseCandidates: topCandidates.map((d) => ({
      id: d.id,
      name: d.name,
      district: d.districtName,
      category: d.category,
      isHiddenGem: d.isHiddenGem,
      approxOneWayKm: d.approxDistanceKm,
      estimatedGroupCostInr: d.estimatedGroupCostInr,
      withinBudget: d.withinBudget,
      practicalForOneDay: d.practicalForOneDay,
      bestTime: d.bestTime,
      entryFeeInfo: d.entryFeeInfo,
      openingHoursInfo: d.openingHoursInfo,
      accessibilityInfo: d.accessibilityInfo,
      safetyNotes: d.safetyNotes,
      popularAttractions: d.popularAttractions
    })),
    corridorEnRouteHiddenGems: enRouteHiddenGems,
    verifiedDistrictHotels: fallbackHotels,
    verifiedRegionalRestaurants: fallbackRestaurants,
    deterministicGroupBudget: budgetBreakdown,
    officialBookingPortals: OFFICIAL_BOOKING_LINKS
  };

  const systemInstruction = `You are MAHATRIP AI, a practical, budget-focused Maharashtra travel planner.
CRITICAL RULES:
1. STRICT BUDGET & HONESTY:
   - Entered budget ₹${budgetBreakdown.totalGroupBudget.toLocaleString('en-IN')} is the MAXIMUM TOTAL FOR THE ENTIRE GROUP of ${budgetBreakdown.groupSize}.
   - Essential cost computed by backend is ₹${budgetBreakdown.estimatedTotalCost.toLocaleString('en-IN')}. NEVER invent expensive restaurants, hotels, or paid tours that exceed the remaining budget.
   - Prefer FREE natural viewpoints, lakes, and forts, and affordable local Maharashtrian food (Misal Pav, Poha, Vada Pav, Zunka Bhakri).
   - Never invent exact live ticket prices, train numbers, opening hours, or hotel room availability. Label costs clearly as estimates.
2. ${
    isOneDay
      ? `ONE-DAY SAME-DAY RETURN MODE (CRITICAL):
   - Generate EXACTLY ONE day object in days[] (Day 1 only). NEVER create Day 2 or suggest overnight hotel stays.
   - Explicitly include: Morning Departure from ${input.startingLocation} (${feasibility.departureWindow}), outbound route stops & breakfast, practical sightseeing with exact time windows & travel/rest buffers, affordable Lunch, afternoon viewpoint & snacks, return departure BEFORE dark (around 4:30-5:00 PM), and arrival back at ${input.startingLocation} (${feasibility.expectedReturnWindow}).
   - If sameDayFeasibilityCheck.isPractical is false OR budgetFeasibility is INSUFFICIENT, honestly warn the traveler in tripSummary & warnings and recommend closer/cheaper places from sameDayFeasibilityCheck.saferCloserAlternatives.`
      : `MULTI-DAY END-TO-END MODE (${input.days} days):
   - Day 1 MUST cover starting departure from ${input.startingLocation}, en-route stops, destination check-in, and dinner.
   - Day ${input.days} MUST end with checkout, return journey, and arrival back in ${input.startingLocation}.`
  }
3. ${
    input.preferredTransport === 'Bike / Motorcycle'
      ? `BIKE / MOTORCYCLE SAFETY & FUEL RULES:
   - Mention two-wheelers are prohibited on Expressways (Mumbai–Pune / Samruddhi); stick to Old Highway / NH48 or state highways.
   - Mention the calculated fuel math (${budgetBreakdown.fuelCalculation?.formulaSummary}), ₹0 two-wheeler highway toll, and safe daytime riding (no night ghat riding).`
      : ''
  }
4. BREVITY & USER-FRIENDLINESS:
   - Keep morningActivities, afternoonActivities, eveningActivities concise (1-2 sentences, max 25 words each).
   - Keep tripSummary short, informative, and inviting (under 40 words).
   - Avoid long essays, repetitive fillers, and technical jargon.
5. Respond in ${input.language || 'English'} (keeping JSON property names in English).`;

  const userPrompt = `Create a practical, realistic ${isOneDay ? 'One-Day Same-Day Return' : `${input.days}-Day`} Maharashtra itinerary from ${input.startingLocation} using ONLY grounded facts:
${JSON.stringify(contextPayload)}

Return ONLY a valid JSON object matching this schema:
{
  "tripSummary": string,
  "startingLocation": string,
  "destinationRecommendations": [
    {
      "attractionId": number,
      "name": string,
      "district": string,
      "whyRecommended": string,
      "estimatedDistanceKm": number,
      "recommendedVisitDuration": string,
      "suitableSeason": string
    }
  ],
  "days": [
    {
      "dayNumber": number,
      "title": string,
      "baseLocation": string,
      "departureOrCheckinNote": string,
      "morningActivities": string,
      "afternoonActivities": string,
      "eveningActivities": string,
      "placesToVisit": string[],
      "estimatedTravelDistanceKm": number,
      "estimatedTravelTime": string,
      "mealSuggestions": string,
      "breakfast": string,
      "lunch": string,
      "eveningSnacks": string,
      "dinner": string,
      "hotelRecommendation": string,
      "activitySuggestions": string[],
      "estimatedDayCostInr": number,
      "safetyNotes": string,
      "returnJourneySummary": string
    }
  ],
  "attractions": string[],
  "activities": [
    {
      "name": string,
      "location": string,
      "timing": string,
      "estimatedCostInr": number,
      "bookingNote": string
    }
  ],
  "accommodation": [
    {
      "propertyName": string,
      "location": string,
      "priceRangeInr": string,
      "amenities": string[],
      "bookingUrl": string,
      "bookingNote": string
    }
  ],
  "transport": [
    {
      "mode": string,
      "from": string,
      "to": string,
      "estimatedDistanceKm": number,
      "estimatedDuration": string,
      "approximateCostInr": number,
      "bookingSource": string,
      "bookingUrl": string
    }
  ],
  "restaurants": [
    {
      "name": string,
      "cuisine": string,
      "location": string,
      "priceRange": string,
      "mustTryDishes": string[]
    }
  ],
  "safetyInformation": string[],
  "assumptions": string[],
  "warnings": string[],
  "sourceReferences": string[]
}`;

  let parsed: any = null;
  try {
    const raw = await generateWithGroq({
      systemPrompt: systemInstruction,
      userPrompt,
      jsonMode: true,
      temperature: 0.2
    });
    parsed = extractJsonPayload(raw, null);
  } catch (err: any) {
    console.warn('[MAHATRIP AI Groq Generate Warning]', err?.message);
  }

  if (!parsed || !Array.isArray(parsed.days) || parsed.days.length === 0) {
    parsed = buildDeterministicFallbackItinerary({
      input,
      isOneDay,
      startPoint,
      selectedAttractions,
      topCandidates,
      budgetBreakdown,
      feasibility,
      roundTripRoadKm,
      fallbackHotels,
      enRouteHiddenGems
    });
  }

  // Guard: If One-Day trip, strictly clamp days[] to 1 day and remove overnight hotel clutter
  const finalDays = isOneDay && Array.isArray(parsed.days) ? parsed.days.slice(0, 1) : parsed.days || [];

  return {
    ...parsed,
    days: finalDays,
    accommodation: isOneDay ? [] : parsed.accommodation || [],
    safetyInformation: (parsed.safetyInformation || []).filter(
      (s: string) =>
        !s.toLowerCase().includes('database') &&
        !s.toLowerCase().includes('deterministic') &&
        !s.toLowerCase().includes('candidate')
    ),
    warnings: (parsed.warnings || []).filter(
      (w: string) =>
        !w.toLowerCase().includes('database') &&
        !w.toLowerCase().includes('deterministic') &&
        !w.toLowerCase().includes('candidate')
    ),
    sameDaySummary,
    fuelStations,
    expenses: budgetBreakdown,
    totalGroupBudget: budgetBreakdown.totalGroupBudget,
    estimatedTotalCost: budgetBreakdown.estimatedTotalCost,
    perPersonCost: budgetBreakdown.perPersonCost,
    remainingBudget: budgetBreakdown.remainingBudget,
    enRouteHiddenGems,
    routeOptions,
    transportComparison,
    hotelAlternatives: fallbackHotels,
    mapContext: {
      startingPoint: startPoint,
      stops: selectedAttractions.map((a) => ({
        id: a.id,
        name: a.name,
        district: a.districtName,
        lat: a.lat,
        lng: a.lng,
        category: a.category,
        wikiTitle: a.wikiTitle
      })),
      enRouteStops: enRouteHiddenGems.map((g) => ({
        id: g.id,
        name: g.name,
        district: g.districtName,
        lat: g.lat,
        lng: g.lng,
        detourKm: g.detourKm,
        wikiTitle: g.wikiTitle
      })),
      fuelStations: fuelStations.slice(0, 4),
      osrmRoute
    },
    weatherSnapshot: weather,
    verifiedCandidates: selectedAttractions
  };
}

export async function regenerateItineraryDay(
  dayNumber: number,
  currentItinerary: any,
  userFeedback: string,
  language = 'English'
) {
  const isOneDay = currentItinerary?.sameDaySummary?.isOneDayTrip === true;
  const systemPrompt = `You are MAHATRIP AI, regenerating ONLY Day ${dayNumber} for a Maharashtra trip based on user feedback.
${isOneDay ? 'CRITICAL: This is a ONE-DAY SAME-DAY RETURN trip. Keep departure and return home on the SAME DAY, with NO overnight hotel.' : ''}
Respond in ${language}. Return ONLY a valid JSON object matching the day structure.`;

  const userPrompt = `Regenerate ONLY Day ${dayNumber} of this Maharashtra trip itinerary based on traveler feedback: "${userFeedback}".
Current Trip Summary: ${currentItinerary.tripSummary || ''}
Current Day ${dayNumber}: ${JSON.stringify((currentItinerary.days || []).find((d: any) => d.dayNumber === dayNumber) || {})}
Available verified stops: ${JSON.stringify(currentItinerary.verifiedCandidates || [])}

JSON Format:
{
  "dayNumber": ${dayNumber},
  "title": string,
  "baseLocation": string,
  "departureOrCheckinNote": string,
  "morningActivities": string,
  "afternoonActivities": string,
  "eveningActivities": string,
  "placesToVisit": string[],
  "estimatedTravelDistanceKm": number,
  "estimatedTravelTime": string,
  "breakfast": string,
  "lunch": string,
  "eveningSnacks": string,
  "dinner": string,
  "mealSuggestions": string,
  "hotelRecommendation": string,
  "activitySuggestions": string[],
  "estimatedDayCostInr": number,
  "returnJourneySummary": string,
  "safetyNotes": string
}`;

  let parsed: any = null;
  try {
    const raw = await generateWithGroq({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.3
    });
    parsed = extractJsonPayload(raw, null);
  } catch (err: any) {
    console.warn('[MAHATRIP AI Groq Regenerate Day Warning]', err?.message);
  }

  return parsed || {
    dayNumber,
    title: `Refreshed Day ${dayNumber}`,
    baseLocation: 'Maharashtra',
    departureOrCheckinNote: 'Refreshed schedule based on your suggestions.',
    morningActivities: 'Refreshed morning sightseeing according to your preferences.',
    afternoonActivities: 'Comfortable afternoon visits and local authentic cuisine.',
    eveningActivities: 'Relaxed evening walk, sunset point and return/dinner.',
    placesToVisit: [],
    estimatedTravelDistanceKm: 45,
    estimatedTravelTime: '1.5 hrs',
    breakfast: 'Poha and Masala Chai',
    lunch: 'Local authentic Thali',
    eveningSnacks: 'Vada Pav and Tea',
    dinner: 'Bhakri and Sabzi',
    mealSuggestions: 'Authentic local cuisine',
    hotelRecommendation: isOneDay ? 'None (Same-Day Return)' : 'MTDC Approved Resort / Homestay',
    activitySuggestions: ['Viewpoint visit', 'Heritage walk'],
    estimatedDayCostInr: 1200,
    returnJourneySummary: 'Safe journey with adequate breaks.',
    safetyNotes: 'Follow local road warnings and stay hydrated.'
  };
}

export async function chatWithMahatripAssistant(params: {
  message: string;
  language?: 'English' | 'Hindi' | 'Marathi';
  tripContext?: any;
  userLat?: number;
  userLng?: number;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}) {
  const lang = params.language || 'English';

  const q = params.message.toLowerCase();
  const relevantPlaces = MAHARASHTRA_ATTRACTIONS.filter(
    (a) =>
      q.includes(a.name.toLowerCase()) ||
      q.includes(a.districtName.toLowerCase()) ||
      q.includes(a.category.toLowerCase()) ||
      (q.includes('rain') && a.suitableSeasons.includes('Monsoon')) ||
      (q.includes('hidden') && a.isHiddenGem)
  ).slice(0, 6);

  let weatherInfo = null;
  if (typeof params.userLat === 'number' && typeof params.userLng === 'number') {
    try {
      weatherInfo = await getRealWeather(params.userLat, params.userLng);
    } catch {
      weatherInfo = null;
    }
  }

  const systemInstruction = `You are MAHATRIP AI, a helpful, budget-conscious, safety-first Maharashtra travel assistant.
- Reply naturally in ${lang} (English, Hindi, or Marathi as requested).
- Remember the active trip context provided below.
- Give practical advice tailored to Maharashtra (same-day return buffers, two-wheeler highway rules, monsoon ghat safety, 112 emergency helpline, official MTDC/IRCTC/MSRTC portals).
- NEVER invent live hotel availability, fake bookings, fake train timings, or fabricated emergency numbers.`;

  const contextBlock = {
    activeTrip: params.tripContext
      ? {
          tripSummary: params.tripContext.tripSummary,
          startingLocation: params.tripContext.startingLocation,
          totalGroupBudget: params.tripContext.totalGroupBudget,
          estimatedTotalCost: params.tripContext.estimatedTotalCost,
          sameDaySummary: params.tripContext.sameDaySummary,
          daysCount: params.tripContext.days?.length,
          stops: params.tripContext.attractions
        }
      : 'No active itinerary loaded yet.',
    liveWeatherAtUserLocation: weatherInfo,
    relevantMaharashtraPlaces: relevantPlaces.map((p) => ({
      name: p.name,
      district: p.districtName,
      category: p.category,
      safetyNotes: p.safetyNotes,
      bestTime: p.bestTime,
      lat: p.lat,
      lng: p.lng
    })),
    recentConversation: (params.history || []).slice(-6)
  };

  let replyText = '';
  try {
    replyText = await generateWithGroq({
      systemPrompt: `${systemInstruction}\n\nContext:\n${JSON.stringify(contextBlock)}`,
      userPrompt: params.message,
      temperature: 0.4
    });
  } catch (err: any) {
    console.warn('[MAHATRIP AI Chat Groq Warning]', err?.message);
    if (relevantPlaces.length > 0) {
      const topP = relevantPlaces[0];
      const highlights = (topP.popularAttractions || topP.thingsToDo || []).slice(0, 3).join(', ') || 'Scenic and cultural heritage';
      replyText = `Based on your query, here is information about **${topP.name}** in ${topP.districtName} district:\n\n- **Category**: ${topP.category}\n- **Best Time**: ${topP.bestTime}\n- **Safety Note**: ${topP.safetyNotes}\n- **Highlights**: ${highlights}.\n\nFor more details, feel free to plan your trip using our AI Trip Planner!`;
    } else {
      replyText = `Welcome to Maharashtra Travel Assistant! I can help you plan trips across all 36 districts of Maharashtra, advise on budget-friendly routes, monsoon ghat safety, and local delicacies. How can I assist your Maharashtra journey today?`;
    }
  }

  return {
    reply: replyText || 'I could not generate a response right now. Please try again.',
    model: DEFAULT_GROQ_MODEL,
    suggestedPlaces: relevantPlaces.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      district: p.districtName,
      category: p.category
    }))
  };
}
