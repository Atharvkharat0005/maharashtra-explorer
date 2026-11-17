import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SavedTripRecord } from '../types.js';
import { StoredUser } from './storeAuthService.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;
let isConnected = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  try {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false
      }
    });
    return client;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  try {
    const { error } = await sb.from('profiles').select('id').limit(1);
    if (!error) {
      isConnected = true;
      return true;
    }
    // If table doesn't exist yet, we still know the credentials were authenticated
    if (error.code === 'PGRST205') {
      console.warn('[Supabase] Connected to project, but schema tables are not yet created. Run supabase_schema.sql in SQL Editor.');
    } else {
      console.warn('[Supabase] Connection test returned error:', error.message);
    }
    return false;
  } catch {
    return false;
  }
}

// ==================== User Operations ====================

export async function getSupabaseUserByEmail(email: string): Promise<StoredUser | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: isNaN(Number(data.id)) ? data.id : Number(data.id),
    fullName: data.full_name,
    email: data.email,
    passwordHash: data.password_hash,
    phone: data.phone || '',
    role: data.role || 'ROLE_USER',
    tier: data.tier || 'Sahyadri Voyager',
    homeCity: data.home_city || 'Pune, Maharashtra',
    favoriteDestinationIds: Array.isArray(data.favorite_destination_ids) ? data.favorite_destination_ids : [],
    trustedEmergencyContact: data.trusted_emergency_contact || undefined,
    inquiries: [],
    createdAt: data.created_at
  };
}

export async function getSupabaseUserById(id: number | string): Promise<StoredUser | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', String(id))
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: isNaN(Number(data.id)) ? data.id : Number(data.id),
    fullName: data.full_name,
    email: data.email,
    passwordHash: data.password_hash,
    phone: data.phone || '',
    role: data.role || 'ROLE_USER',
    tier: data.tier || 'Sahyadri Voyager',
    homeCity: data.home_city || 'Pune, Maharashtra',
    favoriteDestinationIds: Array.isArray(data.favorite_destination_ids) ? data.favorite_destination_ids : [],
    trustedEmergencyContact: data.trusted_emergency_contact || undefined,
    inquiries: [],
    createdAt: data.created_at
  };
}

export async function createSupabaseUser(user: StoredUser): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from('profiles').insert([
    {
      id: String(user.id),
      full_name: user.fullName,
      email: user.email.toLowerCase().trim(),
      password_hash: user.passwordHash,
      phone: user.phone,
      role: user.role,
      tier: user.tier,
      home_city: user.homeCity,
      favorite_destination_ids: user.favoriteDestinationIds || [],
      trusted_emergency_contact: user.trustedEmergencyContact || null,
      created_at: user.createdAt
    }
  ]);
  return !error;
}

export async function updateSupabaseUserProfile(
  id: number | string,
  updates: Partial<{
    homeCity: string;
    phone: string;
    trustedEmergencyContact: { name: string; phone: string };
    favoriteDestinationIds: number[];
  }>
): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const payload: any = {};
  if (updates.homeCity !== undefined) payload.home_city = updates.homeCity;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.trustedEmergencyContact !== undefined) payload.trusted_emergency_contact = updates.trustedEmergencyContact;
  if (updates.favoriteDestinationIds !== undefined) payload.favorite_destination_ids = updates.favoriteDestinationIds;

  const { error } = await sb.from('profiles').update(payload).eq('id', String(id));
  return !error;
}

// ==================== Trip Operations ====================

export async function getSupabaseTripsForUser(userId: number | string): Promise<SavedTripRecord[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from('saved_trips')
    .select('*')
    .eq('user_id', String(userId))
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    userId: isNaN(Number(row.user_id)) ? row.user_id : Number(row.user_id),
    title: row.title,
    status: row.status,
    startingLocation: row.starting_location,
    startDate: row.start_date,
    days: row.days,
    totalGroupBudget: Number(row.total_group_budget),
    groupSize: row.group_size,
    destinations: Array.isArray(row.destinations) ? row.destinations : [],
    itinerary: row.itinerary,
    expensesLogged: Array.isArray(row.expenses_logged) ? row.expenses_logged : [],
    bookings: Array.isArray(row.bookings) ? row.bookings : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function upsertSupabaseTrip(trip: SavedTripRecord): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb.from('saved_trips').upsert({
    id: trip.id,
    user_id: String(trip.userId),
    title: trip.title,
    status: trip.status,
    starting_location: trip.startingLocation,
    start_date: trip.startDate,
    days: trip.days,
    total_group_budget: trip.totalGroupBudget,
    group_size: trip.groupSize,
    destinations: trip.destinations,
    itinerary: trip.itinerary,
    expenses_logged: trip.expensesLogged || [],
    bookings: trip.bookings || [],
    created_at: trip.createdAt,
    updated_at: trip.updatedAt || new Date().toISOString()
  });
  return !error;
}

export async function deleteSupabaseTrip(tripId: string, userId: number | string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { error } = await sb
    .from('saved_trips')
    .delete()
    .eq('id', tripId)
    .eq('user_id', String(userId));
  return !error;
}
