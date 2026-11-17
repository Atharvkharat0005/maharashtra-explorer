import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { SavedTripRecord } from '../types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'maharashtra_explorer_store.json');
const JWT_SECRET = process.env.JWT_SECRET || 'maharashtra-explorer-dev-jwt-secret-change-in-prod';

export interface StoredUser {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  tier: string;
  homeCity: string;
  favoriteDestinationIds: number[];
  trustedEmergencyContact?: { name: string; phone: string };
  inquiries: Array<{
    id: string;
    agentName: string;
    package: string;
    status: string;
    date: string;
    customerName?: string;
    customerPhone?: string;
    message?: string;
  }>;
  createdAt: string;
}

interface StoreSchema {
  users: StoredUser[];
  trips: SavedTripRecord[];
}

function getDefaultStore(): StoreSchema {
  const demoHash = bcrypt.hashSync('Password123', 10);
  return {
    users: [
      {
        id: 101,
        fullName: 'Rahul Patil',
        email: 'demo.traveler@example.com',
        passwordHash: demoHash,
        phone: '+91 98220 12345',
        role: 'ROLE_USER',
        tier: 'Sahyadri Voyager',
        homeCity: 'Pune, Maharashtra',
        favoriteDestinationIds: [1, 2, 5],
        inquiries: [],
        createdAt: '2026-01-15T10:30:00.000Z'
      }
    ],
    trips: [
      {
        id: 'TRIP-101',
        userId: 101,
        title: 'Raigad Fort & Konkan Sahyadri Weekend',
        status: 'upcoming',
        startingLocation: 'Pune',
        startDate: '2026-12-12',
        days: 2,
        totalGroupBudget: 12000,
        groupSize: 4,
        destinations: ['Raigad Fort', 'Kumbhe Waterfall'],
        itinerary: {
          tripSummary: '2-day Maratha capital fort & Sahyadri waterfall getaway from Pune for 4 travelers within ₹12,000.',
          startingLocation: 'Pune',
          totalGroupBudget: 12000,
          estimatedTotalCost: 10450,
          perPersonCost: 2613,
          remainingBudget: 1550,
          days: [
            {
              dayNumber: 1,
              title: 'Pune to Raigad Fort via Tamhini',
              baseLocation: 'Pachad / Raigadwadi',
              morningActivities: 'Early 6:00 AM drive from Pune via Tamhini Ghat to Pachad base.',
              afternoonActivities: 'Ascend Raigad Fort by steps or ropeway; visit Raj Bhavan, Maha Darwaja, and Samadhi.',
              eveningActivities: 'Sunset vistas at Takmak Tok (stay clear of cliff edges), descend to MTDC/homestay.',
              placesToVisit: ['Raigad Fort', 'Maha Darwaja', 'Takmak Tok'],
              estimatedTravelDistanceKm: 135,
              estimatedTravelTime: '3 hr 30 min',
              mealSuggestions: 'Authentic Pithla Bhakri & Taak at Pachad foothill.',
              hotelRecommendation: 'MTDC Raigad Resort or Pachad verified homestays',
              estimatedDayCostInr: 6200,
              safetyNotes: 'Carry drinking water; wear grippy trekking footwear.'
            },
            {
              dayNumber: 2,
              title: 'Kumbhe Gorge & Return to Pune',
              baseLocation: 'Mangaon / Pune',
              morningActivities: 'Morning drive toward Mangaon & Kumbhe Waterfall viewpoint.',
              afternoonActivities: 'Scenic lunch en route through Tamhini Ghat backwaters.',
              eveningActivities: 'Arrive back in Pune by 6:30 PM.',
              placesToVisit: ['Kumbhe Waterfall', 'Tamhini Ghat'],
              estimatedTravelDistanceKm: 155,
              estimatedTravelTime: '4 hr',
              mealSuggestions: 'Zunka Bhakri & coastal thali near Mangaon.',
              hotelRecommendation: 'N/A (Return day)',
              estimatedDayCostInr: 4250,
              safetyNotes: 'Do not enter deep waterfall plunge pools.'
            }
          ]
        },
        expensesLogged: [
          {
            id: 'EXP-1',
            category: 'Parking & Tolls',
            description: 'Pachad Base Parking & Ghat Toll',
            amount: 350,
            date: '2026-11-10'
          }
        ],
        createdAt: '2026-11-10T09:00:00.000Z',
        updatedAt: '2026-11-10T09:00:00.000Z'
      }
    ]
  };
}

