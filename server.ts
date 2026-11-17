import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MAHARASHTRA_ATTRACTIONS } from './server/data/attractions.js';
import { MAHARASHTRA_DISTRICTS } from './server/data/districts.js';
import {
  CURATED_HOTELS,
  CURATED_RESTAURANTS,
  OFFICIAL_BOOKING_LINKS,
  TRAVEL_AGENTS_DIRECTORY
} from './server/data/hospitality.js';
import { calculateGroupBudget } from './server/services/budgetEngine.js';
import {
  geocodeMaharashtraLocation,
  getOsrmRoadRoute,
  getRealWeather,
  queryNearbyOsmPlaces
} from './server/services/geoWeatherService.js';
import {
  chatWithMahatripAssistant,
  generateStructuredTripPlan,
  parseNaturalLanguageTripPrompt,
  rankDestinationsForTrip,
  regenerateItineraryDay,
  resolveStartingCoords
} from './server/services/mahatripAiService.js';
import {
  addTripBooking,
  addTripExpense,
  addUserInquiry,
  AuthedRequest,
  createSavedTrip,
  deleteSavedTrip,
  deleteTripBooking,
  getTripByIdForOwner,
  getUserProfile,
  getUserTrips,
  loginUser,
  registerUser,
  requireAuth,
  toggleUserFavorite,
  updateSavedTrip,
  updateTripBooking,
  updateUserTrustedContact
} from './server/services/storeAuthService.js';
import { fetchWikimediaImagesForTitle } from './server/services/wikimediaService.js';
import { testSupabaseConnection } from './server/services/supabaseService.js';
import { TripPlanInput } from './server/types.js';

const PORT = Number(process.env.PORT || 3000);
const SPRING_BOOT_API_URL = (process.env.SPRING_BOOT_API_URL || '').trim();

// Simple in-memory rate limiter for AI & Auth routes
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'local';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please wait a moment before trying again.'
      });
    }
    bucket.count += 1;
    return next();
  };
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

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // Health & architecture metadata (no secrets exposed)
  app.get('/api/health', async (_req, res) => {
    const groqKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    const supabaseReady = await testSupabaseConnection();
    res.json({
      success: true,
      service: 'Maharashtra Explorer & MAHATRIP AI Server',
      districtsCount: MAHARASHTRA_DISTRICTS.length,
      attractionsCount: MAHARASHTRA_ATTRACTIONS.length,
      springBootBridgeConfigured: Boolean(SPRING_BOOT_API_URL),
      groqConfigured: Boolean(groqKey && groqKey !== 'MY_GROQ_API_KEY'),
      aiProvider: groqKey ? 'Groq / Grok' : (process.env.GEMINI_API_KEY ? 'Gemini' : 'Deterministic / Local'),
      database: supabaseReady ? 'Supabase PostgreSQL (Connected)' : 'Local JSON Fallback'
    });
  });

  // ==================== DISTRICTS (ALL 36) ====================
  app.get('/api/districts', (req, res) => {
    const division = String(req.query.division || '').trim().toLowerCase();
    const q = String(req.query.q || '').trim().toLowerCase();

    let list = MAHARASHTRA_DISTRICTS;
    if (division && division !== 'all') {
      list = list.filter((d) => d.division.toLowerCase() === division);
    }
    if (q) {
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.aliases.some((a) => a.toLowerCase().includes(q)) ||
          d.talukas.some((t) => t.toLowerCase().includes(q)) ||
          d.keyTowns.some((t) => t.toLowerCase().includes(q))
      );
    }

    const enriched = list.map((d) => ({
      ...d,
      attractionsCount: MAHARASHTRA_ATTRACTIONS.filter((a) => a.districtId === d.id).length
    }));
    res.json({ success: true, count: enriched.length, data: enriched });
  });

  app.get('/api/districts/:id', (req, res) => {
    const id = req.params.id.toLowerCase();
    const district = MAHARASHTRA_DISTRICTS.find(
      (d) => d.id === id || d.name.toLowerCase() === id || d.aliases.some((a) => a.toLowerCase() === id)
    );
    if (!district) {
      return res.status(404).json({ success: false, message: 'District not found.' });
    }
    const attractions = MAHARASHTRA_ATTRACTIONS.filter((a) => a.districtId === district.id);
    const hotels = CURATED_HOTELS.filter((h) => h.districtId === district.id);
    const restaurants = CURATED_RESTAURANTS.filter((r) => r.districtId === district.id);
    return res.json({
      success: true,
      data: {
        ...district,
        attractions,
        hotels,
        restaurants
      }
    });
  });

  // ==================== DESTINATIONS & HIDDEN GEMS ====================
  app.get('/api/destinations', (req, res) => {
    const category = String(req.query.category || '').trim().toLowerCase();
    const division = String(req.query.division || '').trim().toLowerCase();
    const districtId = String(req.query.districtId || '').trim().toLowerCase();
    const q = String(req.query.q || '').trim().toLowerCase();
    const season = String(req.query.season || '').trim().toLowerCase();
    const hiddenOnly = req.query.hidden === 'true';

    let items = MAHARASHTRA_ATTRACTIONS;
    if (category && category !== 'all') {
      items = items.filter((a) => a.category.toLowerCase() === category);
    }
    if (division && division !== 'all') {
      items = items.filter((a) => a.division.toLowerCase() === division);
    }
    if (districtId && districtId !== 'all') {
      items = items.filter((a) => a.districtId === districtId);
    }
    if (season && season !== 'all') {
      items = items.filter((a) => a.suitableSeasons.some((s) => s.toLowerCase() === season));
    }
    if (hiddenOnly) {
      items = items.filter((a) => a.isHiddenGem);
    }
    if (q) {
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.districtName.toLowerCase().includes(q) ||
          a.division.toLowerCase().includes(q) ||
          (a.taluka || '').toLowerCase().includes(q) ||
          a.locality.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, count: items.length, data: items });
  });

  app.get('/api/destinations/search', (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) return res.json({ success: true, count: 0, data: [] });
    const matches = MAHARASHTRA_ATTRACTIONS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.districtName.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
    return res.json({ success: true, count: matches.length, data: matches });
  });

  app.get('/api/destinations/nearby', (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm || 150);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng query parameters are required.' });
    }
    const nearby = MAHARASHTRA_ATTRACTIONS.map((a) => ({
      ...a,
      straightLineKm: haversineKm(lat, lng, a.lat, a.lng)
    }))
      .filter((a) => a.straightLineKm <= radiusKm)
      .sort((a, b) => a.straightLineKm - b.straightLineKm);

    return res.json({ success: true, count: nearby.length, data: nearby });
  });

  app.get('/api/destinations/district/:districtId', (req, res) => {
    const list = MAHARASHTRA_ATTRACTIONS.filter((a) => a.districtId === req.params.districtId.toLowerCase());
    res.json({ success: true, count: list.length, data: list });
  });

  app.get('/api/destinations/:id', async (req, res) => {
    const idParam = req.params.id;
    const found = MAHARASHTRA_ATTRACTIONS.find((a) => String(a.id) === idParam || a.slug === idParam);
    if (!found) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }
    const images = await fetchWikimediaImagesForTitle(found.wikiTitle, 5);
    return res.json({
      success: true,
      data: {
        ...found,
        verifiedImages: images,
        imageAvailability: images.length > 0 ? 'VERIFIED' : 'UNAVAILABLE'
      }
    });
  });

  // Authentic Wikimedia Commons Gallery Endpoint
  app.get('/api/destinations/:id/gallery', async (req, res) => {
    const idParam = req.params.id;
    const found = MAHARASHTRA_ATTRACTIONS.find((a) => String(a.id) === idParam || a.slug === idParam);
    if (!found) {
      return res.status(404).json({ success: false, message: 'Destination not found.' });
    }
    const images = await fetchWikimediaImagesForTitle(found.wikiTitle, 6);
    return res.json({
      success: true,
      destinationId: found.id,
      destinationName: found.name,
      verified: images.length > 0,
      images
    });
  });

  // Batch gallery lookup by wikiTitle query
  app.get('/api/wikimedia/image', async (req, res) => {
    const title = String(req.query.title || '').trim();
    if (!title) {
      return res.status(400).json({ success: false, message: 'title query parameter is required.' });
    }
    const images = await fetchWikimediaImagesForTitle(title, 3);
    return res.json({
      success: true,
      verified: images.length > 0,
      images
    });
  });

  app.get('/api/hidden-gems', (req, res) => {
    const filterType = String(req.query.filter || '').trim().toLowerCase();
    const districtId = String(req.query.districtId || '').trim().toLowerCase();
    let gems = MAHARASHTRA_ATTRACTIONS.filter((a) => a.isHiddenGem);
    if (filterType && filterType !== 'all') {
      gems = gems.filter((g) => g.hiddenGemFilters?.some((f) => f.toLowerCase() === filterType));
    }
    if (districtId && districtId !== 'all') {
      gems = gems.filter((g) => g.districtId === districtId);
    }
    res.json({ success: true, count: gems.length, data: gems });
  });

  // ==================== HOTELS, RESTAURANTS, AGENTS & BOOKINGS ====================
  app.get('/api/hotels', (req, res) => {
    const districtId = String(req.query.districtId || '').trim().toLowerCase();
    const data = districtId && districtId !== 'all'
      ? CURATED_HOTELS.filter((h) => h.districtId === districtId)
      : CURATED_HOTELS;
    res.json({ success: true, count: data.length, data, bookingNotice: OFFICIAL_BOOKING_LINKS.hotelsMtdc.note });
  });

  app.get('/api/restaurants', (req, res) => {
    const districtId = String(req.query.districtId || '').trim().toLowerCase();
    const dietary = String(req.query.dietary || '').trim().toLowerCase();
    let data = CURATED_RESTAURANTS;
    if (districtId && districtId !== 'all') {
      data = data.filter((r) => r.districtId === districtId);
    }
    if (dietary && dietary !== 'all') {
      data = data.filter((r) => r.dietaryTags.some((t) => t.toLowerCase().includes(dietary)));
    }
    res.json({ success: true, count: data.length, data });
  });

  app.get('/api/activities', (req, res) => {
    const category = String(req.query.category || '').trim().toLowerCase();
    const list = MAHARASHTRA_ATTRACTIONS.flatMap((a) =>
      a.thingsToDo.map((todo, idx) => ({
        id: `${a.id}-act-${idx}`,
        title: todo,
        attractionName: a.name,
        attractionId: a.id,
        districtId: a.districtId,
        districtName: a.districtName,
        category: a.category,
        bestTime: a.bestTime,
        safetyNotes: a.safetyNotes
      }))
    );
    const filtered = category && category !== 'all'
      ? list.filter((x) => x.category.toLowerCase() === category)
      : list;
    res.json({ success: true, count: filtered.length, data: filtered });
  });

  app.get('/api/booking-links', (_req, res) => {
    res.json({ success: true, data: OFFICIAL_BOOKING_LINKS });
  });

  app.get('/api/travel-agents', (_req, res) => {
    res.json({ success: true, count: TRAVEL_AGENTS_DIRECTORY.length, data: TRAVEL_AGENTS_DIRECTORY });
  });

  app.post('/api/travel-agents/inquiry', (req, res) => {
    const { agentName, customerName, phone, message } = req.body || {};
    if (!agentName || !customerName || !phone) {
      return res.status(400).json({ success: false, message: 'Operator name, full name, and phone are required.' });
    }
    let userId: number | null = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        // Optional user attachment if signed in
        const decoded: any = JSON.parse(Buffer.from(authHeader.slice(7).split('.')[1], 'base64').toString());
        userId = Number(decoded.sub) || null;
      } catch {
        userId = null;
      }
    }
    const inquiry = addUserInquiry(userId, { agentName, customerName, phone, message: message || '' });
    return res.status(201).json({
      success: true,
      message: `Inquiry recorded for ${agentName}. Reference: ${inquiry.id}`,
      data: inquiry
    });
  });

  // ==================== WEATHER, ROUTING & SAFETY NEARBY ====================
  app.get('/api/weather', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const category = req.query.category ? String(req.query.category) : undefined;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng query parameters are required.' });
    }
    try {
      const weather = await getRealWeather(lat, lng, category);
      return res.json({ success: true, data: weather });
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: `Live weather provider unavailable: ${(err as Error).message}`
      });
    }
  });

  app.get('/api/route', async (req, res) => {
    const coordsRaw = String(req.query.coords || '').trim();
    if (!coordsRaw) {
      return res.status(400).json({ success: false, message: 'coords query param required (lat,lng;lat,lng).' });
    }
    try {
      const waypoints = coordsRaw.split(';').map((pair) => {
        const [lat, lng] = pair.split(',').map(Number);
        if (Number.isNaN(lat) || Number.isNaN(lng)) throw new Error('Invalid coordinates format.');
        return { lat, lng };
      });
      const route = await getOsrmRoadRoute(waypoints);
      return res.json({ success: true, data: route });
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: `Road routing error: ${(err as Error).message}`
      });
    }
  });

  app.get('/api/nearby', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const type = String(req.query.type || 'hospital') as
      | 'hospital'
      | 'police'
      | 'pharmacy'
      | 'hotel'
      | 'restaurant'
      | 'fuel';
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'lat and lng query parameters are required.' });
    }
    try {
      const places = await queryNearbyOsmPlaces(lat, lng, type);
      return res.json({ success: true, count: places.length, data: places });
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: `OpenStreetMap Overpass query unavailable right now: ${(err as Error).message}`,
        data: []
      });
    }
  });

  app.get('/api/geocode', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, message: 'q query parameter is required.' });
    const result = await geocodeMaharashtraLocation(q);
    if (!result) return res.status(404).json({ success: false, message: 'Location not found in Maharashtra.' });
    return res.json({ success: true, data: result });
  });

  // ==================== BUDGET & MAHATRIP AI ====================
  app.post('/api/budget/calculate', async (req, res) => {
    const input = req.body as TripPlanInput;
    let distanceKm = Number(req.body.estimatedRoadDistanceKm || 0);
    let distanceLabel = 'Estimated Maharashtra Road Distance';

    if (!distanceKm || distanceKm <= 0) {
      const startPt = await resolveStartingCoords(input.startingLocation || 'Pune', input.startingLat, input.startingLng);
      const pref = (input.destinationPreference || '').trim().toLowerCase();
      const matched =
        pref && pref !== 'ai_recommend'
          ? MAHARASHTRA_ATTRACTIONS.find(
              (a) =>
                a.name.toLowerCase().includes(pref) ||
                a.districtName.toLowerCase().includes(pref) ||
                a.slug.includes(pref)
            )
          : null;
      if (matched) {
        const straight = haversineKm(startPt.lat, startPt.lng, matched.lat, matched.lng);
        distanceKm = Math.max(10, Math.round(straight * 1.24));
        distanceLabel = `Estimated Corridor Distance (${startPt.name} → ${matched.name})`;
      } else {
        distanceKm = input.tripType === 'one-day' || Number(input.days || 1) <= 1 ? 65 : 180;
      }
    }

    const breakdown = calculateGroupBudget(
      input,
      distanceKm,
      Number(req.body.targetAttractionCount || (input.days === 1 ? 2 : 3)),
      distanceLabel
    );
    res.json({ success: true, data: breakdown });
  });

  app.post('/api/ai/recommendations', async (req, res) => {
    try {
      const input = req.body as TripPlanInput;
      const startPoint = await resolveStartingCoords(input.startingLocation || 'Pune', input.startingLat, input.startingLng);
      const ranked = rankDestinationsForTrip(input, startPoint.lat, startPoint.lng).slice(0, 6);
      return res.json({ success: true, startingPoint: startPoint, data: ranked });
    } catch (err) {
      return res.status(400).json({ success: false, message: (err as Error).message });
    }
  });

  app.post('/api/ai/parse-prompt', rateLimit(20, 60_000), async (req, res) => {
    try {
      const prompt = String(req.body?.prompt || '').trim();
      if (!prompt || prompt.length < 6) {
        return res.status(400).json({ success: false, message: 'Please enter a descriptive travel prompt.' });
      }
      const parsed = await parseNaturalLanguageTripPrompt(prompt.slice(0, 1200));
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      const status = err?.status || (String(err?.message).includes('API_KEY') ? 503 : 500);
      return res.status(status).json({
        success: false,
        message: err?.message || 'Unable to parse natural language travel request.'
      });
    }
  });

  app.post('/api/ai/itinerary', rateLimit(15, 60_000), async (req, res) => {
    try {
      const input = req.body as TripPlanInput;
      if (!input.startingLocation || !input.days || !input.totalGroupBudget) {
        return res.status(400).json({
          success: false,
          message: 'Starting location, trip duration (days), and total group budget are required.'
        });
      }
      const plan = await generateStructuredTripPlan(input);
      return res.json({ success: true, data: plan });
    } catch (err: any) {
      console.error('[MAHATRIP AI Itinerary Error]', err);
      const status = err?.status || (String(err?.message).includes('API_KEY') ? 503 : 500);
      return res.status(status).json({
        success: false,
        message: err?.message || 'Unable to generate MAHATRIP AI itinerary.'
      });
    }
  });

  app.post('/api/ai/regenerate-day', rateLimit(20, 60_000), async (req, res) => {
    try {
      const { dayNumber, currentItinerary, feedback, language } = req.body || {};
      if (!dayNumber || !currentItinerary) {
        return res.status(400).json({ success: false, message: 'dayNumber and currentItinerary are required.' });
      }
      const updatedDay = await regenerateItineraryDay(
        Number(dayNumber),
        currentItinerary,
        feedback || 'Suggest a refreshed, balanced schedule with minimal backtracking.',
        language || 'English'
      );
      return res.json({ success: true, data: updatedDay });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Day regeneration failed.' });
    }
  });

  app.post('/api/ai/chat', rateLimit(30, 60_000), async (req, res) => {
    try {
      const { message, language, tripContext, userLat, userLng, history } = req.body || {};
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, message: 'Message text is required.' });
      }
      const result = await chatWithMahatripAssistant({
        message: message.slice(0, 1500),
        language,
        tripContext,
        userLat,
        userLng,
        history
      });
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('[MAHATRIP AI Chat Error]', err);
      const status = err?.status || (String(err?.message).includes('API_KEY') ? 503 : 500);
      return res.status(status).json({
        success: false,
        message: err?.message || 'MAHATRIP AI chat encountered an error.'
      });
    }
  });

  // ==================== AUTH & USER PROFILE ====================
  app.post('/api/auth/register', rateLimit(10, 60_000), async (req, res) => {
    try {
      const { fullName, email, password, phone, homeCity } = req.body || {};
      if (!fullName || !email || !password || String(password).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Full name, valid email, and password (min 6 characters) are required.'
        });
      }
      const result = await registerUser({ fullName, email, password, phone, homeCity });
      return res.status(201).json({ success: true, message: 'Account created successfully.', data: result });
    } catch (err: any) {
      if (err.message === 'EMAIL_EXISTS') {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
      return res.status(500).json({ success: false, message: 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', rateLimit(15, 60_000), async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }
      const result = await loginUser(email, password);
      return res.json({ success: true, message: 'Signed in successfully.', data: result });
    } catch (err: any) {
      if (err.message === 'USER_NOT_FOUND' || err.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      return res.status(500).json({ success: false, message: 'Login failed.' });
    }
  });

  app.get('/api/user/profile', requireAuth, async (req: AuthedRequest, res) => {
    const profile = await getUserProfile(req.authUser!.id);
    if (!profile) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: profile });
  });

  app.post('/api/user/favorites/:destinationId', requireAuth, async (req: AuthedRequest, res) => {
    const destId = Number(req.params.destinationId);
    const favs = await toggleUserFavorite(req.authUser!.id, destId);
    if (!favs) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: favs });
  });

  app.put('/api/user/trusted-contact', requireAuth, async (req: AuthedRequest, res) => {
    const { name, phone } = req.body || {};
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Trusted contact name and phone are required.' });
    }
    const updated = await updateUserTrustedContact(req.authUser!.id, { name, phone });
    return res.json({ success: true, data: updated });
  });

  // ==================== SAVED TRIPS (OWNERSHIP ENFORCED) ====================
  app.get('/api/trips', requireAuth, async (req: AuthedRequest, res) => {
    const trips = await getUserTrips(req.authUser!.id);
    res.json({ success: true, count: trips.length, data: trips });
  });

  app.get('/api/trips/:id', requireAuth, (req: AuthedRequest, res) => {
    const trip = getTripByIdForOwner(req.params.id, req.authUser!.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or access denied.' });
    return res.json({ success: true, data: trip });
  });

  app.post('/api/trips', requireAuth, async (req: AuthedRequest, res) => {
    const body = req.body || {};
    if (!body.title || !body.itinerary) {
      return res.status(400).json({ success: false, message: 'Trip title and itinerary payload are required.' });
    }
    const created = await createSavedTrip(req.authUser!.id, {
      title: body.title,
      status: body.status || 'upcoming',
      startingLocation: body.startingLocation || 'Maharashtra',
      startDate: body.startDate || new Date().toISOString().split('T')[0],
      days: Number(body.days || 2),
      totalGroupBudget: Number(body.totalGroupBudget || 10000),
      groupSize: Number(body.groupSize || 2),
      destinations: Array.isArray(body.destinations) ? body.destinations : [],
      itinerary: body.itinerary,
      expensesLogged: Array.isArray(body.expensesLogged) ? body.expensesLogged : [],
      bookings: Array.isArray(body.bookings) ? body.bookings : []
    });
    return res.status(201).json({ success: true, data: created });
  });

  app.put('/api/trips/:id', requireAuth, async (req: AuthedRequest, res) => {
    const updated = await updateSavedTrip(req.params.id, req.authUser!.id, req.body || {});
    if (!updated) return res.status(404).json({ success: false, message: 'Trip not found or access denied.' });
    return res.json({ success: true, data: updated });
  });

  app.delete('/api/trips/:id', requireAuth, async (req: AuthedRequest, res) => {
    const deleted = await deleteSavedTrip(req.params.id, req.authUser!.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Trip not found or access denied.' });
    return res.json({ success: true, message: 'Trip deleted.' });
  });

  app.post('/api/trips/:id/expenses', requireAuth, (req: AuthedRequest, res) => {
    const { category, description, amount, date } = req.body || {};
    if (!category || !description || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid category, description, and positive amount are required.' });
    }
    const updated = addTripExpense(req.params.id, req.authUser!.id, { category, description, amount, date });
    if (!updated) return res.status(404).json({ success: false, message: 'Trip not found or access denied.' });
    return res.status(201).json({ success: true, data: updated });
  });

  app.post('/api/trips/:id/bookings', requireAuth, (req: AuthedRequest, res) => {
    const { type, title, provider, status, referenceCode, estimatedCostInr, bookingUrl, notes } = req.body || {};
    if (!type || !title || !provider) {
      return res.status(400).json({ success: false, message: 'Booking type, title, and provider are required.' });
    }
    const updated = addTripBooking(req.params.id, req.authUser!.id, {
      type,
      title,
      provider,
      status,
      referenceCode,
      estimatedCostInr,
      bookingUrl,
      notes
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Trip not found or access denied.' });
    return res.status(201).json({ success: true, data: updated });
  });

  app.put('/api/trips/:id/bookings/:bookingId', requireAuth, (req: AuthedRequest, res) => {
    const updated = updateTripBooking(req.params.id, req.params.bookingId, req.authUser!.id, req.body || {});
    if (!updated) return res.status(404).json({ success: false, message: 'Booking or trip not found or access denied.' });
    return res.json({ success: true, data: updated });
  });

  app.delete('/api/trips/:id/bookings/:bookingId', requireAuth, (req: AuthedRequest, res) => {
    const updated = deleteTripBooking(req.params.id, req.params.bookingId, req.authUser!.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Booking or trip not found or access denied.' });
    return res.json({ success: true, data: updated });
  });

  // ==================== VITE DEV / PROD STATIC MOUNT ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maharashtra Explorer server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp();