function readStore(): StoreSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STORE_FILE)) {
      const def = getDefaultStore();
      fs.writeFileSync(STORE_FILE, JSON.stringify(def, null, 2));
      return def;
    }
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
  } catch {
    return getDefaultStore();
  }
}

function writeStore(store: StoreSchema) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

export function sanitizeUser(u: StoredUser) {
  const { passwordHash: _ignored, ...rest } = u;
  return rest;
}

export function signJwtForUser(user: StoredUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export interface AuthedRequest extends Request {
  authUser?: { id: number; email: string; role: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required.' });
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.authUser = { id: Number(decoded.sub), email: decoded.email, role: decoded.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

export function registerUser(payload: { fullName: string; email: string; password: string; phone?: string; homeCity?: string }) {
  const store = readStore();
  const emailNorm = payload.email.trim().toLowerCase();
  if (store.users.some((u) => u.email.toLowerCase() === emailNorm)) {
    throw new Error('EMAIL_EXISTS');
  }
  const newUser: StoredUser = {
    id: Math.max(100, ...store.users.map((u) => u.id)) + 1,
    fullName: payload.fullName.trim(),
    email: emailNorm,
    passwordHash: bcrypt.hashSync(payload.password, 10),
    phone: payload.phone?.trim() || '',
    role: 'ROLE_USER',
    tier: 'Maharashtra Explorer',
    homeCity: payload.homeCity?.trim() || 'Maharashtra, India',
    favoriteDestinationIds: [],
    inquiries: [],
    createdAt: new Date().toISOString()
  };
  store.users.push(newUser);
  writeStore(store);
  return { token: signJwtForUser(newUser), user: sanitizeUser(newUser) };
}

export function loginUser(email: string, password: string) {
  const store = readStore();
  const emailNorm = email.trim().toLowerCase();
  const user = store.users.find((u) => u.email.toLowerCase() === emailNorm);
  if (!user) throw new Error('USER_NOT_FOUND');
  if (!bcrypt.compareSync(password, user.passwordHash)) throw new Error('INVALID_CREDENTIALS');
  return { token: signJwtForUser(user), user: sanitizeUser(user) };
}

export function getUserProfile(userId: number) {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  return sanitizeUser(user);
}

export function updateUserTrustedContact(userId: number, contact: { name: string; phone: string }) {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  user.trustedEmergencyContact = { name: contact.name.trim(), phone: contact.phone.trim() };
  writeStore(store);
  return sanitizeUser(user);
}

export function toggleUserFavorite(userId: number, destinationId: number) {
  const store = readStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;
  const exists = user.favoriteDestinationIds.includes(destinationId);
  user.favoriteDestinationIds = exists
    ? user.favoriteDestinationIds.filter((id) => id !== destinationId)
    : [...user.favoriteDestinationIds, destinationId];
  writeStore(store);
  return user.favoriteDestinationIds;
}

export function addUserInquiry(userId: number | null, data: { agentName: string; customerName: string; phone: string; message: string }) {
  const store = readStore();
  const inquiry = {
    id: 'INQ-' + Math.floor(100000 + Math.random() * 900000),
    agentName: data.agentName,
    package: data.message || 'Custom Maharashtra Tour',
    status: 'Inquiry Recorded (Operator Callback Requested)',
    date: new Date().toISOString().split('T')[0],
    customerName: data.customerName,
    customerPhone: data.phone,
    message: data.message
  };
  if (userId) {
    const user = store.users.find((u) => u.id === userId);
    if (user) {
      user.inquiries.unshift(inquiry);
      writeStore(store);
    }
  }
  return inquiry;
}

export function getUserTrips(userId: number): SavedTripRecord[] {
  const store = readStore();
  return store.trips.filter((t) => t.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getTripByIdForOwner(tripId: string, userId: number): SavedTripRecord | null {
  const store = readStore();
  const trip = store.trips.find((t) => t.id === tripId);
  if (!trip || trip.userId !== userId) return null;
  return trip;
}

export function createSavedTrip(
  userId: number,
  payload: Omit<SavedTripRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): SavedTripRecord {
  const store = readStore();
  const now = new Date().toISOString();
  const newTrip: SavedTripRecord = {
    ...payload,
    id: 'TRIP-' + Math.floor(1000 + Math.random() * 9000),
    userId,
    expensesLogged: payload.expensesLogged || [],
    createdAt: now,
    updatedAt: now
  };
  store.trips.unshift(newTrip);
  writeStore(store);
  return newTrip;
}

export function updateSavedTrip(tripId: string, userId: number, patch: Partial<SavedTripRecord>): SavedTripRecord | null {
  const store = readStore();
  const idx = store.trips.findIndex((t) => t.id === tripId);
  if (idx === -1 || store.trips[idx].userId !== userId) return null;
  store.trips[idx] = {
    ...store.trips[idx],
    ...patch,
    id: store.trips[idx].id,
    userId: store.trips[idx].userId,
    updatedAt: new Date().toISOString()
  };
  writeStore(store);
  return store.trips[idx];
}

export function deleteSavedTrip(tripId: string, userId: number): boolean {
  const store = readStore();
  const trip = store.trips.find((t) => t.id === tripId);
  if (!trip || trip.userId !== userId) return false;
  store.trips = store.trips.filter((t) => t.id !== tripId);
  writeStore(store);
  return true;
}

export function addTripExpense(
  tripId: string,
  userId: number,
  expense: { category: string; description: string; amount: number; date?: string }
): SavedTripRecord | null {
  const store = readStore();
  const trip = store.trips.find((t) => t.id === tripId);
  if (!trip || trip.userId !== userId) return null;
  trip.expensesLogged.unshift({
    id: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
    category: expense.category,
    description: expense.description,
    amount: Number(expense.amount),
    date: expense.date || new Date().toISOString().split('T')[0]
  });
  trip.updatedAt = new Date().toISOString();
  writeStore(store);
  return trip;
}

export function addTripBooking(
  tripId: string,
  userId: number,
  booking: {
    type: 'Transport' | 'Accommodation' | 'Activity' | 'Restaurant' | 'Permit';
    title: string;
    provider: string;
    status?: 'Recommended' | 'Selected' | 'Booking Initiated' | 'Booking Confirmed' | 'Cancelled';
    referenceCode?: string;
    estimatedCostInr?: number;
    bookingUrl?: string;
    notes?: string;
  }
): SavedTripRecord | null {
  const store = readStore();
  const trip = store.trips.find((t) => t.id === tripId);
  if (!trip || trip.userId !== userId) return null;
  if (!Array.isArray(trip.bookings)) trip.bookings = [];

  const now = new Date().toISOString();
  // Prevent auto-confirming if no reference code is provided
  const requestedStatus = booking.status || 'Selected';
  const safeStatus =
    requestedStatus === 'Booking Confirmed' && !(booking.referenceCode || '').trim()
      ? 'Booking Initiated'
      : requestedStatus;

  trip.bookings.unshift({
    id: 'BKG-' + Math.floor(1000 + Math.random() * 9000),
    type: booking.type,
    title: booking.title,
    provider: booking.provider,
    status: safeStatus,
    referenceCode: booking.referenceCode?.trim() || undefined,
    estimatedCostInr: booking.estimatedCostInr ? Number(booking.estimatedCostInr) : undefined,
    bookingUrl: booking.bookingUrl,
    notes: booking.notes,
    updatedAt: now
  });
  trip.updatedAt = now;
  writeStore(store);
  return trip;
}

export function updateTripBooking(
  tripId: string,
  bookingId: string,
  userId: number,
  patch: {
    status?: 'Recommended' | 'Selected' | 'Booking Initiated' | 'Booking Confirmed' | 'Cancelled';
    referenceCode?: string;
    notes?: string;
  }
): SavedTripRecord | null {
  const store = readStore();
  const trip = store.trips.find((t) => t.id === tripId);
  if (!trip || trip.userId !== userId || !Array.isArray(trip.bookings)) return null;
  const idx = trip.bookings.findIndex((b) => b.id === bookingId);
  if (idx === -1) return null;

  const nextRef =
    patch.referenceCode !== undefined ? patch.referenceCode.trim() : trip.bookings[idx].referenceCode;
  const nextStatus = patch.status || trip.bookings[idx].status;
  const safeStatus =
    nextStatus === 'Booking Confirmed' && !nextRef ? 'Booking Initiated' : nextStatus;

  trip.bookings[idx] = {
    ...trip.bookings[idx],
    ...patch,
    status: safeStatus,
    referenceCode: nextRef,
    updatedAt: new Date().toISOString()
  };
  trip.updatedAt = new Date().toISOString();
  writeStore(store);
  return trip;
}

export function deleteTripBooking(tripId: string, bookingId: string, userId: number): SavedTripRecord | null {
  const store = readStore();
  const trip = store.trips.find((t) => t.id === tripId);
  if (!trip || trip.userId !== userId || !Array.isArray(trip.bookings)) return null;
  trip.bookings = trip.bookings.filter((b) => b.id !== bookingId);
  trip.updatedAt = new Date().toISOString();
  writeStore(store);
  return trip;
}

